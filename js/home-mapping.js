/**
 * home-mapping.js
 * Educational Framework: From Transistors to Qubits
 * Handles rendering and interactions for Home Page (#home) and Mapping Table (#mapping).
 */

export function initHomeMapping() {
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
