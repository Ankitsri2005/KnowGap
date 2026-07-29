// ── needed here because taketest.html doesn't load student.js ──
function subjectIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('math')) return '📐';
  if (n.includes('physics')) return '⚛️';
  if (n.includes('computer') || n.includes('cs')) return '💻';
  if (n.includes('chem')) return '🧪';
  if (n.includes('bio')) return '🧬';
  if (n.includes('english')) return '📖';
  return '📚';
}

/* ── TEST TAKING STATE ── */
let testState = {
  sessionId: null, questions: [], answers: {}, confidence: {}, current: 0,
  subjectId: null, subjectName: '',
  totalStartTime: null, qStartTime: null,
  responseTimes: {}, navigatorColors: {}
};
let timerInterval = null;

/* ── TIMER HELPERS ── */
function startTimerLoop() {
  stopTimerLoop();
  timerInterval = setInterval(() => {
    const totalEl = document.getElementById('total-timer');
    const qEl = document.getElementById('q-timer');
    if (!testState.totalStartTime) return;
    if (totalEl) {
      const e = Math.floor((Date.now() - testState.totalStartTime) / 1000);
      totalEl.textContent = `⏱ ${Math.floor(e / 60)}M ${e % 60}S`;
    }
    if (qEl && testState.qStartTime) {
      const s = (Date.now() - testState.qStartTime) / 1000;
      qEl.textContent = `⏱️ Q${testState.current + 1} Time: ${s.toFixed(1)}s`;
    }
  }, 100);
}
function stopTimerLoop() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}
function startPerQuestionTimer() {
  testState.qStartTime = Date.now();
}

/* ── ENTRY POINTS ── */
async function renderTakeTest(params) {
  if (!State.user) return Router.go('auth');
  const { subjectId, subjectName } = params || Router.params;
  if (!subjectId) return Router.go('student');

  testState = {
    sessionId: null, questions: [], answers: {}, confidence: {}, current: 0,
    subjectId, subjectName, totalStartTime: null, qStartTime: null,
    responseTimes: {}, navigatorColors: {}
  };
  stopTimerLoop();

  document.getElementById('app').innerHTML = `
    <div class="auth-wrap" style="align-items:flex-start;padding-top:80px">
      <div style="width:100%;max-width:700px" id="test-wrap">
        <div class="loading-full"><div class="spinner"></div><p>Preparing your test for ${subjectName}...</p></div>
      </div>
    </div>`;

  try {
    const urlTopics = params?.topics || Router.params?.topics;
    const urlLimit = params?.limit || Router.params?.limit;

    if (urlTopics && urlLimit) {
      window._selectedTopics = new Set(urlTopics.split(',').filter(Boolean));
      await startTest(subjectId, urlLimit);
      return;
    }

    const topics = await API.subjects.topics(subjectId);
    renderTopicSelection(topics, subjectId, subjectName);
  } catch (e) {
    toast(e.message, 'error');
    Router.go('student');
  }
}

