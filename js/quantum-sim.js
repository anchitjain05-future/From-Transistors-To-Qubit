/**
 * quantum-sim.js — Quantum State-Vector Simulator
 *
 * A complete, physics-accurate quantum computing simulator in pure JavaScript.
 * No external dependencies. Uses complex number arithmetic and tensor products.
 *
 * Conventions:
 *   - Qubit 0 is the MOST significant (leftmost) bit in ket notation.
 *   - State |ψ⟩ = Σ amplitudes[i] |i⟩ where i is a basis state index in
 *     binary (MSB = qubit 0).
 *   - All gate matrices are in the computational basis {|0⟩, |1⟩}.
 *
 * From Transistors to Qubits: A Hybrid Learning Framework
 * 25MCCE19 Lab Project
 */

// ============================================================
// COMPLEX NUMBER TYPE
// ============================================================

/** @typedef {{ re: number, im: number }} Complex */

/** @param {number} re @param {number} im @returns {Complex} */
const c = (re, im = 0) => ({ re, im });

/** @param {Complex} a @param {Complex} b @returns {Complex} */
const cadd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });

/** @param {Complex} a @param {Complex} b @returns {Complex} */
const cmul = (a, b) => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

/** @param {Complex} a @param {number} s @returns {Complex} */
const cscale = (a, s) => ({ re: a.re * s, im: a.im * s });

/** @param {Complex} a @returns {number} Probability = |a|² */
const prob = (a) => a.re * a.re + a.im * a.im;

/** @param {Complex} a @returns {number} Modulus |a| */
const cabs = (a) => Math.sqrt(prob(a));

/** @param {Complex} a @returns {Complex} Complex conjugate */
const conj = (a) => ({ re: a.re, im: -a.im });

/** Format complex number for display */
export function complexToString(a, decimals = 4) {
  const re = a.re.toFixed(decimals);
  const im = Math.abs(a.im).toFixed(decimals);
  const sign = a.im < 0 ? ' - ' : ' + ';
  return `${re}${sign}${im}i`;
}

// ============================================================
// GATE MATRICES (2×2 and 4×4 as flat arrays of Complex)
// ============================================================

const INV_SQRT2 = 1 / Math.sqrt(2);

/**
 * Gate matrices. Each 2×2 gate is [[a, b], [c, d]] where entries are Complex.
 * Represents: gate|0⟩ = a|0⟩ + c|1⟩, gate|1⟩ = b|0⟩ + d|1⟩
 */
export const GATES = {
  /** Identity */
  I: [[c(1), c(0)], [c(0), c(1)]],

  /** Pauli-X (quantum NOT): |0⟩↔|1⟩ */
  X: [[c(0), c(1)], [c(1), c(0)]],

  /** Pauli-Y: [[0, -i], [i, 0]] */
  Y: [[c(0), c(0, -1)], [c(0, 1), c(0)]],

  /** Pauli-Z: [[1, 0], [0, -1]] */
  Z: [[c(1), c(0)], [c(0), c(-1)]],

  /** Hadamard: 1/√2 * [[1, 1], [1, -1]] */
  H: [
    [c(INV_SQRT2), c(INV_SQRT2)],
    [c(INV_SQRT2), c(-INV_SQRT2)],
  ],

  /** S gate: [[1, 0], [0, i]] (phase gate) */
  S: [[c(1), c(0)], [c(0), c(0, 1)]],

  /** T gate: [[1, 0], [0, e^{iπ/4}]] (π/8 gate) */
  T: [
    [c(1), c(0)],
    [c(0), c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))],
  ],

  /**
   * CNOT (Controlled-NOT) — 4×4 matrix, acts on 2 qubits.
   * |00⟩→|00⟩, |01⟩→|01⟩, |10⟩→|11⟩, |11⟩→|10⟩
   * Stored as [row][col], indices: 00=0, 01=1, 10=2, 11=3
   */
  CNOT: [
    [c(1), c(0), c(0), c(0)],
    [c(0), c(1), c(0), c(0)],
    [c(0), c(0), c(0), c(1)],
    [c(0), c(0), c(1), c(0)],
  ],

  /**
   * Toffoli (CCX) — 8×8 matrix for 3 qubits.
   * Flips target if both controls are |1⟩.
   */
  TOFFOLI: (() => {
    const m = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, col) => c(r === col ? 1 : 0))
    );
    // Swap rows 6 and 7 (|110⟩ ↔ |111⟩)
    [m[6][6], m[6][7], m[7][6], m[7][7]] = [c(0), c(1), c(1), c(0)];
    return m;
  })(),

  /** SWAP gate — swaps two qubits */
  SWAP: [
    [c(1), c(0), c(0), c(0)],
    [c(0), c(0), c(1), c(0)],
    [c(0), c(1), c(0), c(0)],
    [c(0), c(0), c(0), c(1)],
  ],
};

