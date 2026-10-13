/**
 * levels-1-2.js
 * Educational Framework: From Transistors to Qubits
 * Interactive implementation for Level 1 (Transistor as a Switch)
 * and Level 2 (Logic Gates and the Quantum X Gate).
 */

export function initLevels12() {
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