async function startTest(subjectId, overrideLimit) {
  const topics = Array.from(window._selectedTopics || []);
  if (!topics.length) return toast('Select at least one topic', 'error');
  const limit = overrideLimit || document.getElementById('q-count')?.value || 20;

  const wrap = document.getElementById('test-wrap');
  wrap.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading questions...</p></div>`;

  try {
    const session = await API.tests.start({ subject_id: subjectId });
    const questions = await API.questions.forSubject(subjectId, { topics: topics.join(','), limit });
    if (!questions.length) { toast('No questions found for selected topics', 'error'); return Router.go('student'); }

    testState.sessionId = session.sessionId;
    testState.questions = questions;
    testState.totalStartTime = Date.now();
    testState.current = 0;
    testState.answers = {};
    testState.confidence = {};
    testState.responseTimes = {};
    testState.navigatorColors = {};
    startPerQuestionTimer();
    startTimerLoop();
    renderQuestion();
  } catch (e) {
    toast(e.message, 'error');
    Router.go('student');
  }
}

/* ── RENDER QUESTION ── */
function renderQuestion() {
  const { questions, current, answers, confidence, subjectName, navigatorColors } = testState;
  const q = questions[current];
  const total = questions.length;
  const pct = Math.round((current / total) * 100);
  const ansCount = Object.keys(answers).length;
  const elapsed = Math.floor((Date.now() - testState.totalStartTime) / 1000);
  const qElapsed = testState.qStartTime ? (Date.now() - testState.qStartTime) / 1000 : 0;

  const hasAnswer = !!answers[q.id];
  const hasConfidence = !!confidence[q.id];
  const canGoNext = hasAnswer && hasConfidence;
  const isLast = current === total - 1;

  document.getElementById('test-wrap').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">
      <div style="font-weight:700;font-size:1.05rem">${subjectName} Test</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="badge badge-info" id="total-timer">⏱ ${Math.floor(elapsed / 60)}M ${elapsed % 60}S</span>
        <span class="q-timer" id="q-timer">⏱️ Q${current + 1} Time: ${qElapsed.toFixed(1)}s</span>
        <span class="badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}">${q.difficulty.toUpperCase()}</span>
        <button class="btn btn-secondary btn-sm" onclick="confirmQuit()">✕ Quit</button>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:.82rem;color:var(--text-muted);flex-wrap:wrap;gap:4px">
      <span>Question ${current + 1} of ${total}</span>
      <span>${ansCount}/${total} answered</span>
    </div>

    <div class="progress-bar" style="margin-bottom:24px">
      <div class="progress-fill" style="width:${pct}%"></div>
    </div>

    <div class="question-card active" id="question-card">
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px">📋 ${q.topic_name}</div>
      <h3 style="margin-bottom:28px;line-height:1.6;font-size:1.1rem">Q${current + 1}. ${q.question_text}</h3>
      ${['A', 'B', 'C', 'D'].map(opt => `
        <button class="option-btn ${answers[q.id] === opt ? 'selected' : ''}" id="opt-${opt}" onclick="selectAnswer('${opt}')">
          <span class="opt-letter">${opt}</span>
          <span>${q['option_' + opt.toLowerCase()]}</span>
          ${answers[q.id] === opt ? '<span style="margin-left:auto;color:var(--primary);font-weight:600">●</span>' : ''}
        </button>
      `).join('')}

      <!-- ── CONFIDENCE TAG ── -->
      <div class="confidence-block" id="confidence-block">
        <div class="confidence-header">
          <span class="confidence-title">🎯 Confidence Tag (Required)</span>
          <span class="confidence-required" id="conf-required" style="display:${hasAnswer && !hasConfidence ? 'inline-flex' : 'none'}">Required ↓</span>
        </div>
        <p class="confidence-sub">How confident were you in this answer? This is used for forensic gap analysis.</p>
        <div class="confidence-toggle" id="confidence-toggle">
          <button
            class="conf-btn conf-btn--sure ${confidence[q.id] === 'sure' ? 'active' : ''}"
            id="conf-sure"
            onclick="selectConfidence('sure')"
            ${!hasAnswer ? 'disabled' : ''}>
            <span class="conf-btn-icon">✅</span>
            <div>
              <div class="conf-btn-label">Sure</div>
              <div class="conf-btn-sub">I know this answer</div>
            </div>
            <span class="conf-btn-check">${confidence[q.id] === 'sure' ? '●' : ''}</span>
          </button>
          <button
            class="conf-btn conf-btn--guessed ${confidence[q.id] === 'guessed' ? 'active' : ''}"
            id="conf-guessed"
            onclick="selectConfidence('guessed')"
            ${!hasAnswer ? 'disabled' : ''}>
            <span class="conf-btn-icon">❓</span>
            <div>
              <div class="conf-btn-label">Guessed</div>
              <div class="conf-btn-sub">I wasn't sure</div>
            </div>
            <span class="conf-btn-check">${confidence[q.id] === 'guessed' ? '●' : ''}</span>
          </button>
        </div>
        <div class="confidence-hint" id="conf-hint">
          ${!hasAnswer
            ? '← Select an answer first, then tag your confidence'
            : hasConfidence
              ? (confidence[q.id] === 'sure'
                  ? '✅ Tagged as <strong>Sure</strong> — c<sub>i</sub>=1, k<sub>i</sub>=1 (Truly Knows)'
                  : '🎲 Tagged as <strong>Guessed</strong> — c<sub>i</sub>=1, k<sub>i</sub>=0 · <span style="color:#fc8181;font-weight:700">Hidden Gap risk flagged</span>')
              : '💡 Students who guess correctly drop 32.8% on retests. Your honesty helps us find Hidden Gaps.'
          }
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:24px;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary" ${current === 0 ? 'disabled' : ''} onclick="prevQuestion()">← Previous</button>
      ${isLast
        ? `<button class="btn btn-success btn-lg btn-next" id="btn-next" ${canGoNext ? '' : 'disabled'} onclick="submitTest()">Submit & Analyze →</button>`
        : `<button class="btn btn-next" id="btn-next" ${canGoNext ? '' : 'disabled'} onclick="nextQuestion()">Next →</button>`
      }
    </div>

    <!-- Question Navigator -->
    <div style="margin-top:28px">
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:10px">Question Navigator</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px" id="nav-dots">
        ${questions.map((_, i) => {
          const qi = questions[i];
          const nid = `nav-${qi.id}`;
          const isCur = i === current;
          const color = navigatorColors[qi.id] || (isCur ? 'current' : '');
          let cls = 'nav-dot';
          if (color) cls += ' ' + color;
          return `<button class="${cls}" id="${nid}" onclick="jumpTo(${i})">${i + 1}</button>`;
        }).join('')}
      </div>
      <div class="nav-legend">
        <span class="nav-legend-item"><span class="nav-legend-dot" style="background:#22c55e"></span> Correct+Sure</span>
        <span class="nav-legend-item"><span class="nav-legend-dot" style="background:#ef4444"></span> Correct+Guessed</span>
        <span class="nav-legend-item"><span class="nav-legend-dot" style="background:#f59e0b"></span> Wrong+Sure</span>
        <span class="nav-legend-item"><span class="nav-legend-dot" style="background:#3b82f6"></span> Wrong+Guessed</span>
        <span class="nav-legend-item"><span class="nav-legend-dot" style="border:1.5px solid var(--border);background:transparent"></span> Current/Unanswered</span>
      </div>
    </div>`;
}