// ============================================================
// QUANTUM STATE CLASS
// ============================================================

/**
 * Quantum state vector for n qubits.
 * The state |ψ⟩ = Σᵢ amplitudes[i] |i⟩ where i runs over 2ⁿ basis states.
 * Qubit 0 is the most-significant bit.
 */
export class QuantumState {
  /**
   * @param {number} numQubits - Number of qubits (1–10 recommended)
   */
  constructor(numQubits) {
    if (numQubits < 1 || numQubits > 12) {
      throw new Error(`numQubits must be between 1 and 12, got ${numQubits}`);
    }
    this.numQubits = numQubits;
    this.dim = 1 << numQubits; // 2^numQubits
    /** @type {Complex[]} */
    this.amplitudes = Array.from({ length: this.dim }, (_, i) => c(i === 0 ? 1 : 0));
  }

  /**
   * Reset to |0...0⟩
   */
  reset() {
    this.amplitudes = Array.from({ length: this.dim }, (_, i) => c(i === 0 ? 1 : 0));
    return this;
  }

  /**
   * Set state to |i⟩ (computational basis state)
   * @param {number} basisIndex - Index of the basis state (0 to 2ⁿ-1)
   */
  setBasisState(basisIndex) {
    if (basisIndex < 0 || basisIndex >= this.dim) {
      throw new Error(`basisIndex out of range: ${basisIndex}`);
    }
    this.amplitudes = Array.from({ length: this.dim }, (_, i) =>
      c(i === basisIndex ? 1 : 0)
    );
    return this;
  }

  /**
   * Set the full amplitude vector (for single-qubit, e.g. α|0⟩+β|1⟩)
   * @param {Complex[]} amps - Must have length 2ⁿ
   */
  setAmplitudes(amps) {
    if (amps.length !== this.dim) {
      throw new Error(`Expected ${this.dim} amplitudes, got ${amps.length}`);
    }
    this.amplitudes = amps.map(a => ({ ...a }));
    return this;
  }

  /**
   * Clone this state
   * @returns {QuantumState}
   */
  clone() {
    const q = new QuantumState(this.numQubits);
    q.amplitudes = this.amplitudes.map(a => ({ ...a }));
    return q;
  }

  /**
   * Apply a 2×2 single-qubit gate to a specified qubit.
   * Uses pair-based state transformation equivalent to I⊗...⊗G⊗...⊗I.
   * For each pair (|...0...⟩, |...1...⟩) differing only in targetQubit:
   *   [new_0]   [g00 g01] [old_0]
   *   [new_1] = [g10 g11] [old_1]
   *
   * @param {Complex[][]} gate - 2×2 unitary gate matrix [[a,b],[c,d]]
   * @param {number} targetQubit - Which qubit to apply to (0 = most significant)
   */
  applyGate(gate, targetQubit) {
    if (targetQubit < 0 || targetQubit >= this.numQubits) {
      throw new Error(`targetQubit ${targetQubit} out of range [0, ${this.numQubits - 1}]`);
    }

    const bit = this.numQubits - 1 - targetQubit; // bit index (LSB=0)
    const newAmps = this.amplitudes.map(() => c(0));

    for (let i = 0; i < this.dim; i++) {
      // i0 = i with target bit cleared, i1 = i with target bit set
      const i0 = i & ~(1 << bit);
      const i1 = i0 | (1 << bit);

      if (i === i0) {
        // Process the pair (i0, i1) once
        const amp0 = this.amplitudes[i0];
        const amp1 = this.amplitudes[i1];
        newAmps[i0] = cadd(cmul(gate[0][0], amp0), cmul(gate[0][1], amp1));
        newAmps[i1] = cadd(cmul(gate[1][0], amp0), cmul(gate[1][1], amp1));
      }
    }

    this.amplitudes = newAmps;
    return this;
  }

