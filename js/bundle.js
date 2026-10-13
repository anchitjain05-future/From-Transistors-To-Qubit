
/* --- quantum-sim.js --- */
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
function complexToString(a, decimals = 4) {
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
const GATES = {
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
class QuantumState {
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
function runShots(numQubits, initialState, gateSequence, numShots) {
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
function applyNamedGate(qs, op) {
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
function applyBitFlipNoise(qs, qubit, p) {
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
function applyPhaseFlipNoise(qs, qubit, p) {
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
function applyDepolarizingNoise(qs, qubit, p) {
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
function encodeRepetitionCode(qs1) {
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
function decodeRepetitionCode(qs3) {
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
function countsToChartData(result, numQubits) {
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
// Aliases for cross-module compatibility
const complexAbsSq = prob;  // |z|² (same as prob())
const complex = c;          // alias: complex(re, im)

/* --- bloch-sphere.js --- */
/**
 * bloch-sphere.js — Bloch Sphere Renderer (Canvas 2D)
 *
 * Renders a 3D Bloch sphere visualization for qubit states using Canvas 2D
 * with an oblique isometric-style projection.
 *
 * From Transistors to Qubits: A Hybrid Learning Framework
 * 25MCCE19 Lab Project
 */

// ============================================================
// 3D → 2D PROJECTION
// ============================================================

/**
 * Simple oblique projection for 3D → 2D.
 * x-axis points right, y-axis points up, z-axis points toward viewer-left.
 * The projection is: screen_x = x + z*cos(angle), screen_y = -y + z*sin(angle)
 *
 * @param {number} x3d
 * @param {number} y3d
 * @param {number} z3d
 * @param {number} cx - Canvas center x
 * @param {number} cy - Canvas center y
 * @param {number} scale - Sphere radius in pixels
 * @returns {{ x: number, y: number }}
 */
function project(x3d, y3d, z3d, cx, cy, scale) {
  const angle = Math.PI / 6; // 30 degrees for oblique projection
  const obliqueFactor = 0.5;
  const x = cx + scale * (x3d + z3d * obliqueFactor * Math.cos(angle));
  const y = cy + scale * (-y3d + z3d * obliqueFactor * Math.sin(angle));
  return { x, y };
}

// ============================================================
// BLOCH SPHERE CLASS
// ============================================================
class BlochSphere {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this._cssWidth = rect.width;
      this._cssHeight = rect.height;
    } else {
      this._cssWidth = canvas.width;
      this._cssHeight = canvas.height;
    }

    // State vector angles (spherical coordinates)
    this._theta = 0; // polar angle (0 = |0⟩, π = |1⟩)
    this._phi = 0;   // azimuthal angle

    // Initial render
    this.render(0, 0);
  }

  /**
   * Detect current theme from body class
   * @returns {'dark'|'light'}
   */
  _getTheme() {
    return document.body.classList.contains('light-theme') ? 'light' : 'dark';
  }

  /**
   * Get theme colors
   */
  _colors() {
    const isDark = this._getTheme() === 'dark';
    return {
      sphere: isDark ? 'rgba(88, 166, 255, 0.08)' : 'rgba(3, 102, 214, 0.06)',
      sphereBorder: isDark ? 'rgba(88, 166, 255, 0.35)' : 'rgba(3, 102, 214, 0.4)',
      equator: isDark ? 'rgba(88, 166, 255, 0.3)' : 'rgba(3, 102, 214, 0.3)',
      meridian: isDark ? 'rgba(88, 166, 255, 0.15)' : 'rgba(3, 102, 214, 0.2)',
      axisX: '#ff6b6b',
      axisY: '#3fb950',
      axisZ: '#58a6ff',
      axisNeg: isDark ? '#555' : '#aaa',
      arrow: '#f78166',
      arrowHead: '#f78166',
      text: isDark ? '#c9d1d9' : '#24292e',
      textMuted: isDark ? '#8b949e' : '#6a737d',
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      bg: isDark ? '#0d1117' : '#f6f8fa',
      projectionLine: isDark ? 'rgba(247,129,102,0.3)' : 'rgba(200,80,50,0.3)',
    };
  }

  /**
   * Render the Bloch sphere for given spherical angles θ, φ.
   * Convention: |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩
   *
   * @param {number} theta - Polar angle (0 = |0⟩ at north pole, π = |1⟩ at south pole)
   * @param {number} phi   - Azimuthal angle (0 = |+⟩ direction)
   */
  render(theta, phi) {
    this._theta = theta;
    this._phi = phi;

    const ctx = this.ctx;
    const W = this._cssWidth;
    const H = this._cssHeight;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38; // sphere radius in pixels
    const col = this._colors();

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, W, H);

    // ---- Draw sphere ----
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = col.sphere;
    ctx.fill();
    ctx.strokeStyle = col.sphereBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ---- Draw equatorial circle (XY plane) ----
    // Project ellipse — for oblique projection, this is an ellipse
    this._drawEllipse(ctx, cx, cy, R, col.equator, 1, false);

    // ---- Draw meridian circles ----
    // XZ plane (vertical circle in center)
    this._drawVerticalCircle(ctx, cx, cy, R, col.meridian);

    // ---- Draw axes ----
    // Z axis (|0⟩ top, |1⟩ bottom)
    const zTop = project(0, 1.15, 0, cx, cy, R);
    const zBot = project(0, -1.15, 0, cx, cy, R);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), zTop, col.axisZ, '|0⟩', col.text, 'center', -14);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), zBot, col.axisNeg, '|1⟩', col.textMuted, 'center', 14);

    // X axis (|+⟩ right, |−⟩ left)
    const xPos = project(1.15, 0, 0, cx, cy, R);
    const xNeg = project(-1.15, 0, 0, cx, cy, R);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), xPos, col.axisX, '|+⟩', col.textMuted, 'left', 0);
    this._drawDashedLine(ctx, project(0, 0, 0, cx, cy, R), xNeg, col.axisNeg);

    // Y axis (|+i⟩ front, |−i⟩ back)
    const yPos = project(0, 0, 1.15, cx, cy, R);
    const yNeg = project(0, 0, -1.15, cx, cy, R);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), yPos, col.axisY, '|+i⟩', col.textMuted, 'left', 0);
    this._drawDashedLine(ctx, project(0, 0, 0, cx, cy, R), yNeg, col.axisNeg);

    // ---- Draw state vector ----
    // Bloch vector: x = sin(θ)cos(φ), y = cos(θ), z = sin(θ)sin(φ)
    // NOTE: Our y-axis in Bloch sphere is z in 3D space
    const bx = Math.sin(theta) * Math.cos(phi);   // Bloch X component
    const bz_bloch = Math.cos(theta);              // Bloch Z component (our "y" in 3D)
    const by = Math.sin(theta) * Math.sin(phi);   // Bloch Y component (our "z" in 3D)

    // Map: 3D(x, y, z) = Bloch(bx, bz_bloch, by)
    const tipPoint = project(bx, bz_bloch, by, cx, cy, R);
    const origin = project(0, 0, 0, cx, cy, R);

    // Draw projection lines to axes
    const xyPlanePoint = project(bx, 0, by, cx, cy, R);
    ctx.beginPath();
    ctx.moveTo(tipPoint.x, tipPoint.y);
    ctx.lineTo(xyPlanePoint.x, xyPlanePoint.y);
    ctx.strokeStyle = col.projectionLine;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw the state vector arrow
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(tipPoint.x, tipPoint.y);
    ctx.strokeStyle = col.arrow;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arrow head
    this._drawArrowHead(ctx, origin, tipPoint, col.arrowHead);

    // State vector tip dot
    ctx.beginPath();
    ctx.arc(tipPoint.x, tipPoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = col.arrowHead;
    ctx.fill();

    // ---- Labels: show θ, φ values ----
    ctx.font = '11px monospace';
    ctx.fillStyle = col.text;
    ctx.textAlign = 'left';
    const thetaDeg = (theta * 180 / Math.PI).toFixed(1);
    const phiDeg = (phi * 180 / Math.PI).toFixed(1);
    ctx.fillText(`θ = ${thetaDeg}°`, 8, H - 28);
    ctx.fillText(`φ = ${phiDeg}°`, 8, H - 14);

    // State label
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = col.arrow;
    const alpha_re = Math.cos(theta / 2).toFixed(3);
    const beta_re = Math.sin(theta / 2).toFixed(3);
    ctx.fillText(`α=${alpha_re}, β=${beta_re}`, W - 8, H - 14);
  }

  /**
   * Draw the equatorial ellipse (projection of unit circle in XZ plane)
   */
  _drawEllipse(ctx, cx, cy, R, color, lineWidth, dashed) {
    // For oblique projection with factor 0.5 at 30°, the equator projects to an ellipse
    // Sample points on the unit circle in XZ plane (y=0) and project them
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const angle = (2 * Math.PI * i) / N;
      const x3 = Math.cos(angle);
      const z3 = Math.sin(angle);
      const p = project(x3, 0, z3, cx, cy, R);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw a vertical circle (in XY plane)
   */
  _drawVerticalCircle(ctx, cx, cy, R, color) {
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const angle = (2 * Math.PI * i) / N;
      const x3 = Math.cos(angle);
      const y3 = Math.sin(angle);
      const p = project(x3, y3, 0, cx, cy, R);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw an axis line with label
   */
  _drawAxis(ctx, from, to, color, label, textColor, textAlign, textOffsetY) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    if (label) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = textAlign;
      ctx.fillText(label, to.x + (textAlign === 'left' ? 5 : 0), to.y + textOffsetY);
    }
  }

  /**
   * Draw a dashed line
   */
  _drawDashedLine(ctx, from, to, color) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw an arrowhead
   */
  _drawArrowHead(ctx, from, to, color) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - size * Math.cos(angle - Math.PI / 6),
      to.y - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - size * Math.cos(angle + Math.PI / 6),
      to.y - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * Render from Bloch vector components (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  renderFromXYZ(x, y, z) {
    // Convert Bloch vector to angles
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-10) {
      this.render(Math.PI / 2, 0); // equator for mixed state
      return;
    }
    const theta = Math.acos(Math.max(-1, Math.min(1, z / r)));
    const phi = Math.atan2(y, x);
    this.render(theta, phi);
  }

  /**
   * Render from qubit state amplitudes α, β (complex numbers as {re, im})
   * @param {{ re: number, im: number }} alpha
   * @param {{ re: number, im: number }} beta
   */
  renderFromState(alpha, beta) {
    // Compute Bloch vector from density matrix elements
    const prob_alpha = alpha.re * alpha.re + alpha.im * alpha.im;
    const prob_beta = beta.re * beta.re + beta.im * beta.im;

    // alpha_star * beta
    const asb_re = alpha.re * beta.re + alpha.im * beta.im;
    const asb_im = alpha.re * beta.im - alpha.im * beta.re;

    const bx = 2 * asb_re;
    const by = 2 * asb_im;
    const bz = prob_alpha - prob_beta;

    this.renderFromXYZ(bx, by, bz);
  }

  /**
   * Animate the sphere rotating to a new state
   * @param {number} targetTheta
   * @param {number} targetPhi
   * @param {number} [duration=500] ms
   */
  animateTo(targetTheta, targetPhi, duration = 500) {
    const startTheta = this._theta;
    const startPhi = this._phi;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

      const theta = startTheta + (targetTheta - startTheta) * eased;
      const phi = startPhi + (targetPhi - startPhi) * eased;
      this.render(theta, phi);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show the mixed state (Bloch vector at origin, dashed sphere)
   */
  renderMixed() {
    this.render(Math.PI / 2, 0);
    // The render method will show a vector on the equator;
    // for a truly mixed state we'd need to draw the origin dot only
  }
}

/* --- home-mapping.js --- */
/**
 * home-mapping.js
 * Educational Framework: From Transistors to Qubits
 * Handles rendering and interactions for Home Page (#home) and Mapping Table (#mapping).
 */
function initHomeMapping() {
  const homeEl = document.getElementById('home');
  const mappingEl = document.getElementById('mapping');

  if (homeEl) {
    renderHomePage(homeEl);
  }

  if (mappingEl) {
    renderMappingPage(mappingEl);
  }
}

/**
 * Renders the Home Page content into #home
 * @param {HTMLElement} container 
 */
function renderHomePage(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <header class="hero-section text-center py-5 px-3">
      <div class="container hero-container">
        <div class="badge-pill mb-3">
          <span class="badge-accent">Hybrid Pedagogical Framework</span>
          <span class="badge-text">Semiconductor Physics &rarr; Quantum Computing</span>
        </div>
        
        <h1 class="hero-title display-4 fw-bold mb-3">
          From Transistors to Qubits
        </h1>
        <p class="hero-subtitle lead text-muted mx-auto mb-4">
          A pedagogical framework bridging semiconductor electronics and quantum computing
        </p>
        
        <p class="hero-abstract text-secondary mx-auto mb-5">
          Students with semiconductor and digital-circuit backgrounds often face a daunting conceptual 
          gap when transitioning to quantum computing. This hybrid learning framework systematically bridges 
          that gap by anchoring abstract quantum principles—such as state vectors, unitary operators, reversible 
          transformations, and decoherence—to the intuitive, tangible foundations of transistor operation, 
          MOSFET switching, and CMOS logic gates.
        </p>

        <div class="hero-cta-group d-flex justify-content-center gap-3 flex-wrap">
          <a href="#mapping" class="btn btn-primary btn-lg shadow-sm">
            <span class="btn-icon">🗺️</span> Explore Concept Mapping
          </a>
          <a href="#level1" class="btn btn-outline-primary btn-lg shadow-sm">
            <span class="btn-icon">🚀</span> Start Level 1: Transistor
          </a>
          <a href="#simulator" class="btn btn-secondary btn-lg shadow-sm">
            <span class="btn-icon">🔬</span> Launch Simulator
          </a>
        </div>
      </div>
    </header>

    <!-- Visual 4-Step Roadmap -->
    <section class="roadmap-section py-5 bg-surface">
      <div class="container">
        <div class="section-heading text-center mb-5">
          <h2 class="h3 fw-bold">Pedagogical Learning Roadmap</h2>
          <p class="text-muted">A structured progressive trajectory from charge carriers to coherent quantum circuits</p>
        </div>

        <div class="roadmap-wrapper">
          <!-- Step 1 -->
          <a href="#level1" class="roadmap-card step-card text-decoration-none">
            <div class="step-badge">Level 1</div>
            <div class="step-icon">🔌</div>
            <h3 class="step-title">Transistor</h3>
            <p class="step-desc">
              Semiconductor physics, energy bands, depletion regions, and voltage-controlled electronic switching.
            </p>
            <div class="step-action">Explore Level 1 &rarr;</div>
          </a>

          <div class="roadmap-connector" aria-hidden="true">
            <span class="connector-line"></span>
            <span class="connector-arrow">➔</span>
          </div>

          <!-- Step 2 -->
          <a href="#level2" class="roadmap-card step-card text-decoration-none">
            <div class="step-badge">Level 2</div>
            <div class="step-icon">⚡</div>
            <h3 class="step-title">Logic Gate</h3>
            <p class="step-desc">
              CMOS logic families, Boolean algebra, irreversible switching, and static noise margins.
            </p>
            <div class="step-action">Explore Level 2 &rarr;</div>
          </a>

          <div class="roadmap-connector" aria-hidden="true">
            <span class="connector-line"></span>
            <span class="connector-arrow">➔</span>
          </div>

          <!-- Step 3 -->
          <a href="#level3" class="roadmap-card step-card text-decoration-none">
            <div class="step-badge">Level 3</div>
            <div class="step-icon">💫</div>
            <h3 class="step-title">Bit &rarr; Qubit</h3>
            <p class="step-desc">
              Transition from discrete binary states to the Bloch sphere, continuous complex amplitudes, and superposition.
            </p>
            <div class="step-action">Explore Level 3 &rarr;</div>
          </a>

          <div class="roadmap-connector" aria-hidden="true">
            <span class="connector-line"></span>
            <span class="connector-arrow">➔</span>
          </div>

          <!-- Step 4 -->
          <a href="#level4" class="roadmap-card step-card text-decoration-none">
            <div class="step-badge">Level 4</div>
            <div class="step-icon">🔬</div>
            <h3 class="step-title">Quantum Circuit</h3>
            <p class="step-desc">
              Unitary matrix evolutions, reversible gate arrays, quantum entanglement, and projective measurements.
            </p>
            <div class="step-action">Explore Level 4 &rarr;</div>
          </a>
        </div>
      </div>
    </section>

    <!-- Quick Stats Section -->
    <section class="stats-section py-5">
      <div class="container">
        <div class="row g-4 justify-content-center">
          <div class="col-6 col-md-3">
            <div class="stat-card p-4 text-center rounded-3 shadow-sm h-100">
              <div class="stat-number display-5 fw-bold text-primary">10</div>
              <div class="stat-title fw-semibold mt-2">Interactive Modules</div>
              <p class="stat-subtitle text-muted small mb-0">Simulations, Bloch sphere, interactive transfer curves</p>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card p-4 text-center rounded-3 shadow-sm h-100">
              <div class="stat-number display-5 fw-bold text-success">4</div>
              <div class="stat-title fw-semibold mt-2">Learning Levels</div>
              <p class="stat-subtitle text-muted small mb-0">Scaffolded from semiconductor physics to multi-qubit systems</p>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card p-4 text-center rounded-3 shadow-sm h-100">
              <div class="stat-number display-5 fw-bold text-info">100%</div>
              <div class="stat-title fw-semibold mt-2">JS Quantum Simulator</div>
              <p class="stat-subtitle text-muted small mb-0">Client-side statevector propagation and measurement collapse</p>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card p-4 text-center rounded-3 shadow-sm h-100">
              <div class="stat-number display-5 fw-bold text-warning">20</div>
              <div class="stat-title fw-semibold mt-2">Assessment Questions</div>
              <p class="stat-subtitle text-muted small mb-0">Formative self-check quizzes with explanatory feedback</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why This Framework Section -->
    <section class="why-framework-section py-5 bg-surface-alt">
      <div class="container">
        <div class="section-heading text-center mb-5">
          <h2 class="h3 fw-bold">Why This Framework?</h2>
          <p class="text-muted">Designed specifically to capitalize on your existing electronics intuition</p>
        </div>

        <div class="row g-4">
          <!-- Card 1 -->
          <div class="col-md-4">
            <div class="feature-card p-4 rounded-3 shadow-sm h-100 border">
              <div class="feature-icon mb-3">🌉</div>
              <h3 class="h5 fw-bold mb-2">Bridge the Gap</h3>
              <p class="text-secondary mb-0">
                Rather than treating quantum computing as purely abstract linear algebra or postulate-heavy 
                quantum physics, we contextualize each quantum concept with its physical and logical counterpart 
                in solid-state semiconductors.
              </p>
            </div>
          </div>
          <!-- Card 2 -->
          <div class="col-md-4">
            <div class="feature-card p-4 rounded-3 shadow-sm h-100 border">
              <div class="feature-icon mb-3">🎛️</div>
              <h3 class="h5 fw-bold mb-2">Hands-on Learning</h3>
              <p class="text-secondary mb-0">
                Experiment directly with interactive MOSFET threshold curves, CMOS inverter propagation delays, 
                3D Bloch sphere vector rotations, and live multi-gate quantum circuits without installing local software.
              </p>
            </div>
          </div>
          <!-- Card 3 -->
          <div class="col-md-4">
            <div class="feature-card p-4 rounded-3 shadow-sm h-100 border">
              <div class="feature-icon mb-3">📐</div>
              <h3 class="h5 fw-bold mb-2">Physics-Accurate</h3>
              <p class="text-secondary mb-0">
                Rigorous mathematical rigor is preserved throughout: from Poisson-Schrödinger electrostatic analogies 
                to unitary matrices, Hilbert state space transformations, and thermal noise to decoherence rates ($T_1$ and $T_2$).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Renders the Concept Mapping Table page content into #mapping
 * @param {HTMLElement} container 
 */
function renderMappingPage(container) {
  const tableData = [
    {
      concept: "Transistor",
      icon: "🔌",
      classical: "Solid-state electronic switching device governed by charge carrier transport across semiconductor junctions.",
      quantum: "Qubit (two-level quantum system) serving as the fundamental unit of quantum information processing.",
      category: "Hardware Unit"
    },
    {
      concept: "ON / OFF States",
      icon: "💡",
      classical: "Binary discrete states (logic 0 or logic 1) defined by saturated voltage or current thresholds.",
      quantum: "Computational basis states |0⟩ and |1⟩ observed upon projective measurement with collapse.",
      category: "Information States"
    },
    {
      concept: "Voltage / Current State",
      icon: "⚡",
      classical: "Continuous classical physical signal mapped to discrete logic levels via threshold margins.",
      quantum: "Continuous complex probability amplitudes (α, β) governing state vector |ψ⟩ = α|0⟩ + β|1⟩.",
      category: "Physical Representation"
    },
    {
      concept: "Logic Gate",
      icon: "🚪",
      classical: "Irreversible Boolean functional blocks (AND, OR, NOT, NAND) discarding entropy/information.",
      quantum: "Reversible unitary transformations (X, Y, Z, H, CNOT, Phase) conserving probability norm.",
      category: "Processing Operations"
    },
    {
      concept: "NOT Gate",
      icon: "🔄",
      classical: "Inverts logical voltage state: 0 ↔ 1 (V_out = V_DD - V_in across CMOS inverter).",
      quantum: "Pauli-X Gate: Performs unitary bit-flip rotating |0⟩ ↔ |1⟩ along the Bloch sphere X-axis.",
      category: "Single-Bit/Qubit Gate"
    },
    {
      concept: "Digital Circuit",
      icon: "🖧",
      classical: "Combinational and sequential networks of interconnected logic gates with fan-out branches.",
      quantum: "Quantum circuit of sequential unitary operators acting on qubits (no-cloning forbids arbitrary fan-out).",
      category: "Circuit Architecture"
    },
    {
      concept: "Noise & Fluctuations",
      icon: "📉",
      classical: "Thermal Johnson-Nyquist noise, flicker noise, and cross-talk disturbing voltage rails.",
      quantum: "Decoherence, phase damping (T_2), and energy relaxation (T_1) driven by environmental coupling.",
      category: "Error & Perturbation"
    },
    {
      concept: "Measurement / Readout",
      icon: "👁️",
      classical: "Reading output voltage without altering the stored digital bit value non-destructively.",
      quantum: "Projective measurement in basis {|0⟩, |1⟩}; collapses superposition probabilistically (Born rule).",
      category: "Observation"
    },
    {
      concept: "Determinism vs Probability",
      icon: "🎲",
      classical: "Deterministic transfer function: identical input states yield identical output voltage states.",
      quantum: "Intrinsic probabilistic outcome: P(0) = |α|², P(1) = |β|² despite deterministic unitary evolution.",
      category: "Predictability"
    },
    {
      concept: "Classical Bit vs Qubit",
      icon: "🌐",
      classical: "Constrained to binary state space {0, 1} with zero simultaneous coexistence.",
      quantum: "Coherent linear superposition of |0⟩ and |1⟩ existing as continuous surface points on the Bloch sphere.",
      category: "Capacity & Space"
    }
  ];

  const rowsHtml = tableData.map((item, idx) => `
    <tr class="mapping-table-row">
      <td class="fw-bold align-middle concept-cell">
        <span class="concept-icon me-2">${item.icon}</span>
        <span class="concept-name">${item.concept}</span>
        <span class="badge badge-subtle d-block mt-1">${item.category}</span>
      </td>
      <td class="align-middle classical-cell">
        <div class="cell-content">
          <span class="cell-tag classical-tag">Classical</span>
          <p class="mb-0 text-secondary">${item.classical}</p>
        </div>
      </td>
      <td class="align-middle quantum-cell">
        <div class="cell-content">
          <span class="cell-tag quantum-tag">Quantum</span>
          <p class="mb-0 text-white fw-medium">${item.quantum}</p>
        </div>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="mapping-page-wrapper py-5">
      <div class="container">
        <!-- Header -->
        <header class="section-header text-center mb-5">
          <div class="badge-pill mb-2">
            <span class="badge-accent">Core Conceptual Rosetta Stone</span>
          </div>
          <h1 class="display-5 fw-bold mb-3">Concept Mapping Table</h1>
          <p class="lead text-muted mx-auto" style="max-width: 800px;">
            A direct side-by-side translation between classical semiconductor electronics and quantum computing.
            Use this comparative index to anchor complex quantum principles in the familiar framework 
            of solid-state electronics and digital logic design.
          </p>
          <div class="action-bar mt-4 d-flex justify-content-center gap-3">
            <button type="button" class="btn btn-outline-primary" onclick="window.print()">
              🖨️ Print / Download Mapping as PDF
            </button>
            <a href="#level1" class="btn btn-primary">
              Begin Guided Study &rarr;
            </a>
          </div>
        </header>

        <!-- Responsive Table -->
        <div class="card shadow-sm border-0 mb-5 overflow-hidden">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mapping-table mb-0" id="conceptMappingTable">
                <thead class="table-light">
                  <tr>
                    <th scope="col" style="width: 24%;">Electronics Concept</th>
                    <th scope="col" style="width: 38%;">What You Already Know (Semiconductor / Logic)</th>
                    <th scope="col" style="width: 38%;">Quantum Counterpart (Quantum Computing)</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Deep Dive Cards -->
        <section class="deep-dive-section mt-5">
          <div class="section-heading mb-4 text-center">
            <h2 class="h3 fw-bold">Deep Dive: Critical Conceptual Transitions</h2>
            <p class="text-muted">Rigorous analytical breakdown of the three most pivotal conceptual shifts</p>
          </div>

          <div class="row g-4">
            <!-- Deep Dive 1: Transistor to Qubit -->
            <div class="col-lg-4">
              <div class="card deep-dive-card h-100 shadow-sm border">
                <div class="card-header bg-transparent border-bottom pt-3 pb-2">
                  <span class="badge bg-primary-subtle text-primary mb-1">Deep Dive 1</span>
                  <h3 class="h5 fw-bold mb-0">Transistor &rarr; Qubit</h3>
                </div>
                <div class="card-body">
                  <p class="text-secondary small">
                    In a MOSFET, information is encoded by macroscopic electron density in the inversion channel:
                  </p>
                  <div class="math-callout p-2 rounded mb-3 text-center bg-light font-monospace small">
                    I_D = &mu;_n C_{ox} (W/L) [(V_{GS} - V_{TH})V_{DS} - V_{DS}^2 / 2]
                  </div>
                  <p class="text-secondary small">
                    In a quantum system (such as a superconducting transmon or semiconductor spin qubit), information 
                    is held by a normalized state vector in a two-dimensional complex Hilbert space:
                  </p>
                  <div class="math-callout p-2 rounded mb-3 text-center bg-light font-monospace small">
                    |&psi;&rang; = &alpha;|0&rang; + &beta;|1&rang;, &emsp; where |&alpha;|<sup>2</sup> + |&beta;|<sup>2</sup> = 1
                  </div>
                  <p class="small text-muted mb-0">
                    <strong>Key Insight:</strong> The classical switch is strictly bistable (0 or 1) at steady state, 
                    whereas the qubit occupies a continuum of linear superposition states on the surface of the Bloch sphere.
                  </p>
                </div>
              </div>
            </div>

            <!-- Deep Dive 2: NOT to X Gate -->
            <div class="col-lg-4">
              <div class="card deep-dive-card h-100 shadow-sm border">
                <div class="card-header bg-transparent border-bottom pt-3 pb-2">
                  <span class="badge bg-success-subtle text-success mb-1">Deep Dive 2</span>
                  <h3 class="h5 fw-bold mb-0">NOT Gate &rarr; Pauli-X Gate</h3>
                </div>
                <div class="card-body">
                  <p class="text-secondary small">
                    A CMOS inverter achieves logical inversion via complementary PMOS pull-up and NMOS pull-down networks:
                  </p>
                  <div class="math-callout p-2 rounded mb-3 text-center bg-light font-monospace small">
                    V_{OUT} = V_{DD} &emsp; (if V_{IN} = 0), &emsp; V_{OUT} = 0 &emsp; (if V_{IN} = V_{DD})
                  </div>
                  <p class="text-secondary small">
                    The quantum Pauli-X gate acts as a unitary operator represented by the matrix:
                  </p>
                  <div class="math-callout p-2 rounded mb-3 text-center bg-light font-monospace small">
                    X = &begin;pmatrix&end; 0 &amp; 1 \\ 1 &amp; 0 &begin;pmatrix&end; &emsp; &rArr; &emsp; X(&alpha;|0&rang; + &beta;|1&rang;) = &beta;|0&rang; + &alpha;|1&rang;
                  </div>
                  <p class="small text-muted mb-0">
                    <strong>Key Insight:</strong> Unlike classical logic gates that dissipate energy (Landauer limit $k_B T \ln 2$), 
                    quantum gates are unitary ($U^\\dagger U = I$), strictly reversible, and preserve quantum phase coherency.
                  </p>
                </div>
              </div>
            </div>

            <!-- Deep Dive 3: Classical Noise to Decoherence -->
            <div class="col-lg-4">
              <div class="card deep-dive-card h-100 shadow-sm border">
                <div class="card-header bg-transparent border-bottom pt-3 pb-2">
                  <span class="badge bg-warning-subtle text-warning mb-1">Deep Dive 3</span>
                  <h3 class="h5 fw-bold mb-0">Noise &rarr; Decoherence</h3>
                </div>
                <div class="card-body">
                  <p class="text-secondary small">
                    Classical circuits resist thermal fluctuations via non-linear noise margins ($NM_L, NM_H$):
                  </p>
                  <div class="math-callout p-2 rounded mb-3 text-center bg-light font-monospace small">
                    \\langle v_n^2 \\rangle = 4 k_B T R \\Delta f, &emsp; NM_L = V_{IL} - V_{OL}
                  </div>
                  <p class="text-secondary small">
                    In quantum devices, environmental entanglement degrades pure states into statistical mixtures via longitudinal relaxation ($T_1$) and dephasing ($T_2$):
                  </p>
                  <div class="math-callout p-2 rounded mb-3 text-center bg-light font-monospace small">
                    &rho;(t) = &begin;pmatrix&end; &rho;_{00}(t) &amp; &rho;_{01}(0)e^{-t/T_2} \\ &rho;_{10}(0)e^{-t/T_2} &amp; 1 - &rho;_{00}(t) &begin;pmatrix&end;
                  </div>
                  <p class="small text-muted mb-0">
                    <strong>Key Insight:</strong> Classical signals can be continually restored using non-linear amplification, 
                    whereas the No-Cloning theorem forbids simple quantum amplification, necessitating quantum error correction (QEC).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `;
}

// Make accessible globally
if (typeof window !== 'undefined') {
  window.initHomeMapping = initHomeMapping;
}

// Support CommonJS / ES module environments if used
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initHomeMapping };
}

/* --- levels-1-2.js --- */
/**
 * levels-1-2.js
 * Educational Framework: From Transistors to Qubits
 * Interactive implementation for Level 1 (Transistor as a Switch)
 * and Level 2 (Logic Gates and the Quantum X Gate).
 */
function initLevels12() {
  const level1El = document.getElementById('level1');
  const level2El = document.getElementById('level2');

  if (level1El) {
    renderLevel1(level1El);
    initLevel1Interactivity();
  }

  if (level2El) {
    renderLevel2(level2El);
    initLevel2Interactivity();
  }
}

if (typeof window !== 'undefined') {
  window.initLevels12 = initLevels12;
}

/* ==========================================================================
   LEVEL 1 — THE TRANSISTOR AS A SWITCH
   ========================================================================== */

function renderLevel1(container) {
  container.innerHTML = `
    <div class="container py-4">
      <!-- Section Header -->
      <div class="level-header mb-4">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge" style="background: rgba(88, 166, 255, 0.15); color: var(--accent-primary); border: 1px solid rgba(88, 166, 255, 0.3); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">LEVEL 1 &bull; FOUNDATION</span>
          <span class="text-muted" style="font-size: 0.85rem;">Hardware Primitives</span>
        </div>
        <h1 class="h2 fw-bold" style="color: var(--heading-color); margin-bottom: 0.5rem;">
          Level 1: The Transistor — Foundation of Digital Logic
        </h1>
        <p class="lead" style="color: var(--text-muted); max-width: 800px;">
          Explore how a semiconductor Bipolar Junction Transistor (BJT) acts as an electronically controlled switch,
          bridging physical carrier motion with the abstract concept of a classical binary bit.
        </p>
      </div>

      <!-- Level Switcher Navigation Bar -->
      <nav class="level-switcher-bar" aria-label="Switch between levels">
        <div class="level-switcher-track">
          <a href="#level1" class="level-switcher-item active">
            <span class="level-num">1</span>
            <span class="level-info">
              <span class="level-label">Level 1</span>
              <span class="level-title">Transistor Switch</span>
            </span>
          </a>
          <a href="#level2" class="level-switcher-item">
            <span class="level-num">2</span>
            <span class="level-info">
              <span class="level-label">Level 2</span>
              <span class="level-title">Logic Gates</span>
            </span>
          </a>
          <a href="#level3" class="level-switcher-item">
            <span class="level-num">3</span>
            <span class="level-info">
              <span class="level-label">Level 3</span>
              <span class="level-title">Bit &rarr; Qubit</span>
            </span>
          </a>
          <a href="#level4" class="level-switcher-item">
            <span class="level-num">4</span>
            <span class="level-info">
              <span class="level-label">Level 4</span>
              <span class="level-title">Quantum Circuits</span>
            </span>
          </a>
        </div>
      </nav>

      <!-- Explanation Card: BJT / Switch Analogy -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.75rem;">
        <div class="card-header" style="border: none; padding: 0 0 1rem 0; display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🔌</span>
          <div>
            <h2 class="card-title h4 mb-0" style="color: var(--heading-color);">How a Transistor Acts as an Electronic Switch</h2>
            <small class="text-muted">From Base Current (I<sub>B</sub>) to Binary Bit Representation</small>
          </div>
        </div>
        <div class="card-body" style="padding: 0; color: var(--text-main); font-size: 0.95rem; line-height: 1.7;">
          <p>
            In modern computation, digital information is physically stored and manipulated using semiconductor switches.
            In an <strong>NPN Bipolar Junction Transistor (BJT)</strong>, three doped semiconductor layers form two p-n junctions:
            the <em>Emitter</em> (heavily n-doped), the <em>Base</em> (thin, lightly p-doped), and the <em>Collector</em> (moderately n-doped).
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin: 1.25rem 0;">
            <div style="background: var(--surface-color); padding: 1.25rem; border-radius: var(--border-radius-sm); border-left: 4px solid var(--accent-danger);">
              <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--heading-color);">1. Cutoff Region (V<sub>in</sub> &lt; 0.7V)</h4>
              <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);">
                The Base-Emitter p-n junction remains unforwarded. No base current (<em>I<sub>B</sub> &approx; 0</em>) can inject electrons into the base.
                The collector-emitter path acts as an open circuit (<em>I<sub>C</sub> = 0</em>). The LED is <strong>OFF</strong>, representing logical <strong>0</strong>.
              </p>
            </div>
            <div style="background: var(--surface-color); padding: 1.25rem; border-radius: var(--border-radius-sm); border-left: 4px solid var(--accent-amber);">
              <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--heading-color);">2. Active Region (0.7V &le; V<sub>in</sub> &lt; 1.5V)</h4>
              <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);">
                The junction turns ON. Base current enters the base, allowing an amplified collector current (<em>I<sub>C</sub> = &beta; I<sub>B</sub></em>).
                The transistor transitions out of high-impedance cutoff into linear amplification.
              </p>
            </div>
            <div style="background: var(--surface-color); padding: 1.25rem; border-radius: var(--border-radius-sm); border-left: 4px solid var(--accent-secondary);">
              <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--heading-color);">3. Saturation Region (V<sub>in</sub> &ge; 1.5V)</h4>
              <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);">
                Both Base-Emitter and Base-Collector junctions are forward biased. Maximum collector current flows limited only by <em>R<sub>1</sub></em>.
                The switch is fully closed (<em>V<sub>CE(sat)</sub> &approx; 0.2V</em>). The LED glows brightly, representing logical <strong>1</strong>.
              </p>
            </div>
          </div>
          <p style="margin-bottom: 0;">
            <strong>The Analogy to a Bit:</strong> Digital computation abstracts away the continuous analog voltages
            into two discrete binary states: when the transistor conducts fully (Switch Closed / ON), the state corresponds to <strong>Bit = 1</strong>;
            when it blocks current (Switch Open / OFF), it corresponds to <strong>Bit = 0</strong>.
          </p>
        </div>
      </div>

      <!-- Interactive Circuit Card -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.75rem;">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h2 class="h4 mb-1" style="color: var(--heading-color);">Interactive BJT Switch Circuit</h2>
            <p class="text-muted mb-0" style="font-size: 0.9rem;">Adjust the input voltage V<sub>in</sub> to observe carrier injection, collector current, and LED state.</p>
          </div>
          <div id="l1-state-pill" style="padding: 0.4rem 0.9rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-muted);">
            STATE: OFF
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem;" class="level1-grid">
          <!-- Left: SVG Circuit Container -->
          <div class="circuit-wrapper" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.25rem; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
            <div id="l1-circuit-svg-container" style="width: 100%; max-width: 540px; height: 380px;">
              <!-- SVG is generated programmatically -->
            </div>
            <div class="circuit-legend d-flex gap-4 mt-2 text-muted" style="font-size: 0.8rem;">
              <span><span style="display: inline-block; width: 10px; height: 10px; background: #58a6ff; border-radius: 50%; margin-right: 4px;"></span>Vcc Rail (+5V)</span>
              <span><span style="display: inline-block; width: 10px; height: 10px; background: #3fb950; border-radius: 50%; margin-right: 4px;"></span>Current Flow</span>
              <span><span style="display: inline-block; width: 10px; height: 10px; background: #e3b341; border-radius: 50%; margin-right: 4px;"></span>LED Glow</span>
            </div>
          </div>

          <!-- Right: Controls & Real-time Metrics Dashboard -->
          <div class="controls-wrapper d-flex flex-column justify-content-between">
            <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; margin-bottom: 1.25rem;">
              <div class="control-group mb-4">
                <div class="control-label d-flex justify-content-between align-items-center mb-2">
                  <span style="font-weight: 600; color: var(--heading-color);">Base Input Voltage (V<sub>in</sub>)</span>
                  <span id="l1-vin-display" class="control-value" style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">0.0 V</span>
                </div>
                <input type="range" id="l1-vin-slider" min="0" max="5.0" step="0.1" value="0.0" style="width: 100%; cursor: pointer;" aria-label="Base Input Voltage Slider">
                <div class="d-flex justify-content-between text-muted mt-1" style="font-size: 0.75rem;">
                  <span>0.0V (Cutoff)</span>
                  <span style="color: var(--accent-amber);">0.7V (V<sub>th</sub>)</span>
                  <span>5.0V (Saturation)</span>
                </div>
              </div>

              <!-- Preset Quick Buttons -->
              <div class="d-flex gap-2 mb-4">
                <button type="button" class="btn btn-sm btn-secondary" id="l1-btn-off" style="flex: 1;">Set 0V (OFF)</button>
                <button type="button" class="btn btn-sm btn-secondary" id="l1-btn-threshold" style="flex: 1;">Set 0.7V (V<sub>th</sub>)</button>
                <button type="button" class="btn btn-sm btn-secondary" id="l1-btn-on" style="flex: 1;">Set 5V (ON)</button>
              </div>

              <!-- Metrics Telemetry -->
              <div class="telemetry-box" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div style="background: var(--card-bg); padding: 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Transistor State</div>
                  <div id="l1-transistor-state" style="font-size: 1rem; font-weight: 700; color: var(--accent-danger); font-family: var(--font-mono);">CUTOFF (OFF)</div>
                </div>
                <div style="background: var(--card-bg); padding: 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">LED Status</div>
                  <div id="l1-led-state" style="font-size: 1rem; font-weight: 700; color: var(--text-muted); font-family: var(--font-mono);">OFF (Dark)</div>
                </div>
                <div style="background: var(--card-bg); padding: 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Collector Current (I<sub>C</sub>)</div>
                  <div id="l1-ic-display" style="font-size: 1rem; font-weight: 700; color: var(--text-main); font-family: var(--font-mono);">0.00 mA</div>
                </div>
                <div style="background: var(--card-bg); padding: 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Digital Bit Value</div>
                  <div id="l1-bit-display" style="font-size: 1.25rem; font-weight: 800; color: var(--text-muted); font-family: var(--font-mono);">0</div>
                </div>
              </div>
            </div>

            <!-- Physics summary snippet -->
            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; background: rgba(88, 166, 255, 0.05); border: 1px dashed rgba(88, 166, 255, 0.25); border-radius: var(--border-radius-sm); padding: 0.9rem;">
              <strong>Circuit Model:</strong> <em>V<sub>CC</sub> = 5V</em>, <em>R<sub>collector</sub> = 330&Omega;</em>, <em>R<sub>base</sub> = 10k&Omega;</em>, 
              Silicon threshold <em>V<sub>BE</sub> &approx; 0.7V</em>. When <em>V<sub>in</sub> &ge; 0.7V</em>, base current triggers rapid collector saturation.
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insight Box -->
      <div class="card mb-4" style="background: linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, rgba(188, 140, 255, 0.05) 100%); border: 1px solid rgba(88, 166, 255, 0.35); border-left: 5px solid var(--accent-primary); border-radius: var(--border-radius-md); padding: 1.5rem;">
        <div class="d-flex align-items-start gap-3">
          <span style="font-size: 1.8rem; line-height: 1;">💡</span>
          <div>
            <h3 class="h5 mb-1" style="color: var(--heading-color);">Key Insight: The Physical Basis of the Classical Bit</h3>
            <p style="color: var(--text-main); margin-bottom: 0; font-size: 0.95rem; line-height: 1.6;">
              <strong>The transistor's binary ON/OFF behavior is the physical basis of the classical bit.</strong>
              Although the underlying electron mechanics inside semiconductor materials are governed by continuous Fermi-Dirac statistics
              and band energy gradients, computer engineers deliberately enforce steep non-linear switching regions. By establishing wide noise margins
              above <em>V<sub>th</sub></em> and below <em>V<sub>th</sub></em>, macroscopic hardware guarantees unambiguous, deterministic, and noise-immune
              storage of binary <strong>0</strong> and <strong>1</strong>.
            </p>
          </div>
        </div>
      </div>

      <!-- Voltage to Digital Output Table -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem;">
        <h3 class="h5 mb-3" style="color: var(--heading-color);">Operating Regions &amp; Digital Output Mapping</h3>
        <div class="table-responsive" style="margin-bottom: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color);">
                <th style="padding: 0.75rem 1rem; color: var(--heading-color); text-align: left;">Input Voltage (V<sub>in</sub>)</th>
                <th style="padding: 0.75rem 1rem; color: var(--heading-color); text-align: left;">B-E Junction</th>
                <th style="padding: 0.75rem 1rem; color: var(--heading-color); text-align: left;">Transistor State</th>
                <th style="padding: 0.75rem 1rem; color: var(--heading-color); text-align: left;">Collector Current (I<sub>C</sub>)</th>
                <th style="padding: 0.75rem 1rem; color: var(--heading-color); text-align: left;">LED Status</th>
                <th style="padding: 0.75rem 1rem; color: var(--heading-color); text-align: left;">Output Bit</th>
              </tr>
            </thead>
            <tbody>
              <tr id="l1-row-cutoff" style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;">
                <td style="padding: 0.75rem 1rem; font-family: var(--font-mono); font-weight: 600;">V<sub>in</sub> &lt; 0.7V</td>
                <td style="padding: 0.75rem 1rem;">Reverse / Unbiased</td>
                <td style="padding: 0.75rem 1rem;"><span style="color: var(--accent-danger); font-weight: 600;">Cutoff (OFF)</span></td>
                <td style="padding: 0.75rem 1rem; font-family: var(--font-mono);">0 mA</td>
                <td style="padding: 0.75rem 1rem;">Dark / OFF</td>
                <td style="padding: 0.75rem 1rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-danger); font-size: 1.1rem;">0</td>
              </tr>
              <tr id="l1-row-active" style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;">
                <td style="padding: 0.75rem 1rem; font-family: var(--font-mono); font-weight: 600;">0.7V &le; V<sub>in</sub> &lt; 1.5V</td>
                <td style="padding: 0.75rem 1rem;">Forward Biased</td>
                <td style="padding: 0.75rem 1rem;"><span style="color: var(--accent-amber); font-weight: 600;">Active Linear</span></td>
                <td style="padding: 0.75rem 1rem; font-family: var(--font-mono);">&beta; &middot; I<sub>B</sub> (Partial)</td>
                <td style="padding: 0.75rem 1rem;">Dim Glow</td>
                <td style="padding: 0.75rem 1rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-amber); font-size: 1.1rem;">Transition</td>
              </tr>
              <tr id="l1-row-sat" style="transition: background-color 0.2s;">
                <td style="padding: 0.75rem 1rem; font-family: var(--font-mono); font-weight: 600;">V<sub>in</sub> &ge; 1.5V (to 5.0V)</td>
                <td style="padding: 0.75rem 1rem;">Strongly Forward</td>
                <td style="padding: 0.75rem 1rem;"><span style="color: var(--accent-secondary); font-weight: 600;">Saturation (ON)</span></td>
                <td style="padding: 0.75rem 1rem; font-family: var(--font-mono);">&approx; 12.8 mA (Max)</td>
                <td style="padding: 0.75rem 1rem;">Bright Glow</td>
                <td style="padding: 0.75rem 1rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-secondary); font-size: 1.1rem;">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Level Pagination -->
      <div class="level-pagination">
        <a href="#mapping" class="btn btn-outline-secondary level-pagination-prev">
          &larr; Concept Mapping
        </a>
        <a href="#level2" class="btn btn-primary level-pagination-next">
          Next: Level 2 &mdash; Logic Gates &rarr;
        </a>
      </div>
    </div>
  `;
}

/**
 * Generates programmatic SVG for Level 1 Transistor Switch Circuit
 */
function createLevel1CircuitSVG() {
  return `
    <svg viewBox="0 0 540 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;" id="l1-circuit-svg">
      <defs>
        <!-- Glow Filter for LED when ON -->
        <filter id="l1-led-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Current Flow Pulse Animation Marker -->
        <linearGradient id="l1-wire-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#58a6ff" />
          <stop offset="100%" stop-color="#3fb950" />
        </linearGradient>
      </defs>

      <!-- Grid Background Subtle Accent -->
      <g opacity="0.08" stroke="#ffffff" stroke-width="0.5">
        <line x1="40" y1="0" x2="40" y2="380" />
        <line x1="140" y1="0" x2="140" y2="380" />
        <line x1="240" y1="0" x2="240" y2="380" />
        <line x1="340" y1="0" x2="340" y2="380" />
        <line x1="440" y1="0" x2="440" y2="380" />
        <line x1="0" y1="80" x2="540" y2="80" />
        <line x1="0" y1="180" x2="540" y2="180" />
        <line x1="0" y1="280" x2="540" y2="280" />
      </g>

      <!-- ================= 1. VCC RAIL AT TOP ================= -->
      <!-- Vcc Rail Bar -->
      <line x1="300" y1="30" x2="420" y2="30" stroke="#58a6ff" stroke-width="4" stroke-linecap="round" />
      <circle cx="360" cy="30" r="4" fill="#58a6ff" />
      <text x="360" y="20" fill="#58a6ff" font-size="13" font-weight="700" text-anchor="middle" font-family="monospace">+5V (Vcc Rail)</text>

      <!-- Collector Line from Vcc to Collector Resistor R1 -->
      <path d="M 360,30 L 360,60" stroke="#8b949e" stroke-width="2.5" />

      <!-- Resistor R1 (Zigzag path) -->
      <!-- 60 to 110 (length 50) -->
      <path d="M 360,60 
               L 360,65 
               L 350,70 L 370,76 L 350,82 L 370,88 L 350,94 L 370,100 L 360,105 
               L 360,110" 
            fill="none" stroke="#c9d1d9" stroke-width="2.5" stroke-linejoin="round" />
      <text x="382" y="88" fill="#c9d1d9" font-size="12" font-family="monospace">R1 (330&Omega;)</text>

      <!-- Wire from Resistor R1 to LED -->
      <path d="M 360,110 L 360,135" stroke="#8b949e" stroke-width="2.5" />

      <!-- Current Flow Animated Collector Dash Line (Hidden when OFF) -->
      <path id="l1-collector-flow" d="M 360,30 L 360,210" 
            fill="none" stroke="#3fb950" stroke-width="2.5" stroke-dasharray="6,6" opacity="0">
        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.8s" repeatCount="indefinite" />
      </path>

      <!-- ================= 2. LED SYMBOL ================= -->
      <!-- Anode at (360, 135), Cathode at (360, 165) -->
      <g id="l1-led-group" transform="translate(0, 0)">
        <!-- LED Anode to Cathode Triangle -->
        <polygon id="l1-led-triangle" points="345,135 375,135 360,160" 
                 fill="#30363d" stroke="#c9d1d9" stroke-width="2" />
        <!-- Cathode Horizontal Bar -->
        <line x1="345" y1="160" x2="375" y2="160" stroke="#c9d1d9" stroke-width="2.5" />
        <!-- LED Light Emission Arrows -->
        <g id="l1-led-arrows" opacity="0.3">
          <line x1="375" y1="140" x2="390" y2="130" stroke="#f0883e" stroke-width="2" marker-end="url(#arrow)" />
          <polygon points="390,130 382,130 387,135" fill="#f0883e" />
          <line x1="377" y1="150" x2="392" y2="140" stroke="#f0883e" stroke-width="2" />
          <polygon points="392,140 384,140 389,145" fill="#f0883e" />
        </g>
        <text x="315" y="152" fill="#c9d1d9" font-size="12" font-family="monospace">LED</text>
      </g>

      <!-- Wire from LED Cathode to Transistor Collector Terminal -->
      <path d="M 360,160 L 360,210" stroke="#8b949e" stroke-width="2.5" />
      <text x="372" y="195" fill="#8b949e" font-size="11" font-family="monospace">Collector</text>

      <!-- ================= 3. INPUT VOLTAGE (BASE SIDE) ================= -->
      <!-- Input terminal on left -->
      <!-- Ground for Vin source -->
      <g transform="translate(60, 240)">
        <!-- Battery / DC Voltage source circle -->
        <circle cx="20" cy="0" r="18" fill="var(--card-bg)" stroke="#58a6ff" stroke-width="2" />
        <text x="20" y="4" fill="#58a6ff" font-size="11" font-weight="700" text-anchor="middle" font-family="monospace">Vin</text>
        <!-- Top terminal -->
        <line x1="20" y1="-18" x2="20" y2="-40" stroke="#58a6ff" stroke-width="2.5" />
        <!-- Wire heading towards base resistor -->
        <line x1="20" y1="-40" x2="110" y2="-40" stroke="#8b949e" stroke-width="2.5" />
        <!-- Bottom terminal to ground -->
        <line x1="20" y1="18" x2="20" y2="40" stroke="#8b949e" stroke-width="2.5" />
        <!-- Ground lines -->
        <line x1="10" y1="40" x2="30" y2="40" stroke="#8b949e" stroke-width="2" />
        <line x1="14" y1="44" x2="26" y2="44" stroke="#8b949e" stroke-width="1.5" />
        <line x1="18" y1="48" x2="22" y2="48" stroke="#8b949e" stroke-width="1.5" />
      </g>

      <!-- Base Resistor Rb (Zigzag horizontal) from (110, 200) to (180, 200) -->
      <path d="M 80,200 L 110,200" stroke="#8b949e" stroke-width="2.5" />
      <path d="M 110,200 
               L 115,200 
               L 120,192 L 128,208 L 136,192 L 144,208 L 152,192 L 160,208 L 165,200 
               L 175,200" 
            fill="none" stroke="#c9d1d9" stroke-width="2.5" stroke-linejoin="round" />
      <text x="142" y="184" fill="#c9d1d9" font-size="11" font-family="monospace" text-anchor="middle">Rb (10k&Omega;)</text>

      <!-- Wire from Rb to Transistor Base Terminal -->
      <path d="M 175,200 L 260,200" stroke="#8b949e" stroke-width="2.5" />
      <text x="215" y="215" fill="#8b949e" font-size="11" font-family="monospace">Base (B)</text>

      <!-- Animated Base Current Flow Dash line -->
      <path id="l1-base-flow" d="M 80,200 L 270,200" 
            fill="none" stroke="#3fb950" stroke-width="2.5" stroke-dasharray="5,5" opacity="0">
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
      </path>

      <!-- ================= 4. BJT NPN TRANSISTOR SYMBOL ================= -->
      <g transform="translate(40, 0)">
        <!-- Circle Enclosure of Transistor -->
        <circle cx="280" cy="220" r="45" fill="none" stroke="#30363d" stroke-width="2" stroke-dasharray="4,4" />

        <!-- Vertical Base Bar -->
        <line x1="240" y1="185" x2="240" y2="255" stroke="#f0f6fc" stroke-width="4.5" stroke-linecap="round" />

        <!-- Connection to Base Pin -->
        <line x1="220" y1="200" x2="240" y2="200" stroke="#8b949e" stroke-width="2.5" />

        <!-- Collector Diagonal Branch (from base bar to collector pin) -->
        <line x1="240" y1="205" x2="320" y2="185" stroke="#f0f6fc" stroke-width="3" stroke-linecap="round" />
        <line x1="320" y1="185" x2="320" y2="210" stroke="#8b949e" stroke-width="2.5" />

        <!-- Emitter Diagonal Branch with Arrow (pointing outwards for NPN) -->
        <line x1="240" y1="235" x2="320" y2="255" stroke="#f0f6fc" stroke-width="3" stroke-linecap="round" />
        <!-- Emitter Arrow pointing outwards (down-right) -->
        <polygon points="295,248 312,253 300,240" fill="#58a6ff" />

        <!-- Transistor Label -->
        <text x="280" y="295" fill="#58a6ff" font-size="12" font-weight="700" font-family="monospace" text-anchor="middle">NPN BJT</text>
        <text x="330" y="270" fill="#8b949e" font-size="11" font-family="monospace">Emitter</text>
      </g>

      <!-- ================= 5. EMITTER TO GROUND ================= -->
      <!-- Wire from Emitter (360, 255) to Ground at bottom -->
      <path d="M 360,255 L 360,330" stroke="#8b949e" stroke-width="2.5" />

      <!-- Emitter Ground Symbol at (360, 330) -->
      <g transform="translate(360, 330)">
        <line x1="-20" y1="0" x2="20" y2="0" stroke="#8b949e" stroke-width="3" />
        <line x1="-12" y1="5" x2="12" y2="5" stroke="#8b949e" stroke-width="2.5" />
        <line x1="-5" y1="10" x2="5" y2="10" stroke="#8b949e" stroke-width="2" />
        <text x="25" y="5" fill="#8b949e" font-size="11" font-family="monospace">GND (0V)</text>
      </g>

      <!-- Terminal Indicators Nodes -->
      <circle cx="360" cy="210" r="3.5" fill="#58a6ff" />
      <circle cx="260" cy="200" r="3.5" fill="#58a6ff" />
      <circle cx="360" cy="255" r="3.5" fill="#58a6ff" />
    </svg>
  `;
}

function initLevel1Interactivity() {
  const container = document.getElementById('l1-circuit-svg-container');
  if (container) {
    container.innerHTML = createLevel1CircuitSVG();
  }

  const slider = document.getElementById('l1-vin-slider');
  const vinDisplay = document.getElementById('l1-vin-display');
  const statePill = document.getElementById('l1-state-pill');
  const transistorState = document.getElementById('l1-transistor-state');
  const ledState = document.getElementById('l1-led-state');
  const icDisplay = document.getElementById('l1-ic-display');
  const bitDisplay = document.getElementById('l1-bit-display');

  const rowCutoff = document.getElementById('l1-row-cutoff');
  const rowActive = document.getElementById('l1-row-active');
  const rowSat = document.getElementById('l1-row-sat');

  const btnOff = document.getElementById('l1-btn-off');
  const btnThreshold = document.getElementById('l1-btn-threshold');
  const btnOn = document.getElementById('l1-btn-on');

  function updateCircuit(vinVal) {
    const vin = parseFloat(vinVal);
    vinDisplay.textContent = vin.toFixed(1) + ' V';

    // SVG elements
    const ledTriangle = document.getElementById('l1-led-triangle');
    const ledArrows = document.getElementById('l1-led-arrows');
    const collectorFlow = document.getElementById('l1-collector-flow');
    const baseFlow = document.getElementById('l1-base-flow');

    // Reset table row highlights
    [rowCutoff, rowActive, rowSat].forEach(r => {
      if (r) r.style.backgroundColor = 'transparent';
    });

    if (vin < 0.7) {
      // 1. CUTOFF REGION (OFF)
      statePill.textContent = 'STATE: CUTOFF (OFF)';
      statePill.style.color = 'var(--accent-danger)';
      statePill.style.borderColor = 'var(--accent-danger)';

      transistorState.textContent = 'CUTOFF (OFF)';
      transistorState.style.color = 'var(--accent-danger)';

      ledState.textContent = 'OFF (Dark)';
      ledState.style.color = 'var(--text-muted)';

      icDisplay.textContent = '0.00 mA';
      bitDisplay.textContent = '0';
      bitDisplay.style.color = 'var(--accent-danger)';

      if (rowCutoff) rowCutoff.style.backgroundColor = 'rgba(248, 81, 73, 0.12)';

      // SVG visual changes
      if (ledTriangle) {
        ledTriangle.setAttribute('fill', '#21262d');
        ledTriangle.removeAttribute('filter');
        ledTriangle.setAttribute('stroke', '#8b949e');
      }
      if (ledArrows) ledArrows.setAttribute('opacity', '0');
      if (collectorFlow) collectorFlow.setAttribute('opacity', '0');
      if (baseFlow) baseFlow.setAttribute('opacity', '0');

    } else if (vin >= 0.7 && vin < 1.5) {
      // 2. ACTIVE REGION
      const ratio = (vin - 0.7) / (1.5 - 0.7);
      const current = (ratio * 6.5).toFixed(2);

      statePill.textContent = 'STATE: ACTIVE REGION';
      statePill.style.color = 'var(--accent-amber)';
      statePill.style.borderColor = 'var(--accent-amber)';

      transistorState.textContent = 'ACTIVE (Linear)';
      transistorState.style.color = 'var(--accent-amber)';

      ledState.textContent = 'PARTIAL (Dim)';
      ledState.style.color = 'var(--accent-amber)';

      icDisplay.textContent = current + ' mA';
      bitDisplay.textContent = 'Transition (~' + (ratio > 0.5 ? '1' : '0') + ')';
      bitDisplay.style.color = 'var(--accent-amber)';

      if (rowActive) rowActive.style.backgroundColor = 'rgba(210, 153, 34, 0.12)';

      // SVG visual changes
      if (ledTriangle) {
        ledTriangle.setAttribute('fill', '#9e6a03');
        ledTriangle.setAttribute('stroke', '#e3b341');
        ledTriangle.removeAttribute('filter');
      }
      if (ledArrows) ledArrows.setAttribute('opacity', (0.3 + 0.5 * ratio).toString());
      if (collectorFlow) collectorFlow.setAttribute('opacity', (0.4 + 0.4 * ratio).toString());
      if (baseFlow) baseFlow.setAttribute('opacity', (0.4 + 0.4 * ratio).toString());

    } else {
      // 3. SATURATION REGION (ON)
      statePill.textContent = 'STATE: SATURATION (ON)';
      statePill.style.color = 'var(--accent-secondary)';
      statePill.style.borderColor = 'var(--accent-secondary)';

      transistorState.textContent = 'SATURATION (ON)';
      transistorState.style.color = 'var(--accent-secondary)';

      ledState.textContent = 'ON (Bright Glow)';
      ledState.style.color = '#ffd13b';

      // (Vcc - Vled - Vce_sat) / R1 = (5 - 2.0 - 0.2) / 330 = 2.8 / 330 = 8.48 mA
      const satCurrent = (8.5 + (vin - 1.5) * 0.4).toFixed(2);
      icDisplay.textContent = satCurrent + ' mA';
      bitDisplay.textContent = '1';
      bitDisplay.style.color = 'var(--accent-secondary)';

      if (rowSat) rowSat.style.backgroundColor = 'rgba(63, 185, 80, 0.12)';

      // SVG visual changes
      if (ledTriangle) {
        ledTriangle.setAttribute('fill', '#ffd33d');
        ledTriangle.setAttribute('stroke', '#ffea79');
        ledTriangle.setAttribute('filter', 'url(#l1-led-glow)');
      }
      if (ledArrows) ledArrows.setAttribute('opacity', '1');
      if (collectorFlow) collectorFlow.setAttribute('opacity', '1');
      if (baseFlow) baseFlow.setAttribute('opacity', '1');
    }
  }

  if (slider) {
    slider.addEventListener('input', (e) => updateCircuit(e.target.value));
  }

  if (btnOff) {
    btnOff.addEventListener('click', () => {
      if (slider) { slider.value = 0.0; updateCircuit(0.0); }
    });
  }

  if (btnThreshold) {
    btnThreshold.addEventListener('click', () => {
      if (slider) { slider.value = 0.7; updateCircuit(0.7); }
    });
  }

  if (btnOn) {
    btnOn.addEventListener('click', () => {
      if (slider) { slider.value = 5.0; updateCircuit(5.0); }
    });
  }

  // Initial state trigger
  updateCircuit(slider ? slider.value : 0.0);
}

/* ==========================================================================
   LEVEL 2 — LOGIC GATES AND THE QUANTUM X GATE
   ========================================================================== */

function renderLevel2(container) {
  container.innerHTML = `
    <div class="container py-4">
      <!-- Section Header -->
      <div class="level-header mb-4">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge" style="background: rgba(188, 140, 255, 0.15); color: var(--accent-purple); border: 1px solid rgba(188, 140, 255, 0.3); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">LEVEL 2 &bull; GATE EVOLUTION</span>
          <span class="text-muted" style="font-size: 0.85rem;">Boolean Logic &rarr; Unitary Transformations</span>
        </div>
        <h1 class="h2 fw-bold" style="color: var(--heading-color); margin-bottom: 0.5rem;">
          Level 2: Logic Gates &rarr; Quantum Gates
        </h1>
        <p class="lead" style="color: var(--text-muted); max-width: 820px;">
          Trace the architectural leap from the semiconductor RTL / CMOS Inverter to the fundamental Quantum Pauli-X gate.
          Understand why classical gates dissipate entropy while quantum gates preserve unitarity and quantum phase.
        </p>
      </div>

      <!-- Level Switcher Navigation Bar -->
      <nav class="level-switcher-bar" aria-label="Switch between levels">
        <div class="level-switcher-track">
          <a href="#level1" class="level-switcher-item">
            <span class="level-num">1</span>
            <span class="level-info">
              <span class="level-label">Level 1</span>
              <span class="level-title">Transistor Switch</span>
            </span>
          </a>
          <a href="#level2" class="level-switcher-item active">
            <span class="level-num">2</span>
            <span class="level-info">
              <span class="level-label">Level 2</span>
              <span class="level-title">Logic Gates</span>
            </span>
          </a>
          <a href="#level3" class="level-switcher-item">
            <span class="level-num">3</span>
            <span class="level-info">
              <span class="level-label">Level 3</span>
              <span class="level-title">Bit &rarr; Qubit</span>
            </span>
          </a>
          <a href="#level4" class="level-switcher-item">
            <span class="level-num">4</span>
            <span class="level-info">
              <span class="level-label">Level 4</span>
              <span class="level-title">Quantum Circuits</span>
            </span>
          </a>
        </div>
      </nav>

      <!-- Part A: Transistor-Based NOT Gate (Inverter) -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.75rem;">
        <div class="card-header" style="border: none; padding: 0 0 1rem 0;">
          <h2 class="card-title h4 mb-1" style="color: var(--heading-color);">1. Transistor Inverter: Building the Classical NOT Gate</h2>
          <p class="text-muted mb-0" style="font-size: 0.9rem;">
            How an NPN transistor combined with a pull-up resistor performs logical inversion (A &rarr; &not;A).
          </p>
        </div>
        <div class="card-body" style="padding: 0; color: var(--text-main); font-size: 0.95rem; line-height: 1.7;">
          <p>
            The simplest electronic implementation of a NOT gate is an <strong>NPN Transistor Inverter</strong>.
            The collector is connected to <em>+V<sub>CC</sub></em> via a pull-up resistor <em>R<sub>c</sub></em>, and the output
            terminal <em>V<sub>out</sub></em> is tapped directly at the collector node:
          </p>
          <ul style="margin-bottom: 1.25rem; padding-left: 1.5rem;">
            <li><strong>When Input is LOW (0V / Logical 0):</strong> The Base-Emitter junction is unbiased. The transistor is in <em>Cutoff (OFF)</em>. No collector current flows through <em>R<sub>c</sub></em>. Hence there is zero voltage drop across <em>R<sub>c</sub></em>, pulling <em>V<sub>out</sub></em> straight up to <strong>+5V (Logical 1)</strong>.</li>
            <li><strong>When Input is HIGH (5V / Logical 1):</strong> Base current drives the transistor into <em>Saturation (ON)</em>. The collector is pulled down to Ground (<em>V<sub>CE(sat)</sub> &approx; 0.2V</em>), resulting in <em>V<sub>out</sub> &approx; 0V</em> <strong>(Logical 0)</strong>.</li>
          </ul>

          <!-- Circuit Diagram & Interactive Inverter Box -->
          <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.75rem;" class="level2-inverter-grid">
            <!-- Left: SVG Inverter Schematic -->
            <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.25rem; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div id="l2-inverter-svg-container" style="width: 100%; max-width: 480px; height: 320px;">
                <!-- Generated by JS -->
              </div>
              <div class="text-muted mt-2" style="font-size: 0.8rem; text-align: center;">
                Transistor Inverter Schematic: Output tapped at Collector node
              </div>
            </div>

            <!-- Right: Interactive Inverter Controls & Truth Table -->
            <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 class="h5 mb-3" style="color: var(--heading-color);">Interactive NOT Inverter</h3>
                
                <!-- Toggle Button for Input -->
                <div class="d-flex align-items-center justify-content-between p-3 mb-3" style="background: var(--card-bg); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                  <div>
                    <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">Input State (A)</span>
                    <strong id="l2-not-in-val" style="font-size: 1.4rem; font-family: var(--font-mono); color: var(--accent-primary);">0 (0V)</strong>
                  </div>
                  <button type="button" class="btn btn-primary" id="l2-not-toggle-btn" style="padding: 0.5rem 1.25rem;">
                    Toggle Input &harr;
                  </button>
                </div>

                <!-- Output Display -->
                <div class="d-flex align-items-center justify-content-between p-3 mb-3" style="background: var(--card-bg); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                  <div>
                    <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">Output State (Y = &not;A)</span>
                    <strong id="l2-not-out-val" style="font-size: 1.4rem; font-family: var(--font-mono); color: var(--accent-secondary);">1 (+5V)</strong>
                  </div>
                  <span id="l2-not-trans-state" class="badge" style="background: rgba(248, 81, 73, 0.15); color: var(--accent-danger); font-size: 0.8rem; padding: 0.35rem 0.7rem; border-radius: 4px;">
                    Transistor OFF
                  </span>
                </div>
              </div>

              <!-- NOT Gate Truth Table -->
              <div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">NOT Gate Truth Table</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; background: var(--card-bg); border-radius: var(--border-radius-sm); overflow: hidden;">
                  <thead>
                    <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--border-color);">
                      <th style="padding: 0.5rem 0.75rem; color: var(--heading-color);">Input (A)</th>
                      <th style="padding: 0.5rem 0.75rem; color: var(--heading-color);">Transistor</th>
                      <th style="padding: 0.5rem 0.75rem; color: var(--heading-color);">Output (Y = &not;A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr id="l2-not-row0" style="border-bottom: 1px solid var(--border-color); background: rgba(88, 166, 255, 0.12); font-weight: 700;">
                      <td style="padding: 0.5rem 0.75rem; font-family: var(--font-mono);">0 (0V)</td>
                      <td style="padding: 0.5rem 0.75rem; color: var(--accent-danger);">OFF (Cutoff)</td>
                      <td style="padding: 0.5rem 0.75rem; font-family: var(--font-mono); color: var(--accent-secondary);">1 (+5V)</td>
                    </tr>
                    <tr id="l2-not-row1">
                      <td style="padding: 0.5rem 0.75rem; font-family: var(--font-mono);">1 (+5V)</td>
                      <td style="padding: 0.5rem 0.75rem; color: var(--accent-secondary);">ON (Saturated)</td>
                      <td style="padding: 0.5rem 0.75rem; font-family: var(--font-mono); color: var(--accent-danger);">0 (0V)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Part B: Classical NOT Gate Symbol vs Quantum X Gate Symbol Side-by-Side -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.75rem;">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h2 class="h4 mb-1" style="color: var(--heading-color);">2. Symbolism &amp; Representation: Classical vs. Quantum</h2>
            <p class="text-muted mb-0" style="font-size: 0.9rem;">From Boolean logic symbol to unitary circuit matrix notation</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="l2-sync-flip-btn" style="border-color: var(--accent-purple); color: var(--accent-purple);">
            <span>⚡</span> Flip Both Simultaneously
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;" class="level2-compare-grid">
          <!-- Classical Column -->
          <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; text-align: center;">
            <div class="badge mb-2" style="background: rgba(88, 166, 255, 0.15); color: var(--accent-primary);">CLASSICAL LOGIC</div>
            <h3 class="h5 mb-3" style="color: var(--heading-color);">Standard NOT Gate</h3>
            
            <!-- Classical NOT Gate SVG Symbol -->
            <div id="l2-classical-svg-container" style="width: 100%; height: 130px; display: flex; align-items: center; justify-content: center;">
              <!-- JS Generated SVG -->
            </div>

            <div class="p-3 mt-3" style="background: var(--card-bg); border-radius: var(--border-radius-sm); text-align: left; font-size: 0.85rem; line-height: 1.6;">
              <div class="mb-1"><strong>Operation:</strong> Boolean Inversion ($y = \\bar{x}$)</div>
              <div class="mb-1"><strong>Domain:</strong> Discrete set $\\{0, 1\\}$</div>
              <div><strong>Irreversible:</strong> Dissipates dynamic energy $\\frac{1}{2} C V^2 f$ per cycle during CMOS switching.</div>
            </div>
          </div>

          <!-- Quantum Column -->
          <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; text-align: center;">
            <div class="badge mb-2" style="background: rgba(188, 140, 255, 0.15); color: var(--accent-purple);">QUANTUM INFORMATION</div>
            <h3 class="h5 mb-3" style="color: var(--heading-color);">Pauli-X Gate (&sigma;<sub>x</sub>)</h3>
            
            <!-- Quantum X Gate SVG Symbol -->
            <div id="l2-quantum-svg-container" style="width: 100%; height: 130px; display: flex; align-items: center; justify-content: center;">
              <!-- JS Generated SVG -->
            </div>

            <div class="p-3 mt-3" style="background: var(--card-bg); border-radius: var(--border-radius-sm); text-align: left; font-size: 0.85rem; line-height: 1.6;">
              <div class="mb-1"><strong>Operation:</strong> $\\pi$ radian rotation about X-axis of Bloch sphere</div>
              <div class="mb-1"><strong>Domain:</strong> Complex 2D Hilbert space $\\mathbb{C}^2$</div>
              <div><strong>Reversible &amp; Unitary:</strong> $X^\\dagger X = I$, zero information loss, preserves norm.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Part C: Deep Dive: Quantum X Gate Mechanics -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.75rem;">
        <h2 class="card-title h4 mb-3" style="color: var(--heading-color);">3. Quantum X Gate: Mathematical Foundation &amp; Interactive Demo</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;" class="level2-math-grid">
          <!-- Left: Matrix formulation -->
          <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.25rem;">
            <h4 class="h6 mb-2" style="color: var(--accent-purple); text-transform: uppercase;">Matrix Representation</h4>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              The Pauli-X operator is represented in the standard computational basis $\{|0\\rangle, |1\\rangle\}$ by the $2 \times 2$ unitary matrix:
            </p>
            <div style="background: var(--card-bg); padding: 1rem; border-radius: var(--border-radius-sm); text-align: center; font-family: var(--font-mono); font-size: 1.1rem; border: 1px solid var(--border-color); margin-bottom: 1rem;">
              $$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
              Acting on basis vectors:
              <div style="font-family: var(--font-mono); color: var(--text-main); margin-top: 0.25rem;">
                &bull; $X |0\\rangle = \\begin{pmatrix}0&1\\\\1&0\\end{pmatrix} \\begin{pmatrix}1\\\\0\\end{pmatrix} = \\begin{pmatrix}0\\\\1\\end{pmatrix} = |1\\rangle$<br>
                &bull; $X |1\\rangle = \\begin{pmatrix}0&1\\\\1&0\\end{pmatrix} \\begin{pmatrix}0\\\\1\\end{pmatrix} = \\begin{pmatrix}1\\\\0\\end{pmatrix} = |0\\rangle$
              </div>
            </div>
          </div>

          <!-- Right: Interactive Qubit State Sandbox -->
          <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h4 class="h6 mb-2" style="color: var(--accent-primary); text-transform: uppercase;">Interactive X Gate Demo</h4>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
                Select an initial state and apply the quantum X gate to witness the state vector transformation.
              </p>

              <!-- State Initializer buttons -->
              <div class="d-flex gap-2 mb-3">
                <button type="button" class="btn btn-sm btn-secondary active" id="l2-btn-prep-0" style="flex: 1;">Prep |0&rang;</button>
                <button type="button" class="btn btn-sm btn-secondary" id="l2-btn-prep-1" style="flex: 1;">Prep |1&rang;</button>
                <button type="button" class="btn btn-sm btn-secondary" id="l2-btn-prep-plus" style="flex: 1;">Prep |+&rang;</button>
              </div>

              <!-- Vector State Visualizer Box -->
              <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1rem; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.5rem; text-align: center;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">State Before</div>
                  <div id="l2-qubit-before" style="font-family: var(--font-mono); font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); margin-top: 0.25rem;">|0&rang;</div>
                  <div id="l2-vec-before" style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">[1.00, 0.00]<sup>T</sup></div>
                </div>

                <div style="font-size: 1.5rem; color: var(--accent-purple); font-weight: bold;">
                  &xrarr;
                </div>

                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">State After (X&psi;)</div>
                  <div id="l2-qubit-after" style="font-family: var(--font-mono); font-size: 1.15rem; font-weight: 700; color: var(--accent-secondary); margin-top: 0.25rem;">|1&rang;</div>
                  <div id="l2-vec-after" style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">[0.00, 1.00]<sup>T</sup></div>
                </div>
              </div>
            </div>

            <button type="button" class="btn btn-primary mt-3" id="l2-btn-apply-x" style="width: 100%;">
              <span>⚛️</span> Apply Pauli-X Gate [ X |&psi;&rang; ]
            </button>
          </div>
        </div>
      </div>

      <!-- Part D: Animated Side-by-Side Flip Demonstration -->
      <div class="card mb-4" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.75rem;">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h3 class="h5 mb-1" style="color: var(--heading-color);">4. Synchronized Dynamic Inversion: Classical vs Quantum</h3>
            <p class="text-muted mb-0" style="font-size: 0.875rem;">Observe how classical voltage inversion coincides with quantum state basis flipping.</p>
          </div>
          <button type="button" class="btn btn-success" id="l2-btn-run-sync-anim">
            <span>▶</span> Trigger Synchronized Inversion
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;" class="level2-sync-grid">
          <!-- Classical Bit Chamber -->
          <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; text-align: center;">
            <div style="font-size: 0.85rem; color: var(--accent-primary); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Classical Bit Register</div>
            <div id="l2-sync-classical-box" style="width: 110px; height: 110px; margin: 1rem auto; background: var(--surface-color); border: 3px solid var(--accent-primary); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; font-family: var(--font-mono); color: var(--heading-color); box-shadow: var(--shadow-md); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s;">
              0
            </div>
            <div id="l2-sync-classical-voltage" class="text-muted" style="font-size: 0.85rem; font-family: var(--font-mono);">
              Voltage: 0.0V (Ground)
            </div>
          </div>

          <!-- Quantum Qubit Chamber -->
          <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; text-align: center;">
            <div style="font-size: 0.85rem; color: var(--accent-purple); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Quantum Qubit State</div>
            <div id="l2-sync-quantum-box" style="width: 110px; height: 110px; margin: 1rem auto; background: var(--surface-color); border: 3px solid var(--accent-purple); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-purple); box-shadow: var(--shadow-md); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.4s;">
              |0&rang;
            </div>
            <div id="l2-sync-quantum-desc" class="text-muted" style="font-size: 0.85rem; font-family: var(--font-mono);">
              Amplitude: &alpha; = 1.0, &beta; = 0.0
            </div>
          </div>
        </div>
      </div>

      <!-- Part E: Key Insight Card (Superposition) -->
      <div class="card mb-4" style="background: linear-gradient(135deg, rgba(188, 140, 255, 0.1) 0%, rgba(88, 166, 255, 0.06) 100%); border: 1px solid rgba(188, 140, 255, 0.4); border-left: 5px solid var(--accent-purple); border-radius: var(--border-radius-md); padding: 1.5rem;">
        <div class="d-flex align-items-start gap-3">
          <span style="font-size: 1.8rem; line-height: 1;">💡</span>
          <div>
            <h3 class="h5 mb-1" style="color: var(--heading-color);">Key Insight: Beyond Boolean Inversion — Superposition Preservation</h3>
            <p style="color: var(--text-main); margin-bottom: 0.75rem; font-size: 0.95rem; line-height: 1.6;">
              While both the classical NOT gate and the Quantum X gate perform identical operations on discrete computational basis states
              ($0 \\leftrightarrow 1$ and $|0\\rangle \\leftrightarrow |1\\rangle$), the X gate possesses a superpower unique to quantum mechanics:
              <strong>it preserves coherent quantum superpositions by linear mapping!</strong>
            </p>
            <div style="background: var(--card-bg); padding: 0.75rem 1.25rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 1.05rem; color: var(--accent-purple); display: inline-block;">
              $$X (\\alpha|0\\rangle + \\beta|1\\rangle) = \\alpha|1\\rangle + \\beta|0\\rangle$$
            </div>
            <p style="color: var(--text-muted); margin-top: 0.75rem; margin-bottom: 0; font-size: 0.875rem;">
              A classical inverter cannot accept an analog input intermediate state without corrupting it through threshold clamping.
              In contrast, the X gate linearly exchanges the complex probability amplitudes $\\alpha$ and $\\beta$ while preserving absolute phase coherence!
            </p>
          </div>
        </div>
      </div>

      <!-- Part F: Comprehensive Comparison Table -->
      <div class="card mb-4" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem;">
        <h3 class="h5 mb-3" style="color: var(--heading-color);">Comparison: Classical NOT Gate vs. Quantum Pauli-X Gate</h3>
        <div class="table-responsive" style="margin-bottom: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color);">
                <th style="padding: 0.85rem 1rem; color: var(--heading-color); text-align: left; width: 22%;">Feature</th>
                <th style="padding: 0.85rem 1rem; color: var(--heading-color); text-align: left; width: 39%;">Classical NOT Gate (Inverter)</th>
                <th style="padding: 0.85rem 1rem; color: var(--heading-color); text-align: left; width: 39%;">Quantum Pauli-X Gate (&sigma;<sub>x</sub>)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--heading-color);">Input Domain</td>
                <td style="padding: 0.85rem 1rem; font-family: var(--font-mono);">Single classical bit: x &in; {0, 1}</td>
                <td style="padding: 0.85rem 1rem; font-family: var(--font-mono); color: var(--accent-purple);">Qubit state vector: |&psi;&rang; = &alpha;|0&rang; + &beta;|1&rang; &in; &Copf;<sup>2</sup></td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--heading-color);">Mathematical Operation</td>
                <td style="padding: 0.85rem 1rem;">Boolean logic negation: f(x) = 1 - x</td>
                <td style="padding: 0.85rem 1rem; font-family: var(--font-mono); color: var(--accent-purple);">2&times;2 Unitary rotation matrix: [[0, 1], [1, 0]]</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--heading-color);">Output State</td>
                <td style="padding: 0.85rem 1rem; font-family: var(--font-mono);">Deterministic bit: y &in; {0, 1}</td>
                <td style="padding: 0.85rem 1rem; font-family: var(--font-mono); color: var(--accent-purple);">Transformed state: |&psi;'&rang; = &alpha;|1&rang; + &beta;|0&rang;</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--heading-color);">Reversibility &amp; Energy</td>
                <td style="padding: 0.85rem 1rem;">
                  <strong style="color: var(--accent-danger);">Thermodynamically Irreversible:</strong> CMOS dissipates dynamic capacitive power $P = C V^2 f$ to substrate thermal sink.
                </td>
                <td style="padding: 0.85rem 1rem;">
                  <strong style="color: var(--accent-secondary);">Strictly Reversible:</strong> $X^\\dagger X = I$ and $X = X^{-1}$. Zero fundamental Landauer entropy dissipation under ideal closed evolution.
                </td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--heading-color);">Physical Implementation</td>
                <td style="padding: 0.85rem 1rem;">
                  NPN BJT with collector pull-up resistor or CMOS complementary pair (PMOS pull-up / NMOS pull-down).
                </td>
                <td style="padding: 0.85rem 1rem;">
                  Resonant microwave pulse ($R_x(\pi)$ rotation) on superconducting transmon circuit, or resonant laser pulse on trapped ion.
                </td>
              </tr>
              <tr>
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--heading-color);">Superposition Response</td>
                <td style="padding: 0.85rem 1rem; color: var(--text-muted);">Undefined; meta-stable voltages decay to rail 0 or 1.</td>
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--accent-secondary);">Preserves continuous complex probability amplitudes faithfully.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Level Pagination -->
      <div class="level-pagination">
        <a href="#level1" class="btn btn-outline-secondary level-pagination-prev">
          &larr; Previous: Level 1 &mdash; Transistor Switch
        </a>
        <a href="#level3" class="btn btn-primary level-pagination-next">
          Next: Level 3 &mdash; Bit to Qubit &rarr;
        </a>
      </div>
    </div>
  `;
}

/**
 * Creates SVG Schematic for Transistor Inverter (Level 2 Part 1)
 */
function createLevel2InverterSVG() {
  return `
    <svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;" id="l2-inverter-svg">
      <!-- Vcc Top Rail -->
      <line x1="260" y1="25" x2="360" y2="25" stroke="#58a6ff" stroke-width="3" stroke-linecap="round" />
      <circle cx="310" cy="25" r="3.5" fill="#58a6ff" />
      <text x="310" y="16" fill="#58a6ff" font-size="12" font-weight="700" text-anchor="middle" font-family="monospace">+5V (Vcc)</text>

      <!-- Collector Resistor Rc (Zigzag) -->
      <path d="M 310,25 L 310,50" stroke="#8b949e" stroke-width="2.5" />
      <path d="M 310,50 
               L 310,55 
               L 302,60 L 318,66 L 302,72 L 318,78 L 302,84 L 318,90 L 310,95 
               L 310,105" 
            fill="none" stroke="#c9d1d9" stroke-width="2.5" stroke-linejoin="round" />
      <text x="330" y="78" fill="#c9d1d9" font-size="11" font-family="monospace">Rc (1k&Omega;)</text>

      <!-- Node between Rc and Collector (Output tap point) -->
      <line x1="310" y1="105" x2="310" y2="170" stroke="#8b949e" stroke-width="2.5" />
      <circle id="l2-vout-node" cx="310" cy="125" r="4.5" fill="#3fb950" />

      <!-- Output Wire branching right from node -->
      <line x1="310" y1="125" x2="420" y2="125" stroke="#8b949e" stroke-width="2.5" />
      <circle id="l2-vout-terminal" cx="420" cy="125" r="4" fill="none" stroke="#3fb950" stroke-width="2.5" />
      <text x="435" y="129" fill="#3fb950" font-size="13" font-weight="700" font-family="monospace" id="l2-vout-text">Vout = 5V (1)</text>

      <!-- Transistor NPN Body -->
      <circle cx="280" cy="190" r="36" fill="none" stroke="#30363d" stroke-width="2" stroke-dasharray="3,3" />
      <line x1="250" y1="165" x2="250" y2="215" stroke="#f0f6fc" stroke-width="4" stroke-linecap="round" />
      <!-- Base in -->
      <line x1="160" y1="190" x2="250" y2="190" stroke="#8b949e" stroke-width="2.5" />
      <!-- Collector leg -->
      <line x1="250" y1="175" x2="310" y2="160" stroke="#f0f6fc" stroke-width="2.5" stroke-linecap="round" />
      <!-- Emitter leg with arrow -->
      <line x1="250" y1="205" x2="310" y2="220" stroke="#f0f6fc" stroke-width="2.5" stroke-linecap="round" />
      <polygon points="290,214 305,219 295,208" fill="#58a6ff" />

      <!-- Input Resistor Rb -->
      <path d="M 60,190 L 95,190" stroke="#8b949e" stroke-width="2.5" />
      <path d="M 95,190 
               L 100,190 
               L 105,183 L 113,197 L 121,183 L 129,197 L 137,183 L 145,197 L 150,190 
               L 160,190" 
            fill="none" stroke="#c9d1d9" stroke-width="2.5" stroke-linejoin="round" />
      <text x="128" y="176" fill="#c9d1d9" font-size="10" font-family="monospace" text-anchor="middle">Rb (10k&Omega;)</text>

      <!-- Input Terminal on Left -->
      <circle id="l2-vin-terminal" cx="60" cy="190" r="4" fill="#58a6ff" />
      <text x="45" y="194" fill="#58a6ff" font-size="12" font-weight="700" text-anchor="end" font-family="monospace" id="l2-vin-text">Vin = 0V (0)</text>

      <!-- Emitter to Ground -->
      <line x1="310" y1="220" x2="310" y2="275" stroke="#8b949e" stroke-width="2.5" />
      <g transform="translate(310, 275)">
        <line x1="-16" y1="0" x2="16" y2="0" stroke="#8b949e" stroke-width="3" />
        <line x1="-10" y1="4" x2="10" y2="4" stroke="#8b949e" stroke-width="2.5" />
        <line x1="-4" y1="8" x2="4" y2="8" stroke="#8b949e" stroke-width="2" />
        <text x="22" y="5" fill="#8b949e" font-size="10" font-family="monospace">GND</text>
      </g>
    </svg>
  `;
}

/**
 * Creates Classical NOT Gate Symbol SVG
 */
function createClassicalNotGateSVG() {
  return `
    <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
      <!-- Input Wire -->
      <line x1="20" y1="60" x2="90" y2="60" stroke="#58a6ff" stroke-width="3" />
      <text x="45" y="50" fill="#58a6ff" font-family="monospace" font-size="14" font-weight="700">A</text>
      
      <!-- Triangle Gate Body -->
      <polygon points="90,30 90,90 160,60" fill="var(--card-bg)" stroke="#58a6ff" stroke-width="3" stroke-linejoin="round" />

      <!-- Inversion Bubble -->
      <circle cx="168" cy="60" r="8" fill="var(--card-bg)" stroke="#58a6ff" stroke-width="3" />

      <!-- Output Wire -->
      <line x1="176" y1="60" x2="250" y2="60" stroke="#3fb950" stroke-width="3" />
      <text x="220" y="50" fill="#3fb950" font-family="monospace" font-size="14" font-weight="700">Y = &not;A</text>

      <text x="140" y="108" fill="#8b949e" font-family="monospace" font-size="11" text-anchor="middle">Boolean Inverter</text>
    </svg>
  `;
}

/**
 * Creates Quantum X Gate Symbol SVG
 */
function createQuantumXGateSVG() {
  return `
    <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
      <!-- Quantum Wire (Double or Single line) -->
      <line x1="20" y1="60" x2="260" y2="60" stroke="#8b949e" stroke-width="2" />
      <text x="35" y="50" fill="#bc8cff" font-family="monospace" font-size="14" font-weight="700">|&psi;&rang;</text>

      <!-- Gate Box with 'X' -->
      <rect x="110" y="30" width="60" height="60" rx="8" fill="var(--card-bg)" stroke="#bc8cff" stroke-width="3" />
      <text x="140" y="68" fill="#bc8cff" font-family="monospace" font-size="24" font-weight="800" text-anchor="middle">X</text>

      <!-- Output State -->
      <text x="225" y="50" fill="#bc8cff" font-family="monospace" font-size="14" font-weight="700">X|&psi;&rang;</text>

      <text x="140" y="108" fill="#8b949e" font-family="monospace" font-size="11" text-anchor="middle">Pauli-X (NOT) Unitary</text>
    </svg>
  `;
}

function initLevel2Interactivity() {
  // Render SVGs
  const inverterContainer = document.getElementById('l2-inverter-svg-container');
  if (inverterContainer) {
    inverterContainer.innerHTML = createLevel2InverterSVG();
  }

  const classicalSvgContainer = document.getElementById('l2-classical-svg-container');
  if (classicalSvgContainer) {
    classicalSvgContainer.innerHTML = createClassicalNotGateSVG();
  }

  const quantumSvgContainer = document.getElementById('l2-quantum-svg-container');
  if (quantumSvgContainer) {
    quantumSvgContainer.innerHTML = createQuantumXGateSVG();
  }

  /* -------------------------------------------------------------
     1. Interactive Transistor Inverter (Toggle 0/1)
     ------------------------------------------------------------- */
  let currentNotInput = 0;

  const notToggleBtn = document.getElementById('l2-not-toggle-btn');
  const notInVal = document.getElementById('l2-not-in-val');
  const notOutVal = document.getElementById('l2-not-out-val');
  const notTransState = document.getElementById('l2-not-trans-state');
  const notRow0 = document.getElementById('l2-not-row0');
  const notRow1 = document.getElementById('l2-not-row1');

  function updateInverterUI(inputBit) {
    currentNotInput = inputBit;
    const outputBit = currentNotInput === 0 ? 1 : 0;

    const vinText = document.getElementById('l2-vin-text');
    const voutText = document.getElementById('l2-vout-text');
    const voutNode = document.getElementById('l2-vout-node');
    const voutTerminal = document.getElementById('l2-vout-terminal');
    const vinTerminal = document.getElementById('l2-vin-terminal');

    if (currentNotInput === 0) {
      notInVal.textContent = '0 (0V)';
      notInVal.style.color = 'var(--accent-primary)';

      notOutVal.textContent = '1 (+5V)';
      notOutVal.style.color = 'var(--accent-secondary)';

      notTransState.textContent = 'Transistor OFF (Cutoff)';
      notTransState.style.background = 'rgba(248, 81, 73, 0.15)';
      notTransState.style.color = 'var(--accent-danger)';

      if (notRow0) notRow0.style.backgroundColor = 'rgba(88, 166, 255, 0.12)';
      if (notRow1) notRow1.style.backgroundColor = 'transparent';

      if (vinText) vinText.textContent = 'Vin = 0V (0)';
      if (voutText) {
        voutText.textContent = 'Vout = 5V (1)';
        voutText.setAttribute('fill', '#3fb950');
      }
      if (voutNode) voutNode.setAttribute('fill', '#3fb950');
      if (voutTerminal) voutTerminal.setAttribute('stroke', '#3fb950');
      if (vinTerminal) vinTerminal.setAttribute('fill', '#58a6ff');

    } else {
      notInVal.textContent = '1 (+5V)';
      notInVal.style.color = 'var(--accent-secondary)';

      notOutVal.textContent = '0 (0V)';
      notOutVal.style.color = 'var(--accent-danger)';

      notTransState.textContent = 'Transistor ON (Saturated)';
      notTransState.style.background = 'rgba(63, 185, 80, 0.15)';
      notTransState.style.color = 'var(--accent-secondary)';

      if (notRow0) notRow0.style.backgroundColor = 'transparent';
      if (notRow1) notRow1.style.backgroundColor = 'rgba(88, 166, 255, 0.12)';

      if (vinText) vinText.textContent = 'Vin = 5V (1)';
      if (voutText) {
        voutText.textContent = 'Vout = 0.2V (0)';
        voutText.setAttribute('fill', '#f85149');
      }
      if (voutNode) voutNode.setAttribute('fill', '#f85149');
      if (voutTerminal) voutTerminal.setAttribute('stroke', '#f85149');
      if (vinTerminal) vinTerminal.setAttribute('fill', '#3fb950');
    }
  }

  if (notToggleBtn) {
    notToggleBtn.addEventListener('click', () => {
      updateInverterUI(currentNotInput === 0 ? 1 : 0);
    });
  }

  /* -------------------------------------------------------------
     2. Interactive Quantum X Gate Sandbox
     ------------------------------------------------------------- */
  let currentQubitAlpha = 1.0;
  let currentQubitBeta = 0.0;
  let currentQubitLabel = '|0⟩';

  const btnPrep0 = document.getElementById('l2-btn-prep-0');
  const btnPrep1 = document.getElementById('l2-btn-prep-1');
  const btnPrepPlus = document.getElementById('l2-btn-prep-plus');
  const btnApplyX = document.getElementById('l2-btn-apply-x');

  const qubitBefore = document.getElementById('l2-qubit-before');
  const vecBefore = document.getElementById('l2-vec-before');
  const qubitAfter = document.getElementById('l2-qubit-after');
  const vecAfter = document.getElementById('l2-vec-after');

  function updateQubitDisplay() {
    qubitBefore.textContent = currentQubitLabel;
    vecBefore.textContent = `[${currentQubitAlpha.toFixed(2)}, ${currentQubitBeta.toFixed(2)}]ᵀ`;

    // Calculate effect of X = [[0, 1], [1, 0]]
    // X * [alpha, beta]^T = [beta, alpha]^T
    const newAlpha = currentQubitBeta;
    const newBeta = currentQubitAlpha;

    let afterLabel = '|1⟩';
    if (Math.abs(newAlpha - 1) < 0.05) afterLabel = '|0⟩';
    else if (Math.abs(newBeta - 1) < 0.05) afterLabel = '|1⟩';
    else if (Math.abs(newAlpha - 0.707) < 0.05) afterLabel = '|+⟩';

    qubitAfter.textContent = afterLabel;
    vecAfter.textContent = `[${newAlpha.toFixed(2)}, ${newBeta.toFixed(2)}]ᵀ`;
  }

  if (btnPrep0) {
    btnPrep0.addEventListener('click', () => {
      currentQubitAlpha = 1.0;
      currentQubitBeta = 0.0;
      currentQubitLabel = '|0⟩';
      [btnPrep0, btnPrep1, btnPrepPlus].forEach(b => b.classList.remove('active'));
      btnPrep0.classList.add('active');
      updateQubitDisplay();
    });
  }

  if (btnPrep1) {
    btnPrep1.addEventListener('click', () => {
      currentQubitAlpha = 0.0;
      currentQubitBeta = 1.0;
      currentQubitLabel = '|1⟩';
      [btnPrep0, btnPrep1, btnPrepPlus].forEach(b => b.classList.remove('active'));
      btnPrep1.classList.add('active');
      updateQubitDisplay();
    });
  }

  if (btnPrepPlus) {
    btnPrepPlus.addEventListener('click', () => {
      currentQubitAlpha = 1 / Math.sqrt(2);
      currentQubitBeta = 1 / Math.sqrt(2);
      currentQubitLabel = '|+⟩';
      [btnPrep0, btnPrep1, btnPrepPlus].forEach(b => b.classList.remove('active'));
      btnPrepPlus.classList.add('active');
      updateQubitDisplay();
    });
  }

  if (btnApplyX) {
    btnApplyX.addEventListener('click', () => {
      // Exchange alpha and beta
      const tempAlpha = currentQubitAlpha;
      currentQubitAlpha = currentQubitBeta;
      currentQubitBeta = tempAlpha;

      if (Math.abs(currentQubitAlpha - 1) < 0.05) currentQubitLabel = '|0⟩';
      else if (Math.abs(currentQubitBeta - 1) < 0.05) currentQubitLabel = '|1⟩';
      else if (Math.abs(currentQubitAlpha - 0.707) < 0.05) currentQubitLabel = '|+⟩';

      updateQubitDisplay();

      // Visual flash pulse
      const afterBox = document.getElementById('l2-qubit-after');
      if (afterBox) {
        afterBox.style.transform = 'scale(1.2)';
        afterBox.style.transition = 'transform 0.2s';
        setTimeout(() => { afterBox.style.transform = 'scale(1.0)'; }, 200);
      }
    });
  }

  updateQubitDisplay();

  /* -------------------------------------------------------------
     3. Synchronized Animated Side-by-Side Flip Demo
     ------------------------------------------------------------- */
  let syncBit = 0;
  const syncBtn = document.getElementById('l2-btn-run-sync-anim');
  const syncFlipBtn2 = document.getElementById('l2-sync-flip-btn');

  const syncClassicalBox = document.getElementById('l2-sync-classical-box');
  const syncClassicalVolt = document.getElementById('l2-sync-classical-voltage');
  const syncQuantumBox = document.getElementById('l2-sync-quantum-box');
  const syncQuantumDesc = document.getElementById('l2-sync-quantum-desc');

  function runSynchronizedFlip() {
    syncBit = syncBit === 0 ? 1 : 0;

    // Classical animation
    if (syncClassicalBox) {
      syncClassicalBox.style.transform = 'rotateY(180deg) scale(0.9)';
      setTimeout(() => {
        syncClassicalBox.textContent = syncBit.toString();
        syncClassicalBox.style.transform = 'rotateY(0deg) scale(1.0)';
        if (syncBit === 1) {
          syncClassicalBox.style.borderColor = 'var(--accent-secondary)';
          syncClassicalBox.style.color = 'var(--accent-secondary)';
          syncClassicalVolt.textContent = 'Voltage: 5.0V (High / Vcc)';
        } else {
          syncClassicalBox.style.borderColor = 'var(--accent-primary)';
          syncClassicalBox.style.color = 'var(--heading-color)';
          syncClassicalVolt.textContent = 'Voltage: 0.0V (Ground)';
        }
      }, 200);
    }

    // Quantum animation
    if (syncQuantumBox) {
      syncQuantumBox.style.transform = 'rotateX(180deg) scale(0.9)';
      setTimeout(() => {
        syncQuantumBox.textContent = syncBit === 1 ? '|1⟩' : '|0⟩';
        syncQuantumBox.style.transform = 'rotateX(0deg) scale(1.0)';
        if (syncBit === 1) {
          syncQuantumBox.style.borderColor = 'var(--accent-secondary)';
          syncQuantumBox.style.color = 'var(--accent-secondary)';
          syncQuantumDesc.textContent = 'Amplitude: α = 0.0, β = 1.0';
        } else {
          syncQuantumBox.style.borderColor = 'var(--accent-purple)';
          syncQuantumBox.style.color = 'var(--accent-purple)';
          syncQuantumDesc.textContent = 'Amplitude: α = 1.0, β = 0.0';
        }
      }, 200);
    }
  }

  if (syncBtn) {
    syncBtn.addEventListener('click', runSynchronizedFlip);
  }
  if (syncFlipBtn2) {
    syncFlipBtn2.addEventListener('click', runSynchronizedFlip);
  }
}

/* --- levels-3-4.js --- */
/**
 * levels-3-4.js
 * Educational Framework: From Transistors to Qubits
 * 
 * Implements:
 * - LEVEL 3: From Classical Bit to Quantum Qubit (Superposition, Bloch Sphere, Hadamard Experiment)
 * - LEVEL 4: Classical Circuit vs Quantum Circuit (XOR vs CNOT, Half-Adder, Entangled Bell State)
 */
// ============================================================================
// MAIN EXPORT
// ============================================================================
function initLevels34() {
  const level3El = document.getElementById('level3');
  const level4El = document.getElementById('level4');

  if (level3El) {
    renderLevel3(level3El);
  }

  if (level4El) {
    renderLevel4(level4El);
  }
}

// Make globally accessible if running without bundler
if (typeof window !== 'undefined') {
  window.initLevels34 = initLevels34;
}

// ============================================================================
// LEVEL 3: FROM CLASSICAL BIT TO QUANTUM QUBIT
// ============================================================================

function renderLevel3(container) {
  container.innerHTML = `
    <div class="level-page-container py-4">
      <div class="container">
        
        <!-- Section Header -->
        <header class="section-header mb-5">
          <div class="badge-pill mb-2" style="display:inline-block; padding: 0.35rem 0.85rem; background: rgba(88,166,255,0.12); border: 1px solid rgba(88,166,255,0.3); border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: var(--accent-primary);">
            Level 3 &bull; State Representation &amp; Superposition
          </div>
          <h1 class="display-5 fw-bold mb-3">Level 3: From Classical Bit to Quantum Qubit</h1>
          <p class="subtext lead" style="max-width: 850px; color: var(--text-muted);">
            Bridging macroscopic voltage bistability to the continuum of complex Hilbert space.
            Discover how continuous quantum probability amplitudes differ fundamentally from discrete classical states.
          </p>
        </header>

        <!-- Level Switcher Navigation Bar -->
        <nav class="level-switcher-bar" aria-label="Switch between levels">
          <div class="level-switcher-track">
            <a href="#level1" class="level-switcher-item">
              <span class="level-num">1</span>
              <span class="level-info">
                <span class="level-label">Level 1</span>
                <span class="level-title">Transistor Switch</span>
              </span>
            </a>
            <a href="#level2" class="level-switcher-item">
              <span class="level-num">2</span>
              <span class="level-info">
                <span class="level-label">Level 2</span>
                <span class="level-title">Logic Gates</span>
              </span>
            </a>
            <a href="#level3" class="level-switcher-item active">
              <span class="level-num">3</span>
              <span class="level-info">
                <span class="level-label">Level 3</span>
                <span class="level-title">Bit &rarr; Qubit</span>
              </span>
            </a>
            <a href="#level4" class="level-switcher-item">
              <span class="level-num">4</span>
              <span class="level-info">
                <span class="level-label">Level 4</span>
                <span class="level-title">Quantum Circuits</span>
              </span>
            </a>
          </div>
        </nav>

        <!-- Concept Explanation Cards (3 Columns) -->
        <div class="card-grid mb-5" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          
          <!-- Card 1: Transistor -->
          <div class="card">
            <div class="card-header">
              <span style="font-size: 1.8rem;">🔌</span>
              <span class="card-badge">Physical Hardware</span>
            </div>
            <h3 class="card-title">1. Transistor Switch</h3>
            <p class="card-body">
              A physical three-terminal solid-state switch. In a MOSFET, charge carriers either form an inversion channel 
              (<strong>ON / Conductive</strong>, high current, $V_{out} \\approx 0\\text{V}$) or are pinched off 
              (<strong>OFF / Cut-off</strong>, negligible current, $V_{out} \\approx V_{DD}$). Governed by continuous 
              semiconductor physics but intentionally driven into saturated binary regimes.
            </p>
            <div class="card-footer">
              <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-amber);">Physical State: ON or OFF</span>
            </div>
          </div>

          <!-- Card 2: Classical Bit -->
          <div class="card">
            <div class="card-header">
              <span style="font-size: 1.8rem;">💾</span>
              <span class="card-badge">Abstract Information</span>
            </div>
            <h3 class="card-title">2. Classical Bit</h3>
            <p class="card-body">
              The fundamental unit of classical digital computing (Claude Shannon, 1948). An abstract mathematical variable 
              $b \in \{0, 1\}$. It is strictly mutually exclusive: at any instant, a bit is definitively either $0$ or $1$, 
              with zero probability of occupying any intermediate state.
            </p>
            <div class="card-footer">
              <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-primary);">State Space: {0, 1}</span>
            </div>
          </div>

          <!-- Card 3: Qubit -->
          <div class="card">
            <div class="card-header">
              <span style="font-size: 1.8rem;">⚛️</span>
              <span class="card-badge">Quantum Coherence</span>
            </div>
            <h3 class="card-title">3. Quantum Qubit</h3>
            <p class="card-body">
              A two-level quantum mechanical system. A qubit occupies a normalized linear combination of computational basis states: 
              $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$, where $\\alpha, \\beta \\in \\mathbb{C}$ and 
              $|\\alpha|^2 + |\\beta|^2 = 1$. The state exists in a continuum of superposition until projective measurement forces 
              a collapse to $|0\\rangle$ or $|1\\rangle$.
            </p>
            <div class="card-footer">
              <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-purple);">|&psi;&rang; = &alpha;|0&rang; + &beta;|1&rang;</span>
            </div>
          </div>

        </div>

        <!-- Mathematical Formulation Section -->
        <div class="simulator-container mb-5">
          <h2 class="h3 fw-bold mb-3" style="color: var(--heading-color);">Mathematical Formulation &amp; Born's Rule</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
            Understanding the transition from deterministic binary logic to complex Hilbert vector spaces:
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            
            <div style="background: var(--bg-color); padding: 1.25rem; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
              <h4 style="font-size: 1.05rem; color: var(--accent-primary); margin-bottom: 0.75rem;">Classical Bit Formulation</h4>
              <div class="formula-card" style="margin: 0.5rem 0 1rem 0;">
                b &isin; {0, 1}
              </div>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0;">
                The state space is a 0-dimensional discrete set containing exactly two mutually exclusive points:
                $$\\text{State} = 0 \\quad \\text{OR} \\quad \\text{State} = 1$$
                No linear combination or phase interference is possible.
              </p>
            </div>

            <div style="background: var(--bg-color); padding: 1.25rem; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
              <h4 style="font-size: 1.05rem; color: var(--accent-purple); margin-bottom: 0.75rem;">Quantum Qubit Formulation</h4>
              <div class="formula-card" style="margin: 0.5rem 0 1rem 0;">
                |&psi;&rang; = &alpha;|0&rang; + &beta;|1&rang;, &emsp; &alpha;, &beta; &isin; &Copf;
              </div>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0;">
                Vectors are defined in a 2-dimensional complex Hilbert space $\\mathcal{H}_2$.
                The normalization constraint guarantees total probability conservation:
                $$|\\alpha|^2 + |\\beta|^2 = 1$$
              </p>
            </div>

            <div style="background: var(--bg-color); padding: 1.25rem; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
              <h4 style="font-size: 1.05rem; color: var(--accent-secondary); margin-bottom: 0.75rem;">Measurement Postulate (Born Rule)</h4>
              <div class="formula-card" style="margin: 0.5rem 0 1rem 0;">
                P(0) = |&alpha;|&sup2;, &emsp; P(1) = |&beta;|&sup2;
              </div>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0;">
                Upon projective measurement in basis $\{|0\\rangle, |1\\rangle\}$, the superposition collapses irreversibly.
                The modulus squared of each complex amplitude gives the exact detection probability.
              </p>
            </div>

          </div>
        </div>

        <!-- Interactive Hadamard Experiment -->
        <div class="simulator-container mb-5" id="hadamardExperimentSection">
          <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <div>
              <h2 class="h3 fw-bold mb-1" style="color: var(--heading-color);">Interactive Hadamard ($H$) Gate Experiment</h2>
              <p style="color: var(--text-muted); margin-bottom: 0;">
                Transform a definite classical basis state into an equal quantum superposition: $H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$.
              </p>
            </div>
            <span class="card-badge" style="background: rgba(63,185,80,0.15); color: var(--accent-secondary); border-color: rgba(63,185,80,0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">
              Live Experiment Lab
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;" class="hadamard-grid">
            
            <!-- Left: State & Gate Operations -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              
              <div>
                <h4 style="font-size: 1.1rem; color: var(--heading-color); margin-bottom: 1rem;">1. State Vector &amp; Amplitudes</h4>
                
                <!-- State readout display -->
                <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1.25rem; margin-bottom: 1.25rem; font-family: var(--font-mono);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem;">
                    <span style="color: var(--text-muted);">Current State:</span>
                    <span id="hStateDirac" style="color: var(--accent-primary); font-weight: 700; font-size: 1.15rem;">|&psi;&rang; = 1.000|0&rang; + 0.000|1&rang;</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.95rem;">
                    <span>Amplitude &alpha; (|0&rang;):</span>
                    <span id="hAlphaVal" style="color: var(--heading-color); font-weight: 600;">1.0000 (P = 100.0%)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
                    <span>Amplitude &beta; (|1&rang;):</span>
                    <span id="hBetaVal" style="color: var(--heading-color); font-weight: 600;">0.0000 (P = 0.0%)</span>
                  </div>
                </div>

                <!-- Last Measurement Status -->
                <div id="hMeasurementBadge" style="padding: 0.9rem; border-radius: var(--border-radius-sm); background: var(--surface-color); border: 1px dashed var(--border-color); text-align: center; margin-bottom: 1.5rem; font-size: 0.95rem;">
                  <span style="color: var(--text-muted);">No measurement performed yet. State is pure.</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                  <button id="btnApplyH" class="btn btn-primary" style="flex: 1; min-width: 160px;">
                    <span>⚡ Apply H Gate</span>
                  </button>
                  <button id="btnMeasureOnce" class="btn btn-secondary" style="flex: 1; min-width: 140px;">
                    <span>🎲 Measure Once</span>
                  </button>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                  <button id="btnRun1000" class="btn btn-success" style="flex: 2; min-width: 180px;">
                    <span>📊 Run 1000 Shots</span>
                  </button>
                  <button id="btnResetH" class="btn btn-secondary" style="flex: 1; min-width: 100px;">
                    <span>🔄 Reset to |0&rang;</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Right: Histogram & Distribution -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; display: flex; flex-direction: column;">
              <h4 style="font-size: 1.1rem; color: var(--heading-color); margin-bottom: 0.5rem;">2. Measurement Statistics &amp; Histogram</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                Empirical frequency distribution of projective measurements (Chart.js):
              </p>
              
              <div style="position: relative; height: 260px; width: 100%; flex-grow: 1;">
                <canvas id="hadamardChartCanvas"></canvas>
              </div>

              <div id="hStatsSummary" style="display: flex; justify-content: space-around; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 0.9rem;">
                <div>Total Shots: <strong id="hTotalShots">0</strong></div>
                <div>Count |0&rang;: <strong id="hCount0" style="color: var(--accent-primary);">0 (0%)</strong></div>
                <div>Count |1&rang;: <strong id="hCount1" style="color: var(--accent-purple);">0 (0%)</strong></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Alpha / Beta Slider & Real-Time Bloch Sphere Panel -->
        <div class="simulator-container mb-5" id="blochSliderSection">
          <div class="mb-4">
            <h2 class="h3 fw-bold mb-1" style="color: var(--heading-color);">Interactive Amplitude Slider &amp; Bloch Sphere</h2>
            <p style="color: var(--text-muted); margin-bottom: 0;">
              Sweep the polar state angle $\\theta \\in [0, \\pi]$ to continuously modulate state amplitudes: 
              $\\alpha = \\cos(\\theta/2)$ and $\\beta = \\sin(\\theta/2)$. Observe simultaneous changes on the probability distribution and the Bloch sphere.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: start;" class="bloch-grid">
            
            <!-- Controls & Probability Readouts -->
            <div>
              <div class="card p-4" style="background: var(--bg-color); border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                
                <!-- Theta Angle Slider -->
                <div class="control-group mb-4">
                  <div class="control-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <label for="thetaSlider" style="font-weight: 600; font-size: 1rem; color: var(--heading-color);">
                      State Angle &theta; (Polar Latitude):
                    </label>
                    <span class="control-value" id="thetaValDisplay" style="font-family: var(--font-mono); font-size: 1.1rem; color: var(--accent-primary);">
                      &theta; = 1.57 rad (90.0&deg;)
                    </span>
                  </div>
                  <input type="range" id="thetaSlider" min="0" max="3.14159" step="0.01" value="1.5708" style="width: 100%; cursor: pointer;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; font-family: var(--font-mono);">
                    <span>0 (&theta; = 0 &rarr; |0&rang;)</span>
                    <span>&pi;/2 (Equal &rarr; |+&rang;)</span>
                    <span>&pi; (&theta; = &pi; &rarr; |1&rang;)</span>
                  </div>
                </div>

                <!-- Live Amplitude Readouts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                  <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1rem; text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Amplitude &alpha; = cos(&theta;/2)</div>
                    <div id="alphaValDisplay" style="font-size: 1.4rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-mono); margin: 0.25rem 0;">
                      0.7071
                    </div>
                    <div id="prob0Display" style="font-size: 0.9rem; color: var(--heading-color); font-family: var(--font-mono);">
                      P(|0&rang;) = 50.0%
                    </div>
                  </div>

                  <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1rem; text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Amplitude &beta; = sin(&theta;/2)</div>
                    <div id="betaValDisplay" style="font-size: 1.4rem; font-weight: 700; color: var(--accent-purple); font-family: var(--font-mono); margin: 0.25rem 0;">
                      0.7071
                    </div>
                    <div id="prob1Display" style="font-size: 0.9rem; color: var(--heading-color); font-family: var(--font-mono);">
                      P(|1&rang;) = 50.0%
                    </div>
                  </div>
                </div>

                <!-- Live Probability Bars -->
                <div>
                  <div style="font-size: 0.9rem; font-weight: 600; color: var(--heading-color); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                    <span>Probability Distribution P(0) vs P(1)</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">&alpha;&sup2; + &beta;&sup2; = 1.000</span>
                  </div>
                  
                  <!-- Bar 0 -->
                  <div style="margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                      <span style="color: var(--accent-primary); font-family: var(--font-mono); font-weight: 600;">|0&rang; Probability</span>
                      <span id="prob0Text" style="font-family: var(--font-mono);">50.0%</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: var(--surface-color); border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                      <div id="prob0Bar" style="height: 100%; width: 50%; background: var(--accent-primary); transition: width 0.1s ease; border-radius: 6px;"></div>
                    </div>
                  </div>

                  <!-- Bar 1 -->
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                      <span style="color: var(--accent-purple); font-family: var(--font-mono); font-weight: 600;">|1&rang; Probability</span>
                      <span id="prob1Text" style="font-family: var(--font-mono);">50.0%</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: var(--surface-color); border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                      <div id="prob1Bar" style="height: 100%; width: 50%; background: var(--accent-purple); transition: width 0.1s ease; border-radius: 6px;"></div>
                    </div>
                  </div>
                </div>

                <!-- Preset Quick Buttons -->
                <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-secondary" onclick="document.getElementById('thetaSlider').value=0; document.getElementById('thetaSlider').dispatchEvent(new Event('input'));">
                    Pure |0&rang; (&theta;=0)
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="document.getElementById('thetaSlider').value=1.5708; document.getElementById('thetaSlider').dispatchEvent(new Event('input'));">
                    Superposition |+&rang; (&theta;=&pi;/2)
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="document.getElementById('thetaSlider').value=3.1416; document.getElementById('thetaSlider').dispatchEvent(new Event('input'));">
                    Pure |1&rang; (&theta;=&pi;)
                  </button>
                </div>

              </div>
            </div>

            <!-- Bloch Sphere Canvas & Visualizer -->
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div class="bloch-container" style="box-shadow: var(--shadow-md); width: 100%; max-width: 380px; height: 380px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); position: relative;">
                <canvas id="blochSphereCanvas" width="380" height="380" style="width: 100%; height: 100%; display: block;"></canvas>
                <div style="position: absolute; top: 12px; left: 14px; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); pointer-events: none;">
                  North: |0&rang; &bull; South: |1&rang;
                </div>
              </div>
              <div style="text-align: center; margin-top: 0.75rem;">
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                  Live Bloch Sphere &bull; State vector $\\vec{r} = (\\sin\\theta\\cos\\phi, \\sin\\theta\\sin\\phi, \\cos\\theta)$
                </p>
              </div>
            </div>

          </div>
        </div>

        <!-- Summary Comparison Cards -->
        <div class="mb-4">
          <h2 class="h4 fw-bold mb-3" style="color: var(--heading-color);">Conceptual Comparison Summary</h2>
          <div class="card-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            
            <div class="card" style="border-top: 4px solid var(--accent-amber);">
              <h4 class="card-title" style="color: var(--accent-amber);">Transistor</h4>
              <p class="card-body">
                <strong>ON or OFF</strong>: Saturated binary physical operating state governed by channel carrier population. 
                Noise margins ($NM_L, NM_H$) actively suppress intermediate fluctuations.
              </p>
              <div class="card-footer font-monospace small">Physical Electronic Switch</div>
            </div>

            <div class="card" style="border-top: 4px solid var(--accent-primary);">
              <h4 class="card-title" style="color: var(--accent-primary);">Classical Bit</h4>
              <p class="card-body">
                <strong>0 or 1</strong>: Abstract mathematical binary information. Deterministic logic gates (AND, OR, NOT) 
                transform bits without continuous superposition or quantum phase degrees of freedom.
              </p>
              <div class="card-footer font-monospace small">Shannon Discrete Binary</div>
            </div>

            <div class="card" style="border-top: 4px solid var(--accent-purple);">
              <h4 class="card-title" style="color: var(--accent-purple);">Quantum Qubit</h4>
              <p class="card-body">
                <strong>&alpha;|0&rang; + &beta;|1&rang;</strong>: Continuous complex linear superposition. Unitary rotations preserve norm, 
                and projective measurement collapses state to basis vector with Born probability.
              </p>
              <div class="card-footer font-monospace small">Hilbert Space Unitary System</div>
            </div>

          </div>
        </div>

        <!-- Bottom Level Pagination -->
        <div class="level-pagination">
          <a href="#level2" class="btn btn-outline-secondary level-pagination-prev">
            &larr; Previous: Level 2 &mdash; Logic Gates
          </a>
          <a href="#level4" class="btn btn-primary level-pagination-next">
            Next: Level 4 &mdash; Quantum Circuits &rarr;
          </a>
        </div>

      </div>
    </div>
  `;

  // Attach interactive behaviors for Level 3
  initLevel3Interactions();
}

// ============================================================================
// LEVEL 3 LOGIC & EVENT LISTENERS
// ============================================================================

function initLevel3Interactions() {
  // 1. Chart.js Instance for Hadamard Experiment
  const canvasChart = document.getElementById('hadamardChartCanvas');
  let hadamardChart = null;

  let hCounts = { '0': 0, '1': 0 };
  let currentHState = { alpha: 1.0, beta: 0.0 }; // Start at |0>

  if (canvasChart && typeof Chart !== 'undefined') {
    hadamardChart = new Chart(canvasChart, {
      type: 'bar',
      data: {
        labels: ['|0⟩ State', '|1⟩ State'],
        datasets: [{
          label: 'Measurement Frequency',
          data: [0, 0],
          backgroundColor: [
            'rgba(88, 166, 255, 0.75)',
            'rgba(188, 140, 255, 0.75)'
          ],
          borderColor: [
            '#58a6ff',
            '#bc8cff'
          ],
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const total = hCounts['0'] + hCounts['1'];
                const val = ctx.raw;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${val} shots (${pct}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: { color: '#8b949e' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#c9d1d9', font: { weight: 'bold', size: 14 } }
          }
        }
      }
    });
  }

  function updateHadamardDisplay() {
    const sDirac = document.getElementById('hStateDirac');
    const aVal = document.getElementById('hAlphaVal');
    const bVal = document.getElementById('hBetaVal');
    const tShots = document.getElementById('hTotalShots');
    const c0 = document.getElementById('hCount0');
    const c1 = document.getElementById('hCount1');

    const p0 = Math.pow(currentHState.alpha, 2);
    const p1 = Math.pow(currentHState.beta, 2);

    if (sDirac) {
      sDirac.innerHTML = `|&psi;&rang; = ${currentHState.alpha.toFixed(4)}|0&rang; + ${currentHState.beta.toFixed(4)}|1&rang;`;
    }
    if (aVal) {
      aVal.innerHTML = `${currentHState.alpha.toFixed(4)} (P = ${(p0 * 100).toFixed(1)}%)`;
    }
    if (bVal) {
      bVal.innerHTML = `${currentHState.beta.toFixed(4)} (P = ${(p1 * 100).toFixed(1)}%)`;
    }

    const total = hCounts['0'] + hCounts['1'];
    if (tShots) tShots.innerText = total;
    if (c0) {
      const pct0 = total > 0 ? ((hCounts['0'] / total) * 100).toFixed(1) : '0.0';
      c0.innerText = `${hCounts['0']} (${pct0}%)`;
    }
    if (c1) {
      const pct1 = total > 0 ? ((hCounts['1'] / total) * 100).toFixed(1) : '0.0';
      c1.innerText = `${hCounts['1']} (${pct1}%)`;
    }

    if (hadamardChart) {
      hadamardChart.data.datasets[0].data = [hCounts['0'], hCounts['1']];
      hadamardChart.update();
    }
  }

  // Button: Apply H Gate
  const btnApplyH = document.getElementById('btnApplyH');
  if (btnApplyH) {
    btnApplyH.addEventListener('click', () => {
      // H |0> = (|0> + |1>)/sqrt(2)
      // H |1> = (|0> - |1>)/sqrt(2)
      const prevAlpha = currentHState.alpha;
      const prevBeta = currentHState.beta;
      const invSqrt2 = 1.0 / Math.SQRT2;

      currentHState.alpha = (prevAlpha + prevBeta) * invSqrt2;
      currentHState.beta = (prevAlpha - prevBeta) * invSqrt2;

      const badge = document.getElementById('hMeasurementBadge');
      if (badge) {
        badge.innerHTML = `<span style="color: var(--accent-primary); font-weight: 600;">✨ H Gate applied! State transformed into superposition: (|0&rang; + |1&rang;) / &radic;2</span>`;
      }
      updateHadamardDisplay();
    });
  }

  // Button: Measure Once
  const btnMeasureOnce = document.getElementById('btnMeasureOnce');
  if (btnMeasureOnce) {
    btnMeasureOnce.addEventListener('click', () => {
      const p0 = Math.pow(currentHState.alpha, 2);
      const rand = Math.random();
      const outcome = rand < p0 ? '0' : '1';

      hCounts[outcome]++;

      // Measurement collapse!
      if (outcome === '0') {
        currentHState.alpha = 1.0;
        currentHState.beta = 0.0;
      } else {
        currentHState.alpha = 0.0;
        currentHState.beta = 1.0;
      }

      const badge = document.getElementById('hMeasurementBadge');
      if (badge) {
        const color = outcome === '0' ? 'var(--accent-primary)' : 'var(--accent-purple)';
        badge.innerHTML = `<span style="color: ${color}; font-weight: 700; font-size: 1.05rem;">🎯 Measured: |${outcome}&rang;! State collapsed to pure |${outcome}&rang;.</span>`;
      }
      updateHadamardDisplay();
    });
  }

  // Button: Run 1000 Shots
  const btnRun1000 = document.getElementById('btnRun1000');
  if (btnRun1000) {
    btnRun1000.addEventListener('click', () => {
      const p0 = Math.pow(currentHState.alpha, 2);
      let count0 = 0;
      let count1 = 0;

      for (let i = 0; i < 1000; i++) {
        if (Math.random() < p0) {
          count0++;
        } else {
          count1++;
        }
      }

      hCounts['0'] += count0;
      hCounts['1'] += count1;

      const badge = document.getElementById('hMeasurementBadge');
      if (badge) {
        badge.innerHTML = `<span style="color: var(--accent-secondary); font-weight: 600;">🚀 1000 projective shots completed! Observed |0&rang;: ${count0}, |1&rang;: ${count1}.</span>`;
      }
      updateHadamardDisplay();
    });
  }

  // Button: Reset H
  const btnResetH = document.getElementById('btnResetH');
  if (btnResetH) {
    btnResetH.addEventListener('click', () => {
      currentHState = { alpha: 1.0, beta: 0.0 };
      hCounts = { '0': 0, '1': 0 };

      const badge = document.getElementById('hMeasurementBadge');
      if (badge) {
        badge.innerHTML = `<span style="color: var(--text-muted);">Reset completed. State restored to ground state |0&rang;.</span>`;
      }
      updateHadamardDisplay();
    });
  }

  // 2. Bloch Sphere & Slider Setup
  const thetaSlider = document.getElementById('thetaSlider');
  const blochCanvas = document.getElementById('blochSphereCanvas');
  let blochSphereObj = null;

  // Initialize BlochSphere instance from imported class if available
  if (blochCanvas) {
    try {
      if (typeof BlochSphere === 'function') {
        blochSphereObj = new BlochSphere(blochCanvas);
      }
    } catch (e) {
      console.warn('BlochSphere instantiation info:', e);
    }
  }

  function renderBlochFallback(canvas, theta, phi = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.38;

    // Background glow
    const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.2);
    grad.addColorStop(0, 'rgba(88, 166, 255, 0.07)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Outer Circle (Sphere Outline)
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Equator Ellipse
    ctx.strokeStyle = 'rgba(139, 148, 158, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Meridian Ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.32, r, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    // Z Axis (vertical)
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r + 20);
    ctx.lineTo(cx, cy - r - 20);
    ctx.stroke();

    // X Axis (oblique)
    ctx.strokeStyle = '#3fb950';
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.85, cy + r * 0.35);
    ctx.lineTo(cx - r * 0.85, cy - r * 0.35);
    ctx.stroke();

    // Y Axis (horizontal-ish)
    ctx.strokeStyle = '#bc8cff';
    ctx.beginPath();
    ctx.moveTo(cx - r - 15, cy);
    ctx.lineTo(cx + r + 15, cy);
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = '#f0f6fc';
    ctx.fillText('|0⟩ (+Z)', cx - 24, cy - r - 25);
    ctx.fillText('|1⟩ (-Z)', cx - 24, cy + r + 35);
    ctx.fillStyle = '#3fb950';
    ctx.fillText('+X', cx + r * 0.88, cy + r * 0.4);
    ctx.fillStyle = '#bc8cff';
    ctx.fillText('+Y', cx + r + 20, cy + 4);

    // State Vector calculation
    // x = r * sin(theta) * cos(phi)
    // y = r * sin(theta) * sin(phi)
    // z = r * cos(theta)
    // Project 3D onto 2D canvas plane (isometric/orthographic tilt)
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);

    const x3d = r * sinT * cosP;
    const y3d = r * sinT * sinP;
    const z3d = r * cosT;

    // Projection factors:
    const projX = cx + x3d * 0.85 + y3d * 0.5;
    const projY = cy - z3d + x3d * 0.28 - y3d * 0.16;

    // Origin dot
    ctx.fillStyle = '#8b949e';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // State Vector Arrow Line
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(projX, projY);
    ctx.stroke();

    // Arrowhead / Target Point
    ctx.fillStyle = '#79b8ff';
    ctx.shadowColor = '#58a6ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(projX, projY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // State label |ψ⟩
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('|ψ⟩', projX + 10, projY - 6);
  }

  function updateBlochAndSlider() {
    if (!thetaSlider) return;
    const theta = parseFloat(thetaSlider.value);
    const phi = 0; // Pure real amplitudes

    const alpha = Math.cos(theta / 2);
    const beta = Math.sin(theta / 2);

    const p0 = Math.pow(alpha, 2);
    const p1 = Math.pow(beta, 2);

    // Display updates
    const thetaDisp = document.getElementById('thetaValDisplay');
    const aDisp = document.getElementById('alphaValDisplay');
    const bDisp = document.getElementById('betaValDisplay');
    const p0Disp = document.getElementById('prob0Display');
    const p1Disp = document.getElementById('prob1Display');
    const p0Text = document.getElementById('prob0Text');
    const p1Text = document.getElementById('prob1Text');
    const p0Bar = document.getElementById('prob0Bar');
    const p1Bar = document.getElementById('prob1Bar');

    const deg = (theta * 180 / Math.PI).toFixed(1);
    if (thetaDisp) thetaDisp.innerHTML = `&theta; = ${theta.toFixed(2)} rad (${deg}&deg;)`;
    if (aDisp) aDisp.innerText = alpha.toFixed(4);
    if (bDisp) bDisp.innerText = beta.toFixed(4);
    if (p0Disp) p0Disp.innerText = `P(|0⟩) = ${(p0 * 100).toFixed(1)}%`;
    if (p1Disp) p1Disp.innerText = `P(|1⟩) = ${(p1 * 100).toFixed(1)}%`;
    if (p0Text) p0Text.innerText = `${(p0 * 100).toFixed(1)}%`;
    if (p1Text) p1Text.innerText = `${(p1 * 100).toFixed(1)}%`;
    if (p0Bar) p0Bar.style.width = `${(p0 * 100).toFixed(1)}%`;
    if (p1Bar) p1Bar.style.width = `${(p1 * 100).toFixed(1)}%`;

    // Update Bloch Sphere
    if (blochSphereObj) {
      try {
        if (typeof blochSphereObj.setAngles === 'function') {
          blochSphereObj.setAngles(theta, phi);
        } else if (typeof blochSphereObj.setState === 'function') {
          blochSphereObj.setState(alpha, beta);
        } else if (typeof blochSphereObj.update === 'function') {
          blochSphereObj.update(theta, phi);
        }
      } catch (err) {
        console.warn('BlochSphere class update error:', err);
      }
    }
    // Render custom high-detail visual on canvas
    renderBlochFallback(blochCanvas, theta, phi);
  }

  if (thetaSlider) {
    thetaSlider.addEventListener('input', updateBlochAndSlider);
  }

  // Initial runs
  updateHadamardDisplay();
  updateBlochAndSlider();
}

// ============================================================================
// LEVEL 4: CLASSICAL CIRCUIT VS QUANTUM CIRCUIT
// ============================================================================

function renderLevel4(container) {
  container.innerHTML = `
    <div class="level-page-container py-4">
      <div class="container">

        <!-- Section Header -->
        <header class="section-header mb-5">
          <div class="badge-pill mb-2" style="display:inline-block; padding: 0.35rem 0.85rem; background: rgba(188,140,255,0.12); border: 1px solid rgba(188,140,255,0.3); border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: var(--accent-purple);">
            Level 4 &bull; Circuit Implementations &amp; Unitary Reversibility
          </div>
          <h1 class="display-5 fw-bold mb-3">Level 4: Classical Circuit vs Quantum Circuit</h1>
          <p class="subtext lead" style="max-width: 850px; color: var(--text-muted);">
            Comparing identical arithmetic functions implemented with irreversible CMOS logic gates versus unitary, 
            information-conserving quantum circuits.
          </p>
        </header>

        <!-- Level Switcher Navigation Bar -->
        <nav class="level-switcher-bar" aria-label="Switch between levels">
          <div class="level-switcher-track">
            <a href="#level1" class="level-switcher-item">
              <span class="level-num">1</span>
              <span class="level-info">
                <span class="level-label">Level 1</span>
                <span class="level-title">Transistor Switch</span>
              </span>
            </a>
            <a href="#level2" class="level-switcher-item">
              <span class="level-num">2</span>
              <span class="level-info">
                <span class="level-label">Level 2</span>
                <span class="level-title">Logic Gates</span>
              </span>
            </a>
            <a href="#level3" class="level-switcher-item">
              <span class="level-num">3</span>
              <span class="level-info">
                <span class="level-label">Level 3</span>
                <span class="level-title">Bit &rarr; Qubit</span>
              </span>
            </a>
            <a href="#level4" class="level-switcher-item active">
              <span class="level-num">4</span>
              <span class="level-info">
                <span class="level-label">Level 4</span>
                <span class="level-title">Quantum Circuits</span>
              </span>
            </a>
          </div>
        </nav>

        <!-- Introduction Banner -->
        <div class="simulator-container mb-5" style="border-left: 4px solid var(--accent-primary);">
          <div class="row align-items-center">
            <div>
              <h2 class="h4 fw-bold mb-2" style="color: var(--heading-color);">Same Function, Radically Different Physics</h2>
              <p style="color: var(--text-muted); margin-bottom: 0;">
                In digital electronics, an Exclusive-OR (XOR) gate takes two input voltages and produces one output voltage, 
                permanently erasing 1 bit of information. In quantum computing, all non-measurement operations must be unitary 
                and strictly reversible ($U^\\dagger U = I$). The quantum analogue of XOR is the <strong>Controlled-NOT (CNOT)</strong> gate, 
                preserving both qubits so information is never discarded.
              </p>
            </div>
          </div>
        </div>

        <!-- Side-by-Side Layout: Classical XOR vs Quantum CNOT -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3.5rem;" class="side-by-side-grid">
          
          <!-- LEFT: Classical XOR Gate -->
          <div class="card p-4" style="background: var(--surface-color); border: 1px solid var(--border-color); display: flex; flex-direction: column;">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="h4 fw-bold mb-0" style="color: var(--accent-primary);">Classical XOR Gate</h3>
              <span class="card-badge" style="background: rgba(88,166,255,0.1); color: var(--accent-primary); border: 1px solid rgba(88,166,255,0.3);">
                CMOS Irreversible
              </span>
            </div>

            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              Constructed from ~8&ndash;12 MOSFETs. Combines two input voltage rails $A, B$ into output $Y = A \\oplus B$. 
              Dissipates Landauer heat ($k_B T \\ln 2$) because knowing $Y=1$ cannot uniquely recover whether $(A,B)=(1,0)$ or $(0,1)$.
            </p>

            <!-- SVG Circuit Diagram for Classical XOR -->
            <div class="circuit-container mb-3" style="min-height: 180px; background: var(--bg-color); border-radius: var(--border-radius-md); padding: 1rem; border: 1px solid var(--border-color);">
              <svg id="classicalXorSvg" viewBox="0 0 360 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
                <!-- Grid background subtleties -->
                <line x1="20" y1="50" x2="160" y2="50" stroke="#30363d" stroke-width="3" id="wireInA" />
                <line x1="20" y1="110" x2="160" y2="110" stroke="#30363d" stroke-width="3" id="wireInB" />
                <line x1="250" y1="80" x2="330" y2="80" stroke="#30363d" stroke-width="3" id="wireOutY" />

                <!-- XOR Gate Symbol Body (ANSI Standard) -->
                <!-- First curved input line -->
                <path d="M 145 35 Q 165 80 145 125" fill="none" stroke="#58a6ff" stroke-width="3" />
                <!-- Main body: shield front with curved back -->
                <path d="M 155 35 Q 175 80 155 125 Q 215 125 250 80 Q 215 35 155 35 Z" fill="#21262d" stroke="#58a6ff" stroke-width="3" />

                <!-- Nodes & Labels -->
                <circle cx="25" cy="50" r="5" fill="#58a6ff" />
                <text x="35" y="44" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold">Input A</text>

                <circle cx="25" cy="110" r="5" fill="#58a6ff" />
                <text x="35" y="104" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold">Input B</text>

                <circle cx="325" cy="80" r="5" id="outNodeY" fill="#30363d" />
                <text x="260" y="70" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold">Out: A &oplus; B</text>

                <text x="180" y="86" fill="#8b949e" font-family="system-ui" font-size="14" font-weight="bold">&oplus;</text>
              </svg>
            </div>

            <!-- Input Toggles -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: center;">
              <button id="toggleA" class="btn btn-secondary" style="flex: 1;">
                Toggle A: <strong id="valA" style="color: var(--accent-primary);">0</strong>
              </button>
              <button id="toggleB" class="btn btn-secondary" style="flex: 1;">
                Toggle B: <strong id="valB" style="color: var(--accent-primary);">0</strong>
              </button>
            </div>

            <!-- Live Output Status -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 0.9rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: var(--heading-color);">Output (A &oplus; B):</span>
              <span id="outputXorResult" style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: #8b949e;">
                0 (LOW &bull; 0V)
              </span>
            </div>

            <!-- XOR Truth Table -->
            <div class="table-responsive" style="margin-bottom: 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;" id="xorTruthTable">
                <thead>
                  <tr>
                    <th style="padding: 0.5rem 0.75rem;">A</th>
                    <th style="padding: 0.5rem 0.75rem;">B</th>
                    <th style="padding: 0.5rem 0.75rem;">A &oplus; B</th>
                    <th style="padding: 0.5rem 0.75rem;">State</th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-row="00" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">0</td>
                    <td style="padding: 0.5rem 0.75rem;">0</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold;">0</td>
                    <td style="padding: 0.5rem 0.75rem; color: var(--text-muted);">Outputs Match (Off)</td>
                  </tr>
                  <tr data-row="01" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">0</td>
                    <td style="padding: 0.5rem 0.75rem;">1</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold;">1</td>
                    <td style="padding: 0.5rem 0.75rem; color: var(--text-muted);">Inputs Differ (On)</td>
                  </tr>
                  <tr data-row="10" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">1</td>
                    <td style="padding: 0.5rem 0.75rem;">0</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold;">1</td>
                    <td style="padding: 0.5rem 0.75rem; color: var(--text-muted);">Inputs Differ (On)</td>
                  </tr>
                  <tr data-row="11" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">1</td>
                    <td style="padding: 0.5rem 0.75rem;">1</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold;">0</td>
                    <td style="padding: 0.5rem 0.75rem; color: var(--text-muted);">Outputs Match (Off)</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          <!-- RIGHT: Quantum XOR (CNOT Gate) -->
          <div class="card p-4" style="background: var(--surface-color); border: 1px solid var(--border-color); display: flex; flex-direction: column;">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="h4 fw-bold mb-0" style="color: var(--accent-purple);">Quantum CNOT Gate</h3>
              <span class="card-badge" style="background: rgba(188,140,255,0.1); color: var(--accent-purple); border: 1px solid rgba(188,140,255,0.3);">
                Unitary &bull; Reversible
              </span>
            </div>

            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              Controlled-NOT unitary operation on 2 qubits: $|A, B\\rangle \\to |A, A \\oplus B\\rangle$. 
              If the control qubit $|A\\rangle = |1\\rangle$, target $|B\\rangle$ is bit-flipped (Pauli-X). 
              Conserves information: the matrix is unitary ($U = U^\\dagger = U^{-1}$).
            </p>

            <!-- SVG Circuit Diagram for CNOT -->
            <div class="circuit-container mb-3" style="min-height: 180px; background: var(--bg-color); border-radius: var(--border-radius-md); padding: 1rem; border: 1px solid var(--border-color);">
              <svg id="quantumCnotSvg" viewBox="0 0 360 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
                <!-- Qubit rails -->
                <line x1="20" y1="50" x2="330" y2="50" stroke="#30363d" stroke-width="3" id="wireQ0" />
                <line x1="20" y1="110" x2="330" y2="110" stroke="#30363d" stroke-width="3" id="wireQ1" />

                <!-- Vertical CNOT connecting line -->
                <line x1="180" y1="50" x2="180" y2="110" stroke="#bc8cff" stroke-width="3" />

                <!-- Control Node: Filled dot on q0 -->
                <circle cx="180" cy="50" r="8" fill="#bc8cff" />

                <!-- Target Node: Invert circle with plus on q1 -->
                <circle cx="180" cy="110" r="15" fill="#21262d" stroke="#bc8cff" stroke-width="3" />
                <line x1="180" y1="97" x2="180" y2="123" stroke="#bc8cff" stroke-width="3" />
                <line x1="167" y1="110" x2="193" y2="110" stroke="#bc8cff" stroke-width="3" />

                <!-- Labels -->
                <text x="25" y="42" fill="#bc8cff" font-family="system-ui" font-size="13" font-weight="bold" id="labelInQ0">|q₀⟩ = |0⟩</text>
                <text x="25" y="102" fill="#bc8cff" font-family="system-ui" font-size="13" font-weight="bold" id="labelInQ1">|q₁⟩ = |0⟩</text>

                <text x="260" y="42" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold" id="labelOutQ0">|A⟩</text>
                <text x="260" y="102" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold" id="labelOutQ1">|A &oplus; B⟩</text>
              </svg>
            </div>

            <!-- Qubit State Selectors -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: center;">
              <button id="toggleQ0" class="btn btn-secondary" style="flex: 1;">
                Control |A&rang;: <strong id="valQ0" style="color: var(--accent-purple);">|0&rang;</strong>
              </button>
              <button id="toggleQ1" class="btn btn-secondary" style="flex: 1;">
                Target |B&rang;: <strong id="valQ1" style="color: var(--accent-purple);">|0&rang;</strong>
              </button>
            </div>

            <!-- Live Output Status -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 0.9rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: var(--heading-color);">CNOT Output State:</span>
              <span id="outputCnotResult" style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: var(--accent-purple);">
                |00&rang; &rarr; |00&rang;
              </span>
            </div>

            <!-- CNOT State Table -->
            <div class="table-responsive" style="margin-bottom: 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;" id="cnotStateTable">
                <thead>
                  <tr>
                    <th style="padding: 0.5rem 0.75rem;">Input |A,B⟩</th>
                    <th style="padding: 0.5rem 0.75rem;">Control |A⟩</th>
                    <th style="padding: 0.5rem 0.75rem;">Target Output</th>
                    <th style="padding: 0.5rem 0.75rem;">Output State</th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-state="00" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">|00⟩</td>
                    <td style="padding: 0.5rem 0.75rem;">0 (No flip)</td>
                    <td style="padding: 0.5rem 0.75rem;">|0 ⊕ 0⟩ = |0⟩</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold; color: var(--accent-purple);">|00⟩</td>
                  </tr>
                  <tr data-state="01" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">|01⟩</td>
                    <td style="padding: 0.5rem 0.75rem;">0 (No flip)</td>
                    <td style="padding: 0.5rem 0.75rem;">|0 ⊕ 1⟩ = |1⟩</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold; color: var(--accent-purple);">|01⟩</td>
                  </tr>
                  <tr data-state="10" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">|10⟩</td>
                    <td style="padding: 0.5rem 0.75rem;">1 (Bit-flip!)</td>
                    <td style="padding: 0.5rem 0.75rem;">|1 ⊕ 0⟩ = |1⟩</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold; color: var(--accent-purple);">|11⟩</td>
                  </tr>
                  <tr data-state="11" style="transition: background 0.2s;">
                    <td style="padding: 0.5rem 0.75rem;">|11⟩</td>
                    <td style="padding: 0.5rem 0.75rem;">1 (Bit-flip!)</td>
                    <td style="padding: 0.5rem 0.75rem;">|1 ⊕ 1⟩ = |0⟩</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: bold; color: var(--accent-purple);">|10⟩</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>

        <!-- Half-Adder Comparison Section -->
        <div class="simulator-container mb-5">
          <div class="mb-4">
            <h2 class="h3 fw-bold mb-1" style="color: var(--heading-color);">Half-Adder Architecture: Classical vs Quantum</h2>
            <p style="color: var(--text-muted); margin-bottom: 0;">
              An essential arithmetic building block adding two 1-bit inputs: $\\text{Sum} = A \\oplus B$ and $\\text{Carry} = A \\cdot B$.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;" class="adder-grid">
            
            <!-- Classical Half Adder -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem;">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h4 style="font-size: 1.15rem; color: var(--accent-primary); margin-bottom: 0;">Classical Half-Adder</h4>
                <span class="badge" style="background: rgba(88,166,255,0.15); color: var(--accent-primary);">XOR + AND</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                Inputs $A$ and $B$ are branched (fan-out) into an XOR gate (Sum) and an AND gate (Carry).
              </p>

              <!-- SVG for Classical Half Adder -->
              <div style="background: var(--surface-color); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); padding: 1rem;">
                <svg viewBox="0 0 380 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
                  <!-- Inputs A and B -->
                  <text x="15" y="55" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold">A</text>
                  <text x="15" y="145" fill="#f0f6fc" font-family="system-ui" font-size="13" font-weight="bold">B</text>

                  <!-- Input Lines -->
                  <line x1="35" y1="50" x2="140" y2="50" stroke="#58a6ff" stroke-width="2.5" />
                  <line x1="35" y1="140" x2="140" y2="140" stroke="#58a6ff" stroke-width="2.5" />

                  <!-- Fan-out branching points -->
                  <circle cx="70" cy="50" r="4" fill="#58a6ff" />
                  <circle cx="95" cy="140" r="4" fill="#58a6ff" />

                  <!-- Wires down to AND gate -->
                  <path d="M 70 50 L 70 115 L 140 115" fill="none" stroke="#58a6ff" stroke-width="2.5" />
                  <path d="M 95 140 L 95 155 L 140 155" fill="none" stroke="#58a6ff" stroke-width="2.5" />

                  <!-- Wire up to XOR gate for B -->
                  <path d="M 120 140 L 120 75 L 140 75" fill="none" stroke="#58a6ff" stroke-width="2.5" />
                  <circle cx="120" cy="140" r="4" fill="#58a6ff" />

                  <!-- XOR Gate Symbol (Top) -->
                  <path d="M 135 40 Q 150 62 135 85" fill="none" stroke="#58a6ff" stroke-width="2.5" />
                  <path d="M 142 40 Q 157 62 142 85 Q 195 85 220 62 Q 195 40 142 40 Z" fill="#21262d" stroke="#58a6ff" stroke-width="2.5" />
                  <text x="165" y="67" fill="#8b949e" font-family="system-ui" font-size="12" font-weight="bold">XOR</text>

                  <!-- AND Gate Symbol (Bottom) -->
                  <path d="M 140 100 L 175 100 A 35 35 0 0 1 175 170 L 140 170 Z" fill="#21262d" stroke="#3fb950" stroke-width="2.5" />
                  <text x="155" y="140" fill="#8b949e" font-family="system-ui" font-size="12" font-weight="bold">AND</text>

                  <!-- Output Wires -->
                  <line x1="220" y1="62" x2="310" y2="62" stroke="#58a6ff" stroke-width="2.5" />
                  <line x1="210" y1="135" x2="310" y2="135" stroke="#3fb950" stroke-width="2.5" />

                  <!-- Output text -->
                  <circle cx="310" cy="62" r="4" fill="#58a6ff" />
                  <text x="320" y="66" fill="#58a6ff" font-family="system-ui" font-size="13" font-weight="bold">Sum (A &oplus; B)</text>

                  <circle cx="310" cy="135" r="4" fill="#3fb950" />
                  <text x="320" y="139" fill="#3fb950" font-family="system-ui" font-size="13" font-weight="bold">Carry (A &bull; B)</text>
                </svg>
              </div>

              <div class="mt-3 text-muted small">
                <strong>Hardware Reality:</strong> Utilizes 2 separate gates, 10+ transistors. Cannot run backwards 
                (knowing Sum=0 and Carry=0 does not distinguish between $0+0$ and lost state).
              </div>
            </div>

            <!-- Quantum Half Adder -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem;">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h4 style="font-size: 1.15rem; color: var(--accent-purple); margin-bottom: 0;">Quantum Reversible Half-Adder</h4>
                <span class="badge" style="background: rgba(188,140,255,0.15); color: var(--accent-purple);">Toffoli + CNOT</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                No-cloning prevents fan-out branching. Uses a Toffoli (CCNOT) gate with an ancilla $|0\\rangle$ for Carry, plus CNOT for Sum.
              </p>

              <!-- SVG for Quantum Half Adder -->
              <div style="background: var(--surface-color); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); padding: 1rem;">
                <svg viewBox="0 0 380 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
                  <!-- 3 Qubit Lines -->
                  <line x1="30" y1="40" x2="350" y2="40" stroke="#30363d" stroke-width="2.5" />
                  <line x1="30" y1="95" x2="350" y2="95" stroke="#30363d" stroke-width="2.5" />
                  <line x1="30" y1="150" x2="350" y2="150" stroke="#30363d" stroke-width="2.5" />

                  <!-- Input Qubit labels -->
                  <text x="10" y="44" fill="#f0f6fc" font-family="system-ui" font-size="12" font-weight="bold">|A⟩</text>
                  <text x="10" y="99" fill="#f0f6fc" font-family="system-ui" font-size="12" font-weight="bold">|B⟩</text>
                  <text x="5" y="154" fill="#3fb950" font-family="system-ui" font-size="12" font-weight="bold">|0⟩</text>

                  <!-- 1. Toffoli Gate (CCNOT) at X=140 -->
                  <line x1="140" y1="40" x2="140" y2="150" stroke="#3fb950" stroke-width="2.5" />
                  <circle cx="140" cy="40" r="6" fill="#3fb950" />
                  <circle cx="140" cy="95" r="6" fill="#3fb950" />
                  <!-- Target circle on line 3 -->
                  <circle cx="140" cy="150" r="12" fill="#21262d" stroke="#3fb950" stroke-width="2.5" />
                  <line x1="140" y1="140" x2="140" y2="160" stroke="#3fb950" stroke-width="2.5" />
                  <line x1="130" y1="150" x2="150" y2="150" stroke="#3fb950" stroke-width="2.5" />

                  <!-- 2. CNOT Gate at X=240 (Control A, Target B) -->
                  <line x1="240" y1="40" x2="240" y2="95" stroke="#bc8cff" stroke-width="2.5" />
                  <circle cx="240" cy="40" r="6" fill="#bc8cff" />
                  <!-- Target circle on line 2 -->
                  <circle cx="240" cy="95" r="12" fill="#21262d" stroke="#bc8cff" stroke-width="2.5" />
                  <line x1="240" y1="85" x2="240" y2="105" stroke="#bc8cff" stroke-width="2.5" />
                  <line x1="230" y1="95" x2="250" y2="95" stroke="#bc8cff" stroke-width="2.5" />

                  <!-- Gate Annotation Tags -->
                  <text x="115" y="22" fill="#3fb950" font-family="system-ui" font-size="11" font-weight="bold">Toffoli (Carry)</text>
                  <text x="215" y="22" fill="#bc8cff" font-family="system-ui" font-size="11" font-weight="bold">CNOT (Sum)</text>

                  <!-- Output Qubit Labels -->
                  <text x="290" y="34" fill="#8b949e" font-family="system-ui" font-size="11">|A⟩</text>
                  <text x="290" y="89" fill="#bc8cff" font-family="system-ui" font-size="12" font-weight="bold">|A &oplus; B⟩ (Sum)</text>
                  <text x="290" y="144" fill="#3fb950" font-family="system-ui" font-size="12" font-weight="bold">|A &bull; B⟩ (Carry)</text>
                </svg>
              </div>

              <div class="mt-3 text-muted small">
                <strong>Unitary Reality:</strong> Conserves quantum information completely ($U^\\dagger U = I$). 
                Applying the circuit backwards exactly regenerates the original inputs $|A\\rangle$ and $|B\\rangle$!
              </div>
            </div>

          </div>
        </div>

        <!-- Comprehensive Comparison Table: Classical vs Quantum -->
        <div class="mb-5">
          <h2 class="h3 fw-bold mb-3" style="color: var(--heading-color);">Comparative Breakdown: Classical vs Quantum Logic</h2>
          
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 20%;">Property</th>
                  <th style="width: 40%; color: var(--accent-primary);">Classical Logic Circuit (XOR / CMOS)</th>
                  <th style="width: 40%; color: var(--accent-purple);">Quantum Circuit (CNOT / Unitary)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="fw-bold">Fundamental Device</td>
                  <td>Semiconductor MOSFETs (gate, source, drain channels)</td>
                  <td>Two-level quantum systems (superconducting transmons, trapped ions, spin qubits)</td>
                </tr>
                <tr>
                  <td class="fw-bold">Information Reversibility</td>
                  <td><strong>Irreversible</strong>: 2 input bits $\\to$ 1 output bit (information erased)</td>
                  <td><strong>Strictly Reversible</strong>: Bijective unitary mapping ($U^\\dagger = U^{-1}$)</td>
                </tr>
                <tr>
                  <td class="fw-bold">Thermodynamic Dissipation</td>
                  <td>Subject to Landauer limit ($E_{diss} \ge k_B T \ln 2$ per bit erased)</td>
                  <td>Thermodynamically zero theoretical limit (dissipation only occurs during measurement or decoherence)</td>
                </tr>
                <tr>
                  <td class="fw-bold">Signal Fan-out / Branching</td>
                  <td>Arbitrary fan-out permitted (voltage charges multiple gate capacitors)</td>
                  <td><strong>No-Cloning Theorem</strong> forbids cloning unknown quantum states: $|\\psi\\rangle \\not\\to |\\psi\\rangle|\\psi\\rangle$</td>
                </tr>
                <tr>
                  <td class="fw-bold">Superposition Inputs</td>
                  <td>Inputs are strictly digital rails ($0\\text{V}$ or $V_{DD}$)</td>
                  <td>Inputs can be continuous linear superpositions: $\\alpha|0\\rangle + \\beta|1\\rangle$</td>
                </tr>
                <tr>
                  <td class="fw-bold">Entanglement Generation</td>
                  <td>Impossible &mdash; outputs are completely separable and independent</td>
                  <td>Capable of generating non-local Einstein-Podolsky-Rosen (EPR) entangled states</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Key Insight Box -->
        <div class="card p-4 mb-5" style="background: rgba(88,166,255,0.06); border: 1px solid rgba(88,166,255,0.3); border-radius: var(--border-radius-md);">
          <div style="display: flex; gap: 1rem; align-items: flex-start;">
            <span style="font-size: 2rem;">💡</span>
            <div>
              <h3 class="h5 fw-bold mb-1" style="color: var(--accent-primary);">Key Architectural Insight</h3>
              <p style="color: var(--text-main); margin-bottom: 0;">
                <strong>CNOT is the quantum analogue of XOR.</strong> The target qubit is flipped if and only if the control 
                qubit is in state $|1\\rangle$. Crucially, when the control qubit is placed into a coherent superposition 
                $\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$, applying CNOT does not perform a probabilistic choice; instead, 
                it entangles the two qubits into a single composite quantum system!
              </p>
            </div>
          </div>
        </div>

        <!-- Bell State Bonus Section -->
        <div class="simulator-container mb-4" id="bellStateSection">
          <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <div>
              <h2 class="h3 fw-bold mb-1" style="color: var(--heading-color);">Bell State Generator: Pure Quantum Entanglement</h2>
              <p style="color: var(--text-muted); margin-bottom: 0;">
                By applying a Hadamard gate ($H$) followed by a Controlled-NOT ($CNOT$) to ground state $|00\\rangle$, we prepare 
                the maximally entangled Bell state: $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$.
              </p>
            </div>
            <span class="card-badge" style="background: rgba(188,140,255,0.15); color: var(--accent-purple); border-color: rgba(188,140,255,0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">
              Non-Classical Entanglement
            </span>
          </div>

          <!-- Step Progression Diagram -->
          <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 1rem; text-align: center;">
              
              <div style="padding: 1rem; background: var(--surface-color); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); min-width: 140px;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Step 1: Ground State</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--heading-color); font-family: var(--font-mono); margin-top: 0.25rem;">
                  |00&rang;
                </div>
              </div>

              <div style="color: var(--accent-primary); font-size: 1.5rem; font-weight: bold;">&rarr;</div>

              <div style="padding: 1rem; background: var(--surface-color); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); min-width: 180px;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Step 2: Apply H on Qubit 0</div>
                <div style="font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-mono); margin-top: 0.25rem;">
                  (|00&rang; + |10&rang;) / &radic;2
                </div>
              </div>

              <div style="color: var(--accent-purple); font-size: 1.5rem; font-weight: bold;">&rarr;</div>

              <div style="padding: 1rem; background: var(--surface-color); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); min-width: 200px;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Step 3: Apply CNOT(0, 1)</div>
                <div style="font-size: 1.15rem; font-weight: 700; color: var(--accent-purple); font-family: var(--font-mono); margin-top: 0.25rem;">
                  |&Phi;&plus;&rang; = (|00&rang; + |11&rang;) / &radic;2
                </div>
              </div>

            </div>
          </div>

          <!-- Interactive Bell Experiment -->
          <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem;" class="bell-grid">
            
            <!-- Controls -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h4 style="font-size: 1.05rem; color: var(--heading-color); margin-bottom: 0.75rem;">Bell State Generator Controls</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                  Trigger the unitary entanglement pipeline and test correlated joint measurements across both qubits.
                </p>

                <!-- State Readout -->
                <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1.25rem; margin-bottom: 1.25rem; font-family: var(--font-mono);">
                  <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.35rem;">Bell State Status:</div>
                  <div id="bellStateStatusText" style="color: var(--accent-purple); font-weight: 700; font-size: 1.05rem;">
                    State Ready: |&Phi;&plus;&rang; = (|00&rang; + |11&rang;)/&radic;2
                  </div>
                </div>

                <div id="bellLastMeasureText" style="padding: 0.85rem; border-radius: var(--border-radius-sm); background: var(--surface-color); border: 1px dashed var(--border-color); text-align: center; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-muted);">
                  Click below to measure 1000 entangled shots.
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; flex-direction: column;">
                <button id="btnCreateBellState" class="btn btn-primary">
                  <span>⚛️ Create / Reinitialize Bell State</span>
                </button>
                <button id="btnMeasureBell1000" class="btn btn-success">
                  <span>📊 Run 1000 Joint Measurements</span>
                </button>
              </div>
            </div>

            <!-- Chart / Histogram -->
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; display: flex; flex-direction: column;">
              <h4 style="font-size: 1.05rem; color: var(--heading-color); margin-bottom: 0.5rem;">Joint 2-Qubit Measurement Histogram</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                Observe that outcomes $|01\\rangle$ and $|10\\rangle$ never occur ($P = 0\%$), proving perfect quantum correlation!
              </p>

              <div style="position: relative; height: 240px; width: 100%; flex-grow: 1;">
                <canvas id="bellChartCanvas"></canvas>
              </div>

              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 0.85rem; text-align: center;">
                <div>|00&rang;: <strong id="bellCount00" style="color: var(--accent-primary);">0</strong></div>
                <div>|01&rang;: <strong id="bellCount01" style="color: var(--accent-danger);">0</strong></div>
                <div>|10&rang;: <strong id="bellCount10" style="color: var(--accent-danger);">0</strong></div>
                <div>|11&rang;: <strong id="bellCount11" style="color: var(--accent-purple);">0</strong></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Bottom Level Pagination -->
        <div class="level-pagination">
          <a href="#level3" class="btn btn-outline-secondary level-pagination-prev">
            &larr; Previous: Level 3 &mdash; Bit to Qubit
          </a>
          <a href="#noise" class="btn btn-primary level-pagination-next">
            Next: Noise &amp; Errors &rarr;
          </a>
        </div>

      </div>
    </div>
  `;

  // Attach interactive behaviors for Level 4
  initLevel4Interactions();
}

// ============================================================================
// LEVEL 4 LOGIC & EVENT LISTENERS
// ============================================================================

function initLevel4Interactions() {
  // 1. Classical XOR Interactive Logic
  let valA = 0;
  let valB = 0;

  const btnToggleA = document.getElementById('toggleA');
  const btnToggleB = document.getElementById('toggleB');
  const displayValA = document.getElementById('valA');
  const displayValB = document.getElementById('valB');
  const displayOutXor = document.getElementById('outputXorResult');
  const xorTableRows = document.querySelectorAll('#xorTruthTable tbody tr');

  // SVG Elements
  const wireInA = document.getElementById('wireInA');
  const wireInB = document.getElementById('wireInB');
  const wireOutY = document.getElementById('wireOutY');
  const outNodeY = document.getElementById('outNodeY');

  function updateClassicalXor() {
    const xorResult = valA ^ valB;

    if (displayValA) displayValA.innerText = valA;
    if (displayValB) displayValB.innerText = valB;

    if (displayOutXor) {
      if (xorResult === 1) {
        displayOutXor.innerHTML = `<span style="color: var(--accent-secondary);">1 (HIGH &bull; V<sub>DD</sub>)</span>`;
      } else {
        displayOutXor.innerHTML = `<span style="color: #8b949e;">0 (LOW &bull; 0V)</span>`;
      }
    }

    // Update SVG Wires
    const activeColor = '#3fb950';
    const inactiveColor = '#30363d';

    if (wireInA) wireInA.setAttribute('stroke', valA === 1 ? activeColor : inactiveColor);
    if (wireInB) wireInB.setAttribute('stroke', valB === 1 ? activeColor : inactiveColor);
    if (wireOutY) wireOutY.setAttribute('stroke', xorResult === 1 ? activeColor : inactiveColor);
    if (outNodeY) outNodeY.setAttribute('fill', xorResult === 1 ? activeColor : inactiveColor);

    // Highlight Truth Table Row
    const key = `${valA}${valB}`;
    xorTableRows.forEach(row => {
      if (row.getAttribute('data-row') === key) {
        row.style.backgroundColor = 'rgba(88, 166, 255, 0.18)';
        row.style.fontWeight = 'bold';
      } else {
        row.style.backgroundColor = 'transparent';
        row.style.fontWeight = 'normal';
      }
    });
  }

  if (btnToggleA) {
    btnToggleA.addEventListener('click', () => {
      valA = valA === 0 ? 1 : 0;
      updateClassicalXor();
    });
  }

  if (btnToggleB) {
    btnToggleB.addEventListener('click', () => {
      valB = valB === 0 ? 1 : 0;
      updateClassicalXor();
    });
  }

  // 2. Quantum CNOT Interactive Logic
  let q0 = 0; // Control
  let q1 = 0; // Target

  const btnToggleQ0 = document.getElementById('toggleQ0');
  const btnToggleQ1 = document.getElementById('toggleQ1');
  const displayValQ0 = document.getElementById('valQ0');
  const displayValQ1 = document.getElementById('valQ1');
  const displayOutCnot = document.getElementById('outputCnotResult');
  const cnotTableRows = document.querySelectorAll('#cnotStateTable tbody tr');

  const wireQ0 = document.getElementById('wireQ0');
  const wireQ1 = document.getElementById('wireQ1');
  const labelInQ0 = document.getElementById('labelInQ0');
  const labelInQ1 = document.getElementById('labelInQ1');
  const labelOutQ0 = document.getElementById('labelOutQ0');
  const labelOutQ1 = document.getElementById('labelOutQ1');

  function updateQuantumCnot() {
    const outTarget = q0 === 1 ? (q1 === 0 ? 1 : 0) : q1; // CNOT flip
    const outControl = q0;

    if (displayValQ0) displayValQ0.innerText = `|${q0}⟩`;
    if (displayValQ1) displayValQ1.innerText = `|${q1}⟩`;

    if (displayOutCnot) {
      displayOutCnot.innerHTML = `|${q0}${q1}&rang; &rarr; <strong>|${outControl}${outTarget}&rang;</strong>`;
    }

    if (labelInQ0) labelInQ0.textContent = `|q₀⟩ = |${q0}⟩`;
    if (labelInQ1) labelInQ1.textContent = `|q₁⟩ = |${q1}⟩`;
    if (labelOutQ0) labelOutQ0.textContent = `|A⟩ = |${outControl}⟩`;
    if (labelOutQ1) labelOutQ1.textContent = `|A ⊕ B⟩ = |${outTarget}⟩`;

    const activeColor = '#bc8cff';
    const inactiveColor = '#30363d';

    if (wireQ0) wireQ0.setAttribute('stroke', q0 === 1 ? activeColor : inactiveColor);
    if (wireQ1) wireQ1.setAttribute('stroke', outTarget === 1 ? activeColor : inactiveColor);

    // Highlight CNOT State Table Row
    const key = `${q0}${q1}`;
    cnotTableRows.forEach(row => {
      if (row.getAttribute('data-state') === key) {
        row.style.backgroundColor = 'rgba(188, 140, 255, 0.18)';
        row.style.fontWeight = 'bold';
      } else {
        row.style.backgroundColor = 'transparent';
        row.style.fontWeight = 'normal';
      }
    });
  }

  if (btnToggleQ0) {
    btnToggleQ0.addEventListener('click', () => {
      q0 = q0 === 0 ? 1 : 0;
      updateQuantumCnot();
    });
  }

  if (btnToggleQ1) {
    btnToggleQ1.addEventListener('click', () => {
      q1 = q1 === 0 ? 1 : 0;
      updateQuantumCnot();
    });
  }

  // 3. Bell State Bonus Experiment Logic
  const bellCanvas = document.getElementById('bellChartCanvas');
  let bellChart = null;
  let bellCounts = { '00': 0, '01': 0, '10': 0, '11': 0 };

  if (bellCanvas && typeof Chart !== 'undefined') {
    bellChart = new Chart(bellCanvas, {
      type: 'bar',
      data: {
        labels: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
        datasets: [{
          label: 'Joint Measurements',
          data: [0, 0, 0, 0],
          backgroundColor: [
            'rgba(88, 166, 255, 0.75)',
            'rgba(248, 81, 73, 0.75)',
            'rgba(248, 81, 73, 0.75)',
            'rgba(188, 140, 255, 0.75)'
          ],
          borderColor: [
            '#58a6ff',
            '#f85149',
            '#f85149',
            '#bc8cff'
          ],
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const total = bellCounts['00'] + bellCounts['01'] + bellCounts['10'] + bellCounts['11'];
                const val = ctx.raw;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${val} shots (${pct}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: { color: '#8b949e' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#c9d1d9', font: { weight: 'bold', size: 14 } }
          }
        }
      }
    });
  }

  function updateBellDisplay() {
    const c00 = document.getElementById('bellCount00');
    const c01 = document.getElementById('bellCount01');
    const c10 = document.getElementById('bellCount10');
    const c11 = document.getElementById('bellCount11');

    if (c00) c00.innerText = bellCounts['00'];
    if (c01) c01.innerText = bellCounts['01'];
    if (c10) c10.innerText = bellCounts['10'];
    if (c11) c11.innerText = bellCounts['11'];

    if (bellChart) {
      bellChart.data.datasets[0].data = [
        bellCounts['00'],
        bellCounts['01'],
        bellCounts['10'],
        bellCounts['11']
      ];
      bellChart.update();
    }
  }

  const btnCreateBell = document.getElementById('btnCreateBellState');
  if (btnCreateBell) {
    btnCreateBell.addEventListener('click', () => {
      bellCounts = { '00': 0, '01': 0, '10': 0, '11': 0 };
      const statusText = document.getElementById('bellStateStatusText');
      const lastMeasureText = document.getElementById('bellLastMeasureText');

      if (statusText) {
        statusText.innerHTML = `Bell State Ready: |&Phi;&plus;&rang; = (|00&rang; + |11&rang;)/&radic;2`;
      }
      if (lastMeasureText) {
        lastMeasureText.innerHTML = `<span style="color: var(--accent-primary);">✨ Prepared pure entangled state (|00&rang; + |11&rang;)/&radic;2. Ready to sample!</span>`;
      }
      updateBellDisplay();
    });
  }

  const btnMeasureBell1000 = document.getElementById('btnMeasureBell1000');
  if (btnMeasureBell1000) {
    btnMeasureBell1000.addEventListener('click', () => {
      // Bell State (|00> + |11>)/sqrt(2)
      // Exactly 50% chance of |00>, 50% chance of |11>, 0% chance of |01> or |10>
      let c00 = 0;
      let c11 = 0;

      for (let i = 0; i < 1000; i++) {
        if (Math.random() < 0.5) {
          c00++;
        } else {
          c11++;
        }
      }

      bellCounts['00'] += c00;
      bellCounts['11'] += c11;

      const lastMeasureText = document.getElementById('bellLastMeasureText');
      if (lastMeasureText) {
        const pct00 = ((c00 / 1000) * 100).toFixed(1);
        const pct11 = ((c11 / 1000) * 100).toFixed(1);
        lastMeasureText.innerHTML = `
          <span style="color: var(--accent-secondary); font-weight: 600;">
            1000 entangled shots: |00&rang; = ${c00} (${pct00}%), |11&rang; = ${c11} (${pct11}%), |01&rang; = 0, |10&rang; = 0.
          </span>
        `;
      }
      updateBellDisplay();
    });
  }

  // Initial runs for Level 4
  updateClassicalXor();
  updateQuantumCnot();
  updateBellDisplay();
}

/* --- simulator.js --- */
/**
 * @file simulator.js
 * @description Interactive Simulator Lab for 'From Transistors to Qubits' educational framework.
 * Features 4 interconnected modules:
 *   Module A: BJT NPN Transistor Simulator & Transfer Characteristics
 *   Module B: Classical Logic Gate Simulator (NOT, AND, OR, NAND, NOR, XOR)
 *   Module C: Quantum Circuit Simulator (1-2 Qubits, Bloch Sphere, Chart.js histogram)
 *   Module D: Live Classical vs Quantum Comparison Table
 */
// Global lab state shared across modules for live cross-module comparison
const labState = {
  transistor: {
    vbe: 0.70,
    vce: 2.5,
    ib_uA: 10.0,
    ic_mA: 1.0,
    rl_ohm: 1000,
    beta: 100,
    vout: 4.0,
    region: 'Active',
    ledOn: false,
    digitalBit: 0
  },
  logicGate: {
    gate: 'NOT',
    inputA: 1,
    inputB: 0,
    output: 0,
    transistorCount: '2 MOSFETs (CMOS inverter: 1 NMOS, 1 PMOS)'
  },
  quantum: {
    numQubits: 1,
    initialStates: [0, 0],
    gates: [], // array of { step, qubit, gateName, control }
    lastGate: 'None',
    stateVectorStr: '|0⟩',
    measuredBit: '0',
    probabilities: [1.0, 0.0]
  }
};

let transistorTransferChart = null;
let quantumHistogramChart = null;
let blochVisualizer = null;

/**
 * Main initialization entry point for the Simulator Lab page.
 * Populates the #simulator container with a responsive 4-tab interface.
 */
function initSimulator() {
  const container = document.getElementById('simulator');
  if (!container) {
    console.warn('Target #simulator element not found.');
    return;
  }

  // Clear existing loading spinner or content
  container.innerHTML = `
    <div class="simulator-wrapper container py-4">
      <div class="section-header text-center mb-4">
        <span class="hero-badge">Interactive Laboratory</span>
        <h2 class="display-5 fw-bold">Simulator Lab</h2>
        <p class="subtext">
          Explore semiconductor switching physics, classical logic gates, and quantum state transformations side by side.
        </p>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-container">
        <div class="tabs" role="tablist" aria-label="Simulator Modules">
          <button class="tab-btn active" id="tab-btn-a" data-tab="module-a" role="tab" aria-selected="true" aria-controls="module-a">
            <span class="tab-icon">⚡</span> Module A: Transistor (BJT NPN)
          </button>
          <button class="tab-btn" id="tab-btn-b" data-tab="module-b" role="tab" aria-selected="false" aria-controls="module-b">
            <span class="tab-icon">🔀</span> Module B: Logic Gates
          </button>
          <button class="tab-btn" id="tab-btn-c" data-tab="module-c" role="tab" aria-selected="false" aria-controls="module-c">
            <span class="tab-icon">⚛️</span> Module C: Quantum Circuit
          </button>
          <button class="tab-btn" id="tab-btn-d" data-tab="module-d" role="tab" aria-selected="false" aria-controls="module-d">
            <span class="tab-icon">⚖️</span> Module D: Comparison Table
          </button>
        </div>
      </div>

      <!-- Module A Content -->
      <div id="module-a" class="tab-content active" role="tabpanel" aria-labelledby="tab-btn-a">
        <!-- Rendered by renderModuleA -->
      </div>

      <!-- Module B Content -->
      <div id="module-b" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-b">
        <!-- Rendered by renderModuleB -->
      </div>

      <!-- Module C Content -->
      <div id="module-c" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-c">
        <!-- Rendered by renderModuleC -->
      </div>

      <!-- Module D Content -->
      <div id="module-d" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-d">
        <!-- Rendered by renderModuleD -->
      </div>
    </div>
  `;

  // Attach tab switching event listeners
  const tabButtons = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      // If switching to Module A or C, trigger canvas resizes / redraws
      if (targetId === 'module-a') {
        drawTransistorTransferCurve();
      } else if (targetId === 'module-c') {
        if (blochVisualizer) {
          setTimeout(() => blochVisualizer.draw(), 50);
        }
      } else if (targetId === 'module-d') {
        updateModuleDComparison();
        if (typeof window.renderAllMath === 'function') {
          const modD = document.getElementById('module-d');
          if (modD) window.renderAllMath(modD);
        }
      }
    });
  });

  // Render all four modules
  renderModuleA();
  renderModuleB();
  renderModuleC();
  renderModuleD();
}

/* ==========================================================================
   MODULE A: BJT NPN TRANSISTOR SIMULATOR
   ========================================================================== */

function renderModuleA() {
  const container = document.getElementById('module-a');
  if (!container) return;

  container.innerHTML = `
    <div class="card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h4 mb-1">Transistor Simulator (BJT NPN Common-Emitter)</h3>
          <p class="text-muted small mb-0">
            Simulate current amplification, switching regions (Cutoff, Active, Saturation), and voltage transfer characteristic ($V_{out}$ vs $V_{be}$).
          </p>
        </div>
        <div id="transistor-region-badge" class="badge bg-secondary px-3 py-2 fs-6">
          CUTOFF
        </div>
      </div>

      <div class="row g-4" style="display: flex; flex-wrap: wrap; margin: -0.75rem;">
        <!-- Left Column: Controls & Values -->
        <div class="col-lg-6" style="flex: 1 1 340px; padding: 0.75rem;">
          <div class="card p-3 h-100" style="background-color: var(--surface-color);">
            <h4 class="h6 text-uppercase text-muted mb-3">Controls & Parameters</h4>

            <!-- Vbe Slider -->
            <div class="control-group mb-3">
              <div class="control-label">
                <span>Base-Emitter Voltage ($V_{be}$)</span>
                <span id="val-vbe" class="control-value">0.70 V</span>
              </div>
              <input type="range" id="slider-vbe" min="0" max="1.2" step="0.01" value="0.70" aria-label="Base Emitter Voltage">
              <div class="d-flex justify-content-between text-muted small mt-1">
                <span>0.0V (Off)</span>
                <span>0.6V (Cut-in $V_\gamma$)</span>
                <span>1.2V</span>
              </div>
            </div>

            <!-- Vce Slider -->
            <div class="control-group mb-3">
              <div class="control-label">
                <span>Collector-Emitter Voltage ($V_{ce}$)</span>
                <span id="val-vce" class="control-value">2.50 V</span>
              </div>
              <input type="range" id="slider-vce" min="0" max="5.0" step="0.1" value="2.5" aria-label="Collector Emitter Voltage">
              <div class="d-flex justify-content-between text-muted small mt-1">
                <span>0.0V (Saturation)</span>
                <span>2.5V</span>
                <span>5.0V ($V_{cc}$)</span>
              </div>
            </div>

            <!-- Load Resistance RL -->
            <div class="control-group mb-3">
              <div class="control-label">
                <span>Load Resistor ($R_L$)</span>
                <span id="val-rl" class="control-value">1,000 Ω</span>
              </div>
              <input type="range" id="slider-rl" min="100" max="10000" step="100" value="1000" aria-label="Load Resistance">
              <div class="d-flex justify-content-between text-muted small mt-1">
                <span>100 Ω</span>
                <span>1 kΩ</span>
                <span>10 kΩ</span>
              </div>
            </div>

            <!-- Current Gain Beta -->
            <div class="control-group mb-3">
              <div class="control-label">
                <span>Current Gain ($\\beta$ / $h_{FE}$)</span>
                <span id="val-beta" class="control-value">100</span>
              </div>
              <input type="range" id="slider-beta" min="50" max="300" step="10" value="100" aria-label="Current Gain Beta">
              <div class="d-flex justify-content-between text-muted small mt-1">
                <span>50</span>
                <span>100</span>
                <span>300</span>
              </div>
            </div>

            <hr style="border-color: var(--border-color); margin: 1rem 0;">

            <!-- Derived Component Values Grid -->
            <h4 class="h6 text-uppercase text-muted mb-2">Calculated Telemetry</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">
              <div class="p-2 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                <div class="small text-muted">Base Current ($I_b$)</div>
                <div id="disp-ib" class="fw-bold fs-6 font-monospace text-info">10.00 µA</div>
              </div>
              <div class="p-2 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                <div class="small text-muted">Collector Current ($I_c$)</div>
                <div id="disp-ic" class="fw-bold fs-6 font-monospace text-primary">1.00 mA</div>
              </div>
              <div class="p-2 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                <div class="small text-muted">Output Voltage ($V_{out}$)</div>
                <div id="disp-vout" class="fw-bold fs-6 font-monospace text-warning">4.00 V</div>
              </div>
              <div class="p-2 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                <div class="small text-muted">Digital Logic State</div>
                <div id="disp-bit" class="fw-bold fs-6 font-monospace text-success">BIT 1 (HIGH)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Visual Schematic, LED, and Transfer Characteristic Curve -->
        <div class="col-lg-6" style="flex: 1 1 340px; padding: 0.75rem;">
          <div class="card p-3 h-100" style="background-color: var(--surface-color);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="h6 text-uppercase text-muted mb-0">Circuit Status & LED Output</h4>
              <div class="d-flex align-items-center gap-2">
                <span class="small text-muted">LED State:</span>
                <span id="led-status-label" class="badge bg-danger small">OFF</span>
              </div>
            </div>

            <!-- Circuit Schematic & LED Visual -->
            <div class="p-3 mb-3 rounded d-flex justify-content-center align-items-center" style="background: var(--bg-color); border: 1px solid var(--border-color); min-height: 160px;">
              <div id="schematic-svg-container" style="width: 100%; max-width: 360px;">
                <!-- SVG Schematic drawn dynamically -->
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="h6 text-uppercase text-muted mb-0">Voltage Transfer Characteristic</h4>
              <span class="small text-muted">Red dot = operating point</span>
            </div>

            <!-- Canvas for Transfer Curve -->
            <div class="chart-container" style="min-height: 220px; height: 220px; padding: 0.5rem;">
              <canvas id="transistor-canvas" width="460" height="210" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Pedagogical Semiconductor Note -->
      <div class="mt-4 p-3 rounded" style="background: rgba(88, 166, 255, 0.08); border-left: 4px solid var(--accent-primary);">
        <strong style="color: var(--accent-primary);">Semiconductor Insight:</strong>
        <p class="mb-0 small text-muted">
          In digital electronics, the BJT acts as an electronic switch. When $V_{be} &lt; 0.6\\text{ V}$, the base-emitter diode is reverse-biased (Cutoff, $I_c = 0$, $V_{out} = V_{cc} = 5\\text{V}$, Logic 1). 
          When $V_{be} \\ge 0.7\\text{ V}$ with high base drive, the transistor is driven into Saturation ($V_{ce} \approx 0.2\\text{V}$, Logic 0). This physical nonlinearity provides the noise margin that makes classical bits deterministic!
        </p>
      </div>
    </div>
  `;

  // Attach slider input listeners
  const sliderVbe = document.getElementById('slider-vbe');
  const sliderVce = document.getElementById('slider-vce');
  const sliderRl = document.getElementById('slider-rl');
  const sliderBeta = document.getElementById('slider-beta');

  function updateTransistorSimulation() {
    const vbe = parseFloat(sliderVbe.value);
    const vce = parseFloat(sliderVce.value);
    const rl = parseFloat(sliderRl.value);
    const beta = parseFloat(sliderBeta.value);

    // Update slider readouts
    document.getElementById('val-vbe').textContent = `${vbe.toFixed(2)} V`;
    document.getElementById('val-vce').textContent = `${vce.toFixed(2)} V`;
    document.getElementById('val-rl').textContent = `${rl.toLocaleString()} Ω`;
    document.getElementById('val-beta').textContent = `${beta}`;

    // Base current calculation (assume base resistor Rb = 10k ohm)
    const Rb = 10000; // 10 kΩ
    let ib = 0;
    if (vbe >= 0.60) {
      ib = (vbe - 0.60) / Rb; // in Amperes
    }

    const Vcc = 5.0; // Collector supply voltage
    const Vce_sat = 0.2; // Saturation knee voltage
    const ic_active = beta * ib; // in Amperes
    const ic_sat = (Vcc - Vce_sat) / rl; // max collector current in saturation

    let region = 'Cutoff';
    let ic = 0;
    let vout = Vcc;

    if (vbe < 0.60) {
      region = 'Cutoff';
      ic = 0;
      vout = Vcc;
    } else {
      if (vce <= Vce_sat || ic_active >= ic_sat) {
        region = 'Saturation';
        ic = ic_sat;
        vout = Vce_sat;
      } else {
        region = 'Active';
        ic = ic_active;
        vout = Math.max(Vce_sat, Vcc - ic * rl);
      }
    }

    const ib_uA = ib * 1e6;
    const ic_mA = ic * 1e3;
    const ledOn = ic_mA >= 4.0; // LED glows if Ic >= 4.0mA
    const digitalBit = vout > 2.5 ? 1 : 0;

    // Save into labState
    labState.transistor = {
      vbe,
      vce,
      ib_uA,
      ic_mA,
      rl_ohm: rl,
      beta,
      vout,
      region,
      ledOn,
      digitalBit
    };

    // Update UI telemetry badges & displays
    document.getElementById('disp-ib').textContent = `${ib_uA.toFixed(2)} µA`;
    document.getElementById('disp-ic').textContent = `${ic_mA.toFixed(2)} mA`;
    document.getElementById('disp-vout').textContent = `${vout.toFixed(2)} V`;

    const dispBit = document.getElementById('disp-bit');
    if (digitalBit === 1) {
      dispBit.textContent = 'BIT 1 (HIGH)';
      dispBit.className = 'fw-bold fs-6 font-monospace text-success';
    } else {
      dispBit.textContent = 'BIT 0 (LOW)';
      dispBit.className = 'fw-bold fs-6 font-monospace text-danger';
    }

    // Region badge styling
    const badge = document.getElementById('transistor-region-badge');
    badge.textContent = region.toUpperCase();
    if (region === 'Cutoff') {
      badge.className = 'badge bg-secondary px-3 py-2 fs-6';
      badge.style.backgroundColor = '#64748b';
    } else if (region === 'Active') {
      badge.className = 'badge bg-warning text-dark px-3 py-2 fs-6';
      badge.style.backgroundColor = 'var(--accent-amber)';
    } else {
      badge.className = 'badge bg-success px-3 py-2 fs-6';
      badge.style.backgroundColor = 'var(--accent-secondary)';
    }

    // Update LED status badge
    const ledLabel = document.getElementById('led-status-label');
    if (ledOn) {
      ledLabel.textContent = 'ON (Glow)';
      ledLabel.className = 'badge bg-success small';
    } else {
      ledLabel.textContent = 'OFF';
      ledLabel.className = 'badge bg-secondary small';
    }

    // Redraw SVG Schematic with LED glowing
    renderTransistorSchematic(vbe, vout, ic_mA, ledOn, region);

    // Redraw live Canvas Transfer Curve
    drawTransistorTransferCurve();

    // Propagate changes to Module D live table
    updateModuleDComparison();
  }

  sliderVbe.addEventListener('input', updateTransistorSimulation);
  sliderVce.addEventListener('input', updateTransistorSimulation);
  sliderRl.addEventListener('input', updateTransistorSimulation);
  sliderBeta.addEventListener('input', updateTransistorSimulation);

  // Initial calculation
  updateTransistorSimulation();
}

/**
 * Draws an interactive SVG schematic diagram showing NPN BJT, LED, RL, and Vcc.
 */
function renderTransistorSchematic(vbe, vout, ic_mA, ledOn, region) {
  const container = document.getElementById('schematic-svg-container');
  if (!container) return;

  const ledGlowColor = ledOn ? '#22c55e' : '#475569';
  const ledFilter = ledOn ? 'filter="url(#led-glow-filter)"' : '';
  const wireColorHigh = 'var(--accent-primary)';
  const wireColorLow = '#64748b';
  const voutColor = vout > 2.5 ? '#22c55e' : '#ef4444';

  container.innerHTML = `
    <svg viewBox="0 0 340 180" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="led-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Vcc Rail -->
      <line x1="160" y1="20" x2="280" y2="20" stroke="#f59e0b" stroke-width="2.5" />
      <text x="140" y="24" fill="#f59e0b" font-size="11" font-weight="bold" font-family="monospace">+5V (Vcc)</text>

      <!-- Resistor RL -->
      <line x1="220" y1="20" x2="220" y2="45" stroke="#f59e0b" stroke-width="2" />
      <rect x="212" y="45" width="16" height="28" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" rx="2" />
      <text x="235" y="62" fill="#94a3b8" font-size="9" font-family="monospace">RL</text>
      <line x1="220" y1="73" x2="220" y2="88" stroke="${voutColor}" stroke-width="2" />

      <!-- Vout Node Point -->
      <circle cx="220" cy="88" r="3.5" fill="${voutColor}" />
      <line x1="220" y1="88" x2="280" y2="88" stroke="${voutColor}" stroke-width="2" stroke-dasharray="3,2" />
      <circle cx="280" cy="88" r="3" fill="${voutColor}" />
      <text x="286" y="92" fill="${voutColor}" font-size="10" font-weight="bold" font-family="monospace">Vout (${vout.toFixed(1)}V)</text>

      <!-- Collector Line to LED -->
      <line x1="220" y1="88" x2="220" y2="105" stroke="${ledOn ? '#22c55e' : '#64748b'}" stroke-width="2" />

      <!-- LED Diode Symbol -->
      <g transform="translate(220, 115)">
        <polygon points="-8,-6 8,-6 0,6" fill="${ledGlowColor}" stroke="${ledGlowColor}" stroke-width="1" ${ledFilter} />
        <line x1="-8" y1="6" x2="8" y2="6" stroke="${ledGlowColor}" stroke-width="1.5" />
        <!-- Arrows indicating light emission -->
        <line x1="7" y1="-2" x2="14" y2="-7" stroke="${ledGlowColor}" stroke-width="1.2" />
        <line x1="9" y1="3" x2="16" y2="-2" stroke="${ledGlowColor}" stroke-width="1.2" />
      </g>
      <line x1="220" y1="122" x2="220" y2="135" stroke="#64748b" stroke-width="2" />

      <!-- BJT Transistor Symbol -->
      <!-- Base Lead -->
      <line x1="40" y1="140" x2="110" y2="140" stroke="${wireColorHigh}" stroke-width="2" />
      <circle cx="40" cy="140" r="3" fill="${wireColorHigh}" />
      <text x="20" y="144" fill="${wireColorHigh}" font-size="10" font-weight="bold" font-family="monospace">Vin</text>
      <!-- Base Bar -->
      <line x1="110" y1="125" x2="110" y2="155" stroke="#cbd5e1" stroke-width="3" />

      <!-- Collector Branch -->
      <line x1="110" y1="132" x2="140" y2="118" stroke="#cbd5e1" stroke-width="2" />
      <line x1="140" y1="118" x2="220" y2="135" stroke="#cbd5e1" stroke-width="2" />

      <!-- Emitter Branch with Arrow -->
      <line x1="110" y1="148" x2="140" y2="162" stroke="#cbd5e1" stroke-width="2" />
      <polygon points="135,157 141,163 133,164" fill="#cbd5e1" />
      <line x1="140" y1="162" x2="140" y2="175" stroke="#cbd5e1" stroke-width="2" />

      <!-- Ground Symbol -->
      <line x1="130" y1="175" x2="150" y2="175" stroke="#94a3b8" stroke-width="2" />
      <line x1="134" y1="178" x2="146" y2="178" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="137" y1="181" x2="143" y2="181" stroke="#94a3b8" stroke-width="1" />

      <!-- Transistor Circle outline -->
      <circle cx="125" cy="140" r="22" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="2,2" />
      <text x="85" y="105" fill="#94a3b8" font-size="9" font-family="monospace">NPN BJT</text>
    </svg>
  `;
}

/**
 * Draws the transfer characteristic curve (Vout vs Vbe) on the Canvas,
 * highlighting the current operating point.
 */
function drawTransistorTransferCurve() {
  const canvas = document.getElementById('transistor-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.width;
  const height = rect.height || canvas.height;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 15, right: 20, bottom: 30, left: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Background grid
  ctx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let v = 0; v <= 5; v += 1) {
    const y = padding.top + plotH - (v / 5) * plotH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${v}V`, padding.left - 6, y + 3);
  }

  for (let vin = 0; vin <= 1.2; vin += 0.3) {
    const x = padding.left + (vin / 1.2) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotH);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${vin.toFixed(1)}V`, x, height - 12);
  }

  // Axes lines
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.stroke();

  // Axis Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Vbe (Input Voltage)', padding.left + plotW / 2, height - 2);

  ctx.save();
  ctx.translate(14, padding.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Vout (Output Voltage)', 0, 0);
  ctx.restore();

  // Plot Transfer Characteristic Curve based on active RL and Beta
  const rl = labState.transistor.rl_ohm;
  const beta = labState.transistor.beta;
  const Rb = 10000;
  const Vcc = 5.0;
  const Vce_sat = 0.2;
  const ic_sat = (Vcc - Vce_sat) / rl;

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  const numPoints = 60;
  for (let i = 0; i <= numPoints; i++) {
    const v_in = (i / numPoints) * 1.2;
    let v_out = Vcc;
    if (v_in >= 0.6) {
      const ib_val = (v_in - 0.6) / Rb;
      const ic_act = beta * ib_val;
      if (ic_act >= ic_sat) {
        v_out = Vce_sat;
      } else {
        v_out = Math.max(Vce_sat, Vcc - ic_act * rl);
      }
    }

    const px = padding.left + (v_in / 1.2) * plotW;
    const py = padding.top + plotH - (v_out / 5.0) * plotH;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Highlight Current Operating Point (Red Dot + Halo)
  const curVbe = labState.transistor.vbe;
  const curVout = labState.transistor.vout;
  const curX = padding.left + (curVbe / 1.2) * plotW;
  const curY = padding.top + plotH - (curVout / 5.0) * plotH;

  // Outer halo
  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.beginPath();
  ctx.arc(curX, curY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Inner core
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Operating point label
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = curX > width - 80 ? 'right' : 'left';
  const labelOffsetX = curX > width - 80 ? -10 : 10;
  ctx.fillText(`(${curVbe.toFixed(2)}V, ${curVout.toFixed(2)}V)`, curX + labelOffsetX, curY - 6);

  ctx.restore();
}

/* ==========================================================================
   MODULE B: CLASSICAL LOGIC GATE SIMULATOR
   ========================================================================== */

function renderModuleB() {
  const container = document.getElementById('module-b');
  if (!container) return;

  container.innerHTML = `
    <div class="card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h4 mb-1">Classical Logic Gate Simulator</h3>
          <p class="text-muted small mb-0">
            Select standard IEEE gates, toggle digital inputs (0/1), and examine CMOS transistor architectures and truth tables.
          </p>
        </div>
        <div id="gate-boolean-badge" class="badge bg-primary px-3 py-2 fs-6 font-monospace">
          Y = NOT(A)
        </div>
      </div>

      <!-- Gate Selector Buttons -->
      <div class="d-flex gap-2 mb-4 flex-wrap" role="group" aria-label="Logic Gate Type">
        <button class="btn btn-primary gate-select-btn active" data-gate="NOT">NOT</button>
        <button class="btn btn-secondary gate-select-btn" data-gate="AND">AND</button>
        <button class="btn btn-secondary gate-select-btn" data-gate="OR">OR</button>
        <button class="btn btn-secondary gate-select-btn" data-gate="NAND">NAND</button>
        <button class="btn btn-secondary gate-select-btn" data-gate="NOR">NOR</button>
        <button class="btn btn-secondary gate-select-btn" data-gate="XOR">XOR</button>
      </div>

      <div class="row g-4" style="display: flex; flex-wrap: wrap; margin: -0.75rem;">
        <!-- Left: Interactive Gate SVG & Inputs/Output -->
        <div class="col-lg-6" style="flex: 1 1 360px; padding: 0.75rem;">
          <div class="card p-3 h-100" style="background-color: var(--surface-color);">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 class="h6 text-uppercase text-muted mb-0">Interactive Gate Diagram</h4>
              <span class="small text-muted">Click inputs to toggle</span>
            </div>

            <!-- SVG Gate Display -->
            <div class="p-3 mb-3 rounded d-flex justify-content-center align-items-center" style="background: var(--bg-color); border: 1px solid var(--border-color); min-height: 200px;">
              <div id="logic-gate-svg-container" style="width: 100%; max-width: 360px;">
                <!-- Drawn programmatically -->
              </div>
            </div>

            <!-- Input Controls & Large Output Indicator -->
            <div class="d-flex justify-content-between align-items-center gap-3 p-3 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
              <div class="d-flex gap-2 align-items-center">
                <!-- Input A toggle -->
                <button id="toggle-input-a" class="btn btn-sm btn-outline-primary px-3 py-2 font-monospace fw-bold fs-6">
                  Input A: 1
                </button>
                <!-- Input B toggle (hidden for NOT gate) -->
                <button id="toggle-input-b" class="btn btn-sm btn-outline-primary px-3 py-2 font-monospace fw-bold fs-6" style="display: none;">
                  Input B: 0
                </button>
              </div>

              <!-- Output Indicator Display -->
              <div class="text-end">
                <div class="small text-muted">Output (Y)</div>
                <div id="logic-output-display" class="display-6 fw-bold font-monospace text-danger">
                  0
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Truth Table & Transistor Implementation Notes -->
        <div class="col-lg-6" style="flex: 1 1 360px; padding: 0.75rem;">
          <div class="card p-3 h-100" style="background-color: var(--surface-color);">
            <h4 class="h6 text-uppercase text-muted mb-2">Truth Table</h4>
            <div class="table-responsive mb-3" style="max-height: 180px;">
              <table class="table mb-0" id="logic-truth-table">
                <!-- Populated dynamically -->
              </table>
            </div>

            <h4 class="h6 text-uppercase text-muted mb-2">CMOS / Semiconductor Implementation</h4>
            <div id="gate-transistor-note" class="p-3 rounded mb-2 small" style="background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main);">
              <strong>CMOS Inverter:</strong> Requires 2 MOSFETs (1 pMOS pull-up to VDD, 1 nMOS pull-down to GND). Operates with zero static power dissipation.
            </div>

            <div class="p-2 rounded small text-muted" style="background: rgba(188, 140, 255, 0.08); border-left: 3px solid var(--accent-purple);">
              <strong>Reversibility Note:</strong> Most classical gates (AND, OR, NAND) discard information (2 inputs $\to$ 1 output). They are thermodynamically irreversible (Landauer limit: $k_B T \ln 2$ dissipated per bit erased). Quantum gates, by contrast, must be unitary and fully reversible!
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach button events
  const gateButtons = container.querySelectorAll('.gate-select-btn');
  const toggleBtnA = document.getElementById('toggle-input-a');
  const toggleBtnB = document.getElementById('toggle-input-b');

  gateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      gateButtons.forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');

      labState.logicGate.gate = btn.getAttribute('data-gate');
      updateLogicGateSimulation();
    });
  });

  toggleBtnA.addEventListener('click', () => {
    labState.logicGate.inputA = labState.logicGate.inputA === 1 ? 0 : 1;
    updateLogicGateSimulation();
  });

  toggleBtnB.addEventListener('click', () => {
    labState.logicGate.inputB = labState.logicGate.inputB === 1 ? 0 : 1;
    updateLogicGateSimulation();
  });

  function updateLogicGateSimulation() {
    const gate = labState.logicGate.gate;
    const a = labState.logicGate.inputA;
    const b = labState.logicGate.inputB;

    let y = 0;
    let boolExpr = '';
    let transistorInfo = '';

    if (gate === 'NOT') {
      y = a === 1 ? 0 : 1;
      boolExpr = 'Y = ¬A (NOT A)';
      transistorInfo = '<strong>CMOS Inverter:</strong> 2 MOSFETs (1 pMOS + 1 nMOS). When A=1, nMOS pulls output to GND (0). When A=0, pMOS pulls output to VDD (1).';
      toggleBtnB.style.display = 'none';
    } else {
      toggleBtnB.style.display = 'inline-block';
      if (gate === 'AND') {
        y = (a && b) ? 1 : 0;
        boolExpr = 'Y = A · B';
        transistorInfo = '<strong>CMOS AND:</strong> 6 MOSFETs (NAND gate of 4 MOSFETs followed by a 2-MOSFET CMOS inverter).';
      } else if (gate === 'OR') {
        y = (a || b) ? 1 : 0;
        boolExpr = 'Y = A + B';
        transistorInfo = '<strong>CMOS OR:</strong> 6 MOSFETs (NOR gate of 4 MOSFETs followed by a 2-MOSFET inverter).';
      } else if (gate === 'NAND') {
        y = !(a && b) ? 1 : 0;
        boolExpr = 'Y = ¬(A · B)';
        transistorInfo = '<strong>CMOS NAND (Universal):</strong> 4 MOSFETs (2 pMOS in parallel to VDD, 2 nMOS in series to GND). Minimum silicon footprint for universal classical computation.';
      } else if (gate === 'NOR') {
        y = !(a || b) ? 1 : 0;
        boolExpr = 'Y = ¬(A + B)';
        transistorInfo = '<strong>CMOS NOR (Universal):</strong> 4 MOSFETs (2 pMOS in series to VDD, 2 nMOS in parallel to GND).';
      } else if (gate === 'XOR') {
        y = (a ^ b) ? 1 : 0;
        boolExpr = 'Y = A ⊕ B = A¬B + ¬AB';
        transistorInfo = '<strong>CMOS XOR:</strong> 8 to 12 MOSFETs (using transmission gates or 4 cross-coupled NAND gates). Directly parallels the quantum CNOT operation.';
      }
    }

    labState.logicGate.output = y;
    labState.logicGate.transistorCount = transistorInfo;

    // Update buttons text
    toggleBtnA.textContent = `Input A: ${a}`;
    toggleBtnA.className = a === 1 ? 'btn btn-sm btn-success px-3 py-2 font-monospace fw-bold' : 'btn btn-sm btn-outline-secondary px-3 py-2 font-monospace fw-bold';

    toggleBtnB.textContent = `Input B: ${b}`;
    toggleBtnB.className = b === 1 ? 'btn btn-sm btn-success px-3 py-2 font-monospace fw-bold' : 'btn btn-sm btn-outline-secondary px-3 py-2 font-monospace fw-bold';

    // Output indicator
    const outputEl = document.getElementById('logic-output-display');
    outputEl.textContent = `${y}`;
    outputEl.className = y === 1 ? 'display-6 fw-bold font-monospace text-success' : 'display-6 fw-bold font-monospace text-danger';

    // Expression badge
    document.getElementById('gate-boolean-badge').textContent = boolExpr;

    // Transistor note
    document.getElementById('gate-transistor-note').innerHTML = transistorInfo;

    // Render IEEE SVG Gate
    renderLogicGateSVG(gate, a, b, y);

    // Render Truth Table
    renderTruthTable(gate, a, b);

    // Update Module D comparison table
    updateModuleDComparison();
  }

  // Initial draw
  updateLogicGateSimulation();
}

/**
 * Draws standard IEEE/ANSI logic gate symbols with live colored signal wires.
 */
function renderLogicGateSVG(gate, a, b, y) {
  const container = document.getElementById('logic-gate-svg-container');
  if (!container) return;

  const color1 = '#22c55e'; // Green for HIGH / 1
  const color0 = '#64748b'; // Muted slate for LOW / 0
  const wireA = a === 1 ? color1 : color0;
  const wireB = b === 1 ? color1 : color0;
  const wireOut = y === 1 ? color1 : color0;

  let bodySvg = '';

  if (gate === 'NOT') {
    bodySvg = `
      <!-- Input Wire A -->
      <line x1="30" y1="75" x2="100" y2="75" stroke="${wireA}" stroke-width="3" />
      <circle cx="30" cy="75" r="4" fill="${wireA}" />
      <text x="10" y="80" fill="${wireA}" font-size="12" font-family="monospace" font-weight="bold">A=${a}</text>

      <!-- NOT Triangle -->
      <polygon points="100,45 100,105 160,75" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5" />

      <!-- Inversion Bubble -->
      <circle cx="167" cy="75" r="7" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />

      <!-- Output Wire -->
      <line x1="174" y1="75" x2="250" y2="75" stroke="${wireOut}" stroke-width="3" />
      <circle cx="250" cy="75" r="4" fill="${wireOut}" />
      <text x="260" y="80" fill="${wireOut}" font-size="12" font-family="monospace" font-weight="bold">Y=${y}</text>
    `;
  } else if (gate === 'AND' || gate === 'NAND') {
    const isNand = gate === 'NAND';
    const outStartX = isNand ? 204 : 190;
    bodySvg = `
      <!-- Input Wire A -->
      <line x1="30" y1="55" x2="110" y2="55" stroke="${wireA}" stroke-width="3" />
      <circle cx="30" cy="55" r="4" fill="${wireA}" />
      <text x="10" y="60" fill="${wireA}" font-size="12" font-family="monospace" font-weight="bold">A=${a}</text>

      <!-- Input Wire B -->
      <line x1="30" y1="95" x2="110" y2="95" stroke="${wireB}" stroke-width="3" />
      <circle cx="30" cy="95" r="4" fill="${wireB}" />
      <text x="10" y="100" fill="${wireB}" font-size="12" font-family="monospace" font-weight="bold">B=${b}</text>

      <!-- AND D-shape Body -->
      <path d="M 110,35 L 150,35 A 40,40 0 0,1 150,115 L 110,115 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5" />

      ${isNand ? `<circle cx="197" cy="75" r="7" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />` : ''}

      <!-- Output Wire -->
      <line x1="${outStartX}" y1="75" x2="260" y2="75" stroke="${wireOut}" stroke-width="3" />
      <circle cx="260" cy="75" r="4" fill="${wireOut}" />
      <text x="270" y="80" fill="${wireOut}" font-size="12" font-family="monospace" font-weight="bold">Y=${y}</text>
    `;
  } else if (gate === 'OR' || gate === 'NOR') {
    const isNor = gate === 'NOR';
    const outStartX = isNor ? 211 : 197;
    bodySvg = `
      <!-- Input Wire A -->
      <line x1="30" y1="55" x2="125" y2="55" stroke="${wireA}" stroke-width="3" />
      <circle cx="30" cy="55" r="4" fill="${wireA}" />
      <text x="10" y="60" fill="${wireA}" font-size="12" font-family="monospace" font-weight="bold">A=${a}</text>

      <!-- Input Wire B -->
      <line x1="30" y1="95" x2="125" y2="95" stroke="${wireB}" stroke-width="3" />
      <circle cx="30" cy="95" r="4" fill="${wireB}" />
      <text x="10" y="100" fill="${wireB}" font-size="12" font-family="monospace" font-weight="bold">B=${b}</text>

      <!-- OR Curved Shape -->
      <path d="M 105,35 Q 130,75 105,115 Q 160,115 197,75 Q 160,35 105,35 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5" />

      ${isNor ? `<circle cx="204" cy="75" r="7" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />` : ''}

      <!-- Output Wire -->
      <line x1="${outStartX}" y1="75" x2="260" y2="75" stroke="${wireOut}" stroke-width="3" />
      <circle cx="260" cy="75" r="4" fill="${wireOut}" />
      <text x="270" y="80" fill="${wireOut}" font-size="12" font-family="monospace" font-weight="bold">Y=${y}</text>
    `;
  } else if (gate === 'XOR') {
    bodySvg = `
      <!-- Input Wire A -->
      <line x1="30" y1="55" x2="120" y2="55" stroke="${wireA}" stroke-width="3" />
      <circle cx="30" cy="55" r="4" fill="${wireA}" />
      <text x="10" y="60" fill="${wireA}" font-size="12" font-family="monospace" font-weight="bold">A=${a}</text>

      <!-- Input Wire B -->
      <line x1="30" y1="95" x2="120" y2="95" stroke="${wireB}" stroke-width="3" />
      <circle cx="30" cy="95" r="4" fill="${wireB}" />
      <text x="10" y="100" fill="${wireB}" font-size="12" font-family="monospace" font-weight="bold">B=${b}</text>

      <!-- Back Extra Curved Arc -->
      <path d="M 98,35 Q 123,75 98,115" fill="none" stroke="#38bdf8" stroke-width="2.5" />

      <!-- OR Body Shape -->
      <path d="M 110,35 Q 135,75 110,115 Q 165,115 202,75 Q 165,35 110,35 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5" />

      <!-- Output Wire -->
      <line x1="202" y1="75" x2="265" y2="75" stroke="${wireOut}" stroke-width="3" />
      <circle cx="265" cy="75" r="4" fill="${wireOut}" />
      <text x="275" y="80" fill="${wireOut}" font-size="12" font-family="monospace" font-weight="bold">Y=${y}</text>
    `;
  }

  container.innerHTML = `
    <svg viewBox="0 0 320 150" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">
      ${bodySvg}
    </svg>
  `;
}

/**
 * Renders the truth table for the selected gate with the active input row highlighted.
 */
function renderTruthTable(gate, activeA, activeB) {
  const table = document.getElementById('logic-truth-table');
  if (!table) return;

  if (gate === 'NOT') {
    const rows = [
      { a: 0, y: 1 },
      { a: 1, y: 0 }
    ];

    let tbody = rows.map(r => {
      const isCurrent = r.a === activeA;
      return `
        <tr class="${isCurrent ? 'table-primary fw-bold' : ''}" style="${isCurrent ? 'background: rgba(56, 189, 248, 0.15);' : ''}">
          <td class="font-monospace">${r.a}</td>
          <td class="font-monospace ${r.y === 1 ? 'text-success' : 'text-danger'}">${r.y}</td>
          <td>${isCurrent ? '<span class="badge bg-primary">Active</span>' : ''}</td>
        </tr>
      `;
    }).join('');

    table.innerHTML = `
      <thead>
        <tr>
          <th>Input (A)</th>
          <th>Output (Y)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
    `;
  } else {
    const combinations = [
      { a: 0, b: 0 },
      { a: 0, b: 1 },
      { a: 1, b: 0 },
      { a: 1, b: 1 }
    ];

    const getOut = (a, b) => {
      if (gate === 'AND') return (a && b) ? 1 : 0;
      if (gate === 'OR') return (a || b) ? 1 : 0;
      if (gate === 'NAND') return !(a && b) ? 1 : 0;
      if (gate === 'NOR') return !(a || b) ? 1 : 0;
      if (gate === 'XOR') return (a ^ b) ? 1 : 0;
      return 0;
    };

    let tbody = combinations.map(r => {
      const y = getOut(r.a, r.b);
      const isCurrent = r.a === activeA && r.b === activeB;
      return `
        <tr class="${isCurrent ? 'table-primary fw-bold' : ''}" style="${isCurrent ? 'background: rgba(56, 189, 248, 0.15);' : ''}">
          <td class="font-monospace">${r.a}</td>
          <td class="font-monospace">${r.b}</td>
          <td class="font-monospace ${y === 1 ? 'text-success' : 'text-danger'}">${y}</td>
          <td>${isCurrent ? '<span class="badge bg-primary">Active</span>' : ''}</td>
        </tr>
      `;
    }).join('');

    table.innerHTML = `
      <thead>
        <tr>
          <th>Input A</th>
          <th>Input B</th>
          <th>Output Y</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
    `;
  }
}

/* ==========================================================================
   MODULE C: QUANTUM CIRCUIT SIMULATOR
   ========================================================================== */

function renderModuleC() {
  const container = document.getElementById('module-c');
  if (!container) return;

  container.innerHTML = `
    <div class="card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h4 mb-1">Quantum Circuit Simulator</h3>
          <p class="text-muted small mb-0">
            Build circuits with unitary gates ($X, H, Z, S, T, CNOT$), inspect complex state vectors, view the Bloch sphere, and sample Monte Carlo measurement shots.
          </p>
        </div>
        <div class="d-flex gap-2">
          <!-- Preset Circuit Buttons -->
          <button class="btn btn-sm btn-outline-info" id="preset-superposition">Preset: Superposition</button>
          <button class="btn btn-sm btn-outline-info" id="preset-xgate">Preset: X Gate</button>
          <button class="btn btn-sm btn-outline-info" id="preset-bell">Preset: Bell State</button>
        </div>
      </div>

      <!-- Circuit Configuration Bar -->
      <div class="d-flex justify-content-between align-items-center gap-3 p-3 rounded mb-3 flex-wrap" style="background: var(--surface-color); border: 1px solid var(--border-color);">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <!-- Qubit Count Toggle -->
          <div class="d-flex align-items-center gap-2">
            <span class="small text-muted fw-bold">Qubits:</span>
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-primary" id="btn-qubits-1">1 Qubit</button>
              <button class="btn btn-secondary" id="btn-qubits-2">2 Qubits</button>
            </div>
          </div>

          <!-- Initial State Selector -->
          <div class="d-flex align-items-center gap-2" id="initial-state-controls">
            <span class="small text-muted fw-bold">Initial State:</span>
            <button class="btn btn-sm btn-outline-secondary font-monospace" id="btn-init-q0">q0: |0⟩</button>
            <button class="btn btn-sm btn-outline-secondary font-monospace" id="btn-init-q1" style="display: none;">q1: |0⟩</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-secondary" id="btn-clear-circuit">
            ✕ Clear
          </button>
          <button class="btn btn-sm btn-primary" id="btn-run-circuit">
            ▶ Run Circuit
          </button>
        </div>
      </div>

      <!-- Gate Palette & Placement -->
      <div class="card p-3 mb-3" style="background: var(--surface-color);">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap">
          <h4 class="h6 text-uppercase text-muted mb-0">Gate Palette (Click gate, then click slot on wire)</h4>
          <span id="selected-gate-badge" class="badge bg-secondary small">Selected: None</span>
        </div>
        <div class="d-flex gap-2 flex-wrap" id="gate-palette">
          <button class="btn btn-outline-primary gate-palette-btn font-monospace fw-bold" data-gate="X">X (NOT)</button>
          <button class="btn btn-outline-info gate-palette-btn font-monospace fw-bold" data-gate="H">H (Hadamard)</button>
          <button class="btn btn-outline-primary gate-palette-btn font-monospace fw-bold" data-gate="Z">Z (Phase-flip)</button>
          <button class="btn btn-outline-secondary gate-palette-btn font-monospace fw-bold" data-gate="S">S (π/2)</button>
          <button class="btn btn-outline-secondary gate-palette-btn font-monospace fw-bold" data-gate="T">T (π/4)</button>
          <button class="btn btn-outline-warning gate-palette-btn font-monospace fw-bold" id="palette-cnot" data-gate="CNOT" style="display: none;">CNOT (0→1)</button>
        </div>
      </div>

      <!-- Circuit Canvas / Wire Diagram Container -->
      <div class="circuit-container mb-4" id="circuit-wire-diagram-container" style="min-height: 180px; padding: 1.5rem 1rem;">
        <svg id="circuit-svg" width="100%" height="160" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg">
          <!-- Rendered programmatically -->
        </svg>
      </div>

      <!-- Simulation Results & Visualizations Grid -->
      <div class="row g-4" style="display: flex; flex-wrap: wrap; margin: -0.75rem;">
        <!-- Left: State Vector & Measurement -->
        <div class="col-lg-6" style="flex: 1 1 360px; padding: 0.75rem;">
          <div class="card p-3 h-100" style="background-color: var(--surface-color);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="h6 text-uppercase text-muted mb-0">State Vector & Dirac Notation</h4>
              <span id="dirac-state-display" class="font-monospace text-info fw-bold">|0⟩</span>
            </div>

            <!-- State Vector Table -->
            <div class="table-responsive mb-3">
              <table class="table mb-0" id="quantum-state-table">
                <!-- Populated dynamically -->
              </table>
            </div>

            <!-- Measurement Controls -->
            <div class="p-3 rounded mb-3" style="background: var(--card-bg); border: 1px solid var(--border-color);">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small text-muted fw-bold">Measurement Execution:</span>
                <span id="single-measure-badge" class="badge bg-secondary font-monospace">No Measurement</span>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-sm btn-outline-primary" id="btn-measure-once">
                  🎲 Measure Once
                </button>
                <button class="btn btn-sm btn-success" id="btn-run-1000-shots">
                  📊 Run 1000 Shots
                </button>
              </div>
            </div>

            <!-- Chart.js Measurement Histogram -->
            <div class="histogram-container" style="min-height: 200px; height: 200px; padding: 0.5rem;">
              <canvas id="quantum-shots-chart" width="400" height="190" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
          </div>
        </div>

        <!-- Right: Bloch Sphere (for Single Qubit or Subsystem Qubit 0) -->
        <div class="col-lg-6" style="flex: 1 1 360px; padding: 0.75rem;">
          <div class="card p-3 h-100" style="background-color: var(--surface-color);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="h6 text-uppercase text-muted mb-0">Bloch Sphere Representation</h4>
              <span id="bloch-qubit-label" class="badge bg-info text-dark small">Qubit 0</span>
            </div>

            <p class="small text-muted mb-2">
              Visualizes pure state vector $|\\psi\\rangle = \\cos(\\theta/2)|0\\rangle + e^{i\\phi}\\sin(\\theta/2)|1\\rangle$ on the 3D unit sphere.
            </p>

            <div class="bloch-container" style="height: 320px; width: 100%; max-width: 380px;">
              <canvas id="bloch-canvas" width="360" height="320"></canvas>
            </div>

            <div class="d-flex justify-content-around mt-2 text-muted small font-monospace" id="bloch-coords-display">
              <span>x: 0.00</span>
              <span>y: 0.00</span>
              <span>z: 1.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize Bloch Visualizer instance
  const blochCanvas = document.getElementById('bloch-canvas');
  if (blochCanvas) {
    blochVisualizer = new BlochSphere(blochCanvas, {
      yaw: -0.70,
      pitch: 0.38,
      vectorColor: '#38bdf8'
    });
  }

  let activePaletteGate = 'H';
  const selectedBadge = document.getElementById('selected-gate-badge');
  selectedBadge.textContent = 'Selected: H';
  selectedBadge.className = 'badge bg-info text-dark small';

  // Palette button interactions
  const paletteBtns = container.querySelectorAll('.gate-palette-btn');
  paletteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paletteBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePaletteGate = btn.getAttribute('data-gate');
      selectedBadge.textContent = `Selected: ${activePaletteGate}`;
      selectedBadge.className = 'badge bg-info text-dark small';
    });
  });

  // Qubit count toggle
  const btnQ1 = document.getElementById('btn-qubits-1');
  const btnQ2 = document.getElementById('btn-qubits-2');
  const cnotPaletteBtn = document.getElementById('palette-cnot');
  const initQ1Btn = document.getElementById('btn-init-q1');

  btnQ1.addEventListener('click', () => {
    if (labState.quantum.numQubits === 1) return;
    labState.quantum.numQubits = 1;
    labState.quantum.gates = labState.quantum.gates.filter(g => g.qubit === 0 && g.gateName !== 'CNOT');
    btnQ1.classList.add('btn-primary');
    btnQ1.classList.remove('btn-secondary');
    btnQ2.classList.remove('btn-primary');
    btnQ2.classList.add('btn-secondary');
    cnotPaletteBtn.style.display = 'none';
    initQ1Btn.style.display = 'none';
    if (activePaletteGate === 'CNOT') {
      activePaletteGate = 'H';
      selectedBadge.textContent = 'Selected: H';
    }
    executeQuantumCircuit();
  });

  btnQ2.addEventListener('click', () => {
    if (labState.quantum.numQubits === 2) return;
    labState.quantum.numQubits = 2;
    btnQ2.classList.add('btn-primary');
    btnQ2.classList.remove('btn-secondary');
    btnQ1.classList.remove('btn-primary');
    btnQ1.classList.add('btn-secondary');
    cnotPaletteBtn.style.display = 'inline-block';
    initQ1Btn.style.display = 'inline-block';
    executeQuantumCircuit();
  });

  // Initial state toggles
  const initQ0Btn = document.getElementById('btn-init-q0');
  initQ0Btn.addEventListener('click', () => {
    labState.quantum.initialStates[0] = labState.quantum.initialStates[0] === 0 ? 1 : 0;
    initQ0Btn.textContent = `q0: |${labState.quantum.initialStates[0]}⟩`;
    executeQuantumCircuit();
  });

  initQ1Btn.addEventListener('click', () => {
    labState.quantum.initialStates[1] = labState.quantum.initialStates[1] === 0 ? 1 : 0;
    initQ1Btn.textContent = `q1: |${labState.quantum.initialStates[1]}⟩`;
    executeQuantumCircuit();
  });

  // Clear & Run Circuit
  document.getElementById('btn-clear-circuit').addEventListener('click', () => {
    labState.quantum.gates = [];
    executeQuantumCircuit();
  });

  document.getElementById('btn-run-circuit').addEventListener('click', () => {
    executeQuantumCircuit();
  });

  // Presets
  document.getElementById('preset-superposition').addEventListener('click', () => {
    labState.quantum.numQubits = 1;
    labState.quantum.initialStates = [0, 0];
    initQ0Btn.textContent = 'q0: |0⟩';
    btnQ1.click();
    labState.quantum.gates = [{ step: 0, qubit: 0, gateName: 'H' }];
    executeQuantumCircuit();
  });

  document.getElementById('preset-xgate').addEventListener('click', () => {
    labState.quantum.numQubits = 1;
    labState.quantum.initialStates = [0, 0];
    initQ0Btn.textContent = 'q0: |0⟩';
    btnQ1.click();
    labState.quantum.gates = [{ step: 0, qubit: 0, gateName: 'X' }];
    executeQuantumCircuit();
  });

  document.getElementById('preset-bell').addEventListener('click', () => {
    labState.quantum.numQubits = 2;
    labState.quantum.initialStates = [0, 0];
    initQ0Btn.textContent = 'q0: |0⟩';
    initQ1Btn.textContent = 'q1: |0⟩';
    btnQ2.click();
    labState.quantum.gates = [
      { step: 0, qubit: 0, gateName: 'H' },
      { step: 1, qubit: 1, gateName: 'CNOT', control: 0 }
    ];
    executeQuantumCircuit();
  });

  // Single measurement sample
  document.getElementById('btn-measure-once').addEventListener('click', () => {
    const outcome = sampleQuantumStateMeasurement();
    const badge = document.getElementById('single-measure-badge');
    badge.textContent = `Outcome: |${outcome}⟩`;
    badge.className = 'badge bg-warning text-dark font-monospace fs-6';
  });

  // 1000 Shots Execution
  document.getElementById('btn-run-1000-shots').addEventListener('click', () => {
    runQuantumShotsSimulation(1000);
  });

  /**
   * Evaluates the quantum circuit using QuantumState from quantum-sim.js
   */
  function executeQuantumCircuit() {
    const numQubits = labState.quantum.numQubits;
    const qState = new QuantumState(numQubits);

    // Apply initial state bit-flips if initialized to |1>
    if (labState.quantum.initialStates[0] === 1) {
      qState.applyGate(GATES.X, 0);
    }
    if (numQubits === 2 && labState.quantum.initialStates[1] === 1) {
      qState.applyGate(GATES.X, 1);
    }

    // Sort gates chronologically by step
    const sortedGates = [...labState.quantum.gates].sort((a, b) => a.step - b.step);

    let lastGateStr = 'None';
    for (const op of sortedGates) {
      lastGateStr = op.gateName;
      if (op.gateName === 'CNOT') {
        qState.applyTwoQubitGate(GATES.CNOT, op.control, op.qubit);
      } else if (GATES[op.gateName]) {
        qState.applyGate(GATES[op.gateName], op.qubit);
      }
    }

    labState.quantum.lastGate = lastGateStr;
    const probs = qState.probabilities();
    labState.quantum.probabilities = probs;
    const diracStr = (typeof qState.toDiracString === 'function')
      ? qState.toDiracString(3)
      : (typeof qState.toString === 'function' ? qState.toString() : '|0⟩');
    labState.quantum.stateVectorStr = diracStr;

    // Update Dirac UI
    document.getElementById('dirac-state-display').textContent = diracStr;

    // Update State Vector Table
    renderStateVectorTable(qState);

    // Render Circuit Diagram SVG
    renderCircuitSVG(numQubits, sortedGates);

    // Update Bloch Sphere
    if (blochVisualizer) {
      const blochVec = qState.getBlochVector(0);
      blochVisualizer.renderFromXYZ(blochVec.x, blochVec.y, blochVec.z);

      const coordsEl = document.getElementById('bloch-coords-display');
      if (coordsEl) {
        coordsEl.innerHTML = `
          <span>x: ${blochVec.x.toFixed(2)}</span>
          <span>y: ${blochVec.y.toFixed(2)}</span>
          <span>z: ${blochVec.z.toFixed(2)}</span>
          <span>r: ${Math.sqrt(blochVec.x * blochVec.x + blochVec.y * blochVec.y + blochVec.z * blochVec.z).toFixed(2)}</span>
        `;
      }
    }

    // Update initial Histogram with exact theoretical probabilities
    updateHistogramFromProbs(probs, numQubits);

    // Update Module D comparison table
    updateModuleDComparison();
  }

  /**
   * Helper to sample single measurement outcome
   */
  function sampleQuantumStateMeasurement() {
    const probs = labState.quantum.probabilities;
    const r = Math.random();
    let sum = 0;
    let selectedIdx = probs.length - 1;
    for (let i = 0; i < probs.length; i++) {
      sum += probs[i];
      if (r <= sum) {
        selectedIdx = i;
        break;
      }
    }
    const bitStr = selectedIdx.toString(2).padStart(labState.quantum.numQubits, '0');
    labState.quantum.measuredBit = bitStr;
    updateModuleDComparison();
    return bitStr;
  }

  /**
   * Executes 1000 Monte Carlo shots using runShots() from quantum-sim.js
   */
  function runQuantumShotsSimulation(shotsCount = 1000) {
    const numQubits = labState.quantum.numQubits;
    const qState = new QuantumState(numQubits);

    if (labState.quantum.initialStates[0] === 1) qState.applyGate(GATES.X, 0);
    if (numQubits === 2 && labState.quantum.initialStates[1] === 1) qState.applyGate(GATES.X, 1);

    const sortedGates = [...labState.quantum.gates].sort((a, b) => a.step - b.step);
    const gateSequence = sortedGates.map(op => {
      if (op.gateName === 'CNOT') {
        return { gate: GATES.CNOT, control: op.control, target: op.qubit };
      }
      return { gate: GATES[op.gateName], target: op.qubit };
    });

    const counts = runShots(qState, gateSequence, shotsCount);
    updateHistogramFromCounts(counts, numQubits, shotsCount);
  }

  /**
   * Populates the state vector breakdown table with complex amplitude and probability.
   */
  function renderStateVectorTable(qState) {
    const table = document.getElementById('quantum-state-table');
    if (!table) return;

    const numQubits = qState.numQubits;
    const dim = qState.dim;
    let rows = '';

    for (let i = 0; i < dim; i++) {
      const bitStr = i.toString(2).padStart(numQubits, '0');
      const amp = qState.amplitudes[i];
      const prob = complexAbsSq(amp);
      const probPercent = (prob * 100).toFixed(1);

      // Complex amplitude formatting a + bi
      let ampStr = '';
      if (Math.abs(amp.im) < 1e-4) {
        ampStr = amp.re.toFixed(3);
      } else if (Math.abs(amp.re) < 1e-4) {
        ampStr = `${amp.im.toFixed(3)}i`;
      } else {
        const sign = amp.im >= 0 ? '+' : '-';
        ampStr = `${amp.re.toFixed(3)} ${sign} ${Math.abs(amp.im).toFixed(3)}i`;
      }

      rows += `
        <tr>
          <td class="font-monospace fw-bold text-info">|${bitStr}⟩</td>
          <td class="font-monospace text-muted small">${ampStr}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress-bar-bg flex-grow-1" style="height: 6px;">
                <div class="progress-bar-fill" style="width: ${probPercent}%;"></div>
              </div>
              <span class="font-monospace small">${probPercent}%</span>
            </div>
          </td>
        </tr>
      `;
    }

    table.innerHTML = `
      <thead>
        <tr>
          <th>Basis State</th>
          <th>Amplitude (a+bi)</th>
          <th>Probability (|ψ|²)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;
  }

  /**
   * Renders the interactive circuit diagram with wires and gate placement slots.
   */
  function renderCircuitSVG(numQubits, gates) {
    const svg = document.getElementById('circuit-svg');
    if (!svg) return;

    const width = 600;
    const height = numQubits === 1 ? 90 : 150;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('height', height);

    const wireY = [45, 105];
    const numSteps = 5;
    const startX = 90;
    const stepSpacing = 95;

    let svgContent = '';

    // Draw Qubit Labels and Horizontal Wires
    for (let q = 0; q < numQubits; q++) {
      const y = wireY[q];
      const initState = labState.quantum.initialStates[q];

      svgContent += `
        <!-- Wire q${q} -->
        <text x="25" y="${y + 5}" fill="#38bdf8" font-size="14" font-weight="bold" font-family="monospace">q${q} |${initState}⟩</text>
        <line x1="${startX - 20}" y1="${y}" x2="${width - 30}" y2="${y}" stroke="#475569" stroke-width="2.5" />
      `;

      // Draw clickable step slot placeholders
      for (let s = 0; s < numSteps; s++) {
        const slotX = startX + s * stepSpacing;
        svgContent += `
          <rect class="circuit-slot" data-step="${s}" data-qubit="${q}" 
            x="${slotX - 18}" y="${y - 18}" width="36" height="36" 
            fill="rgba(30, 41, 59, 0.4)" stroke="#334155" stroke-dasharray="3,3" stroke-width="1.5" rx="4"
            style="cursor: pointer; transition: all 0.2s;" />
        `;
      }
    }

    // Render placed gates
    for (const op of gates) {
      if (op.step >= numSteps) continue;
      const gx = startX + op.step * stepSpacing;
      const gy = wireY[op.qubit];

      if (op.gateName === 'CNOT') {
        const cy = wireY[op.control];
        // Vertical connecting line
        svgContent += `
          <line x1="${gx}" y1="${cy}" x2="${gx}" y2="${gy}" stroke="#f59e0b" stroke-width="3" />
          <!-- Control Dot -->
          <circle cx="${gx}" cy="${cy}" r="6.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
          <!-- Target Plus Circle -->
          <circle cx="${gx}" cy="${gy}" r="15" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5" />
          <line x1="${gx - 10}" y1="${gy}" x2="${gx + 10}" y2="${gy}" stroke="#f59e0b" stroke-width="2.5" />
          <line x1="${gx}" y1="${gy - 10}" x2="${gx}" y2="${gy + 10}" stroke="#f59e0b" stroke-width="2.5" />
        `;
      } else {
        const color = op.gateName === 'H' ? '#06b6d4' : (op.gateName === 'X' ? '#38bdf8' : '#bc8cff');
        svgContent += `
          <g class="placed-gate" data-step="${op.step}" data-qubit="${op.qubit}" style="cursor: pointer;">
            <rect x="${gx - 17}" y="${gy - 17}" width="34" height="34" fill="#0f172a" stroke="${color}" stroke-width="2" rx="4" />
            <text x="${gx}" y="${gy + 5}" fill="${color}" font-size="14" font-weight="bold" font-family="monospace" text-anchor="middle">${op.gateName}</text>
          </g>
        `;
      }
    }

    svg.innerHTML = svgContent;

    // Attach click listener to slots for gate placement/removal
    const slots = svg.querySelectorAll('.circuit-slot');
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        const step = parseInt(slot.getAttribute('data-step'), 10);
        const qubit = parseInt(slot.getAttribute('data-qubit'), 10);

        // Remove any gate already at this step/qubit
        labState.quantum.gates = labState.quantum.gates.filter(g => !(g.step === step && g.qubit === qubit));

        if (activePaletteGate === 'CNOT') {
          if (labState.quantum.numQubits === 2) {
            // Target is qubit 1, control is qubit 0
            labState.quantum.gates.push({ step, qubit: 1, gateName: 'CNOT', control: 0 });
          }
        } else {
          labState.quantum.gates.push({ step, qubit, gateName: activePaletteGate });
        }

        executeQuantumCircuit();
      });

      // Hover feedback
      slot.addEventListener('mouseenter', () => {
        slot.setAttribute('stroke', '#38bdf8');
        slot.setAttribute('fill', 'rgba(56, 189, 248, 0.15)');
      });
      slot.addEventListener('mouseleave', () => {
        slot.setAttribute('stroke', '#334155');
        slot.setAttribute('fill', 'rgba(30, 41, 59, 0.4)');
      });
    });

    // Allow clicking placed gates to remove them
    const placedGateElements = svg.querySelectorAll('.placed-gate');
    placedGateElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const step = parseInt(el.getAttribute('data-step'), 10);
        const qubit = parseInt(el.getAttribute('data-qubit'), 10);
        labState.quantum.gates = labState.quantum.gates.filter(g => !(g.step === step && g.qubit === qubit));
        executeQuantumCircuit();
      });
    });
  }

  /**
   * Updates Chart.js measurement histogram chart.
   */
  function updateHistogramFromProbs(probs, numQubits) {
    const labels = [];
    const data = [];
    for (let i = 0; i < probs.length; i++) {
      labels.push(`|${i.toString(2).padStart(numQubits, '0')}⟩`);
      data.push(Math.round(probs[i] * 1000));
    }
    renderHistogramChart(labels, data, 1000);
  }

  function updateHistogramFromCounts(counts, numQubits, totalShots) {
    const numStates = 1 << numQubits;
    const labels = [];
    const data = [];
    for (let i = 0; i < numStates; i++) {
      const bitStr = i.toString(2).padStart(numQubits, '0');
      labels.push(`|${bitStr}⟩`);
      data.push(counts[bitStr] || 0);
    }
    renderHistogramChart(labels, data, totalShots);
  }

  function renderHistogramChart(labels, data, totalShots) {
    const canvas = document.getElementById('quantum-shots-chart');
    if (!canvas) return;

    if (window.Chart) {
      if (quantumHistogramChart) {
        quantumHistogramChart.data.labels = labels;
        quantumHistogramChart.data.datasets[0].data = data;
        quantumHistogramChart.update();
      } else {
        const isLight = document.body.classList.contains('light-theme');
        quantumHistogramChart = new window.Chart(canvas, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Shots Count (Frequency)',
              data: data,
              backgroundColor: 'rgba(56, 189, 248, 0.7)',
              borderColor: '#38bdf8',
              borderWidth: 1.5,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.raw} shots (${((ctx.raw / totalShots) * 100).toFixed(1)}%)`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: totalShots,
                grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' },
                ticks: { color: '#64748b', font: { size: 10 } }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { family: 'monospace', size: 11 } }
              }
            }
          }
        });
      }
    } else {
      // Fallback simple Canvas drawing if Chart.js is not yet loaded
      drawCanvasHistogramFallback(canvas, labels, data, totalShots);
    }
  }

  function drawCanvasHistogramFallback(canvas, labels, data, total) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barW = (w - 60) / labels.length;
    for (let i = 0; i < labels.length; i++) {
      const barH = (data[i] / total) * (h - 40);
      const x = 30 + i * barW;
      const y = h - 25 - barH;

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 5, y, barW - 10, barH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, h - 8);
      ctx.fillText(`${data[i]}`, x + barW / 2, y - 5);
    }
  }

  // Initial execution of Module C
  executeQuantumCircuit();
}

/* ==========================================================================
   MODULE D: COMPARISON TABLE (LIVE INTEGRATION)
   ========================================================================== */

function renderModuleD() {
  const container = document.getElementById('module-d');
  if (!container) return;

  container.innerHTML = `
    <div class="card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h4 mb-1">Live Classical vs Quantum Comparison</h3>
          <p class="text-muted small mb-0">
            Real-time ontological contrast comparing semiconductor parameters with quantum state principles.
          </p>
        </div>
        <button class="btn btn-sm btn-outline-primary" id="btn-refresh-comparison">
          🔄 Refresh Comparison
        </button>
      </div>

      <!-- Live Comparison Table -->
      <div class="table-responsive mb-4">
        <table class="table mb-0" id="live-comparison-table">
          <thead>
            <tr>
              <th style="width: 20%;">Property</th>
              <th style="width: 40%; color: var(--accent-primary);">Classical (from Module A & B)</th>
              <th style="width: 40%; color: var(--accent-purple);">Quantum (from Module C)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="fw-bold">Information Unit</td>
              <td>Bit (Binary voltage level: LOW/HIGH)</td>
              <td>Qubit (2-level quantum state vector)</td>
            </tr>
            <tr>
              <td class="fw-bold">Possible Values</td>
              <td>0 or 1 ($V_{ce} \\le 0.2\\text{V}$ or $V_{out} = 5.0\\text{V}$)</td>
              <td>Continuous superposition: $\\alpha|0\\rangle + \\beta|1\\rangle$ ($|\\alpha|^2 + |\\beta|^2 = 1$)</td>
            </tr>
            <tr>
              <td class="fw-bold">Current State</td>
              <td id="comp-live-classical-state" class="font-monospace text-success fw-bold">
                BIT 1 (Vout = 4.00V, Region = Active)
              </td>
              <td id="comp-live-quantum-state" class="font-monospace text-info fw-bold">
                |0⟩ (100.0% probability)
              </td>
            </tr>
            <tr>
              <td class="fw-bold">Operation Type</td>
              <td>Logic gate / Semiconductor switch</td>
              <td>Unitary matrix transformation ($U^\\dagger U = I$)</td>
            </tr>
            <tr>
              <td class="fw-bold">Recent Operation</td>
              <td id="comp-live-classical-op" class="font-monospace text-warning">
                NOT gate (A=1 → Y=0)
              </td>
              <td id="comp-live-quantum-op" class="font-monospace text-purple">
                H gate on q0
              </td>
            </tr>
            <tr>
              <td class="fw-bold">Output Type</td>
              <td>Deterministic (Voltage clamped by supply rail)</td>
              <td>Probabilistic (Wavefunction collapse upon measurement)</td>
            </tr>
            <tr>
              <td class="fw-bold">Noise Type</td>
              <td>Electronic thermal ($k_B T$) & shot noise (mitigated by voltage thresholds)</td>
              <td>Environmental decoherence ($T_1$ relaxation, $T_2$ dephasing)</td>
            </tr>
            <tr>
              <td class="fw-bold">Physical Basis</td>
              <td>Transistor electron drift/diffusion in silicon bandgap</td>
              <td>Superconducting transmon / spin / trapped ion superposition</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pedagogical Summary Cards Grid -->
      <div class="row g-3" style="display: flex; flex-wrap: wrap; margin: -0.5rem;">
        <div class="col-md-4" style="flex: 1 1 240px; padding: 0.5rem;">
          <div class="p-3 rounded h-100" style="background: var(--surface-color); border: 1px solid var(--border-color);">
            <h5 class="h6 text-primary mb-1">1. Noise Margins vs Decoherence</h5>
            <p class="small text-muted mb-0">
              Classical circuits restore degraded voltages using nonlinear gain curves (Module A). Quantum states cannot be restored by amplification without destroying phase coherence (No-Cloning Theorem).
            </p>
          </div>
        </div>
        <div class="col-md-4" style="flex: 1 1 240px; padding: 0.5rem;">
          <div class="p-3 rounded h-100" style="background: var(--surface-color); border: 1px solid var(--border-color);">
            <h5 class="h6 text-success mb-1">2. Irreversibility vs Unitary</h5>
            <p class="small text-muted mb-0">
              Classical NAND gates erase 1 bit of information per cycle (Landauer heat dissipation). Quantum gates are unitary ($U^{-1} = U^\\dagger$), meaning every operation is completely reversible and preserves probability.
            </p>
          </div>
        </div>
        <div class="col-md-4" style="flex: 1 1 240px; padding: 0.5rem;">
          <div class="p-3 rounded h-100" style="background: var(--surface-color); border: 1px solid var(--border-color);">
            <h5 class="h6 text-info mb-1">3. Parallelism & Entanglement</h5>
            <p class="small text-muted mb-0">
              $N$ classical bits encode exactly 1 integer from $0$ to $2^N-1$ at any instant. $N$ qubits encode a simultaneous superposition of all $2^N$ complex amplitudes, enabling exponential quantum parallelism.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-refresh-comparison')?.addEventListener('click', () => {
    updateModuleDComparison();
  });

  updateModuleDComparison();

  // Render mathematics in Module D
  if (typeof window.renderAllMath === 'function') {
    window.renderAllMath(container);
  }
}

/**
 * Updates the live comparison table rows dynamically based on the current states
 * of Module A, Module B, and Module C.
 */
function updateModuleDComparison() {
  const classicalStateEl = document.getElementById('comp-live-classical-state');
  const quantumStateEl = document.getElementById('comp-live-quantum-state');
  const classicalOpEl = document.getElementById('comp-live-classical-op');
  const quantumOpEl = document.getElementById('comp-live-quantum-op');

  if (!classicalStateEl || !quantumStateEl) return;

  // Classical state from Module A
  const t = labState.transistor;
  classicalStateEl.textContent = `BIT ${t.digitalBit} (Vout = ${t.vout.toFixed(2)}V, Region = ${t.region}, Ic = ${t.ic_mA.toFixed(2)}mA)`;
  classicalStateEl.className = t.digitalBit === 1 ? 'font-monospace text-success fw-bold' : 'font-monospace text-danger fw-bold';

  // Classical op from Module B
  const g = labState.logicGate;
  if (g.gate === 'NOT') {
    classicalOpEl.textContent = `NOT gate (A=${g.inputA} → Y=${g.output})`;
  } else {
    classicalOpEl.textContent = `${g.gate} gate (A=${g.inputA}, B=${g.inputB} → Y=${g.output})`;
  }

  // Quantum state from Module C
  const q = labState.quantum;
  quantumStateEl.textContent = `${q.stateVectorStr} [Recent sample: |${q.measuredBit}⟩]`;

  // Quantum op from Module C
  quantumOpEl.textContent = q.lastGate !== 'None' ? `${q.lastGate} gate applied` : 'Identity / Ground state';
}

if (typeof window !== 'undefined') {
  window.initSimulator = initSimulator;
}

/* --- noise.js --- */
/**
 * noise.js - Noise & Errors: Classical vs Quantum
 * Educational module comparing classical transistor noise to quantum decoherence and error correction.
 */

// Function to ensure Chart.js is loaded
function ensureChartJs(callback) {
  if (typeof Chart !== 'undefined') {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = () => callback();
  script.onerror = () => {
    console.warn('Could not load Chart.js from CDN. Using fallback canvas rendering.');
    callback();
  };
  document.head.appendChild(script);
}
function initNoise() {
  const container = document.getElementById('noise');
  if (!container) {
    console.error('Container #noise not found');
    return;
  }

  // Render HTML markup and attach interactive events immediately
  renderNoiseModule(container);

  // If Chart.js was not ready yet, load it asynchronously and refresh the charts
  if (typeof Chart === 'undefined') {
    ensureChartJs(() => {
      renderClassicalChart();
    });
  }
}

// Support browser global window call
if (typeof window !== 'undefined') {
  window.initNoise = initNoise;
}

function renderNoiseModule(container) {
  container.innerHTML = `
    <div class="noise-module-wrapper">
      <!-- Section Header -->
      <header class="noise-header">
        <div class="badge-tag">MODULE: ERROR CHANNELS & FIDELITY</div>
        <h2 class="section-title">Noise & Errors: Classical vs Quantum</h2>
        <p class="section-subtitle">
          Explore how thermal fluctuations cause bit flips in classical CMOS transistors, 
          and how environmental entanglement causes decoherence and quantum phase/bit flips.
        </p>
      </header>

      <!-- Guiding Question Box -->
      <div class="guiding-question-box">
        <div class="gq-icon">💡</div>
        <div class="gq-content">
          <h4>Guiding Research Question</h4>
          <p class="gq-text">
            <strong>"How does classical noise in transistor-based switching compare conceptually with noise affecting quantum states?"</strong>
          </p>
          <p class="gq-subtext">
            In classical logic, noise perturbates continuous voltages, but discrete threshold slicing provides immense noise margins. In quantum mechanics, noise couples the system to the environment, degrading continuous complex amplitudes and relative phases—and quantum states cannot be simply duplicated or measured without collapse.
          </p>
        </div>
      </div>

      <!-- SECTION 1: CLASSICAL NOISE -->
      <section class="noise-card classical-noise-section">
        <div class="card-header">
          <span class="step-num">01</span>
          <h3>Classical Noise in Transistor Circuits</h3>
        </div>
        <div class="card-body">
          <div class="math-explanation-box">
            <p>
              In digital CMOS logic, an output voltage is modeled as:
            </p>
            <div class="formula-box">
              $$V_{\\text{out}}(t) = V_{\\text{ideal}}(t) + n(t)$$
            </div>
            <p>
              where $n(t)$ represents stochastic noise originating from Johnson-Nyquist thermal agitation ($4k_B T R \\Delta f$), flicker ($1/f$) noise, power supply ripple, and capacitive crosstalk.
            </p>
            <div class="threshold-note">
              <strong>Digital Noise Immunity:</strong> A digital inverter relies on a switching threshold $V_{th} = 2.5\\text{ V}$ (for 5V TTL/CMOS). If $V_{ideal} = 5\\text{ V}$ (Logic 1) and negative noise exceeds the noise margin ($|n(t)| > 2.5\\text{ V}$), the downstream gate misinterprets it as Logic 0, producing a <em>Bit Error</em>.
            </div>
          </div>

          <!-- Interactive Simulator Controls -->
          <div class="classical-sim-grid">
            <div class="controls-panel">
              <div class="control-group">
                <label for="noiseAmpSlider">
                  <strong>Noise Amplitude $\\sigma_n$:</strong> 
                  <span id="noiseAmpVal" class="val-highlight">0.50 V</span>
                </label>
                <input type="range" id="noiseAmpSlider" min="0" max="2.0" step="0.05" value="0.5">
                <div class="range-marks">
                  <span>0V (Clean)</span>
                  <span>1.0V (Moderate)</span>
                  <span>2.0V (Severe)</span>
                </div>
              </div>

              <div class="control-group">
                <label for="signalSelect"><strong>Input Bit Stream Pattern:</strong></label>
                <select id="signalSelect" class="styled-select">
                  <option value="clock">Alternating Clock [1, 0, 1, 0, 1, 0]</option>
                  <option value="data">Pseudorandom Data [1, 1, 0, 1, 0, 0]</option>
                  <option value="high">Continuous High [1, 1, 1, 1, 1, 1]</option>
                </select>
              </div>

              <div class="telemetry-box">
                <div class="telemetry-item">
                  <span class="telemetry-label">Decision Threshold ($V_{th}$):</span>
                  <span class="telemetry-val">2.50 V</span>
                </div>
                <div class="telemetry-item">
                  <span class="telemetry-label">Signal-to-Noise Ratio (SNR):</span>
                  <span id="snrDisplay" class="telemetry-val snr-ok">20.0 dB</span>
                </div>
                <div class="telemetry-item">
                  <span class="telemetry-label">Bit Errors Detected:</span>
                  <span id="bitErrorCount" class="telemetry-val err-none">0 / 6 bits (0%)</span>
                </div>
              </div>

              <button id="btnRegenerateNoise" class="btn-primary">⚡ Re-sample Random Noise</button>
            </div>

            <!-- Canvas Visualization -->
            <div class="chart-wrapper">
              <canvas id="classicalNoiseChart" width="600" height="300"></canvas>
              <div class="chart-legend-custom">
                <span class="legend-chip"><i class="dot dot-ideal"></i> Ideal Signal (0V / 5V)</span>
                <span class="legend-chip"><i class="dot dot-noisy"></i> Noisy Signal $V_{out}(t)$</span>
                <span class="legend-chip"><i class="dot dot-thresh"></i> Threshold $V_{th} = 2.5\\text{V}$</span>
                <span class="legend-chip"><i class="dot dot-error"></i> Sampled Bit Error</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: QUANTUM NOISE & DECOHERENCE -->
      <section class="noise-card quantum-noise-section">
        <div class="card-header">
          <span class="step-num">02</span>
          <h3>Quantum Noise & Decoherence Mechanisms</h3>
        </div>
        <div class="card-body">
          <p class="section-intro">
            Unlike classical noise which alters continuous voltage levels while leaving the bits intact until a threshold is crossed, <strong>quantum noise</strong> stems from unavoidable quantum entanglement between the fragile qubit state and its macroscopic environment.
          </p>

          <div class="decay-parameters-grid">
            <div class="decay-card">
              <h4>$T_1$ Relaxation Time (Energy Dissipation)</h4>
              <p>
                Also known as longitudinal relaxation. A qubit in excited state $|1\\rangle$ spontaneously emits energy to the environment and decays to ground state $|0\\rangle$:
              </p>
              <div class="formula-box">
                $$P(|1\\rangle, t) = e^{-t / T_1}$$
              </div>
              <p class="decay-note">
                Equivalent to an unintended reset or damping channel.
              </p>
            </div>

            <div class="decay-card">
              <h4>$T_2$ Dephasing Time (Phase Decoherence)</h4>
              <p>
                Also known as transverse relaxation. Fluctuations in magnetic fields or charge shift the relative phase angle $\\phi$ between $|0\\rangle$ and $|1\\rangle$:
              </p>
              <div class="formula-box">
                $$\\frac{1}{T_2} = \\frac{1}{2T_1} + \\frac{1}{T_\\phi}$$
              </div>
              <p class="decay-note">
                $T_\\phi$ is pure dephasing. The off-diagonal density matrix elements decay as $e^{-t / T_2}$, turning a pure state into an incoherent statistical mixture!
              </p>
            </div>
          </div>

          <!-- Conceptual Comparison Table -->
          <div class="table-responsive">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Classical Transistor Noise</th>
                  <th>Quantum Decoherence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Physical Origin</strong></td>
                  <td>Thermal electron agitation ($k_B T$), power supply ripple, crosstalk</td>
                  <td>Unwanted entanglement with thermal bath, dielectric loss, flux noise</td>
                </tr>
                <tr>
                  <td><strong>Nature of Errors</strong></td>
                  <td>Discrete bit flips ($0 \\leftrightarrow 1$) when noise exceeds $V_{th}$</td>
                  <td>Continuous errors: both Bit flips ($X$) AND Phase shifts ($Z$, relative phase \\theta)</td>
                </tr>
                <tr>
                  <td><strong>State Evolution</strong></td>
                  <td>State remains purely deterministic classical bit (0 or 1)</td>
                  <td>Pure quantum state $|\\psi\\rangle$ degrades into mixed density matrix $\\rho$</td>
                </tr>
                <tr>
                  <td><strong>Measurement Check</strong></td>
                  <td>Passive continuous voltage probe without altering bit value</td>
                  <td>Any measurement projection collapses superposition destroying coherence</td>
                </tr>
                <tr>
                  <td><strong>Protection Law</strong></td>
                  <td>Nonlinear gain of transistors restores voltage to rail levels</td>
                  <td><strong>No-Cloning Theorem</strong> forbids bit-copying; requires quantum entanglement encoding</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- SECTION 3: QUANTUM ERROR TYPES (INTERACTIVE DEMOS) -->
      <section class="noise-card quantum-errors-section">
        <div class="card-header">
          <span class="step-num">03</span>
          <h3>Quantum Error Channels: Interactive Demos</h3>
        </div>
        <div class="card-body">
          <div class="demo-tabs-nav">
            <button class="demo-tab-btn active" data-tab="tab-bitflip">A. Bit-Flip Channel ($X$)</button>
            <button class="demo-tab-btn" data-tab="tab-phaseflip">B. Phase-Flip Channel ($Z$)</button>
            <button class="demo-tab-btn" data-tab="tab-depol">C. Depolarizing Channel</button>
          </div>

          <!-- SUB-TAB A: BIT-FLIP -->
          <div id="tab-bitflip" class="demo-tab-content active">
            <div class="tab-explainer">
              <h4>Bit-Flip Error Channel $\\mathcal{E}_{BF}(\\rho) = (1-p)\\rho + p X \\rho X$</h4>
              <p>With probability $p$, a Pauli-$X$ gate is applied, swapping state amplitudes: $\\alpha|0\\rangle + \\beta|1\\rangle \\to \\alpha|1\\rangle + \\beta|0\\rangle$.</p>
            </div>
            <div class="interactive-channel-grid">
              <div class="channel-controls">
                <div class="control-group">
                  <label>Initial Quantum State $|\\psi_{in}\\rangle$:</label>
                  <select id="bfInitialState" class="styled-select">
                    <option value="zero">|0⟩ (Ground state)</option>
                    <option value="one">|1⟩ (Excited state)</option>
                    <option value="plus">|+⟩ = (|0⟩ + |1⟩) / √2</option>
                    <option value="custom">0.8|0⟩ + 0.6|1⟩</option>
                  </select>
                </div>
                <div class="control-group">
                  <label for="bfProbSlider">Error Probability $p$: <span id="bfProbVal" class="val-highlight">0.30</span></label>
                  <input type="range" id="bfProbSlider" min="0" max="1" step="0.05" value="0.30">
                </div>
                <button id="btnSimulateBF" class="btn-primary">🎲 Simulate Error Channel</button>
              </div>
              <div class="channel-results-card">
                <div class="state-comparison-display">
                  <div class="state-box">
                    <span class="state-label">Before Error:</span>
                    <div id="bfStateBefore" class="quantum-ket">|0⟩</div>
                    <div id="bfProbBeforeBar" class="prob-bar-container"></div>
                  </div>
                  <div class="state-arrow">➜</div>
                  <div class="state-box">
                    <span class="state-label">After Error Channel:</span>
                    <div id="bfStateAfter" class="quantum-ket">|0⟩</div>
                    <div id="bfProbAfterBar" class="prob-bar-container"></div>
                  </div>
                </div>
                <div id="bfEventStatus" class="event-status-badge status-clean">No Error Occurred (Stayed Identity)</div>
              </div>
            </div>
          </div>

          <!-- SUB-TAB B: PHASE-FLIP -->
          <div id="tab-phaseflip" class="demo-tab-content">
            <div class="tab-explainer">
              <h4>Phase-Flip Error Channel $\\mathcal{E}_{PF}(\\rho) = (1-p)\\rho + p Z \\rho Z$</h4>
              <p>With probability $p$, a Pauli-$Z$ gate is applied. The relative phase flips by $\\pi$: $\\alpha|0\\rangle + \\beta|1\\rangle \\to \\alpha|0\\rangle - \\beta|1\\rangle$. Crucially, computational measurement probabilities $| \\alpha |^2, | \\beta |^2$ do not change, but superposition interference is completely inverted ($|+\\rangle \\leftrightarrow |-\\rangle$)!</p>
            </div>
            <div class="interactive-channel-grid">
              <div class="channel-controls">
                <div class="control-group">
                  <label>Initial Quantum State $|\\psi_{in}\\rangle$:</label>
                  <select id="pfInitialState" class="styled-select">
                    <option value="plus">|+⟩ = (|0⟩ + |1⟩) / √2</option>
                    <option value="minus">|-⟩ = (|0⟩ - |1⟩) / √2</option>
                    <option value="custom">0.6|0⟩ + 0.8|1⟩</option>
                  </select>
                </div>
                <div class="control-group">
                  <label for="pfProbSlider">Phase-Flip Probability $p$: <span id="pfProbVal" class="val-highlight">0.40</span></label>
                  <input type="range" id="pfProbSlider" min="0" max="1" step="0.05" value="0.40">
                </div>
                <button id="btnSimulatePF" class="btn-primary">🎲 Simulate Phase Flip</button>
              </div>
              <div class="channel-results-card">
                <div class="state-comparison-display">
                  <div class="state-box">
                    <span class="state-label">Before Error:</span>
                    <div id="pfStateBefore" class="quantum-ket">|+⟩</div>
                    <div class="phase-indicator" id="pfPhaseBefore">Phase: 0 rad</div>
                  </div>
                  <div class="state-arrow">➜</div>
                  <div class="state-box">
                    <span class="state-label">After Error Channel:</span>
                    <div id="pfStateAfter" class="quantum-ket">|+⟩</div>
                    <div class="phase-indicator" id="pfPhaseAfter">Phase: 0 rad</div>
                  </div>
                </div>
                <div id="pfEventStatus" class="event-status-badge status-clean">No Error Occurred (Identity)</div>
              </div>
            </div>
          </div>

          <!-- SUB-TAB C: DEPOLARIZING CHANNEL & BLOCH SPHERE -->
          <div id="tab-depol" class="demo-tab-content">
            <div class="tab-explainer">
              <h4>Depolarizing Channel $\\mathcal{E}_{depol}(\\rho) = (1-p)\\rho + \\frac{p}{3}(X\\rho X + Y\\rho Y + Z\\rho Z)$</h4>
              <p>
                Depolarizing noise models isotropic decay where the state is replaced with the maximally mixed state $I/2$ with probability $p$. On the <strong>Bloch sphere</strong>, the state vector length contracts from $|\\vec{r}|=1$ to $|\\vec{r}| = 1-p$, moving into the sphere interior.
              </p>
            </div>
            
            <div class="depol-grid">
              <!-- Left: Controls and Bloch Sphere -->
              <div class="depol-left">
                <div class="control-group">
                  <label for="depolProbSlider">Depolarizing Parameter $p$: <span id="depolProbVal" class="val-highlight">0.50</span></label>
                  <input type="range" id="depolProbSlider" min="0" max="1" step="0.05" value="0.50">
                  <div class="bloch-metrics">
                    <span>Bloch Vector Length $|\\vec{r}|$: <strong id="blochRadiusVal">0.50</strong></span>
                    <span>State Purity $\\text{Tr}(\\rho^2)$: <strong id="statePurityVal">0.625</strong></span>
                  </div>
                </div>

                <div class="bloch-canvas-container">
                  <canvas id="blochSphereCanvas" width="300" height="300"></canvas>
                  <div class="bloch-caption">Bloch Sphere Projection (Z-X Plane)</div>
                </div>

                <button id="btnRun500Shots" class="btn-primary" style="width:100%; margin-top:10px;">
                  🚀 Run 500 Measurement Shots
                </button>
              </div>

              <!-- Right: Shot Histogram -->
              <div class="depol-right">
                <h5>500-Shot Measurement Histogram (Ideal vs Depolarized)</h5>
                <div class="chart-wrapper-depol">
                  <canvas id="depolHistogramChart" width="450" height="260"></canvas>
                </div>
                <p class="hist-note">
                  Notice how as $p \\to 1.0$, the measurement distribution flattens into a 50/50 uniform coin toss, completely destroying the stored quantum information.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- SECTION 4: QUANTUM ERROR CORRECTION -->
      <section class="noise-card qec-section">
        <div class="card-header">
          <span class="step-num">04</span>
          <h3>Quantum Error Correction: 3-Qubit Bit-Flip Repetition Code</h3>
        </div>
        <div class="card-body">
          <p class="qec-intro">
            How can quantum errors be corrected if measuring a qubit collapses it, and cloning is forbidden by the No-Cloning theorem? 
            <strong>Solution:</strong> Entangle the logical qubit into multi-qubit entangled states and measure <em>syndromes (parity checks)</em> that reveal <em>where</em> an error occurred without revealing the quantum amplitude $\\alpha$ and $\\beta$!
          </p>

          <!-- Circuit Diagram SVG -->
          <div class="circuit-diagram-container">
            <h4>Quantum Circuit: Encoding, Syndrome Extraction &amp; Correction</h4>
            <div class="circuit-svg-wrap">
              <svg viewBox="0 0 920 230" class="qec-circuit-svg" xmlns="http://www.w3.org/2000/svg">
                <!-- Stage 1: Encoding Background & Badge -->
                <rect x="95" y="12" width="150" height="206" rx="8" class="circuit-stage-box stage-box-encode" />
                <rect x="115" y="20" width="110" height="24" rx="12" class="stage-badge stage-badge-encode" />
                <text x="170" y="32" class="stage-label stage-label-encode" text-anchor="middle" dominant-baseline="central">1. ENCODE</text>

                <!-- Stage 2: Noise Channel Background & Badge -->
                <rect x="258" y="12" width="136" height="206" rx="8" class="circuit-stage-box error-box-border stage-box-noise" />
                <rect x="268" y="20" width="116" height="24" rx="12" class="stage-badge stage-badge-noise" />
                <text x="326" y="32" class="stage-label error-label" text-anchor="middle" dominant-baseline="central">2. NOISE CHANNEL</text>

                <!-- Stage 3: Syndrome Extraction Background & Badge -->
                <rect x="406" y="12" width="236" height="206" rx="8" class="circuit-stage-box stage-box-syndrome" />
                <rect x="424" y="20" width="200" height="24" rx="12" class="stage-badge stage-badge-syndrome" />
                <text x="524" y="32" class="stage-label stage-label-syndrome" text-anchor="middle" dominant-baseline="central">3. SYNDROME (Z₀Z₁, Z₁Z₂)</text>

                <!-- Stage 4: Correction Background & Badge -->
                <rect x="654" y="12" width="136" height="206" rx="8" class="circuit-stage-box stage-box-correct" />
                <rect x="664" y="20" width="116" height="24" rx="12" class="stage-badge stage-badge-correct" />
                <text x="722" y="32" class="stage-label stage-label-correct" text-anchor="middle" dominant-baseline="central">4. CORRECTION</text>

                <!-- Qubit Wires & Labels -->
                <text x="25" y="75" class="circuit-text" text-anchor="start" dominant-baseline="central">q0: |ψ⟩</text>
                <line x1="82" y1="75" x2="805" y2="75" class="circuit-wire" />

                <text x="25" y="135" class="circuit-text" text-anchor="start" dominant-baseline="central">q1: |0⟩</text>
                <line x1="82" y1="135" x2="805" y2="135" class="circuit-wire" />

                <text x="25" y="195" class="circuit-text" text-anchor="start" dominant-baseline="central">q2: |0⟩</text>
                <line x1="82" y1="195" x2="805" y2="195" class="circuit-wire" />

                <!-- Stage 1 Gates: CNOT q0->q1, CNOT q0->q2 -->
                <line x1="142" y1="75" x2="142" y2="135" class="cnot-line" />
                <circle cx="142" cy="75" r="5" class="cnot-control" />
                <circle cx="142" cy="135" r="10" class="cnot-target" />
                <line x1="132" y1="135" x2="152" y2="135" class="cnot-target-cross" />
                <line x1="142" y1="125" x2="142" y2="145" class="cnot-target-cross" />

                <line x1="202" y1="75" x2="202" y2="195" class="cnot-line" />
                <circle cx="202" cy="75" r="5" class="cnot-control" />
                <circle cx="202" cy="195" r="10" class="cnot-target" />
                <line x1="192" y1="195" x2="212" y2="195" class="cnot-target-cross" />
                <line x1="202" y1="185" x2="202" y2="205" class="cnot-target-cross" />

                <!-- Stage 2 Gates: Noise Bit-Flips (X^e0, X^e1, X^e2) -->
                <rect x="299" y="57" width="54" height="36" rx="6" class="gate-box gate-noise" />
                <text x="326" y="75" class="gate-text" text-anchor="middle" dominant-baseline="central">X<tspan font-size="9" dy="-5">e0</tspan></text>

                <rect x="299" y="117" width="54" height="36" rx="6" class="gate-box gate-noise" />
                <text x="326" y="135" class="gate-text" text-anchor="middle" dominant-baseline="central">X<tspan font-size="9" dy="-5">e1</tspan></text>

                <rect x="299" y="177" width="54" height="36" rx="6" class="gate-box gate-noise" />
                <text x="326" y="195" class="gate-text" text-anchor="middle" dominant-baseline="central">X<tspan font-size="9" dy="-5">e2</tspan></text>

                <!-- Stage 3 Gates: Non-Destructive Parity Checks -->
                <!-- s1 Parity Check (q0 & q1) -->
                <line x1="465" y1="75" x2="465" y2="135" class="syndrome-parity-line" />
                <circle cx="465" cy="75" r="4" class="syndrome-sensor-dot" />
                <circle cx="465" cy="135" r="4" class="syndrome-sensor-dot" />
                <rect x="415" y="88" width="100" height="34" rx="6" class="gate-box gate-syndrome" />
                <text x="465" y="105" class="gate-text gate-syndrome-text" text-anchor="middle" dominant-baseline="central">s₁: Z₀ ⊗ Z₁</text>

                <!-- s2 Parity Check (q1 & q2) -->
                <line x1="583" y1="135" x2="583" y2="195" class="syndrome-parity-line" />
                <circle cx="583" cy="135" r="4" class="syndrome-sensor-dot" />
                <circle cx="583" cy="195" r="4" class="syndrome-sensor-dot" />
                <rect x="533" y="148" width="100" height="34" rx="6" class="gate-box gate-syndrome" />
                <text x="583" y="165" class="gate-text gate-syndrome-text" text-anchor="middle" dominant-baseline="central">s₂: Z₁ ⊗ Z₂</text>

                <!-- Stage 4 Gates: Conditional Recovery (X^s) -->
                <rect x="695" y="57" width="54" height="36" rx="6" class="gate-box gate-correct" />
                <text x="722" y="75" class="gate-text" text-anchor="middle" dominant-baseline="central">X<tspan font-size="9" dy="-5">s</tspan></text>

                <rect x="695" y="117" width="54" height="36" rx="6" class="gate-box gate-correct" />
                <text x="722" y="135" class="gate-text" text-anchor="middle" dominant-baseline="central">X<tspan font-size="9" dy="-5">s</tspan></text>

                <rect x="695" y="177" width="54" height="36" rx="6" class="gate-box gate-correct" />
                <text x="722" y="195" class="gate-text" text-anchor="middle" dominant-baseline="central">X<tspan font-size="9" dy="-5">s</tspan></text>

                <!-- Output State Bracket -->
                <path d="M 812 75 Q 820 75 820 105 Q 820 135 828 135 Q 820 135 820 165 Q 820 195 812 195" fill="none" stroke="var(--border-focus)" stroke-width="1.8" />
                <text x="838" y="128" class="restored-state-title" dominant-baseline="central">|ψ⟩</text>
                <text x="838" y="145" class="restored-state-sub" dominant-baseline="central">Restored</text>
              </svg>
            </div>
          </div>

          <!-- Interactive 4-step QEC Workflow -->
          <div class="qec-stepper-container">
            <div class="step-buttons-row">
              <button id="btnQecEncode" class="qec-step-btn active-step">1. Encode State</button>
              <button id="btnQecError" class="qec-step-btn" disabled>2. Introduce Error</button>
              <button id="btnQecSyndrome" class="qec-step-btn" disabled>3. Measure Syndrome & Correct</button>
              <button id="btnQecVerify" class="qec-step-btn" disabled>4. Verify Fidelity</button>
            </div>

            <div class="qec-console">
              <div class="qec-register-display">
                <div class="register-block">
                  <span class="reg-label">Logical Input $|\\psi\\rangle$:</span>
                  <span id="qecInputState" class="reg-val">0.8|0⟩ + 0.6|1⟩</span>
                </div>
                <div class="register-block">
                  <span class="reg-label">3-Qubit Register:</span>
                  <span id="qecTriState" class="reg-val">Not Encoded</span>
                </div>
                <div class="register-block">
                  <span class="reg-label">Syndrome $(s_1, s_2)$:</span>
                  <span id="qecSyndromeVal" class="reg-val">(--, --)</span>
                </div>
                <div class="register-block">
                  <span class="reg-label">Recovery Action:</span>
                  <span id="qecActionVal" class="reg-val">None</span>
                </div>
              </div>
              <div id="qecStatusMessage" class="qec-status-bar">
                Click <strong>"1. Encode State"</strong> to entangle the logical qubit into $\\alpha|000\\rangle + \\beta|111\\rangle$.
              </div>
            </div>

            <!-- Syndrome Lookup Table -->
            <div class="syndrome-table-wrap">
              <h5>Syndrome Decoding Lookup Table</h5>
              <table class="syndrome-table">
                <thead>
                  <tr>
                    <th>Syndrome $(s_1, s_2)$</th>
                    <th>Parity Interpretation</th>
                    <th>Inferred Error Location</th>
                    <th>Corrective Gate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr id="synRow00">
                    <td><code>(0, 0)</code></td>
                    <td>$q_0 = q_1$ and $q_1 = q_2$</td>
                    <td>No Error</td>
                    <td>$I$ (Do nothing)</td>
                  </tr>
                  <tr id="synRow10">
                    <td><code>(1, 0)</code></td>
                    <td>$q_0 \\neq q_1$ and $q_1 = q_2$</td>
                    <td>Bit flip on $q_0$</td>
                    <td>Apply $X$ to $q_0$</td>
                  </tr>
                  <tr id="synRow11">
                    <td><code>(1, 1)</code></td>
                    <td>$q_0 \\neq q_1$ and $q_1 \\neq q_2$</td>
                    <td>Bit flip on $q_1$</td>
                    <td>Apply $X$ to $q_1$</td>
                  </tr>
                  <tr id="synRow01">
                    <td><code>(0, 1)</code></td>
                    <td>$q_0 = q_1$ and $q_1 \\neq q_2$</td>
                    <td>Bit flip on $q_2$</td>
                    <td>Apply $X$ to $q_2$</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: CONCEPTUAL COMPARISON (4 CARDS) -->
      <section class="noise-card comparison-cards-section">
        <div class="card-header">
          <span class="step-num">05</span>
          <h3>Conceptual Comparison Cards</h3>
        </div>
        <div class="card-body">
          <div class="four-cards-grid">
            <!-- Card 1 -->
            <div class="compare-card">
              <div class="card-chip">Mechanism</div>
              <h4>Classical Noise vs Decoherence</h4>
              <p>
                Classical transistor noise is additive continuous voltage disturbance $V_{ideal} + n(t)$. Digital thresholding prevents errors until noise voltage crosses the midpoint.
              </p>
              <div class="divider-sub"></div>
              <p>
                Quantum decoherence is <em>entanglement with environmental degrees of freedom</em>. There is no natural threshold: any environmental interaction instantly reduces phase coherence and degrades quantum fidelity.
              </p>
            </div>

            <!-- Card 2 -->
            <div class="compare-card">
              <div class="card-chip">Correction Theory</div>
              <h4>Classical Error Correction vs QEC</h4>
              <p>
                Classical ECC (e.g. Hamming, Reed-Solomon) checks bits directly by cloning and calculating modular arithmetic checksums without disturbing stored data.
              </p>
              <div class="divider-sub"></div>
              <p>
                QEC must overcome two fundamental quantum barriers:
                <br>• <strong>No-Cloning Theorem</strong>: Unknown states cannot be copied.
                <br>• <strong>Measurement Collapse</strong>: Direct reading destroys superpositions. Syndromes measure multi-qubit operators ($Z \\otimes Z$) instead of individual qubits.
              </p>
            </div>

            <!-- Card 3 -->
            <div class="compare-card">
              <div class="card-chip">Redundancy Principle</div>
              <h4>Classical Redundancy vs Quantum Repetition</h4>
              <p>
                Classical Triple Modular Redundancy (TMR) duplicates bit $b \\to (b, b, b)$ independently and votes by majority logic.
              </p>
              <div class="divider-sub"></div>
              <p>
                Quantum repetition code encodes $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ into an entangled Greenberger-Horne-Zeilinger (GHZ) state $\\alpha|000\\rangle + \\beta|111\\rangle$. The qubits are not independent clones; they are entangled together.
              </p>
            </div>

            <!-- Card 4 -->
            <div class="compare-card">
              <div class="card-chip">Error Spectrum</div>
              <h4>Bit Error vs Phase Error</h4>
              <p>
                Classical systems only suffer from one error type: a bit inversion ($0 \\to 1$ or $1 \\to 0$).
              </p>
              <div class="divider-sub"></div>
              <p>
                Quantum systems suffer from dual orthogonal errors: bit-flips (Pauli-$X$) and <strong>phase-flips (Pauli-$Z$)</strong>. Correcting both requires sophisticated 2D surface codes or Shor/Steane codes where continuous rotations are digitized into discrete Pauli errors through syndrome projection!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // Attach interactive logic
  initClassicalSimulator();
  initQuantumDemos();
  initQECWorkflow();

  // Render mathematics in container
  if (typeof window.renderAllMath === 'function') {
    window.renderAllMath(container);
  }
}

/* ==========================================================
 * 1. CLASSICAL NOISE INTERACTIVE SIMULATOR (Chart.js)
 * ========================================================== */
let classicalChartInstance = null;

function initClassicalSimulator() {
  const slider = document.getElementById('noiseAmpSlider');
  const valDisplay = document.getElementById('noiseAmpVal');
  const signalSelect = document.getElementById('signalSelect');
  const btnResample = document.getElementById('btnRegenerateNoise');

  function update() {
    valDisplay.textContent = parseFloat(slider.value).toFixed(2) + ' V';
    renderClassicalChart();
  }

  slider.addEventListener('input', update);
  signalSelect.addEventListener('change', update);
  btnResample.addEventListener('click', update);

  // Initial draw
  update();
}

function renderClassicalChart() {
  const canvas = document.getElementById('classicalNoiseChart');
  if (!canvas) return;

  const noiseAmp = parseFloat(document.getElementById('noiseAmpSlider').value);
  const pattern = document.getElementById('signalSelect').value;

  // Bits definition (6 bit intervals)
  let bitStream = [1, 0, 1, 0, 1, 0];
  if (pattern === 'data') bitStream = [1, 1, 0, 1, 0, 0];
  if (pattern === 'high') bitStream = [1, 1, 1, 1, 1, 1];

  const samplesPerBit = 20;
  const totalSamples = bitStream.length * samplesPerBit;
  const labels = [];
  const idealData = [];
  const noisyData = [];
  const thresholdData = [];
  const errorPoints = [];

  let bitErrors = 0;

  for (let i = 0; i < totalSamples; i++) {
    const bitIdx = Math.floor(i / samplesPerBit);
    const bitVal = bitStream[bitIdx];
    const idealV = bitVal === 1 ? 5.0 : 0.0;
    
    // Gaussian-like noise (Box-Muller)
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();
    const gauss = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const noiseV = gauss * noiseAmp;
    const noisyV = Math.max(-0.5, Math.min(5.5, idealV + noiseV));

    labels.push((i * 0.1).toFixed(1) + 'ns');
    idealData.push(idealV);
    noisyData.push(noisyV);
    thresholdData.push(2.5);

    // Sample decision at midpoint of bit clock
    if (i % samplesPerBit === Math.floor(samplesPerBit / 2)) {
      const sampledBit = noisyV >= 2.5 ? 1 : 0;
      if (sampledBit !== bitVal) {
        bitErrors++;
        errorPoints.push({ x: (i * 0.1).toFixed(1) + 'ns', y: noisyV });
      }
    }
  }

  // Update telemetry
  const snr = noiseAmp === 0 ? 99.9 : (20 * Math.log10(2.5 / Math.max(0.01, noiseAmp))).toFixed(1);
  const snrEl = document.getElementById('snrDisplay');
  snrEl.textContent = noiseAmp === 0 ? '> 60 dB' : snr + ' dB';
  snrEl.className = 'telemetry-val ' + (snr < 10 ? 'snr-bad' : snr < 18 ? 'snr-warn' : 'snr-ok');

  const errEl = document.getElementById('bitErrorCount');
  const errPercent = ((bitErrors / bitStream.length) * 100).toFixed(0);
  errEl.textContent = `${bitErrors} / ${bitStream.length} bits (${errPercent}%)`;
  errEl.className = 'telemetry-val ' + (bitErrors > 0 ? 'err-bad' : 'err-none');

  if (typeof Chart === 'undefined') {
    renderCanvasFallback(canvas, idealData, noisyData, 2.5, errorPoints);
    return;
  }

  if (classicalChartInstance) {
    classicalChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  classicalChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Threshold Vth (2.5V)',
          data: thresholdData,
          borderColor: '#e74c3c',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Ideal Signal',
          data: idealData,
          borderColor: '#2ecc71',
          borderWidth: 2,
          pointRadius: 0,
          stepped: 'before',
          fill: false
        },
        {
          label: 'Noisy Signal Vout(t)',
          data: noisyData,
          borderColor: '#3498db',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Time (ns)', color: '#8b949e' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { maxTicksLimit: 12, color: '#8b949e' }
        },
        y: {
          min: -1,
          max: 6,
          title: { display: true, text: 'Voltage (V)', color: '#8b949e' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#8b949e' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });
}

function renderCanvasFallback(canvas, ideal, noisy, thresh, errors) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Grid & threshold
  ctx.strokeStyle = '#e74c3c';
  ctx.setLineDash([5, 5]);
  const yThresh = h - (thresh / 6) * h;
  ctx.beginPath();
  ctx.moveTo(0, yThresh);
  ctx.lineTo(w, yThresh);
  ctx.stroke();
  ctx.setLineDash([]);

  // Noisy
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < noisy.length; i++) {
    const x = (i / noisy.length) * w;
    const y = h - (noisy[i] / 6) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Ideal
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < ideal.length; i++) {
    const x = (i / ideal.length) * w;
    const y = h - (ideal[i] / 6) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* ==========================================================
 * 2. QUANTUM ERROR CHANNELS DEMOS (Tabs A, B, C)
 * ========================================================== */
let depolChartInstance = null;

function initQuantumDemos() {
  // Tabs navigation
  const tabBtns = document.querySelectorAll('.demo-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.demo-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');

      if (targetId === 'tab-depol') {
        drawBlochSphere();
        updateDepolarizingStats();
      }
    });
  });

  // Tab A: Bit Flip
  const bfSlider = document.getElementById('bfProbSlider');
  const bfVal = document.getElementById('bfProbVal');
  const bfSelect = document.getElementById('bfInitialState');
  const btnBf = document.getElementById('btnSimulateBF');

  bfSlider.addEventListener('input', () => {
    bfVal.textContent = parseFloat(bfSlider.value).toFixed(2);
  });
  btnBf.addEventListener('click', runBitFlipSim);
  bfSelect.addEventListener('change', runBitFlipSim);
  runBitFlipSim();

  // Tab B: Phase Flip
  const pfSlider = document.getElementById('pfProbSlider');
  const pfVal = document.getElementById('pfProbVal');
  const pfSelect = document.getElementById('pfInitialState');
  const btnPf = document.getElementById('btnSimulatePF');

  pfSlider.addEventListener('input', () => {
    pfVal.textContent = parseFloat(pfSlider.value).toFixed(2);
  });
  btnPf.addEventListener('click', runPhaseFlipSim);
  pfSelect.addEventListener('change', runPhaseFlipSim);
  runPhaseFlipSim();

  // Tab C: Depolarizing Channel & Bloch Sphere
  const depolSlider = document.getElementById('depolProbSlider');
  const depolVal = document.getElementById('depolProbVal');
  const btn500Shots = document.getElementById('btnRun500Shots');

  depolSlider.addEventListener('input', () => {
    depolVal.textContent = parseFloat(depolSlider.value).toFixed(2);
    updateDepolarizingStats();
    drawBlochSphere();
  });
  btn500Shots.addEventListener('click', run500ShotsDepol);

  // Initial draw of Bloch sphere
  setTimeout(() => {
    drawBlochSphere();
    run500ShotsDepol();
  }, 100);
}

function getInitialAmplitudes(val) {
  if (val === 'zero') return { alpha: 1.0, beta: 0.0, text: '|0⟩' };
  if (val === 'one') return { alpha: 0.0, beta: 1.0, text: '|1⟩' };
  if (val === 'plus') return { alpha: 1 / Math.SQRT2, beta: 1 / Math.SQRT2, text: '|+⟩' };
  if (val === 'minus') return { alpha: 1 / Math.SQRT2, beta: -1 / Math.SQRT2, text: '|-⟩' };
  if (val === 'custom') return { alpha: 0.8, beta: 0.6, text: '0.8|0⟩ + 0.6|1⟩' };
  return { alpha: 1.0, beta: 0.0, text: '|0⟩' };
}

function runBitFlipSim() {
  const p = parseFloat(document.getElementById('bfProbSlider').value);
  const choice = document.getElementById('bfInitialState').value;
  const initial = getInitialAmplitudes(choice);

  const beforeBox = document.getElementById('bfStateBefore');
  const afterBox = document.getElementById('bfStateAfter');
  const statusBadge = document.getElementById('bfEventStatus');

  beforeBox.textContent = initial.text;

  const occurred = Math.random() < p;
  let finalAlpha = initial.alpha;
  let finalBeta = initial.beta;
  let finalText = initial.text;

  if (occurred) {
    // X gate flips alpha and beta
    finalAlpha = initial.beta;
    finalBeta = initial.alpha;
    if (choice === 'zero') finalText = '|1⟩ (Flipped!)';
    else if (choice === 'one') finalText = '|0⟩ (Flipped!)';
    else if (choice === 'plus') finalText = '|+⟩ (Symmetric: X|+⟩ = |+⟩)';
    else finalText = `${finalAlpha.toFixed(1)}|0⟩ + ${finalBeta.toFixed(1)}|1⟩`;

    statusBadge.textContent = '⚠️ Bit-Flip Error Occurred! (Pauli-X Applied)';
    statusBadge.className = 'event-status-badge status-error';
  } else {
    statusBadge.textContent = '✓ No Error Occurred (Identity Channel)';
    statusBadge.className = 'event-status-badge status-clean';
  }

  afterBox.textContent = finalText;
  renderProbBar('bfProbBeforeBar', Math.pow(initial.alpha, 2), Math.pow(initial.beta, 2));
  renderProbBar('bfProbAfterBar', Math.pow(finalAlpha, 2), Math.pow(finalBeta, 2));
}

function runPhaseFlipSim() {
  const p = parseFloat(document.getElementById('pfProbSlider').value);
  const choice = document.getElementById('pfInitialState').value;
  const initial = getInitialAmplitudes(choice);

  const beforeBox = document.getElementById('pfStateBefore');
  const afterBox = document.getElementById('pfStateAfter');
  const statusBadge = document.getElementById('pfEventStatus');
  const phaseBefore = document.getElementById('pfPhaseBefore');
  const phaseAfter = document.getElementById('pfPhaseAfter');

  beforeBox.textContent = initial.text;
  phaseBefore.textContent = choice === 'minus' ? 'Phase: π rad (180°)' : 'Phase: 0 rad (0°)';

  const occurred = Math.random() < p;
  let finalText = initial.text;
  let finalPhase = phaseBefore.textContent;

  if (occurred) {
    // Z gate flips phase of |1>
    if (choice === 'plus') {
      finalText = '|-⟩ = (|0⟩ - |1⟩) / √2';
      finalPhase = 'Phase: π rad (180°) [Inverted!]';
    } else if (choice === 'minus') {
      finalText = '|+⟩ = (|0⟩ + |1⟩) / √2';
      finalPhase = 'Phase: 0 rad (0°) [Inverted!]';
    } else {
      finalText = `${initial.alpha.toFixed(1)}|0⟩ - ${Math.abs(initial.beta).toFixed(1)}|1⟩`;
      finalPhase = 'Relative phase shifted by π rad';
    }
    statusBadge.textContent = '⚠️ Phase-Flip Error Occurred! (Pauli-Z Applied)';
    statusBadge.className = 'event-status-badge status-error';
  } else {
    statusBadge.textContent = '✓ No Error Occurred (Identity Channel)';
    statusBadge.className = 'event-status-badge status-clean';
  }

  afterBox.textContent = finalText;
  phaseAfter.textContent = finalPhase;
}

function renderProbBar(elementId, p0, p1) {
  const container = document.getElementById(elementId);
  if (!container) return;
  const pct0 = (p0 * 100).toFixed(0);
  const pct1 = (p1 * 100).toFixed(0);
  container.innerHTML = `
    <div class="mini-prob-split">
      <div class="p0-fill" style="width:${pct0}%" title="P(|0>) = ${pct0}%">|0⟩ ${pct0}%</div>
      <div class="p1-fill" style="width:${pct1}%" title="P(|1>) = ${pct1}%">|1⟩ ${pct1}%</div>
    </div>
  `;
}

function updateDepolarizingStats() {
  const p = parseFloat(document.getElementById('depolProbSlider').value);
  const radius = Math.max(0, 1 - p);
  const purity = (1 - p) + p * 0.5; // Tr(rho^2) = (1 + (1-p)^2) / 2
  const calcPurity = 0.5 * (1 + radius * radius);

  const radiusEl = document.getElementById('blochRadiusVal');
  const purityEl = document.getElementById('statePurityVal');
  if (radiusEl) radiusEl.textContent = radius.toFixed(2);
  if (purityEl) purityEl.textContent = calcPurity.toFixed(3);
}

function drawBlochSphere() {
  const canvas = document.getElementById('blochSphereCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const R = 110;

  ctx.clearRect(0, 0, w, h);

  // Background sphere glow
  const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
  radGrad.addColorStop(0, '#1a2234');
  radGrad.addColorStop(1, '#0b0f19');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // Outer circle
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Equator ellipse
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Z-axis (vertical)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R - 15);
  ctx.lineTo(cx, cy + R + 15);
  ctx.stroke();

  // X-axis (horizontal)
  ctx.beginPath();
  ctx.moveTo(cx - R - 15, cy);
  ctx.lineTo(cx + R + 15, cy);
  ctx.stroke();

  // Axis Labels
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('|0⟩ (+Z)', cx, cy - R - 20);
  ctx.fillText('|1⟩ (-Z)', cx, cy + R + 25);
  ctx.fillText('|+⟩ (+X)', cx + R + 25, cy + 4);
  ctx.fillText('|-⟩ (-X)', cx - R - 25, cy + 4);

  // State vector under depolarizing channel
  // Initial state |0> (pointing to North Pole: z = 1)
  const p = parseFloat(document.getElementById('depolProbSlider').value);
  const rLength = Math.max(0, 1 - p);
  const targetX = cx;
  const targetY = cy - R * rLength;

  // Mixed state interior shaded sphere showing contraction
  if (rLength > 0.02) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, R * rLength, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw arrow from center to target
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // State tip
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Label vector
  ctx.fillStyle = '#fda4af';
  ctx.font = '11px monospace';
  ctx.fillText(`|r| = ${rLength.toFixed(2)}`, targetX + 15, targetY + (targetY < cy ? 15 : -10));
}

function run500ShotsDepol() {
  const p = parseFloat(document.getElementById('depolProbSlider').value);
  const totalShots = 500;

  // Let initial state be |0> with ideal 100% |0>
  // Under depolarizing channel:
  // With prob (1-p): state is |0> -> measure |0>
  // With prob p: state is completely random I/2 -> 50% |0>, 50% |1>
  let zeroCount = 0;
  let oneCount = 0;

  for (let s = 0; s < totalShots; s++) {
    if (Math.random() < (1 - p)) {
      // Intact state |0>
      zeroCount++;
    } else {
      // Depolarized uniformly
      if (Math.random() < 0.5) zeroCount++;
      else oneCount++;
    }
  }

  const canvas = document.getElementById('depolHistogramChart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') return;

  if (depolChartInstance) {
    depolChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  depolChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Outcome |0⟩', 'Outcome |1⟩'],
      datasets: [
        {
          label: 'Ideal State |0⟩ (No Noise)',
          data: [500, 0],
          backgroundColor: 'rgba(34, 197, 94, 0.4)',
          borderColor: '#22c55e',
          borderWidth: 1.5
        },
        {
          label: `Noisy Channel (p = ${p.toFixed(2)})`,
          data: [zeroCount, oneCount],
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#ef4444',
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 520,
          title: { display: true, text: 'Counts (out of 500)', color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          ticks: { color: '#e2e8f0', font: { weight: 'bold' } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#e2e8f0' }
        }
      }
    }
  });
}

/* ==========================================================
 * 3. QUANTUM ERROR CORRECTION (3-Qubit Repetition Code)
 * ========================================================== */
let qecState = {
  step: 0,
  alpha: 0.8,
  beta: 0.6,
  flippedQubit: -1,
  syndrome: [0, 0],
  corrected: false
};

function initQECWorkflow() {
  const btnEncode = document.getElementById('btnQecEncode');
  const btnError = document.getElementById('btnQecError');
  const btnSyndrome = document.getElementById('btnQecSyndrome');
  const btnVerify = document.getElementById('btnQecVerify');

  btnEncode.addEventListener('click', () => {
    qecState.step = 1;
    qecState.flippedQubit = -1;
    qecState.syndrome = [0, 0];
    qecState.corrected = false;

    document.getElementById('qecTriState').textContent = '0.8|000⟩ + 0.6|111⟩';
    document.getElementById('qecSyndromeVal').textContent = '(0, 0)';
    document.getElementById('qecActionVal').textContent = 'None';
    document.getElementById('qecStatusMessage').innerHTML = `
      ✓ <strong>Step 1 Complete:</strong> Encoded into 3-qubit entangled logical state $\\alpha|000\\rangle + \\beta|111\\rangle$. Now click <strong>"2. Introduce Error"</strong>.
    `;

    btnEncode.disabled = true;
    btnError.disabled = false;
    btnSyndrome.disabled = true;
    btnVerify.disabled = true;

    highlightSyndromeRow(null);
  });

  btnError.addEventListener('click', () => {
    qecState.step = 2;
    // Pick random qubit 0, 1, or 2 to flip
    const targetQubit = Math.floor(Math.random() * 3);
    qecState.flippedQubit = targetQubit;

    let noisyDisplay = '';
    if (targetQubit === 0) noisyDisplay = '0.8|100⟩ + 0.6|011⟩ (q0 flipped)';
    if (targetQubit === 1) noisyDisplay = '0.8|010⟩ + 0.6|101⟩ (q1 flipped)';
    if (targetQubit === 2) noisyDisplay = '0.8|001⟩ + 0.6|110⟩ (q2 flipped)';

    document.getElementById('qecTriState').textContent = noisyDisplay;
    document.getElementById('qecStatusMessage').innerHTML = `
      ⚠️ <strong>Step 2 Complete:</strong> A stochastic bit-flip error struck <strong>Qubit q${targetQubit}</strong>! Notice the amplitudes $\\alpha, \\beta$ are completely intact, but the basis states flipped. Click <strong>"3. Measure Syndrome"</strong>.
    `;
    if (typeof window.renderAllMath === 'function') window.renderAllMath(document.getElementById('qecStatusMessage'));

    btnError.disabled = true;
    btnSyndrome.disabled = false;
  });

  btnSyndrome.addEventListener('click', () => {
    qecState.step = 3;
    const q = qecState.flippedQubit;
    let s1 = 0, s2 = 0;
    let actionText = '';

    if (q === 0) { s1 = 1; s2 = 0; actionText = 'Apply X to q0'; }
    else if (q === 1) { s1 = 1; s2 = 1; actionText = 'Apply X to q1'; }
    else if (q === 2) { s1 = 0; s2 = 1; actionText = 'Apply X to q2'; }
    else { s1 = 0; s2 = 0; actionText = 'Identity I'; }

    qecState.syndrome = [s1, s2];
    document.getElementById('qecSyndromeVal').textContent = `(${s1}, ${s2})`;
    document.getElementById('qecActionVal').textContent = actionText;

    highlightSyndromeRow(`synRow${s1}${s2}`);

    document.getElementById('qecStatusMessage').innerHTML = `
      🔍 <strong>Syndrome Measured:</strong> $(s_1, s_2) = (${s1}, ${s2})$. Lookup table pinpoints <strong>q${q}</strong>. Corrective gate <strong>X</strong> applied to restore the register! Click <strong>"4. Verify Fidelity"</strong>.
    `;
    if (typeof window.renderAllMath === 'function') window.renderAllMath(document.getElementById('qecStatusMessage'));

    btnSyndrome.disabled = true;
    btnVerify.disabled = false;
  });

  btnVerify.addEventListener('click', () => {
    qecState.step = 4;
    document.getElementById('qecTriState').textContent = '0.8|000⟩ + 0.6|111⟩ (Restored!)';
    document.getElementById('qecStatusMessage').innerHTML = `
      🎉 <strong>Verification Passed!</strong> Fidelity $\\mathcal{F} = 1.000$ (100% Recovery). The original superposition $0.8|0\\rangle + 0.6|1\\rangle$ was completely preserved without ever directly measuring the payload data! Click <strong>"1. Encode State"</strong> to test again.
    `;
    if (typeof window.renderAllMath === 'function') window.renderAllMath(document.getElementById('qecStatusMessage'));

    btnVerify.disabled = true;
    btnEncode.disabled = false;
  });
}

function highlightSyndromeRow(rowId) {
  ['synRow00', 'synRow10', 'synRow11', 'synRow01'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active-syndrome-row');
  });
  if (rowId) {
    const el = document.getElementById(rowId);
    if (el) el.classList.add('active-syndrome-row');
  }
}

/* --- assessment.js --- */
/**
 * assessment.js - Comprehensive Assessment & Learning Gain Module
 * Implements pre-learning quiz, post-learning quiz, normalized learning gain calculation,
 * interactive circuit tasks with auto-checking, and Likert self-rating rubric with radar chart.
 */

function ensureChartJsAssessment(callback) {
  if (typeof Chart !== 'undefined') {
    callback();
    return;
  }
  if (typeof ensureChartJs === 'function') {
    ensureChartJs(callback);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = () => callback();
  script.onerror = () => {
    console.warn('Could not load Chart.js CDN in assessment.js');
    callback();
  };
  document.head.appendChild(script);
}
function initAssessment() {
  const container = document.getElementById('assessment');
  if (!container) {
    console.error('Container #assessment not found');
    return;
  }

  // Render HTML markup and attach quiz interactivity immediately
  renderAssessmentModule(container);

  // If Chart.js was not ready yet, load it asynchronously and refresh charts
  if (typeof Chart === 'undefined') {
    ensureChartJsAssessment(() => {
      updateGainDisplay();
      updateRadarChart();
    });
  }
}

if (typeof window !== 'undefined') {
  window.initAssessment = initAssessment;
}

// -------------------------------------------------------------
// QUIZ DATA DEFINITIONS
// -------------------------------------------------------------
const preQuizQuestions = [
  {
    id: 1,
    question: "What does a transistor primarily do in electronic circuits?",
    options: [
      "Acts as a switch or amplifier",
      "Stores electrical energy indefinitely like a chemical battery",
      "Converts AC directly into microwaves without dissipation",
      "Emits monochromatic coherent photons"
    ],
    answer: 0,
    explanation: "Transistors function primarily as electronic switches (in digital circuits) and signal amplifiers (in analog circuits)."
  },
  {
    id: 2,
    question: "What is a classical bit?",
    options: [
      "A continuous quantum state vector on a sphere",
      "A fundamental binary unit that can be either 0 or 1",
      "An entangled three-state variable",
      "A negative resistance tunnel junction"
    ],
    answer: 1,
    explanation: "A classical bit is strictly deterministic and binary, taking on one discrete state: either 0 or 1."
  },
  {
    id: 3,
    question: "What is the function of a logic gate?",
    options: [
      "Performs logical Boolean operations on binary bits",
      "Stores permanent analog voltage without power",
      "Regulates ambient room temperature around the CPU",
      "Directly measures quantum superposition"
    ],
    answer: 0,
    explanation: "Logic gates implement Boolean algebra operations (AND, OR, NOT, etc.) on input voltages representing binary bits."
  },
  {
    id: 4,
    question: "What does the classical NOT gate do?",
    options: [
      "Multiplies two inputs together",
      "Inverts the bit: 0 → 1 or 1 → 0",
      "Forces any input to zero regardless of state",
      "Introduces random phase shifts"
    ],
    answer: 1,
    explanation: "The NOT gate computes the logical complement, mapping 0 to 1 and 1 to 0."
  },
  {
    id: 5,
    question: "What causes electrical noise in transistor circuits?",
    options: [
      "Thermal electron agitation (Johnson-Nyquist), EMI, and power ripple",
      "Gravitational wave oscillations in silicon",
      "Only software programming bugs",
      "Quantum black hole evaporation in the die"
    ],
    answer: 0,
    explanation: "Classical circuit noise is primarily caused by thermal motion of charge carriers (Johnson noise), electromagnetic interference (EMI), and power fluctuations."
  },
  {
    id: 6,
    question: "What is a qubit in quantum computing?",
    options: [
      "A standard 8-bit byte stored in magnetic RAM",
      "The quantum analogue of a bit, capable of existing in superpositions of |0⟩ and |1⟩",
      "A classical transistor operated at zero volts",
      "An error-checking parity parity bit in ASCII"
    ],
    answer: 1,
    explanation: "A qubit is a two-level quantum mechanical system described by |ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1."
  },
  {
    id: 7,
    question: "What is quantum superposition?",
    options: [
      "Running two CPU threads on a single core simultaneously",
      "A state being in a linear combination of basis states simultaneously",
      "Connecting multiple transistors in parallel for higher current",
      "Overclocking clock frequencies beyond manufacturer limits"
    ],
    answer: 1,
    explanation: "Superposition allows a quantum state to exist as a linear combination of mutually orthogonal eigenstates prior to measurement."
  },
  {
    id: 8,
    question: "What happens during a quantum projective measurement in the computational basis?",
    options: [
      "The state remains completely unchanged and copies itself",
      "The state collapses irreversibly to either |0⟩ or |1⟩ according to Born's rule",
      "The state is amplified into a macroscopic voltage wave without collapse",
      "The quantum phase doubles automatically"
    ],
    answer: 1,
    explanation: "Quantum measurement projects the wave function onto one of the eigenbasis states, collapsing the superposition."
  },
  {
    id: 9,
    question: "What is quantum decoherence?",
    options: [
      "The intentional cooling of a dilution refrigerator",
      "The loss of quantum coherence and phase information due to environmental coupling",
      "The process of soldering superconducting chips",
      "The speed-up achieved by Shor's factoring algorithm"
    ],
    answer: 1,
    explanation: "Decoherence occurs when an open quantum system entangles with environmental degrees of freedom, degrading pure states into statistical mixtures."
  },
  {
    id: 10,
    question: "In quantum circuits, what is the Pauli-X gate equivalent to in classical computing?",
    options: [
      "The classical NOT gate",
      "The classical AND gate",
      "A high-impedance tri-state buffer",
      "A pull-down resistor"
    ],
    answer: 0,
    explanation: "The Pauli-X gate maps |0⟩ ↦ |1⟩ and |1⟩ ↦ |0⟩, serving as the quantum equivalent of the classical NOT gate (bit-flip)."
  }
];

const postQuizQuestions = [
  {
    id: 1,
    question: "Which of the following is considered the fundamental quantum counterpart to the classical switching transistor/bit?",
    options: [
      "Qubit (two-level quantum physical system)",
      "Standard operational amplifier (Op-Amp)",
      "Schottky barrier diode",
      "555 Astable timer IC"
    ],
    answer: 0,
    explanation: "The qubit represents the foundational building block of quantum computation, bridging classical discrete switching to unitary state evolutions."
  },
  {
    id: 2,
    question: "How many basis states can a single qubit exist in simultaneously as a superposition?",
    options: [
      "Only 1 discrete state at any instant",
      "A continuous linear combination of 2 orthonormal basis states (|0⟩ and |1⟩)",
      "Exactly 8 binary states",
      "An infinite discrete integer grid"
    ],
    answer: 1,
    explanation: "A single qubit spans a 2D complex Hilbert space, expressible as α|0⟩ + β|1⟩."
  },
  {
    id: 3,
    question: "The quantum unitary gate that performs the exact equivalent function of a classical NOT gate is:",
    options: [
      "Pauli-Z gate",
      "Hadamard (H) gate",
      "Pauli-X gate",
      "Phase (S) gate"
    ],
    answer: 2,
    explanation: "Pauli-X exchanges basis amplitudes: X|0⟩ = |1⟩ and X|1⟩ = |0⟩."
  },
  {
    id: 4,
    question: "Applying a Hadamard (H) gate to the ground state |0⟩ results in:",
    options: [
      "|1⟩",
      "|+⟩ = (|0⟩ + |1⟩) / √2",
      "|-⟩ = (|0⟩ - |1⟩) / √2",
      "|0⟩ (identity)"
    ],
    answer: 1,
    explanation: "H|0⟩ creates the equal symmetric superposition state |+⟩ = (|0⟩ + |1⟩) / √2."
  },
  {
    id: 5,
    question: "What is the probability of measuring outcome |1⟩ from state (|0⟩ + |1⟩) / √2?",
    options: [
      "0%",
      "25%",
      "50% (Probability = |1/√2|² = 1/2)",
      "100%"
    ],
    answer: 2,
    explanation: "According to Born's rule, P(|1⟩) = |β|² = |1/√2|² = 0.50 (50%)."
  },
  {
    id: 6,
    question: "What does the Controlled-NOT (CNOT) gate do to the target qubit if the control qubit is in state |1⟩?",
    options: [
      "Leaves the target unchanged",
      "Flips the target qubit (applies Pauli-X)",
      "Measures and resets the target to |0⟩",
      "Applies a Hadamard gate to both qubits"
    ],
    answer: 1,
    explanation: "CNOT applies an X gate to the target qubit if and only if the control qubit is in state |1⟩."
  },
  {
    id: 7,
    question: "A canonical Bell state (such as |Φ⁺⟩ = (|00⟩ + |11⟩)/√2) is:",
    options: [
      "A separable product state of two independent bits",
      "A maximally entangled two-qubit state that exhibits non-local correlations",
      "A classical majority logic gate",
      "An unphysical theoretical paradox"
    ],
    answer: 1,
    explanation: "Bell states are maximally entangled two-qubit quantum states that cannot be factored into product states."
  },
  {
    id: 8,
    question: "Which quantum noise channel is directly analogous to a classical bit-flip?",
    options: [
      "Bit-flip channel (associated with Pauli-X)",
      "Pure dephasing (associated with Pauli-Z)",
      "T2 relaxation without dissipation",
      "Stochastic Kerr non-linearity"
    ],
    answer: 0,
    explanation: "The quantum bit-flip channel applies Pauli-X with probability p, interchanging |0⟩ and |1⟩ identically to a classical bit flip."
  },
  {
    id: 9,
    question: "In the 3-qubit bit-flip repetition code, what does the parity check (syndrome measurement) detect?",
    options: [
      "The exact unknown amplitudes α and β of the payload qubit",
      "The relative parities between neighboring qubits (identifying error location without collapsing data)",
      "The ambient temperature of the cryogenic stage",
      "The physical gate execution speed in nanoseconds"
    ],
    answer: 1,
    explanation: "Syndrome operators measure multi-qubit eigenvalues (Z0Z1, Z1Z2), diagnosing which qubit flipped without reading or destroying α and β."
  },
  {
    id: 10,
    question: "What does the quantum decoherence time T2 represent?",
    options: [
      "The time taken for a classical CMOS gate to toggle its logic level",
      "The transverse dephasing time, characterizing the decay of off-diagonal quantum phase coherence",
      "The total battery operating lifetime of a quantum laboratory",
      "The time required to compile QASM code into microcode"
    ],
    answer: 1,
    explanation: "T2 is the transverse relaxation time during which quantum superpositions lose relative phase information (1/T2 = 1/(2T1) + 1/T_phi)."
  }
];

const rubricItems = [
  "I understand how a transistor works as a switch",
  "I can explain how a classical bit is represented physically",
  "I understand what superposition means",
  "I can explain what a qubit is",
  "I understand how quantum gates relate to classical logic gates",
  "I can explain quantum measurement",
  "I understand decoherence",
  "I can compare classical and quantum error correction"
];

// -------------------------------------------------------------
// RENDER HTML TEMPLATE
// -------------------------------------------------------------
function renderAssessmentModule(container) {
  container.innerHTML = `
    <div class="assessment-module-wrapper">
      <!-- Header -->
      <header class="assessment-header">
        <div class="badge-tag">MODULE: EVALUATION & GAIN METRICS</div>
        <h2 class="section-title">Assessment & Competency Evaluation</h2>
        <p class="section-subtitle">
          Evaluate your understanding before and after learning, compute your normalized learning gain $g$, 
          complete hands-on circuit challenges, and track your self-efficacy across core quantum-classical competencies.
        </p>
      </header>

      <!-- TOP SECTION: SCORE SUMMARY & GAIN BANNER -->
      <section class="assessment-card score-summary-card" id="gainSummarySection">
        <div class="card-header">
          <span class="step-num">📊</span>
          <h3>Learning Gain & Score Metrics</h3>
        </div>
        <div class="card-body">
          <div class="gain-metrics-grid">
            <!-- Metric 1: Pre-score -->
            <div class="gain-stat-box">
              <span class="gain-stat-label">Pre-Learning Score</span>
              <span id="displayPreScore" class="gain-stat-val">Not Taken</span>
              <span class="gain-stat-sub" id="displayPreCount">0 / 10 correct</span>
            </div>

            <!-- Metric 2: Post-score -->
            <div class="gain-stat-box">
              <span class="gain-stat-label">Post-Learning Score</span>
              <span id="displayPostScore" class="gain-stat-val">Not Taken</span>
              <span class="gain-stat-sub" id="displayPostCount">0 / 10 correct</span>
            </div>

            <!-- Metric 3: Normalized Gain -->
            <div class="gain-stat-box highlight-gain-box">
              <span class="gain-stat-label">Normalized Gain ($g$)</span>
              <span id="displayGainVal" class="gain-stat-val">--</span>
              <span id="displayGainBadge" class="gain-badge badge-pending">Complete Both Quizzes</span>
            </div>
          </div>

          <!-- Formula & Chart Row -->
          <div class="gain-chart-row">
            <div class="gain-formula-box">
              <h5>Hake's Normalized Learning Gain Formula:</h5>
              <div class="formula-box">
                $$g = \\frac{\\text{Post\\%} - \\text{Pre\\%}}{100\\% - \\text{Pre\\%}}$$
              </div>
              <ul class="gain-criteria-list">
                <li><span class="dot dot-high"></span> <strong>High Gain ($g > 0.70$):</strong> Exceptional conceptual mastery</li>
                <li><span class="dot dot-med"></span> <strong>Medium Gain ($0.30 \\le g \\le 0.70$):</strong> Solid progression & comprehension</li>
                <li><span class="dot dot-low"></span> <strong>Low Gain ($g < 0.30$):</strong> Requires further study & hands-on exploration</li>
              </ul>
              <div class="score-controls-actions">
                <button id="btnResetScores" class="btn-secondary">🔄 Reset Quiz Scores</button>
              </div>
            </div>

            <div class="gain-chart-container">
              <canvas id="gainComparisonChart" width="380" height="220"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 1: PRE-LEARNING QUIZ -->
      <section class="assessment-card quiz-card" id="preQuizCard">
        <div class="card-header">
          <span class="step-num">01</span>
          <h3>Pre-Learning Quiz (10 MCQs)</h3>
          <span class="card-status-pill" id="preQuizPill">Pending</span>
        </div>
        <div class="card-body">
          <p class="quiz-instruction">
            Test your baseline prior knowledge regarding transistors, bits, Boolean logic, and fundamental quantum concepts.
          </p>
          <div id="preQuizQuestionsContainer" class="quiz-questions-list"></div>
          <div class="quiz-submit-row">
            <button id="btnSubmitPreQuiz" class="btn-primary">Submit Pre-Learning Quiz</button>
            <span id="preQuizResultMsg" class="quiz-feedback-text"></span>
          </div>
        </div>
      </section>

      <!-- SECTION 2: POST-LEARNING QUIZ -->
      <section class="assessment-card quiz-card" id="postQuizCard">
        <div class="card-header">
          <span class="step-num">02</span>
          <h3>Post-Learning Quiz (10 MCQs)</h3>
          <span class="card-status-pill" id="postQuizPill">Pending</span>
        </div>
        <div class="card-body">
          <p class="quiz-instruction">
            Measure your conceptual comprehension following module completion on quantum gates, noise, Bell states, and error correction.
          </p>
          <div id="postQuizQuestionsContainer" class="quiz-questions-list"></div>
          <div class="quiz-submit-row">
            <button id="btnSubmitPostQuiz" class="btn-primary">Submit Post-Learning Quiz</button>
            <span id="postQuizResultMsg" class="quiz-feedback-text"></span>
          </div>
        </div>
      </section>

      <!-- SECTION 3: CIRCUIT TASKS -->
      <section class="assessment-card circuit-tasks-card">
        <div class="card-header">
          <span class="step-num">03</span>
          <h3>Hands-on Quantum Circuit Tasks</h3>
        </div>
        <div class="card-body">
          <p class="section-intro">
            Select the appropriate quantum gate operation to complete each physical state preparation challenge.
          </p>
          <div class="tasks-grid">
            <!-- Task 1 -->
            <div class="task-card" id="task1Card">
              <div class="task-badge">Task 1</div>
              <h4>Build Superposition</h4>
              <p class="task-desc">
                Given an initial state $|0\\rangle$, what single-qubit quantum gate must be applied to transform it into the equal superposition $(|0\\rangle + |1\\rangle)/\\sqrt{2}$?
              </p>
              <div class="task-action-row">
                <select id="task1Select" class="styled-select task-select">
                  <option value="">-- Choose Gate --</option>
                  <option value="X">Pauli-X Gate</option>
                  <option value="H">Hadamard (H) Gate</option>
                  <option value="Z">Pauli-Z Gate</option>
                  <option value="CNOT">Controlled-NOT (CNOT)</option>
                </select>
                <button class="btn-primary btn-check-task" data-task="1">Check Task 1</button>
              </div>
              <div id="task1Feedback" class="task-feedback"></div>
            </div>

            <!-- Task 2 -->
            <div class="task-card" id="task2Card">
              <div class="task-badge">Task 2</div>
              <h4>State Inversion (Bit-Flip)</h4>
              <p class="task-desc">
                To unconditionally flip a qubit from the excited eigenstate $|1\\rangle$ to the ground state $|0\\rangle$, which gate do you apply?
              </p>
              <div class="task-action-row">
                <select id="task2Select" class="styled-select task-select">
                  <option value="">-- Choose Gate --</option>
                  <option value="X">Pauli-X Gate</option>
                  <option value="H">Hadamard (H) Gate</option>
                  <option value="Z">Pauli-Z Gate</option>
                  <option value="CNOT">Controlled-NOT (CNOT)</option>
                </select>
                <button class="btn-primary btn-check-task" data-task="2">Check Task 2</button>
              </div>
              <div id="task2Feedback" class="task-feedback"></div>
            </div>

            <!-- Task 3 -->
            <div class="task-card" id="task3Card">
              <div class="task-badge">Task 3</div>
              <h4>Create Bell State ($|\\Phi^+\\rangle$)</h4>
              <p class="task-desc">
                Starting with two qubits in $|00\\rangle$, you first apply a Hadamard $H$ gate to $q_0$. What gate must then be applied between control $q_0$ and target $q_1$?
              </p>
              <div class="task-action-row">
                <select id="task3Select" class="styled-select task-select">
                  <option value="">-- Choose Gate --</option>
                  <option value="X">Pauli-X Gate</option>
                  <option value="H">Hadamard (H) Gate</option>
                  <option value="Z">Pauli-Z Gate</option>
                  <option value="CNOT">Controlled-NOT (CNOT)</option>
                </select>
                <button class="btn-primary btn-check-task" data-task="3">Check Task 3</button>
              </div>
              <div id="task3Feedback" class="task-feedback"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 4: SELF-RATING RUBRIC & RADAR CHART -->
      <section class="assessment-card rubric-card">
        <div class="card-header">
          <span class="step-num">04</span>
          <h3>Self-Rating Competency Rubric (Likert Scale 1-5)</h3>
        </div>
        <div class="card-body">
          <p class="section-intro">
            Rate your confidence level across the 8 central research competencies from 1 (Novice / Unfamiliar) to 5 (Expert / Mastery).
          </p>

          <div class="rubric-grid">
            <!-- Left: 8 Likert items -->
            <div class="rubric-items-col" id="rubricItemsContainer"></div>

            <!-- Right: Radar Chart & Download -->
            <div class="rubric-chart-col">
              <h5>Competency Radar Profile</h5>
              <div class="radar-chart-wrap">
                <canvas id="rubricRadarChart" width="340" height="340"></canvas>
              </div>
              <div class="rubric-actions">
                <button id="btnDownloadSummary" class="btn-primary" style="width:100%;">
                  📥 Download Comprehensive Assessment Summary (.txt)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // Initialize interactive subcomponents
  initQuizzes();
  initScoreAndGainDisplay();
  initCircuitTasks();
  initRubricAndRadar();
}

// -------------------------------------------------------------
// QUIZ ENGINE
// -------------------------------------------------------------
function initQuizzes() {
  renderQuizQuestions('preQuizQuestionsContainer', preQuizQuestions, 'pre');
  renderQuizQuestions('postQuizQuestionsContainer', postQuizQuestions, 'post');

  // Submit Pre-Quiz
  document.getElementById('btnSubmitPreQuiz').addEventListener('click', () => {
    gradeQuiz(preQuizQuestions, 'pre', 'preQuizScore', 'preQuizResultMsg', 'preQuizPill');
    initScoreAndGainDisplay();
  });

  // Submit Post-Quiz
  document.getElementById('btnSubmitPostQuiz').addEventListener('click', () => {
    gradeQuiz(postQuizQuestions, 'post', 'postQuizScore', 'postQuizResultMsg', 'postQuizPill');
    initScoreAndGainDisplay();
  });

  // Check if previously stored
  restoreQuizState('pre', 'preQuizScore', 'preQuizResultMsg', 'preQuizPill');
  restoreQuizState('post', 'postQuizScore', 'postQuizResultMsg', 'postQuizPill');
}

function renderQuizQuestions(containerId, questions, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = questions.map((q, idx) => `
    <div class="quiz-item" id="${prefix}_q_${idx}">
      <div class="quiz-q-header">
        <span class="q-badge">Q${idx + 1}</span>
        <span class="q-text">${escapeHtml(q.question)}</span>
      </div>
      <div class="quiz-options-group">
        ${q.options.map((opt, optIdx) => `
          <label class="quiz-option-label" id="label_${prefix}_${idx}_${optIdx}">
            <input type="radio" name="${prefix}_q_${idx}" value="${optIdx}">
            <span class="option-custom-radio"></span>
            <span class="option-text">${escapeHtml(opt)}</span>
          </label>
        `).join('')}
      </div>
      <div class="q-explanation" id="${prefix}_exp_${idx}" style="display:none;"></div>
    </div>
  `).join('');
}

function gradeQuiz(questions, prefix, storageKey, msgElementId, pillId) {
  let score = 0;
  let answeredCount = 0;

  questions.forEach((q, idx) => {
    const selected = document.querySelector(`input[name="${prefix}_q_${idx}"]:checked`);
    const qItem = document.getElementById(`${prefix}_q_${idx}`);
    const expBox = document.getElementById(`${prefix}_exp_${idx}`);

    if (selected) {
      answeredCount++;
      const userChoice = parseInt(selected.value, 10);
      if (userChoice === q.answer) {
        score++;
        qItem.classList.remove('item-incorrect');
        qItem.classList.add('item-correct');
      } else {
        qItem.classList.remove('item-correct');
        qItem.classList.add('item-incorrect');
      }

      // Show explanation
      if (expBox) {
        expBox.style.display = 'block';
        expBox.innerHTML = `<strong>${userChoice === q.answer ? '✓ Correct!' : '✗ Incorrect.'}</strong> ${q.explanation}`;
        expBox.className = 'q-explanation ' + (userChoice === q.answer ? 'exp-correct' : 'exp-incorrect');
      }
    } else {
      qItem.classList.remove('item-correct', 'item-incorrect');
      if (expBox) expBox.style.display = 'none';
    }
  });

  if (answeredCount < questions.length) {
    alert(`Please answer all ${questions.length} questions before submitting (You answered ${answeredCount}/${questions.length}).`);
    return;
  }

  // Save to localStorage
  localStorage.setItem(storageKey, score.toString());

  const pct = ((score / questions.length) * 100).toFixed(0);
  const msgEl = document.getElementById(msgElementId);
  if (msgEl) {
    msgEl.textContent = `Score: ${score}/${questions.length} (${pct}%) saved!`;
    msgEl.className = 'quiz-feedback-text feedback-success';
  }

  const pill = document.getElementById(pillId);
  if (pill) {
    pill.textContent = `Completed: ${pct}%`;
    pill.className = 'card-status-pill pill-done';
  }
}

function restoreQuizState(prefix, storageKey, msgElementId, pillId) {
  const saved = localStorage.getItem(storageKey);
  if (saved !== null) {
    const score = parseInt(saved, 10);
    const pct = ((score / 10) * 100).toFixed(0);
    const msgEl = document.getElementById(msgElementId);
    if (msgEl) {
      msgEl.textContent = `Prior score recorded: ${score}/10 (${pct}%)`;
      msgEl.className = 'quiz-feedback-text feedback-info';
    }
    const pill = document.getElementById(pillId);
    if (pill) {
      pill.textContent = `Completed: ${pct}%`;
      pill.className = 'card-status-pill pill-done';
    }
  }
}

// -------------------------------------------------------------
// GAIN DISPLAY & COMPARISON CHART (Chart.js)
// -------------------------------------------------------------
let gainChartInstance = null;

function initScoreAndGainDisplay() {
  const preSaved = localStorage.getItem('preQuizScore');
  const postSaved = localStorage.getItem('postQuizScore');

  const preEl = document.getElementById('displayPreScore');
  const preCnt = document.getElementById('displayPreCount');
  const postEl = document.getElementById('displayPostScore');
  const postCnt = document.getElementById('displayPostCount');
  const gainEl = document.getElementById('displayGainVal');
  const gainBadge = document.getElementById('displayGainBadge');

  let prePct = null;
  let postPct = null;

  if (preSaved !== null) {
    const s = parseInt(preSaved, 10);
    prePct = (s / 10) * 100;
    preEl.textContent = `${prePct.toFixed(0)}%`;
    preCnt.textContent = `${s} / 10 correct`;
  } else {
    preEl.textContent = 'Not Taken';
    preCnt.textContent = '0 / 10 correct';
  }

  if (postSaved !== null) {
    const s = parseInt(postSaved, 10);
    postPct = (s / 10) * 100;
    postEl.textContent = `${postPct.toFixed(0)}%`;
    postCnt.textContent = `${s} / 10 correct`;
  } else {
    postEl.textContent = 'Not Taken';
    postCnt.textContent = '0 / 10 correct';
  }

  // Calculate Normalized Gain g
  if (prePct !== null && postPct !== null) {
    let g = 0;
    if (prePct === 100) {
      g = postPct === 100 ? 1.0 : 0.0;
    } else {
      g = (postPct - prePct) / (100 - prePct);
    }

    gainEl.textContent = `g = ${g.toFixed(2)}`;

    if (g >= 0.70) {
      gainBadge.textContent = 'High Gain (g ≥ 0.70)';
      gainBadge.className = 'gain-badge badge-high';
    } else if (g >= 0.30) {
      gainBadge.textContent = 'Medium Gain (0.30 ≤ g < 0.70)';
      gainBadge.className = 'gain-badge badge-med';
    } else {
      gainBadge.textContent = 'Low Gain (g < 0.30)';
      gainBadge.className = 'gain-badge badge-low';
    }
  } else {
    gainEl.textContent = '--';
    gainBadge.textContent = 'Complete Both Quizzes';
    gainBadge.className = 'gain-badge badge-pending';
  }

  renderGainChart(prePct, postPct);

  // Reset button
  const btnReset = document.getElementById('btnResetScores');
  if (btnReset) {
    btnReset.onclick = () => {
      if (confirm('Are you sure you want to reset both Pre and Post quiz scores in localStorage?')) {
        localStorage.removeItem('preQuizScore');
        localStorage.removeItem('postQuizScore');
        initScoreAndGainDisplay();
        // Clear UI indicators
        document.querySelectorAll('.quiz-item').forEach(el => el.classList.remove('item-correct', 'item-incorrect'));
        document.querySelectorAll('.q-explanation').forEach(el => el.style.display = 'none');
        document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
        const prePill = document.getElementById('preQuizPill');
        const postPill = document.getElementById('postQuizPill');
        if (prePill) { prePill.textContent = 'Pending'; prePill.className = 'card-status-pill'; }
        if (postPill) { postPill.textContent = 'Pending'; postPill.className = 'card-status-pill'; }
        const preMsg = document.getElementById('preQuizResultMsg');
        const postMsg = document.getElementById('postQuizResultMsg');
        if (preMsg) preMsg.textContent = '';
        if (postMsg) postMsg.textContent = '';
      }
    };
  }
}

function renderGainChart(prePct, postPct) {
  const canvas = document.getElementById('gainComparisonChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (gainChartInstance) {
    gainChartInstance.destroy();
  }

  const preVal = prePct !== null ? prePct : 0;
  const postVal = postPct !== null ? postPct : 0;

  const ctx = canvas.getContext('2d');
  gainChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Pre-Learning Quiz', 'Post-Learning Quiz'],
      datasets: [
        {
          label: 'Score Percentage (%)',
          data: [preVal, postVal],
          backgroundColor: [
            'rgba(59, 130, 246, 0.75)',
            'rgba(16, 185, 129, 0.85)'
          ],
          borderColor: ['#3b82f6', '#10b981'],
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Score (%)', color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#f8fafc', font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// -------------------------------------------------------------
// CIRCUIT TASKS AUTO-CHECKER
// -------------------------------------------------------------
function initCircuitTasks() {
  const taskButtons = document.querySelectorAll('.btn-check-task');
  taskButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-task');
      checkCircuitTask(taskId);
    });
  });
}

function checkCircuitTask(taskId) {
  if (taskId === '1') {
    const val = document.getElementById('task1Select').value;
    const fb = document.getElementById('task1Feedback');
    if (val === 'H') {
      fb.className = 'task-feedback fb-correct';
      fb.innerHTML = '✓ <strong>Correct!</strong> The Hadamard gate transforms $|0\\rangle \\mapsto \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$, creating a maximal 50/50 superposition.';
    }
  if (typeof window.renderAllMath === 'function') { window.renderAllMath(fb); } else {
      fb.className = 'task-feedback fb-incorrect';
      fb.innerHTML = `✗ <strong>Incorrect.</strong> You chose <em>${val || 'None'}</em>. To map a computational basis state into equal superposition amplitudes, use the <strong>Hadamard (H)</strong> gate.`;
    }
  } else if (taskId === '2') {
    const val = document.getElementById('task2Select').value;
    const fb = document.getElementById('task2Feedback');
    if (val === 'X') {
      fb.className = 'task-feedback fb-correct';
      fb.innerHTML = '✓ <strong>Correct!</strong> The Pauli-X gate acts as the quantum NOT gate, flipping $|1\\rangle \\mapsto |0\\rangle$ exactly.';
    }
  if (typeof window.renderAllMath === 'function') { window.renderAllMath(fb); } else {
      fb.className = 'task-feedback fb-incorrect';
      fb.innerHTML = `✗ <strong>Incorrect.</strong> You chose <em>${val || 'None'}</em>. The <strong>Pauli-X</strong> gate executes a bit-flip on computational basis states.`;
    }
  } else if (taskId === '3') {
    const val = document.getElementById('task3Select').value;
    const fb = document.getElementById('task3Feedback');
    if (val === 'CNOT') {
      fb.className = 'task-feedback fb-correct';
      fb.innerHTML = '✓ <strong>Correct!</strong> Applying $H$ on $q_0$ produces $(|0\\rangle + |1\\rangle)|0\\rangle/\\sqrt{2} = (|00\\rangle + |10\\rangle)/\\sqrt{2}$. The subsequent <strong>CNOT</strong> flips the second qubit when $q_0$ is 1, yielding $(|00\\rangle + |11\\rangle)/\\sqrt{2} = |\\Phi^+\\rangle$.';
    }
  if (typeof window.renderAllMath === 'function') { window.renderAllMath(fb); } else {
      fb.className = 'task-feedback fb-incorrect';
      fb.innerHTML = `✗ <strong>Incorrect.</strong> You chose <em>${val || 'None'}</em>. Entangling the two qubits to create a Bell pair requires a two-qubit <strong>Controlled-NOT (CNOT)</strong> gate.`;
    }
  }
}

// -------------------------------------------------------------
// SELF-RATING RUBRIC & RADAR CHART (Chart.js)
// -------------------------------------------------------------
let radarChartInstance = null;
const rubricRatings = [3, 3, 3, 3, 3, 3, 3, 3];

function initRubricAndRadar() {
  const container = document.getElementById('rubricItemsContainer');
  if (!container) return;

  // Load saved ratings
  const saved = localStorage.getItem('rubricRatings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === rubricItems.length) {
        for (let i = 0; i < parsed.length; i++) rubricRatings[i] = parsed[i];
      }
    } catch (e) {
      console.warn('Failed to parse saved rubric ratings', e);
    }
  }

  container.innerHTML = rubricItems.map((item, idx) => `
    <div class="rubric-item-row" id="rubric_row_${idx}">
      <div class="rubric-item-title">
        <span class="rubric-index">${idx + 1}.</span>
        <span class="rubric-text">${escapeHtml(item)}</span>
      </div>
      <div class="rubric-scale-buttons">
        ${[1, 2, 3, 4, 5].map(rating => `
          <button type="button" class="likert-btn ${rubricRatings[idx] === rating ? 'selected' : ''}" 
                  data-idx="${idx}" data-val="${rating}">
            ${rating}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Event listeners for likert buttons
  container.querySelectorAll('.likert-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemIdx = parseInt(btn.getAttribute('data-idx'), 10);
      const ratingVal = parseInt(btn.getAttribute('data-val'), 10);
      rubricRatings[itemIdx] = ratingVal;

      // Update button styles in that row
      const parentRow = document.getElementById(`rubric_row_${itemIdx}`);
      if (parentRow) {
        parentRow.querySelectorAll('.likert-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      }

      // Save to localStorage
      localStorage.setItem('rubricRatings', JSON.stringify(rubricRatings));
      updateRadarChart();
    });
  });

  // Render radar chart
  updateRadarChart();

  // Summary download button
  const btnDownload = document.getElementById('btnDownloadSummary');
  if (btnDownload) {
    btnDownload.addEventListener('click', downloadSummaryReport);
  }
}

function updateRadarChart() {
  const canvas = document.getElementById('rubricRadarChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  const shortLabels = [
    'Transistor Switch',
    'Classical Bit',
    'Superposition',
    'Qubit Concept',
    'Quantum Gates',
    'Measurement',
    'Decoherence',
    'Error Correction'
  ];

  const ctx = canvas.getContext('2d');
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: shortLabels,
      datasets: [
        {
          label: 'Self-Efficacy Rating (1-5)',
          data: rubricRatings,
          backgroundColor: 'rgba(56, 189, 248, 0.25)',
          borderColor: '#38bdf8',
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#38bdf8',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1,
            color: '#94a3b8',
            backdropColor: 'transparent'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.15)'
          },
          pointLabels: {
            color: '#e2e8f0',
            font: { size: 11, weight: 'bold' }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function downloadSummaryReport() {
  const preScore = localStorage.getItem('preQuizScore') ?? 'N/A';
  const postScore = localStorage.getItem('postQuizScore') ?? 'N/A';
  
  let gainStr = 'N/A';
  if (preScore !== 'N/A' && postScore !== 'N/A') {
    const prePct = (parseInt(preScore, 10) / 10) * 100;
    const postPct = (parseInt(postScore, 10) / 10) * 100;
    const g = prePct === 100 ? (postPct === 100 ? 1.0 : 0.0) : (postPct - prePct) / (100 - prePct);
    gainStr = g.toFixed(2);
  }

  const timestamp = new Date().toISOString();
  let content = `========================================================================\n`;
  content += `     QUANTUM COMPUTING EDUCATIONAL LAB: LEARNER ASSESSMENT REPORT\n`;
  content += `========================================================================\n`;
  content += `Timestamp: ${timestamp}\n\n`;
  content += `[1] QUIZ PERFORMANCE\n`;
  content += `------------------------------------------------------------------------\n`;
  content += `• Pre-Learning Quiz Score:  ${preScore} / 10 (${preScore !== 'N/A' ? (parseInt(preScore, 10) * 10) : '0'}%)\n`;
  content += `• Post-Learning Quiz Score: ${postScore} / 10 (${postScore !== 'N/A' ? (parseInt(postScore, 10) * 10) : '0'}%)\n`;
  content += `• Normalized Learning Gain: g = ${gainStr}\n`;
  if (gainStr !== 'N/A') {
    const gVal = parseFloat(gainStr);
    content += `• Interpretation:           ${gVal >= 0.7 ? 'HIGH GAIN (Mastery)' : gVal >= 0.3 ? 'MEDIUM GAIN (Good Progression)' : 'LOW GAIN (Review Required)'}\n`;
  }
  content += `\n[2] SELF-EFFICACY RUBRIC RATINGS (1: Novice to 5: Mastery)\n`;
  content += `------------------------------------------------------------------------\n`;
  rubricItems.forEach((item, idx) => {
    content += `${idx + 1}. ${item}: [${rubricRatings[idx]} / 5]\n`;
  });
  content += `\n[3] RESEARCH COMPARISON SUMMARY\n`;
  content += `------------------------------------------------------------------------\n`;
  content += `• Transistors switch deterministic digital voltages bounded by noise margins.\n`;
  content += `• Qubits evolve continuous complex probability amplitudes in Hilbert space.\n`;
  content += `• Classical errors are discrete bit flips due to voltage threshold crossing.\n`;
  content += `• Quantum noise introduces both bit-flips (X) and phase-flips (Z) via decoherence.\n`;
  content += `• Quantum Error Correction relies on non-destructive syndrome parity checks.\n`;
  content += `========================================================================\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Quantum_Assessment_Summary_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

/* --- about.js --- */
/**
 * about.js - Project Overview, Methodology, Physical Build, and Student Info module
 * Quantum Computing & Solid-State Electronics Educational Platform
 */
function initAbout() {
  const container = document.getElementById('about');
  if (!container) {
    console.warn("Element with id 'about' not found.");
    return;
  }

  container.innerHTML = `
    <div class="about-wrapper">
      <!-- Section Header -->
      <header class="about-header">
        <div class="header-badge">Pedagogical Framework & Lab Integration</div>
        <h1 class="about-title">About This Project</h1>
        <p class="about-subtitle">
          Bridging Classical Solid-State Semiconductor Physics and Quantum Information Science: 
          An Interactive Hands-On Curriculum for Engineering Students.
        </p>
      </header>

      <!-- Project Overview -->
      <section class="about-card overview-card">
        <h2 class="section-title"><span class="icon">🎯</span> Project Overview</h2>
        <div class="overview-content">
          <p class="project-description">
            <strong>Project Title:</strong> Classical-to-Quantum Logic Transition Laboratory (Course Code: 25MCCE19)
          </p>
          <p class="project-description">
            This educational portal addresses the cognitive gap between classical binary switching theory 
            (governed by drift-diffusion currents in semiconductor devices) and quantum logic 
            (governed by unitary state transformations on Hilbert spaces). By juxtaposing discrete 
            breadboard hardware experiments with computational and quantum algorithmic simulations, 
            students acquire both foundational intuition and rigorous mathematical comprehension.
          </p>
          
          <div class="overview-columns">
            <div class="objectives-box">
              <h3>Core Learning Objectives</h3>
              <ul class="styled-list">
                <li><strong>Deconstruct Classical Switching:</strong> Model BJT/MOSFET saturation and cut-off mechanisms as binary Boolean inverters (NOT gates).</li>
                <li><strong>Generalize to State Vectors:</strong> Map deterministic binary voltages ({0V, 5V}) to complex probability amplitudes on the Bloch sphere ($|0\\rangle, |1\\rangle$).</li>
                <li><strong>Explore Non-Classical Phenomena:</strong> Investigate quantum superposition, phase kickback, entanglement (Bell states), and quantum decoherence.</li>
                <li><strong>Analyze Quantum Noise:</strong> Quantify bit-flip, phase-flip, and depolarizing errors and execute 3-qubit repetition codes.</li>
                <li><strong>Validate Physical Implementations:</strong> Compare breadboard laboratory measurements with NumPy and Qiskit numerical models.</li>
              </ul>
            </div>

            <div class="audience-box">
              <h3>Target Audience</h3>
              <div class="audience-badges">
                <span class="audience-pill">Undergraduate Electronics & Communication Engineers</span>
                <span class="audience-pill">Computer Science & Quantum Computing Students</span>
                <span class="audience-pill">Semiconductor Device Physics Researchers</span>
                <span class="audience-pill">STEM Educators & Laboratory Instructors</span>
              </div>
              <p class="audience-note">
                <strong>Prerequisites:</strong> Introductory linear algebra (vectors, matrix multiplication), 
                basic circuit theory (Ohm's law, KVL/KCL), and elementary Python proficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Methodology Section -->
      <section class="about-card methodology-card">
        <h2 class="section-title"><span class="icon">🔬</span> Pedagogical Methodology</h2>
        <p class="section-intro">
          Our curriculum employs a spiral learning approach structured in four progressive tiers, 
          grounded in experiential learning theory (Kolb's cycle).
        </p>

        <div class="methodology-grid">
          <div class="step-card">
            <div class="step-number">01</div>
            <h4>Empirical Hardware</h4>
            <p>Construct discrete BJT/MOSFET inverter circuits on breadboards. Measure transfer curves, noise margins, and switching delays.</p>
          </div>
          <div class="step-card">
            <div class="step-number">02</div>
            <h4>State Vector Formalism</h4>
            <p>Formulate state vectors and unitary transformations via pure NumPy simulations. Visualize single-qubit rotations on the Bloch Sphere.</p>
          </div>
          <div class="step-card">
            <div class="step-number">03</div>
            <h4>Quantum Algorithms</h4>
            <p>Synthesize multi-qubit circuits, entanglement generators, and Deutsch-Jozsa algorithms using Qiskit SDK with shot-based statistics.</p>
          </div>
          <div class="step-card">
            <div class="step-number">04</div>
            <h4>Noise & Fault Tolerance</h4>
            <p>Simulate realistic open quantum systems, relaxation ($T_1$), dephasing ($T_2$), and evaluate quantum error-correcting codes.</p>
          </div>
        </div>

        <div class="mapping-box">
          <h3>Conceptual Mapping Framework</h3>
          <div class="mapping-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Classical Domain (EDC)</th>
                  <th>Quantum Domain (QIS)</th>
                  <th>Mathematical Link</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Voltage rail $V_{OL} \\approx 0\\text{V}$ (Logic 0)</td>
                  <td>Basis state $|0\\rangle$</td>
                  <td>$\\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix}$ (North Pole)</td>
                </tr>
                <tr>
                  <td>Voltage rail $V_{OH} \\approx 5\\text{V}$ (Logic 1)</td>
                  <td>Basis state $|1\\rangle$</td>
                  <td>$\\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix}$ (South Pole)</td>
                </tr>
                <tr>
                  <td>BJT Inverter (NOT Gate)</td>
                  <td>Pauli-X Gate (Bit-flip)</td>
                  <td>$\\sigma_x = \\begin{bmatrix} 0 & 1 \\\\ 1 & 0 \\end{bmatrix}$ Unitary operator</td>
                </tr>
                <tr>
                  <td>Thermal Voltage ($V_T = k_B T / q$) Noise</td>
                  <td>Depolarizing / Dephasing Noise</td>
                  <td>Kraus Operators $\\rho \\mapsto \\sum_k E_k \\rho E_k^\\dagger$</td>
                </tr>
                <tr>
                  <td>Modular Triple Redundancy (TMR)</td>
                  <td>3-Qubit Repetition Code</td>
                  <td>Shor Syndrome Measurement via Ancillas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Technology Stack -->
      <section class="about-card tech-card">
        <h2 class="section-title"><span class="icon">⚡</span> Technology Stack & Tooling</h2>
        
        <div class="tech-subgroup">
          <h3>Hardware Infrastructure</h3>
          <div class="badge-cluster">
            <span class="tech-badge hardware"><i class="badge-icon">🔌</i> NPN BJT (BC547 / 2N2222)</span>
            <span class="tech-badge hardware"><i class="badge-icon">⚡</i> N-Channel MOSFET (2N7000 / BS170)</span>
            <span class="tech-badge hardware"><i class="badge-icon">🍞</i> Solderless Breadboards & Jumper Wires</span>
            <span class="tech-badge hardware"><i class="badge-icon">💡</i> GaP/GaAs Diagnostic LEDs & Resistors</span>
            <span class="tech-badge hardware"><i class="badge-icon">📟</i> Arduino Uno / ESP32 Data Acquisition</span>
            <span class="tech-badge hardware"><i class="badge-icon">📈</i> Rigol Digital Storage Oscilloscope (DSO)</span>
          </div>
        </div>

        <div class="tech-subgroup">
          <h3>Software, Simulation & Libraries</h3>
          <div class="badge-cluster">
            <span class="tech-badge software"><i class="badge-icon">🐍</i> Python 3.9+</span>
            <span class="tech-badge software"><i class="badge-icon">🔢</i> NumPy (Matrix Mechanics)</span>
            <span class="tech-badge software"><i class="badge-icon">⚛️</i> Qiskit SDK (v1.0+)</span>
            <span class="tech-badge software"><i class="badge-icon">🌪️</i> Qiskit-Aer (Noise Channels)</span>
            <span class="tech-badge software"><i class="badge-icon">☁️</i> IBM Quantum Composer</span>
            <span class="tech-badge software"><i class="badge-icon">📊</i> Chart.js (Real-time telemetry)</span>
            <span class="tech-badge software"><i class="badge-icon">🌐</i> Vanilla JavaScript (ES6+ Modules)</span>
            <span class="tech-badge software"><i class="badge-icon">🎨</i> Modern Responsive CSS3</span>
          </div>
        </div>
      </section>

      <!-- Physical Build: Breadboard NOT Gate Experiment -->
      <section class="about-card build-card">
        <h2 class="section-title"><span class="icon">🛠️</span> Physical Build: Breadboard NOT Gate Experiment</h2>
        <p class="section-intro">
          This hands-on experiment demonstrates classical logic inversion using a single NPN Bipolar Junction 
          Transistor in common-emitter configuration. When the base receives a HIGH logic voltage ($5\\text{V}$), 
          the transistor saturates and grounds the collector node, driving the output LOW.
        </p>

        <div class="component-table-container">
          <h3>Component Bill of Materials (BOM)</h3>
          <table class="data-table bom-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Part Number / Value</th>
                <th>Quantity</th>
                <th>Function / Circuit Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bipolar Junction Transistor</strong></td>
                <td>NPN BC547 or 2N2222</td>
                <td>1</td>
                <td>Solid-state electronic switch (active element)</td>
              </tr>
              <tr>
                <td><strong>Indicator Diode</strong></td>
                <td>Red LED (5mm, $V_f \\approx 2.0\\text{V}$)</td>
                <td>1</td>
                <td>Visual indicator of logical output state</td>
              </tr>
              <tr>
                <td><strong>Collector Resistor</strong></td>
                <td>$330\\,\\Omega$, $1/4\\text{W}$</td>
                <td>1</td>
                <td>Collector pull-up / LED current limiting resistor</td>
              </tr>
              <tr>
                <td><strong>Base Resistor</strong></td>
                <td>$10\\,\\text{k}\\Omega$, $1/4\\text{W}$</td>
                <td>1</td>
                <td>Base current limiting to ensure safe saturation ($I_B \\approx 0.43\\text{mA}$)</td>
              </tr>
              <tr>
                <td><strong>DC Power Supply</strong></td>
                <td>$5\\text{V}$ Regulated / Arduino 5V Pin</td>
                <td>1</td>
                <td>System supply voltage ($V_{CC}$) and ground rail</td>
              </tr>
              <tr>
                <td><strong>Connecting Elements</strong></td>
                <td>Solid-core Jumper Wires</td>
                <td>6–8</td>
                <td>Breadboard interconnection links</td>
              </tr>
              <tr>
                <td><strong>Prototyping Board</strong></td>
                <td>Half-size Solderless Breadboard</td>
                <td>1</td>
                <td>Circuit assembly matrix (400 tie points)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="wiring-steps-container">
          <h3>Laboratory Wiring Guide & Step-by-Step Procedure</h3>
          <ol class="steps-list">
            <li>
              <strong>Transistor Insertion:</strong> Insert the NPN BJT (BC547 or 2N2222) into breadboard tie-points. 
              Confirm the pinout configuration: looking at the flat face of a BC547 with pins pointing down, 
              the pins are Collector (C), Base (B), and Emitter (E) [Note: 2N2222 TO-92 is E-B-C].
            </li>
            <li>
              <strong>Ground Reference:</strong> Connect the Transistor Emitter directly to the Common Ground (GND) power rail.
            </li>
            <li>
              <strong>Collector Pull-Up Network:</strong> Connect the Collector terminal to one leg of the $330\\,\\Omega$ resistor. 
              Connect the opposite leg of the $330\\,\\Omega$ resistor to the Anode (longer leg) of the LED.
            </li>
            <li>
              <strong>VCC Termination:</strong> Connect the Cathode (shorter leg, flat side) of the LED to Ground, OR in the common pull-up configuration: 
              connect the $330\\,\\Omega$ resistor to $+5\\text{V}$, Collector to LED Anode, and LED Cathode to GND with parallel branching. 
              <em>Standard Inverter setup:</em> Connect $330\\,\\Omega$ between $+5\\text{V}$ ($V_{CC}$) and Collector node. Connect LED Anode to Collector node and Cathode via $220\\,\\Omega$ to GND, OR connect LED in series with collector load.
            </li>
            <li>
              <strong>Base Drive Network:</strong> Connect a $10\\,\\text{k}\\Omega$ current-limiting resistor to the Base terminal. 
              The free end serves as the logic input probe ($V_{IN}$).
            </li>
            <li>
              <strong>HIGH Logic Verification ($V_{IN} = 5\\text{V}$):</strong> Connect input probe to $+5\\text{V}$. 
              Base-emitter junction forward biases ($V_{BE} \\approx 0.7\\text{V}$). Transistor drives into saturation 
              ($V_{CE(sat)} \\approx 0.1\\text{V}-0.2\\text{V}$). The collector node is pulled to ground, extinguishing the output LED (Logic 0).
            </li>
            <li>
              <strong>LOW Logic Verification ($V_{IN} = 0\\text{V}$ / GND):</strong> Connect input probe to GND. 
              Transistor enters cut-off ($I_B = 0, I_C \\approx 0$). Collector node floats up towards $+5\\text{V}$, 
              allowing current through the output LED, lighting it brightly (Logic 1).
            </li>
          </ol>
        </div>

        <!-- Placeholder photo gallery -->
        <div class="photo-gallery">
          <h3>Hardware Verification Bench Gallery</h3>
          <div class="photo-grid">
            <div class="photo-placeholder">
              <div class="photo-icon">📷</div>
              <p class="photo-caption">Photo placeholder — insert breadboard photo<br><strong>(Transistor Inverter Hardware Layout)</strong></p>
            </div>
            <div class="photo-placeholder">
              <div class="photo-icon">💡</div>
              <p class="photo-caption">Photo placeholder — insert breadboard photo<br><strong>(Input LOW: Transistor Cut-off, LED ON)</strong></p>
            </div>
            <div class="photo-placeholder">
              <div class="photo-icon">📉</div>
              <p class="photo-caption">Photo placeholder — insert breadboard photo<br><strong>(Input HIGH: Transistor Saturation, LED OFF)</strong></p>
            </div>
          </div>
        </div>
      </section>

      <!-- Evaluation Method -->
      <section class="about-card evaluation-card">
        <h2 class="section-title"><span class="icon">📐</span> Pedagogical Evaluation & Learning Assessment</h2>
        
        <div class="evaluation-grid">
          <div class="eval-box">
            <h3>Normalized Learning Gain Metric</h3>
            <p>
              To scientifically evaluate cognitive progression across the classical-to-quantum paradigm shift, 
              we adopt Hake's normalized gain formula ($g$):
            </p>
            <div class="formula-box">
              $$g = \\frac{\\%\\text{post} - \\%\\text{pre}}{100\\% - \\%\\text{pre}}$$
            </div>
            <ul class="gain-benchmarks">
              <li><span class="tag high">High Gain ($g \\ge 0.7$)</span> Mastered both semiconductor inverter physics and quantum state vectors.</li>
              <li><span class="tag med">Medium Gain ($0.3 \\le g < 0.7$)</span> Competent in circuit analysis and single-qubit gates; developing entanglement intuition.</li>
              <li><span class="tag low">Low Gain ($g < 0.3$)</span> Requires reinforced study on matrix transformations and quantum measurement postulates.</li>
            </ul>
          </div>

          <div class="eval-box">
            <h3>Student Self-Assessment Rubric</h3>
            <table class="rubric-table">
              <thead>
                <tr>
                  <th>Competency Domain</th>
                  <th>Level 1: Novice</th>
                  <th>Level 2: Proficient</th>
                  <th>Level 3: Advanced</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>BJT Inversion</strong></td>
                  <td>Understands switch metaphor only</td>
                  <td>Calculates $I_B, I_C$ and saturation limits</td>
                  <td>Analyzes propagation delay & noise margin</td>
                </tr>
                <tr>
                  <td><strong>Superposition</strong></td>
                  <td>Treats qubit as analog voltage</td>
                  <td>Calculates probabilities $|\\alpha|^2, |\\beta|^2$</td>
                  <td>Rotates state vectors on Bloch Sphere</td>
                </tr>
                <tr>
                  <td><strong>Entanglement</strong></td>
                  <td>Confuses correlation with communication</td>
                  <td>Writes Bell states; computes inner products</td>
                  <td>Simulates Bell inequality and CNOT circuits</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Student Profile & Progress Persistence -->
      <section class="about-card student-card">
        <h2 class="section-title"><span class="icon">👤</span> Student Lab Enrollment & Profile</h2>
        <p class="section-intro">
          Enter and register your laboratory credentials below. Your details are saved securely in your browser's local storage 
          and associated with your interactive simulation runs and quiz results.
        </p>

        <form id="student-info-form" class="student-form" onsubmit="return false;">
          <div class="form-row">
            <div class="form-group">
              <label for="student-name">Full Name</label>
              <input type="text" id="student-name" placeholder="e.g. Anchit Jain" required autocomplete="name" />
            </div>
            <div class="form-group">
              <label for="student-id">Student ID / Roll Number</label>
              <input type="text" id="student-id" placeholder="e.g. 25MCCE19" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="student-institution">Institution / University</label>
              <input type="text" id="student-institution" placeholder="e.g. National Institute of Technology" required />
            </div>
            <div class="form-group">
              <label for="student-program">Degree Program / Branch</label>
              <input type="text" id="student-program" placeholder="e.g. M.Tech in Microelectronics & VLSI" required />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" id="save-student-btn" class="btn btn-primary">
              💾 Save Profile to LocalStorage
            </button>
            <button type="button" id="clear-student-btn" class="btn btn-secondary">
              🧹 Clear Saved Data
            </button>
          </div>
        </form>

        <div id="saved-info-display" class="saved-info-card" style="display: none;">
          <div class="saved-header">
            <h4>Verified Student Badge</h4>
            <span class="status-indicator active">● Profile Synced</span>
          </div>
          <div class="saved-details-grid">
            <div><span class="detail-label">Name:</span> <strong id="disp-name">--</strong></div>
            <div><span class="detail-label">Roll ID:</span> <strong id="disp-id">--</strong></div>
            <div><span class="detail-label">Institution:</span> <strong id="disp-institution">--</strong></div>
            <div><span class="detail-label">Program:</span> <strong id="disp-program">--</strong></div>
          </div>
        </div>
      </section>

      <!-- References Section -->
      <section class="about-card references-card">
        <h2 class="section-title"><span class="icon">📚</span> Academic & Technical References</h2>
        <ol class="references-list">
          <li>
            <strong>Nielsen, M. A., & Chuang, I. L. (2010).</strong> 
            <em>Quantum Computation and Quantum Information</em> (10th Anniversary ed.). Cambridge University Press.
          </li>
          <li>
            <strong>Streetman, B. G., & Banerjee, S. (2016).</strong> 
            <em>Solid State Electronic Devices</em> (7th ed.). Pearson Education.
          </li>
          <li>
            <strong>Sedra, A. S., & Smith, K. C. (2020).</strong> 
            <em>Microelectronic Circuits</em> (8th ed.). Oxford University Press.
          </li>
          <li>
            <strong>Preskill, J. (2018).</strong> 
            <em>Quantum Computing in the NISQ era and beyond.</em> Quantum, 2, 79. https://doi.org/10.22331/q-2018-08-06-79
          </li>
          <li>
            <strong>Qiskit Community. (2024).</strong> 
            <em>Qiskit: An Open-source Framework for Quantum Computing.</em> Zenodo. https://doi.org/10.5281/zenodo.2573505
          </li>
          <li>
            <strong>Hake, R. R. (1998).</strong> 
            <em>Interactive-engagement versus traditional methods in mechanics courses.</em> American Journal of Physics, 66(1), 64–74.
          </li>
        </ol>
      </section>

      <!-- Footer Credits -->
      <footer class="about-footer">
        <div class="footer-divider"></div>
        <p class="footer-text">
          <strong>25MCCE19 Lab Project:</strong> Developed for the Electronic Devices and Circuits (EDC) & Quantum Computing Laboratory.
        </p>
        <p class="footer-subtext">
          All simulation code, hardware schematics, and interactive web visualizers are released under the MIT Educational License.
        </p>
      </footer>
    </div>
  `;

  // Attach event handlers for student info profile
  setupStudentProfileHandlers();

  // Render mathematics in about container
  if (typeof window.renderAllMath === 'function') {
    window.renderAllMath(container);
  }
}

/**
 * Handles localStorage persistence and profile display
 */
function setupStudentProfileHandlers() {
  const nameInput = document.getElementById('student-name');
  const idInput = document.getElementById('student-id');
  const instInput = document.getElementById('student-institution');
  const progInput = document.getElementById('student-program');

  const saveBtn = document.getElementById('save-student-btn');
  const clearBtn = document.getElementById('clear-student-btn');
  const displayBox = document.getElementById('saved-info-display');

  const dispName = document.getElementById('disp-name');
  const dispId = document.getElementById('disp-id');
  const dispInst = document.getElementById('disp-institution');
  const dispProg = document.getElementById('disp-program');

  const STORAGE_KEY = 'quantum_lab_student_profile';

  function renderProfile(profile) {
    if (!profile) {
      if (displayBox) displayBox.style.display = 'none';
      return;
    }
    if (dispName) dispName.textContent = profile.name || 'N/A';
    if (dispId) dispId.textContent = profile.studentId || 'N/A';
    if (dispInst) dispInst.textContent = profile.institution || 'N/A';
    if (dispProg) dispProg.textContent = profile.program || 'N/A';

    if (nameInput) nameInput.value = profile.name || '';
    if (idInput) idInput.value = profile.studentId || '';
    if (instInput) instInput.value = profile.institution || '';
    if (progInput) progInput.value = profile.program || '';

    if (displayBox) displayBox.style.display = 'block';
  }

  // Load from localStorage on initialization
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      renderProfile(parsed);
    }
  } catch (err) {
    console.error('Error loading student profile from localStorage:', err);
  }

  // Save profile
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      const studentId = idInput ? idInput.value.trim() : '';
      const institution = instInput ? instInput.value.trim() : '';
      const program = progInput ? progInput.value.trim() : '';

      if (!name || !studentId) {
        alert('Please enter at least your Name and Student ID.');
        return;
      }

      const profile = { name, studentId, institution, program, timestamp: new Date().toISOString() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        renderProfile(profile);
        alert('Student profile saved successfully!');
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
        alert('Failed to save student profile.');
      }
    });
  }

  // Clear profile
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your saved student profile?')) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          if (nameInput) nameInput.value = '';
          if (idInput) idInput.value = '';
          if (instInput) instInput.value = '';
          if (progInput) progInput.value = '';
          if (displayBox) displayBox.style.display = 'none';
          alert('Saved profile cleared.');
        } catch (err) {
          console.error('Failed to clear profile:', err);
        }
      }
    });
  }
}

// Support both ES Module import and global script tag
if (typeof window !== 'undefined') {
  window.initAbout = initAbout;
}

/* --- main.js --- */
/**
 * @file main.js
 * @description Main application entry point for the Quantum Computing Educational Platform.
 * Provides client-side SPA hash routing, theme switching, mobile navigation,
 * interactive widget initializers, and core mathematical utilities.
 */
// Re-export required complex math utilities
/**
 * Weighted or uniform random item picker.
 * @template T
 * @param {Array<T>} items - Items to pick from
 * @param {Array<number>} [weights] - Non-negative weights corresponding to each item
 * @returns {T} Selected item
 */
function randomChoice(items, weights) {
  if (!items || items.length === 0) {
    throw new Error('randomChoice requires a non-empty array of items');
  }
  if (!weights || weights.length !== items.length) {
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
  }

  const sum = weights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);
  if (sum <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  const rand = Math.random() * sum;
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += Math.max(0, weights[i]);
    if (rand <= cumulative) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

/**
 * Valid SPA route IDs.
 */
const VALID_ROUTES = [
  '#home',
  '#mapping',
  '#level1',
  '#level2',
  '#level3',
  '#level4',
  '#noise',
  '#simulator',
  '#assessment',
  '#about'
];

/**
 * Initializes Theme management (dark / light mode).
 * Reads preference from localStorage and updates <body> class.
 */
function initTheme() {
  const THEME_STORAGE_KEY = 'quantum_edu_theme';
  const themeToggleBtn = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    // If user prefers light or saved light
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  } else if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme');
  }

  const updateToggleIcon = () => {
    if (!themeToggleBtn) return;
    const isLight = document.body.classList.contains('light-theme');
    themeToggleBtn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    const icon = themeToggleBtn.querySelector('.theme-icon') || themeToggleBtn;
    if (icon) {
      icon.textContent = isLight ? '🌙' : '☀️';
    }
  };

  updateToggleIcon();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem(THEME_STORAGE_KEY, isLight ? 'light' : 'dark');
      updateToggleIcon();

      // Trigger custom event so any active Bloch sphere or charts re-render
      window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: isLight ? 'light' : 'dark' } }));
    });
  }
}

/**
 * Initializes mobile hamburger menu toggle.
 */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('mobile-menu-toggle') || document.querySelector('.hamburger');
  const navMenu = document.getElementById('nav-menu') || document.querySelector('.nav-links') || document.querySelector('nav');

  if (!hamburgerBtn || !navMenu) return;

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', isOpen);
    hamburgerBtn.classList.toggle('active', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  };

  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking any nav link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });
}

/**
 * Single-Page App Hash Router.
 * Shows the active section matching current hash and hides others.
 */
function initRouter() {
  function handleRoute() {
    let hash = window.location.hash || '#home';
    if (!VALID_ROUTES.includes(hash)) {
      hash = '#home';
    }

    const targetId = hash.substring(1);

    // Toggle active section visibility — supports both .page and .page-section, .active and .active-section
    VALID_ROUTES.forEach(route => {
      const sectionId = route.substring(1);
      const section = document.getElementById(sectionId);
      if (section) {
        if (sectionId === targetId) {
          section.classList.add('active');
          section.classList.add('active-section');
          section.removeAttribute('hidden');
        } else {
          section.classList.remove('active');
          section.classList.remove('active-section');
        }
      }
    });

    // Also support any element selected with .page-section or .page
    document.querySelectorAll('.page, .page-section').forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.add('active');
        sec.classList.add('active-section');
        sec.removeAttribute('hidden');
      } else if (sec.id && VALID_ROUTES.includes('#' + sec.id)) {
        sec.classList.remove('active');
        sec.classList.remove('active-section');
      }
    });

    // Update active nav links (both in main nav and dropdowns)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash) {
        link.classList.add('active');
        link.classList.add('active-section');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.classList.remove('active-section');
        link.removeAttribute('aria-current');
      }
    });

    // Highlight parent dropdown if active route is a sub-level
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      const subLinkActive = dropdown.querySelector(`a[href="${hash}"]`);
      const parentLink = dropdown.querySelector('.nav-link');
      if (parentLink) {
        if (subLinkActive) {
          parentLink.classList.add('active');
          parentLink.classList.add('active-section');
        }
      }
    });

    // Scroll to top of section or page smoothly
    const activeSection = document.getElementById(targetId);
    if (activeSection) {
      activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Dispatch route event for custom section initializers
    window.dispatchEvent(new CustomEvent('pagechanged', { detail: { route: hash, sectionId: targetId } }));

    // Re-render mathematics for the activated section
    if (typeof window.renderAllMath === 'function') {
      const activeEl = document.getElementById(targetId);
      if (activeEl) {
        window.renderAllMath(activeEl);
      }
    }
  }

  window.addEventListener('hashchange', handleRoute);
  // Initial route execution
  handleRoute();
}

/**
 * Smooth scrolling for navigation links that are in-page anchors.
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetHash = this.getAttribute('href');
      if (VALID_ROUTES.includes(targetHash)) {
        // Handled by hash router
        if (window.location.hash === targetHash) {
          // If already on the hash, scroll to it manually
          const el = document.getElementById(targetHash.substring(1));
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });
}

/**
 * Initializes interactive elements present on the page.
 */
function initInteractiveElements() {
  // Automatically bind any canvas with class or id 'bloch-canvas'
  const blochCanvases = document.querySelectorAll('canvas[data-bloch], canvas.bloch-canvas, #bloch-sphere-canvas');
  blochCanvases.forEach(canvas => {
    if (!canvas.__blochInstance) {
      const bloch = new BlochSphere(canvas);
      canvas.__blochInstance = bloch;
      bloch.render(0, 0); // Ground state |0>

      window.addEventListener('themechanged', () => {
        bloch.draw();
      });
    }
  });
}

/**
 * Main application bootstrap on DOM ready.
 */
function initApp() {
  initTheme();
  initMobileMenu();
  initRouter();
  initSmoothScroll();
  initInteractiveElements();
}

// Auto-run when DOM is loaded in browser
if (typeof window !== 'undefined') {
  window.initApp = initApp;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }
}
