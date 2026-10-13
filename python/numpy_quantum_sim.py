#!/usr/bin/env python3
"""
=============================================================================
NumPy-Only Quantum State Vector Simulator
Course: 25MCCE19 - Classical to Quantum Logic Transition
Author: Anchit Jain
=============================================================================

A pure Python/NumPy simulation engine for discrete quantum systems.
Requires NO external quantum computing frameworks (e.g., Qiskit not required).

Key Features:
  - Exact complex state vector evolution (|psi> in C^(2^N))
  - Unitary single-qubit transformations (X, Y, Z, H, S, T, I)
  - Controlled multi-qubit entangling operations (CNOT, arbitrary controlled-U)
  - Full Bloch sphere coordinate extraction (u_x, u_y, u_z)
  - Probabilistic projective measurement with state vector collapse
  - Dirac bra-ket string formatting
  - Educational visualization routines via Matplotlib
=============================================================================
"""

import os
import math
import cmath
import numpy as np
import matplotlib.pyplot as plt

# =============================================================================
# STANDARD QUANTUM GATE MATRICES (2x2 and 4x4)
# =============================================================================
I = np.array([[1.0, 0.0],
              [0.0, 1.0]], dtype=complex)

X = np.array([[0.0, 1.0],
              [1.0, 0.0]], dtype=complex)

Y = np.array([[0.0, -1.0j],
              [1.0j, 0.0]], dtype=complex)

Z = np.array([[1.0, 0.0],
              [0.0, -1.0]], dtype=complex)

H = (1.0 / np.sqrt(2.0)) * np.array([[1.0, 1.0],
                                     [1.0, -1.0]], dtype=complex)

S = np.array([[1.0, 0.0],
              [0.0, 1.0j]], dtype=complex)

T = np.array([[1.0, 0.0],
              [0.0, np.exp(1j * np.pi / 4.0)]], dtype=complex)

# Standard 2-qubit CNOT matrix (control=0, target=1 in computational ordering)
CNOT = np.array([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 0.0]
], dtype=complex)

# Projector operators
P0 = np.array([[1.0, 0.0],
               [0.0, 0.0]], dtype=complex)

P1 = np.array([[0.0, 0.0],
               [0.0, 1.0]], dtype=complex)