function updateNavigatorDot(qId, color) {
  const dot = document.getElementById(`nav-${qId}`);
  if (!dot) return;
  dot.className = 'nav-dot';
  if (color) dot.classList.add(color);
}

/* ── USER ACTIONS ── */
window.selectAnswer = function (opt) {
  const q = testState.questions[testState.current];
  // Changing answer invalidates previous confidence & color
  if (testState.answers[q.id] && testState.answers[q.id] !== opt) {
    delete testState.confidence[q.id];
    delete testState.navigatorColors[q.id];
  }
  if (testState.navigatorColors[q.id]) {
    delete testState.navigatorColors[q.id];
  }
  testState.answers[q.id] = opt;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`opt-${opt}`).classList.add('selected');

  document.querySelectorAll('.conf-btn').forEach(b => b.removeAttribute('disabled'));

  const reqEl = document.getElementById('conf-required');
  if (reqEl && !testState.confidence[q.id]) reqEl.style.display = 'inline-flex';

  const hint = document.getElementById('conf-hint');
  if (hint) {
    if (!testState.confidence[q.id]) {
      hint.innerHTML = '💡 Students who guess correctly drop 32.8% on retests. Your honesty helps us find Hidden Gaps.';
    }
  }

  updateNextButton();
};

window.selectConfidence = function (level) {
  const q = testState.questions[testState.current];
  if (!testState.answers[q.id]) {
    toast('Select an answer first', 'warning');
    return;
  }
  // Re-tagging invalidates previous color
  if (testState.navigatorColors[q.id]) {
    delete testState.navigatorColors[q.id];
  }
  testState.confidence[q.id] = level;

  document.querySelectorAll('.conf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(level === 'sure' ? 'conf-sure' : 'conf-guessed').classList.add('active');

  // Update check marks
  document.querySelectorAll('.conf-btn-check').forEach(b => b.textContent = '');
  document.querySelectorAll(`.conf-btn-check`).forEach(b => {
    if (b.closest(`.conf-btn--${level}`)) b.textContent = '●';
  });

  const reqEl = document.getElementById('conf-required');
  if (reqEl) reqEl.style.display = 'none';

  const hint = document.getElementById('conf-hint');
  if (hint) {
    hint.innerHTML = level === 'sure'
      ? '✅ Tagged as <strong>Sure</strong> — c<sub>i</sub>=1, k<sub>i</sub>=1 (Truly Knows)'
      : '🎲 Tagged as <strong>Guessed</strong> — c<sub>i</sub>=1, k<sub>i</sub>=0 · <span style="color:#fc8181;font-weight:700">Hidden Gap risk flagged</span>';
  }

  updateNextButton();
};

function updateNextButton() {
  const btn = document.getElementById('btn-next');
  if (!btn) return;
  const q = testState.questions[testState.current];
  const canGo = !!testState.answers[q.id] && !!testState.confidence[q.id];
  if (canGo) {
    btn.removeAttribute('disabled');
  } else {
    btn.setAttribute('disabled', '');
  }
}

window.nextQuestion = function () {
  const q = testState.questions[testState.current];
  if (!testState.answers[q.id] || !testState.confidence[q.id]) {
    const card = document.getElementById('question-card');
    if (card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 600); }
    const block = document.getElementById('confidence-block');
    if (block) { block.classList.add('highlight-required'); setTimeout(() => block.classList.remove('highlight-required'), 1200); }
    toast('⚠️ Please tag your confidence (Sure or Guessed) before continuing', 'warning');
    return;
  }

  // Record response time for the current question
  const qTime = Date.now() - testState.qStartTime;
  testState.responseTimes[q.id] = qTime;

  // Fire async answer check
  checkAnswerOnServer(q.id, testState.answers[q.id]);

  if (testState.current < testState.questions.length - 1) {
    testState.current++;
    startPerQuestionTimer();
    renderQuestion();
  }
};

