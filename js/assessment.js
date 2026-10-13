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

export function initAssessment() {
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
