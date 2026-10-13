/**
 * about.js - Project Overview, Methodology, Physical Build, and Student Info module
 * Quantum Computing & Solid-State Electronics Educational Platform
 */

export function initAbout() {
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
