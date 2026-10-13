# 25MCCE19 Quantum Computing Laboratory: Python Simulation Suite

Welcome to the Python simulation companion for the **Classical-to-Quantum Logic Transition Laboratory (Course: 25MCCE19)**. This repository houses two standalone Python implementations:

1. **`quantum_experiments.py`**: A comprehensive quantum experimentation pipeline using the **Qiskit 1.x/2.x SDK** and **Qiskit Aer**, demonstrating single-qubit logic, multi-qubit entanglement, open quantum noise channels, and quantum error correction.
2. **`numpy_quantum_sim.py`**: A **dependency-free, pure NumPy** state vector simulator engineered from first-principles linear algebra, demonstrating state vector mechanics, unitary tensor expansion, Bloch vector tracking, and projective wave collapse.

---

## 1. System Requirements & Installation

- **Python Version**: Python 3.8, 3.9, 3.10, 3.11, or 3.12 (64-bit recommended)
- **Virtual Environment (Recommended)**:

```bash
# Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.\venv\Scripts\activate.bat

# Linux / macOS
source venv/bin/activate
```

### Installing Required Packages

```bash
pip install --upgrade pip
pip install numpy matplotlib qiskit qiskit-aer
```

> **Note on Qiskit 1.0+**: In early 2024, Qiskit transitioned to version 1.0. The legacy metapackage `qiskit-terra` has been superseded. Do **not** install `qiskit-terra` or legacy packages like `qiskit-aer-gpu` unless specifically configured.

---

## 2. Scripts Overview & Architecture

### A. `quantum_experiments.py` (Qiskit 1.x / Qiskit-Aer)

| Section | Experiment Name | Description | Key Operators / Circuits |
| :--- | :--- | :--- | :--- |
| **Section 1** | **Pauli-X Gate** | Quantum NOT inverter (direct analogue of the BJT common-emitter inverter). | $X \|0\rangle = \|1\rangle$ |
| **Section 2** | **Hadamard Superposition** | Transforms discrete basis states into equal linear combinations. | $H \|0\rangle = \frac{1}{\sqrt{2}}(\|0\rangle + \|1\rangle)$ |
| **Section 3** | **Bell State ($\|\Phi^+\rangle$)** | Prepares maximally entangled two-qubit Einstein-Podolsky-Rosen pair. | $\text{CNOT}_{0,1}(H \otimes I)\|00\rangle$ |
| **Section 4** | **Quantum Noise Models** | Simulates non-unitary decoherence in open systems using Kraus operators: Bit-flip ($p=0.1$), Phase-flip ($p=0.1$), and Depolarizing error. | `NoiseModel`, `pauli_error`, `depolarizing_error` |
| **Section 5** | **3-Qubit Repetition Code** | Encodes logical qubit into 3 physical qubits, injects bit-flip error, and autonomous syndrome decoding/recovery. | Shor 3-qubit bit-flip code |

### B. `numpy_quantum_sim.py` (Zero Qiskit Dependencies)

An educational, first-principles state vector simulator that requires **only NumPy and Matplotlib**:

- **Class `QuantumState(n_qubits)`**:
  - Encapsulates state vector $|\psi\rangle \in \mathbb{C}^{2^n}$ initialized to $|00\dots 0\rangle$.
  - `apply_gate(gate_matrix, target_qubit)`: Dynamically generates full $2^n \times 2^n$ operators using Kronecker tensor products ($I \otimes \dots \otimes U \otimes \dots \otimes I$).
  - `apply_two_qubit_gate(gate_matrix, control, target)`: Executes controlled unitary transformations ($|0\rangle\langle 0| \otimes I + |1\rangle\langle 1| \otimes U$) between arbitrary, non-adjacent qubits.
  - `probabilities()`: Calculates exact Born rule probability vector $|\alpha_i|^2$.
  - `measure()`: Simulates projective measurement, samples an outcome, and **collapses** the state vector to the corresponding eigenstate.
  - `sample_shots(shots=1000)`: Simulates repeated non-destructive measurement distributions.
  - `get_bloch_vector(qubit_idx)`: Calculates expectation values $(\langle\sigma_x\rangle, \langle\sigma_y\rangle, \langle\sigma_z\rangle)$ representing the Bloch sphere orientation.
  - `to_dirac_string()`: Formats complex state vectors into readable mathematical Dirac notation ($0.707|00\rangle + 0.707|11\rangle$).