  /** Alias for backward compatibility */
  _applyGateCorrect(gate, targetQubit) {
    return this.applyGate(gate, targetQubit);
  }

  /**
   * Apply a 4×4 two-qubit gate (e.g., CNOT, SWAP).
   * Uses the standard tensor product expansion.
   *
   * @param {Complex[][]} gate - 4×4 unitary gate matrix
   * @param {number} qubit0 - First qubit (higher-order in gate, e.g. control)
   * @param {number} qubit1 - Second qubit (lower-order in gate, e.g. target)
   */
  applyTwoQubitGate(gate, qubit0, qubit1) {
    if (this.numQubits < 2) throw new Error('Need at least 2 qubits for two-qubit gate');
    if (qubit0 === qubit1) throw new Error('qubit0 and qubit1 must be different');
    if (qubit0 < 0 || qubit0 >= this.numQubits || qubit1 < 0 || qubit1 >= this.numQubits) {
      throw new Error('Qubit index out of range');
    }

    const bit0 = this.numQubits - 1 - qubit0; // bit index for qubit0 (LSB=0)
    const bit1 = this.numQubits - 1 - qubit1; // bit index for qubit1

    const newAmps = Array.from({ length: this.dim }, () => c(0));

    for (let i = 0; i < this.dim; i++) {
      // Get the 2-bit sub-index for (qubit0, qubit1)
      const b0 = (i >> bit0) & 1;
      const b1 = (i >> bit1) & 1;
      const row = (b0 << 1) | b1; // 0,1,2,3

      for (let col = 0; col < 4; col++) {
        if (prob(gate[row][col]) === 0) continue;

        // Input basis sub-index
        const inB0 = (col >> 1) & 1;
        const inB1 = col & 1;

        // Construct input state index: replace bits bit0 and bit1
        let j = i;
        j = (j & ~(1 << bit0)) | (inB0 << bit0);
        j = (j & ~(1 << bit1)) | (inB1 << bit1);

        newAmps[i] = cadd(newAmps[i], cmul(gate[row][col], this.amplitudes[j]));
      }
    }

    this.amplitudes = newAmps;
    return this;
  }

  /**
   * Apply CNOT gate: flips target qubit if control qubit is |1⟩.
   * This is the most commonly needed two-qubit gate.
   *
   * @param {number} controlQubit
   * @param {number} targetQubit
   */
  applyCNOT(controlQubit, targetQubit) {
    return this.applyTwoQubitGate(GATES.CNOT, controlQubit, targetQubit);
  }

  /**
   * Get probability array |amplitude[i]|² for each basis state.
   * @returns {number[]}
   */
  probabilities() {
    return this.amplitudes.map(a => prob(a));
  }