async function checkAnswerOnServer(qId, selectedAnswer) {
  if (testState.navigatorColors[qId]) return; // already checked
  try {
    const res = await API.post('/questions/check', { questionId: qId, selectedAnswer });
    const isCorrect = res.isCorrect;
    const conf = testState.confidence[qId];
    let color;
    if (isCorrect && conf === 'sure') color = 'green';
    else if (isCorrect && conf === 'guessed') color = 'red';
    else if (!isCorrect && conf === 'sure') color = 'orange';
    else color = 'blue';
    testState.navigatorColors[qId] = color;
    updateNavigatorDot(qId, color);
  } catch (e) {
    // Silently fail — navigator stays neutral
  }
}

window.prevQuestion = function () {
  if (testState.current > 0) {
    testState.current--;
    startPerQuestionTimer();
    renderQuestion();
  }
};

window.jumpTo = function (i) {
  if (i >= 0 && i < testState.questions.length) {
    testState.current = i;
    startPerQuestionTimer();
    renderQuestion();
  }
};

window.confirmQuit = function () {
  stopTimerLoop();
  if (confirm('Quit test? Progress will be lost.')) Router.go('student');
  else startTimerLoop();
};

async function submitTest() {
  const { sessionId, questions, answers, confidence, responseTimes } = testState;
  const unanswered = questions.filter(q => !answers[q.id]).length;
  const missingConf = questions.filter(q => answers[q.id] && !confidence[q.id]).length;

  if (unanswered > 0) {
    if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
  }
  if (missingConf > 0) {
    if (!confirm(`${missingConf} answered question(s) are missing a confidence tag (Sure/Guessed). Without it, those answers cannot be forensically analysed. Submit anyway?`)) return;
  }

  // Record response time and check the final question
  const lastQ = questions[testState.current];
  if (lastQ && testState.qStartTime && !responseTimes[lastQ.id]) {
    responseTimes[lastQ.id] = Date.now() - testState.qStartTime;
    checkAnswerOnServer(lastQ.id, testState.answers[lastQ.id]);
  }

  stopTimerLoop();

  const wrap = document.getElementById('test-wrap');
  wrap.innerHTML = `
    <div class="loading-full" style="min-height:420px">
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:12px">🎉</div>
        <p style="margin-top:8px;font-size:1.2rem;font-weight:700">Test Submitted!</p>
        <p style="color:var(--text-muted);margin-top:6px;margin-bottom:24px">Generating your forensic gap analysis...</p>
        <div class="spinner" style="margin:0 auto 24px"></div>
        <div style="text-align:left;display:inline-block;min-width:220px">
          <div class="t-step visible">✅ Analyzing confidence tags</div>
          <div class="t-step" style="animation-delay:0.4s">🔍 Mapping misconceptions</div>
          <div class="t-step" style="animation-delay:0.8s">📊 Building study plan</div>
        </div>
      </div>
    </div>`;

  try {
    const payload = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] || null,
      confidence: confidence[q.id] || null,
      responseTimeMs: responseTimes[q.id] || null
    }));

    const res = await API.tests.submit(
      sessionId,
      { answers: payload }
    );

    if (res.analysis) {
      sessionStorage.setItem(
        `knowgap_result_${res.sessionId}`,
        JSON.stringify(res.analysis)
      );
    }

    toast('Analysis complete! 🎉', 'success');

    window.location.href =
      `student-report.html?testId=${res.sessionId}`;

  } catch (e) {
    toast(e.message, 'error');
    Router.go('student');
  }
}

