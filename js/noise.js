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

export function initNoise() {
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