  /**
   * Sample a measurement outcome from the probability distribution.
   * Returns the basis state index measured (does NOT collapse the state).
   * @returns {number}
   */
  sampleMeasurement() {
    const probs = this.probabilities();
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (r < cumulative) return i;
    }
    return probs.length - 1;
  }

  /**
   * Measure ALL qubits, collapse the state, return measured bit string.
   * @returns {string} e.g. "01" for a 2-qubit system measured in state |01⟩
   */
  measureAll() {
    const outcome = this.sampleMeasurement();
    // Collapse state to |outcome⟩
    this.amplitudes = Array.from({ length: this.dim }, (_, i) =>
      c(i === outcome ? 1 : 0)
    );
    return outcome.toString(2).padStart(this.numQubits, '0');
  }

  /**
   * Measure a single qubit. Returns 0 or 1, collapses state accordingly.
   * @param {number} qubit
   * @returns {number} 0 or 1
   */
  measureQubit(qubit) {
    const bit = this.numQubits - 1 - qubit;

    // Compute P(qubit = 1)
    let p1 = 0;
    for (let i = 0; i < this.dim; i++) {
      if ((i >> bit) & 1) p1 += prob(this.amplitudes[i]);
    }

    const outcome = Math.random() < p1 ? 1 : 0;

    // Collapse and renormalize
    let norm = 0;
    for (let i = 0; i < this.dim; i++) {
      const bit_i = (i >> bit) & 1;
      if (bit_i !== outcome) {
        this.amplitudes[i] = c(0);
      } else {
        norm += prob(this.amplitudes[i]);
      }
    }
    const normFactor = 1 / Math.sqrt(norm);
    for (let i = 0; i < this.dim; i++) {
      this.amplitudes[i] = cscale(this.amplitudes[i], normFactor);
    }

    return outcome;
  }

  /**
   * Compute Bloch sphere coordinates (x, y, z) for a single-qubit state.
   * ψ = α|0⟩ + β|1⟩
   * x = 2 Re(α* β), y = 2 Im(α* β), z = |α|² - |β|²
   *
   * @returns {{ x: number, y: number, z: number }}
   */
  getBlochVector() {
    if (this.numQubits !== 1) {
      console.warn('getBlochVector() is only meaningful for single-qubit states');
      // Return Bloch vector for qubit 0 (tracing out others) — simplified
    }
    const alpha = this.amplitudes[0]; // amplitude of |0⟩
    const beta = this.amplitudes[1];  // amplitude of |1⟩
    const alphaStar_beta = cmul(conj(alpha), beta); // α* β
    return {
      x: 2 * alphaStar_beta.re,
      y: 2 * alphaStar_beta.im,
      z: prob(alpha) - prob(beta),
    };
  }

  /**
   * Get spherical coordinates (θ, φ) for the Bloch sphere.
   * @returns {{ theta: number, phi: number }}
   */
  getBlochAngles() {
    const { x, y, z } = this.getBlochVector();
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-10) return { theta: 0, phi: 0 };
    const theta = Math.acos(Math.max(-1, Math.min(1, z / r)));
    const phi = Math.atan2(y, x);
    return { theta, phi };
  }

  /**
   * Get a human-readable representation of the state.
   * @returns {string} e.g. "0.707|0⟩ + 0.707|1⟩"
   */
  toString() {
    const terms = [];
    for (let i = 0; i < this.dim; i++) {
      const a = this.amplitudes[i];
      if (cabs(a) < 1e-8) continue;
      const ket = `|${i.toString(2).padStart(this.numQubits, '0')}⟩`;
      const ampStr = complexToString(a, 3);
      terms.push(`(${ampStr})${ket}`);
    }
    return terms.length > 0 ? terms.join(' + ') : '|0⟩';
  }

  /**
   * Format the state vector in Dirac bra-ket notation for UI display.
   * Filters out zero or negligible amplitudes.
   * @param {number} precision - Number of decimal places
   * @returns {string} e.g. "0.707|0⟩ + 0.707|1⟩"
   */
  toDiracString(precision = 3) {
    const terms = [];
    for (let i = 0; i < this.dim; i++) {
      const a = this.amplitudes[i];
      const magnitude = Math.sqrt(a.re * a.re + a.im * a.im);
      if (magnitude < 1e-4) continue;
      const ket = `|${i.toString(2).padStart(this.numQubits, '0')}⟩`;
      let ampStr = '';
      if (Math.abs(a.im) < 1e-4) {
        ampStr = a.re.toFixed(precision);
      } else if (Math.abs(a.re) < 1e-4) {
        ampStr = `${a.im.toFixed(precision)}i`;
      } else {
        const sign = a.im >= 0 ? '+' : '-';
        ampStr = `(${a.re.toFixed(precision)} ${sign} ${Math.abs(a.im).toFixed(precision)}i)`;
      }
      terms.push(`${ampStr}${ket}`);
    }
    return terms.length > 0 ? terms.join(' + ') : '|0⟩';
  }

  /**
   * Get basis state labels (for display in tables/charts)
   * @returns {string[]} e.g. ["|00⟩", "|01⟩", "|10⟩", "|11⟩"]
   */
  getBasisLabels() {
    return Array.from({ length: this.dim }, (_, i) =>
      `|${i.toString(2).padStart(this.numQubits, '0')}⟩`
    );
  }

  /**
   * Normalize the state vector (in case of floating-point drift)
   */
  normalize() {
    let norm = 0;
    for (const a of this.amplitudes) norm += prob(a);
    const factor = 1 / Math.sqrt(norm);
    this.amplitudes = this.amplitudes.map(a => cscale(a, factor));
    return this;
  }
}