/* ── INLINE TOPIC SELECTION (fallback, used when setup page bypassed) ── */
function renderTopicSelection(topics, subjectId, subjectName) {
  const wrap = document.getElementById('test-wrap');
  const selected = new Set();

  wrap.innerHTML = `
    <button class="btn btn-secondary btn-sm" style="margin-bottom:20px" onclick="Router.go('student')">← Back</button>
    <div class="card-glass" style="padding:32px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:2.5rem">${subjectIcon(subjectName)}</div>
        <h2 style="margin-top:12px">${subjectName}</h2>
        <p style="color:var(--text-secondary);margin-top:8px">Select topics to include in your test (select all for full assessment)</p>
      </div>
      <div id="topic-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
        ${topics.map(t => {
          const tid = t.id || t._id;
          return `
          <label style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--bg-input);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:all .2s" id="tl-${tid}">
            <input type="checkbox" id="topic-${tid}" value="${tid}" style="width:18px;height:18px;accent-color:var(--primary)" onchange="toggleTopic('${tid}',this)" checked/>
            <div style="flex:1">
              <div style="font-weight:600">${t.name}</div>
              <div style="font-size:.8rem;color:var(--text-muted)">${t.question_count} questions available</div>
            </div>
            <span class="badge badge-info">${t.question_count} Q</span>
          </label>`;
        }).join('')}
      </div>
      <div style="margin-bottom:20px">
        <label class="form-label">Number of Questions: <strong id="q-count-label">20</strong></label>
        <input type="range" id="q-count" min="10" max="30" value="20" style="width:100%;accent-color:var(--primary)" oninput="document.getElementById('q-count-label').textContent=this.value"/>
      </div>
      <button class="btn btn-primary btn-full btn-lg" onclick="startTest('${subjectId}')">🚀 Start Test →</button>
    </div>`;

  topics.forEach(t => selected.add(String(t.id || t._id)));
  window._selectedTopics = selected;
}

window.toggleTopic = function (id, cb) {
  const label = document.getElementById(`tl-${id}`);
  if (cb.checked) {
    window._selectedTopics.add(id);
    label.style.borderColor = 'var(--primary)';
    label.style.background = 'var(--accent-soft)';
  } else {
    window._selectedTopics.delete(id);
    label.style.borderColor = 'var(--border)';
    label.style.background = 'var(--bg-input)';
  }
};