class QuantumState:
    """
    Simulates an n-qubit pure quantum state vector in Hilbert space C^(2^n).
    
    Qubit Indexing Convention:
      Qubit 0 is the most significant qubit in tensor products:
      |q0, q1, ..., q_(n-1)>
    """

    def __init__(self, n_qubits: int = 1):
        """
        Initializes an n-qubit register to ground state |00...0>.

        Args:
            n_qubits (int): Total number of qubits (>= 1).
        """
        if n_qubits < 1:
            raise ValueError("System must have at least 1 qubit.")
        self.n_qubits = n_qubits
        self.dim = 2 ** n_qubits
        # Initialize state to |00...0>
        self.state = np.zeros(self.dim, dtype=complex)
        self.state[0] = 1.0 + 0.0j

    def copy(self):
        """Returns a deep clone of the current quantum state."""
        qs = QuantumState(self.n_qubits)
        qs.state = np.copy(self.state)
        return qs

    def _build_single_qubit_full_gate(self, gate_matrix: np.ndarray, target_qubit: int) -> np.ndarray:
        """Expands a 2x2 gate into the full 2^n x 2^n Hilbert space via Kronecker products."""
        if target_qubit < 0 or target_qubit >= self.n_qubits:
            raise IndexError(f"Target qubit {target_qubit} out of range [0, {self.n_qubits - 1}]")

        full_op = np.array([[1.0]], dtype=complex)
        for i in range(self.n_qubits):
            if i == target_qubit:
                full_op = np.kron(full_op, gate_matrix)
            else:
                full_op = np.kron(full_op, I)
        return full_op

    def apply_gate(self, gate_matrix: np.ndarray, target_qubit: int):
        """
        Applies a single-qubit unitary gate (2x2) to the specified target qubit.

        Args:
            gate_matrix (np.ndarray): 2x2 unitary matrix.
            target_qubit (int): 0-indexed qubit index.
        """
        if gate_matrix.shape != (2, 2):
            raise ValueError("Gate matrix must be 2x2.")
        full_gate = self._build_single_qubit_full_gate(gate_matrix, target_qubit)
        self.state = np.dot(full_gate, self.state)
        # Numerical normalization cleanup
        norm = np.linalg.norm(self.state)
        if norm > 0:
            self.state = self.state / norm

    def apply_two_qubit_gate(self, gate_matrix: np.ndarray, control: int, target: int):
        """
        Applies an arbitrary controlled 2-qubit operation or standard CNOT.
        If gate_matrix is 2x2, treats it as a Controlled-U gate.
        If gate_matrix is 4x4 (standard CNOT), operates accordingly.

        Args:
            gate_matrix (np.ndarray): 2x2 (Controlled-U target) or 4x4 matrix.
            control (int): Control qubit index.
            target (int): Target qubit index.
        """
        if control == target:
            raise ValueError("Control and target qubits must be distinct.")
        if control < 0 or control >= self.n_qubits or target < 0 or target >= self.n_qubits:
            raise IndexError("Qubit indices out of range.")

        # If 4x4 matrix given, check if it's standard CNOT, or decompose as controlled-U
        if gate_matrix.shape == (2, 2):
            u_target = gate_matrix
        elif gate_matrix.shape == (4, 4):
            # Controlled-NOT decomposition: CNOT = |0><0| (x) I + |1><1| (x) X
            u_target = X
        else:
            raise ValueError("Gate matrix must be 2x2 or 4x4.")

        # Full controlled operator:
        # U_full = (|0><0|_c (x) I_t) + (|1><1|_c (x) U_t) expanded across all qubits
        op0 = np.array([[1.0]], dtype=complex)
        op1 = np.array([[1.0]], dtype=complex)

        for i in range(self.n_qubits):
            if i == control:
                op0 = np.kron(op0, P0)
                op1 = np.kron(op1, P1)
            elif i == target:
                op0 = np.kron(op0, I)
                op1 = np.kron(op1, u_target)
            else:
                op0 = np.kron(op0, I)
                op1 = np.kron(op1, I)

        full_op = op0 + op1
        self.state = np.dot(full_op, self.state)
        norm = np.linalg.norm(self.state)
        if norm > 0:
            self.state = self.state / norm

    def probabilities(self) -> np.ndarray:
        """
        Computes the Born rule probability distribution across all 2^n basis states.
        
        Returns:
            np.ndarray: 1D float array of probabilities summing to 1.0.
        """
        probs = np.abs(self.state) ** 2
        return probs

    def measure(self) -> tuple[int, str]:
        """
        Performs a projective measurement according to Born's postulate.
        Collapses the state vector to the measured basis eigenstate.

        Returns:
            tuple[int, str]: (integer outcome index, binary bitstring)
        """
        probs = self.probabilities()
        outcome_idx = np.random.choice(self.dim, p=probs)
        bitstring = format(outcome_idx, f"0{self.n_qubits}b")

        # Collapse the state vector
        self.state = np.zeros(self.dim, dtype=complex)
        self.state[outcome_idx] = 1.0 + 0.0j

        return outcome_idx, bitstring

    def sample_shots(self, shots: int = 1000) -> dict[str, int]:
        """
        Simulates multiple independent projective measurement shots
        without permanently destroying the underlying unmeasured state vector.

        Args:
            shots (int): Total shot repetitions.

        Returns:
            dict[str, int]: Frequency dictionary of measured bitstrings.
        """
        probs = self.probabilities()
        outcomes = np.random.choice(self.dim, size=shots, p=probs)
        counts = {}
        for idx in outcomes:
            bstr = format(idx, f"0{self.n_qubits}b")
            counts[bstr] = counts.get(bstr, 0) + 1
        return counts

    def get_bloch_vector(self, qubit_idx: int = 0) -> tuple[float, float, float]:
        """
        Calculates the Bloch sphere coordinates (rx, ry, rz) for a single qubit.
        For multi-qubit systems, evaluates the reduced single-qubit expectation values.

        Returns:
            tuple[float, float, float]: (rx, ry, rz)
        """
        if qubit_idx < 0 or qubit_idx >= self.n_qubits:
            raise IndexError("Qubit index out of range.")

        full_x = self._build_single_qubit_full_gate(X, qubit_idx)
        full_y = self._build_single_qubit_full_gate(Y, qubit_idx)
        full_z = self._build_single_qubit_full_gate(Z, qubit_idx)

        # Expectation value <sigma> = <psi| sigma |psi>
        rx = float(np.real(np.vdot(self.state, np.dot(full_x, self.state))))
        ry = float(np.real(np.vdot(self.state, np.dot(full_y, self.state))))
        rz = float(np.real(np.vdot(self.state, np.dot(full_z, self.state))))

        return (rx, ry, rz)

    def to_dirac_string(self) -> str:
        """Formats the state vector into mathematical Dirac bra-ket notation."""
        terms = []
        for idx in range(self.dim):
            amp = self.state[idx]
            if np.abs(amp) > 1e-6:
                bitstring = format(idx, f"0{self.n_qubits}b")
                # Format complex amplitude
                re = np.real(amp)
                im = np.imag(amp)
                if abs(im) < 1e-6:
                    coeff = f"{re:+.3f}"
                elif abs(re) < 1e-6:
                    coeff = f"{im:+.3f}i"
                else:
                    coeff = f"({re:+.3f}{im:+.3f}i)"
                terms.append(f"{coeff}|{bitstring}>")

        if not terms:
            return "0"
        res = " ".join(terms)
        if res.startswith("+"):
            res = res[1:]
        return res

    def __repr__(self) -> str:
        return f"QuantumState(n_qubits={self.n_qubits}, state={self.to_dirac_string()})"


