/**
 * @file simulator.js
 * @description Interactive Simulator Lab for 'From Transistors to Qubits' educational framework.
 * Features 4 interconnected modules:
 *   Module A: BJT NPN Transistor Simulator & Transfer Characteristics
 *   Module B: Classical Logic Gate Simulator (NOT, AND, OR, NAND, NOR, XOR)
 *   Module C: Quantum Circuit Simulator (1-2 Qubits, Bloch Sphere, Chart.js histogram)
 *   Module D: Live Classical vs Quantum Comparison Table
 */

import { QuantumState, GATES, runShots, complexAbsSq } from './quantum-sim.js';
import { BlochSphere } from './bloch-sphere.js';

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
export function initSimulator() {
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