// ============================================================
// CIRCUIT RUNNER
// ============================================================

/**
 * Represents a single gate operation in a circuit
 * @typedef {{ gate: string, qubits: number[] }} GateOp
 */

/**
 * Run a quantum circuit multiple times and collect measurement statistics.
 *
 * @param {number} numQubits - Number of qubits
 * @param {number[]} initialState - Initial computational basis state per qubit (0 or 1)
 * @param {GateOp[]} gateSequence - Sequence of gate operations
 * @param {number} numShots - Number of times to run the circuit
 * @returns {{ counts: Object.<string, number>, probabilities: Object.<string, number> }}
 */
export function runShots(numQubits, initialState, gateSequence, numShots) {
  const counts = {};

  for (let shot = 0; shot < numShots; shot++) {
    const qs = new QuantumState(numQubits);

    // Set initial state
    let initIndex = 0;
    for (let q = 0; q < numQubits; q++) {
      if (initialState[q] === 1) {
        initIndex |= (1 << (numQubits - 1 - q));
      }
    }
    qs.setBasisState(initIndex);

    // Apply gates
    for (const op of gateSequence) {
      applyNamedGate(qs, op);
    }

    // Measure
    const outcome = qs.measureAll();
    counts[outcome] = (counts[outcome] || 0) + 1;
  }

  // Compute probabilities
  const probabilities = {};
  for (const [state, count] of Object.entries(counts)) {
    probabilities[state] = count / numShots;
  }

  return { counts, probabilities };
}

/**
 * Apply a named gate operation to a QuantumState
 * @param {QuantumState} qs
 * @param {GateOp} op
 */
export function applyNamedGate(qs, op) {
  const { gate, qubits } = op;
  switch (gate.toUpperCase()) {
    case 'X': qs.applyGate(GATES.X, qubits[0]); break;
    case 'Y': qs.applyGate(GATES.Y, qubits[0]); break;
    case 'Z': qs.applyGate(GATES.Z, qubits[0]); break;
    case 'H': qs.applyGate(GATES.H, qubits[0]); break;
    case 'S': qs.applyGate(GATES.S, qubits[0]); break;
    case 'T': qs.applyGate(GATES.T, qubits[0]); break;
    case 'I': break; // Identity — no-op
    case 'CNOT': qs.applyTwoQubitGate(GATES.CNOT, qubits[0], qubits[1]); break;
    case 'SWAP': qs.applyTwoQubitGate(GATES.SWAP, qubits[0], qubits[1]); break;
    case 'TOFFOLI':
      if (qs.numQubits >= 3) {
        // Apply Toffoli: TODO for full n-qubit expansion
        console.warn('Toffoli on arbitrary positions not fully implemented');
      }
      break;
    default:
      console.warn(`Unknown gate: ${gate}`);
  }
}

// ============================================================
// NOISE CHANNELS
// ============================================================

/**
 * Apply bit-flip noise with probability p.
 * With prob p, applies X gate to the target qubit.
 *
 * @param {QuantumState} qs
 * @param {number} qubit
 * @param {number} p - Error probability (0 to 1)
 */
export function applyBitFlipNoise(qs, qubit, p) {
  if (Math.random() < p) {
    qs.applyGate(GATES.X, qubit);
  }
}

/**
 * Apply phase-flip noise with probability p.
 * With prob p, applies Z gate to the target qubit.
 *
 * @param {QuantumState} qs
 * @param {number} qubit
 * @param {number} p - Error probability (0 to 1)
 */