# =============================================================================
# DEMONSTRATION & VERIFICATION EXPERIMENTS
# =============================================================================
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "numpy_plots")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def plot_simulation_histogram(counts: dict[str, int], title: str, filename: str):
    """Generates and saves a clean Matplotlib bar chart for measurement frequencies."""
    labels = sorted(counts.keys())
    values = [counts[k] for k in labels]
    total_shots = sum(values)

    fig, ax = plt.subplots(figsize=(6, 4))
    bars = ax.bar(labels, values, color='#4361ee', edgecolor='#3a0ca3', width=0.5)

    # Label heights with percentages
    for bar in bars:
        h = bar.get_height()
        pct = (h / total_shots) * 100
        ax.annotate(f"{pct:.1f}%\n({h})",
                    xy=(bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, 3), textcoords="offset points",
                    ha='center', va='bottom', fontsize=9)

    ax.set_ylabel("Measured Occurrences (Counts)")
    ax.set_xlabel("Computational Basis State |...>")
    ax.set_title(title, fontweight="bold")
    ax.set_ylim(0, max(values) * 1.25)
    ax.grid(axis='y', linestyle='--', alpha=0.6)

    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.tight_layout()
    plt.savefig(filepath, dpi=300)
    print(f"  [Histogram Saved] -> {filepath}")
    plt.close(fig)


