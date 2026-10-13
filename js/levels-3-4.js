/**
 * levels-3-4.js
 * Educational Framework: From Transistors to Qubits
 * 
 * Implements:
 * - LEVEL 3: From Classical Bit to Quantum Qubit (Superposition, Bloch Sphere, Hadamard Experiment)
 * - LEVEL 4: Classical Circuit vs Quantum Circuit (XOR vs CNOT, Half-Adder, Entangled Bell State)
 */

import { QuantumState } from './quantum-sim.js';
import { BlochSphere } from './bloch-sphere.js';

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function initLevels34() {
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