---

## 3. How to Execute the Scripts

Ensure your shell is inside the `python/` folder:

```bash
cd "c:\Users\Anchit Jain\Desktop\CAREER\EDC\25MCCE19(Lab Project)\python"
```

### Running the Qiskit Experimental Suite:
```bash
python quantum_experiments.py
```

### Running the Pure NumPy Simulator:
```bash
python numpy_quantum_sim.py
```

---

## 4. Expected Outputs & Artifacts

### Console Output Samples

#### When running `quantum_experiments.py`:
```text
======================================================================
   QUANTUM COMPUTING LAB: EDC TO QIS EXPERIMENTAL SUITE   
======================================================================
Working Directory: ...\python
Output Plots Directory: ...\python\experiment_plots

======================================================================
SECTION 1: Pauli-X Gate Experiment (Quantum NOT Gate)
======================================================================
Circuit Diagram:
   ┌───┐┌─┐
q: ┤ X ├┤M├
   └───┘└╥┘
c: ══════╩═
Measurement Counts (shots=1000):
  State |1> : 1000 (100.00%)
  [Plot Saved] -> experiment_plots/01_x_gate_histogram.png

======================================================================
SECTION 3: Maximally Entangled Bell State (|Phi+>)
======================================================================
Measurement Counts (shots=1000):
  State |00> : 492 (49.20%)
  State |11> : 508 (50.80%)
  [Plot Saved] -> experiment_plots/03_bell_state_histogram.png
```

#### Generated Graph Artifacts:
- **`experiment_plots/`**:
  - `01_x_gate_histogram.png`: Single-qubit deterministic inversion distribution.
  - `02_hadamard_histogram.png`: 50/50 superposition histogram.
  - `03_bell_state_histogram.png`: Correlation showing 00 and 11 outcomes with zero 01 or 10 cross-terms.
  - `04_quantum_noise_comparison.png`: Three-panel comparative study of bit-flip, phase-flip, and depolarizing channels.
  - `05_qec_repetition_code.png`: Error correction fidelity verification.
- **`numpy_plots/`**:
  - `numpy_01_x_gate.png`: State vector measurement under Pauli-X.
  - `numpy_02_hadamard.png`: Numerical verification of equal superposition.
  - `numpy_03_bell_state.png`: NumPy-simulated Bell state distribution.

---

## 5. Troubleshooting & Common Pitfalls

### Issue 1: `ModuleNotFoundError: No module named 'qiskit_aer'`
- **Cause**: In Qiskit 1.0+, Aer is packaged separately as `qiskit-aer`.
- **Fix**: Run `pip install qiskit-aer`.

### Issue 2: `AttributeError: module 'qiskit' has no attribute 'Aer'`
- **Cause**: Using outdated Qiskit 0.x tutorials that called `from qiskit import Aer`.
- **Fix**: In Qiskit 1.x/2.x, use `from qiskit_aer import AerSimulator`. Both scripts in this repository are pre-configured with the modern API.

### Issue 3: `UserWarning: Matplotlib is currently using agg, which is a non-GUI backend`
- **Cause**: Headless terminal or non-interactive execution environment.
- **Resolution**: Harmless. Both scripts automatically save high-resolution PNG copies directly to `experiment_plots/` and `numpy_plots/` regardless of display configuration.

---

## 6. Optional: Running on Real IBM Quantum Hardware

To execute these circuits on physical superconducting quantum processors (such as `ibm_brisbane`, `ibm_kyoto`, or `ibm_sherbrooke`):

1. **Sign up**: Create an account at [quantum.ibm.com](https://quantum.ibm.com).
2. **Obtain API Token**: Navigate to your dashboard and copy your API Token.
3. **Install the Runtime Client**:
   ```bash
   pip install qiskit-ibm-runtime
   ```
4. **Authenticate in Python**:
   ```python
   from qiskit_ibm_runtime import QiskitRuntimeService

   # Save token to your local disk profile (one-time setup)
   QiskitRuntimeService.save_account(
       channel="ibm_quantum",
       token="YOUR_IBM_QUANTUM_API_TOKEN",
       overwrite=True
   )

   service = QiskitRuntimeService()
   backend = service.least_busy(operational=True, simulator=False)
   print(f"Submitting job to physical quantum processor: {backend.name}")
   ```