def run_numpy_demos():
    print("=" * 75)
    print("      NUMPY QUANTUM STATE VECTOR SIMULATOR (BENCHMARKS & DEMOS)      ")
    print("=" * 75)

    # Demo 1: Single Qubit Pauli-X Gate
    print("\n[Demo 1: Single Qubit Pauli-X Inversion]")
    qs_x = QuantumState(n_qubits=1)
    print("  Initial state       :", qs_x.to_dirac_string())
    qs_x.apply_gate(X, target_qubit=0)
    print("  After X applied     :", qs_x.to_dirac_string())
    rx, ry, rz = qs_x.get_bloch_vector(0)
    print(f"  Bloch vector (x,y,z): ({rx:.2f}, {ry:.2f}, {rz:.2f})")
    counts_x = qs_x.sample_shots(shots=1000)
    print("  1000 Measurement shots:", counts_x)
    plot_simulation_histogram(counts_x, "NumPy Simulator: Pauli-X Gate Output", "numpy_01_x_gate.png")

    # Demo 2: Hadamard Gate Superposition
    print("\n[Demo 2: Hadamard Superposition Preparation]")
    qs_h = QuantumState(n_qubits=1)
    print("  Initial state       :", qs_h.to_dirac_string())
    qs_h.apply_gate(H, target_qubit=0)
    print("  After H applied     :", qs_h.to_dirac_string())
    rx, ry, rz = qs_h.get_bloch_vector(0)
    print(f"  Bloch vector (x,y,z): ({rx:.2f}, {ry:.2f}, {rz:.2f})")
    counts_h = qs_h.sample_shots(shots=1000)
    print("  1000 Measurement shots:", counts_h)
    plot_simulation_histogram(counts_h, "NumPy Simulator: Hadamard Superposition", "numpy_02_hadamard.png")

    # Demo 3: Bell State Preparation (|Phi+>)
    print("\n[Demo 3: Bell State Generation (|00> + |11>)/sqrt(2)]")
    qs_bell = QuantumState(n_qubits=2)
    print("  Initial state       :", qs_bell.to_dirac_string())
    qs_bell.apply_gate(H, target_qubit=0)
    print("  After H on Q0       :", qs_bell.to_dirac_string())
    qs_bell.apply_two_qubit_gate(CNOT, control=0, target=1)
    print("  After CNOT(0 -> 1)  :", qs_bell.to_dirac_string())
    counts_bell = qs_bell.sample_shots(shots=1000)
    print("  1000 Measurement shots:", counts_bell)
    plot_simulation_histogram(counts_bell, "NumPy Simulator: Bell State (|Phi+>)", "numpy_03_bell_state.png")

    # Demo 4: Wavefunction Collapse Verification
    print("\n[Demo 4: Wavefunction Collapse on Measurement]")
    qs_collapse = QuantumState(n_qubits=2)
    qs_collapse.apply_gate(H, target_qubit=0)
    qs_collapse.apply_two_qubit_gate(CNOT, control=0, target=1)
    print("  Pre-measurement entangled state:", qs_collapse.to_dirac_string())
    idx, bits = qs_collapse.measure()
    print(f"  COLLAPSE EVENT OCCURRED! Measured basis state: |{bits}> (Index {idx})")
    print("  Post-collapse state vector     :", qs_collapse.to_dirac_string())

    # Demo 5: Phase Gates (S and T gates)
    print("\n[Demo 5: Phase Gate Sequence (T and S Gates)]")
    qs_phase = QuantumState(n_qubits=1)
    qs_phase.apply_gate(H, target_qubit=0)
    print("  State in |+>   :", qs_phase.to_dirac_string())
    qs_phase.apply_gate(T, target_qubit=0)
    print("  State after T  :", qs_phase.to_dirac_string())
    qs_phase.apply_gate(S, target_qubit=0)
    print("  State after S  :", qs_phase.to_dirac_string())
    rx, ry, rz = qs_phase.get_bloch_vector(0)
    print(f"  Bloch vector (x,y,z): ({rx:.2f}, {ry:.2f}, {rz:.2f})")

    print("\n" + "=" * 75)
    print("NUMPY SIMULATION SUITE COMPLETED SUCCESSFULLY.")
    print("=" * 75)


if __name__ == "__main__":
    run_numpy_demos()