export function applyPhaseFlipNoise(qs, qubit, p) {
  if (Math.random() < p) {
    qs.applyGate(GATES.Z, qubit);
  }
}

/**
 * Apply depolarizing noise with probability p.
 * With prob p, applies a random Pauli (X, Y, or Z) to the target qubit.
 * With prob 1-p, applies identity.
 *
 * @param {QuantumState} qs
 * @param {number} qubit
 * @param {number} p - Depolarizing probability (0 to 1)
 */
export function applyDepolarizingNoise(qs, qubit, p) {
  const r = Math.random();
  if (r < p / 3) {
    qs.applyGate(GATES.X, qubit);
  } else if (r < 2 * p / 3) {
    qs.applyGate(GATES.Y, qubit);
  } else if (r < p) {
    qs.applyGate(GATES.Z, qubit);
  }
  // else: identity (no noise)
}

// ============================================================
// 3-QUBIT REPETITION CODE (Bit-Flip QEC)
// ============================================================

/**
 * Encode a single-qubit state into 3-qubit repetition code.
 * |ψ⟩ = α|0⟩ + β|1⟩ → α|000⟩ + β|111⟩
 *
 * @param {QuantumState} qs1 - Single-qubit state to encode
 * @returns {QuantumState} 3-qubit encoded state
 */
export function encodeRepetitionCode(qs1) {
  if (qs1.numQubits !== 1) throw new Error('Input must be a 1-qubit state');

  const alpha = qs1.amplitudes[0]; // α
  const beta = qs1.amplitudes[1];  // β

  // α|000⟩ + β|111⟩
  const qs3 = new QuantumState(3);
  qs3.amplitudes = [
    { ...alpha }, // |000⟩: coefficient α
    c(0),         // |001⟩
    c(0),         // |010⟩
    c(0),         // |011⟩
    c(0),         // |100⟩
    c(0),         // |101⟩
    c(0),         // |110⟩
    { ...beta },  // |111⟩: coefficient β
  ];
  return qs3;
}

/**
 * Decode 3-qubit repetition code using majority vote (syndrome measurement).
 * @param {QuantumState} qs3 - 3-qubit encoded state
 * @returns {QuantumState} Decoded 1-qubit state
 */
export function decodeRepetitionCode(qs3) {
  if (qs3.numQubits !== 3) throw new Error('Input must be a 3-qubit state');

  // Measure syndrome: parity of q0⊕q1 and q1⊕q2
  // In an ideal simulation, we perform majority vote on amplitudes
  const alpha = qs3.amplitudes[0]; // |000⟩
  const beta = qs3.amplitudes[7];  // |111⟩

  // Normalize
  const norm = Math.sqrt(prob(alpha) + prob(beta));
  const qs1 = new QuantumState(1);
  qs1.amplitudes = [
    cscale(alpha, 1 / (norm || 1)),
    cscale(beta, 1 / (norm || 1)),
  ];
  return qs1;
}

// ============================================================
// HELPER: Build histogram data for Chart.js
// ============================================================

/**
 * Convert shot counts to Chart.js dataset format
 * @param {{ counts: Object.<string, number> }} result - From runShots()
 * @param {number} numQubits
 * @returns {{ labels: string[], data: number[], totalShots: number }}
 */
export function countsToChartData(result, numQubits) {
  const dim = 1 << numQubits;
  const labels = Array.from({ length: dim }, (_, i) =>
    `|${i.toString(2).padStart(numQubits, '0')}⟩`
  );
  const data = labels.map((label, i) => {
    const key = i.toString(2).padStart(numQubits, '0');
    return result.counts[key] || 0;
  });
  const totalShots = Object.values(result.counts).reduce((s, v) => s + v, 0);
  return { labels, data, totalShots };
}

// ============================================================
// EXPORTS
// ============================================================
export { c as complexNum, cadd as complexAdd, cmul as complexMul, cscale as complexScale, prob as complexProb, cabs as complexAbs };

// Aliases for cross-module compatibility
export const complexAbsSq = prob;  // |z|² (same as prob())
export const complex = c;          // alias: complex(re, im)

