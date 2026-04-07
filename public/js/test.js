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

/* ── TEST TAKING PAGE ── */
let testState = {
  sessionId: null, questions: [], answers: {}, current: 0,
  subjectId: null, subjectName: '', startTime: null
};

async function renderTakeTest(params) {
  if (!State.user) return Router.go('auth');
  const { subjectId, subjectName } = params || Router.params;
  if (!subjectId) return Router.go('student');

  testState = { sessionId: null, questions: [], answers: {}, current: 0, subjectId, subjectName, startTime: null };

  document.getElementById('app').innerHTML = `
    <div class="auth-wrap" style="align-items:flex-start;padding-top:80px">
      <div style="width:100%;max-width:700px" id="test-wrap">
        <div class="loading-full"><div class="spinner"></div><p>Preparing your test for ${subjectName}...</p></div>
      </div>
    </div>`;

  try {
    const topics = await API.subjects.topics(subjectId);
    renderTopicSelection(topics, subjectId, subjectName);
  } catch (e) {
    toast(e.message, 'error');
    Router.go('student');
  }
}

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
        ${topics.map(t => `
          <label style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--bg-input);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:all .2s" id="tl-${t.id}">
            <input type="checkbox" id="topic-${t.id}" value="${t.id}" style="width:18px;height:18px;accent-color:var(--primary)" onchange="toggleTopic(${t.id},this)" checked/>
            <div style="flex:1">
              <div style="font-weight:600">${t.name}</div>
              <div style="font-size:.8rem;color:var(--text-muted)">${t.question_count} questions available</div>
            </div>
            <span class="badge badge-info">${t.question_count} Q</span>
          </label>
        `).join('')}
      </div>
      <div style="margin-bottom:20px">
        <label class="form-label">Number of Questions: <strong id="q-count-label">20</strong></label>
        <input type="range" id="q-count" min="10" max="30" value="20" style="width:100%;accent-color:var(--primary)" oninput="document.getElementById('q-count-label').textContent=this.value"/>
      </div>
      <button class="btn btn-primary btn-full btn-lg" onclick="startTest(${subjectId})">🚀 Start Test →</button>
    </div>`;

  topics.forEach(t => selected.add(t.id));
  window._selectedTopics = selected;
}

window.toggleTopic = function (id, cb) {
  const label = document.getElementById(`tl-${id}`);
  if (cb.checked) {
    window._selectedTopics.add(id);
    label.style.borderColor = 'var(--primary)';
    label.style.background = 'rgba(99,102,241,.08)';
  } else {
    window._selectedTopics.delete(id);
    label.style.borderColor = 'var(--border)';
    label.style.background = 'var(--bg-input)';
  }
};

async function startTest(subjectId) {
  const topics = Array.from(window._selectedTopics || []);
  if (!topics.length) return toast('Select at least one topic', 'error');
  const limit = document.getElementById('q-count')?.value || 20;

  const wrap = document.getElementById('test-wrap');
  wrap.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading questions...</p></div>`;

  try {
    const session = await API.tests.start({ subject_id: subjectId });
    const questions = await API.questions.forSubject(subjectId, { topics: topics.join(','), limit });
    if (!questions.length) { toast('No questions found for selected topics', 'error'); return Router.go('student'); }

    testState.sessionId = session.sessionId;
    testState.questions = questions;
    testState.startTime = Date.now();
    testState.current = 0;
    testState.answers = {};

    renderQuestion();
  } catch (e) {
    toast(e.message, 'error');
    Router.go('student');
  }
}

function renderQuestion() {
  const { questions, current, answers, subjectName } = testState;
  const q = questions[current];
  const total = questions.length;
  const pct = Math.round((current / total) * 100);
  const elapsed = Math.floor((Date.now() - testState.startTime) / 1000);
  const mins = Math.floor(elapsed / 60), secs = elapsed % 60;

  document.getElementById('test-wrap').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-weight:700">${subjectName} Test</div>
        <div style="font-size:.85rem;color:var(--text-muted)">Question ${current + 1} of ${total}</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        <span class="badge badge-info">⏱ ${mins}m ${secs}s</span>
        <span class="badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}">${q.difficulty}</span>
        <button class="btn btn-secondary btn-sm" onclick="confirmQuit()">✕ Quit</button>
      </div>
    </div>

    <div class="progress-bar" style="margin-bottom:8px">
      <div class="progress-fill" style="width:${pct}%"></div>
    </div>
    <div style="text-align:right;font-size:.8rem;color:var(--text-muted);margin-bottom:24px">${Object.keys(answers).length}/${total} answered</div>

    <div class="question-card active">
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px">📋 ${q.topic_name}</div>
      <h3 style="margin-bottom:28px;line-height:1.6;font-size:1.1rem">Q${current + 1}. ${q.question_text}</h3>
      ${['A', 'B', 'C', 'D'].map(opt => `
        <button class="option-btn ${answers[q.id] === opt ? 'selected' : ''}" id="opt-${opt}" onclick="selectAnswer('${opt}')">
          <span class="opt-label">${opt}</span>
          <span>${q['option_' + opt.toLowerCase()]}</span>
        </button>
      `).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:24px;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary" ${current === 0 ? 'disabled' : ''} onclick="prevQuestion()">← Previous</button>
      <div style="display:flex;gap:8px">
        ${current < total - 1
      ? `<button class="btn btn-primary" onclick="nextQuestion()">Next →</button>`
      : `<button class="btn btn-success btn-lg" onclick="submitTest()">🧠 Submit & Analyze →</button>`
    }
      </div>
    </div>

    <!-- Question Navigator -->
    <div style="margin-top:28px">
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:10px">Question Navigator</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${questions.map((_, i) => `
          <button onclick="jumpTo(${i})" style="width:32px;height:32px;border-radius:8px;border:1.5px solid ${i === current ? 'var(--primary)' : answers[questions[i].id] ? 'var(--success)' : 'var(--border)'
      };background:${i === current ? 'rgba(99,102,241,.2)' : answers[questions[i].id] ? 'rgba(16,185,129,.15)' : 'var(--bg-input)'
      };color:var(--text);cursor:pointer;font-size:.8rem;font-weight:600">${i + 1}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:16px;margin-top:10px;font-size:.75rem;color:var(--text-muted)">
        <span>⬜ Unanswered</span><span style="color:var(--success)">🟩 Answered</span><span style="color:var(--primary)">🟦 Current</span>
      </div>
    </div>`;
}

window.selectAnswer = function (opt) {
  const q = testState.questions[testState.current];
  testState.answers[q.id] = opt;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`opt-${opt}`).classList.add('selected');
};

window.nextQuestion = function () {
  if (testState.current < testState.questions.length - 1) { testState.current++; renderQuestion(); }
};

window.prevQuestion = function () {
  if (testState.current > 0) { testState.current--; renderQuestion(); }
};

window.jumpTo = function (i) { testState.current = i; renderQuestion(); };

window.confirmQuit = function () {
  if (confirm('Quit test? Progress will be lost.')) Router.go('student');
};

async function submitTest() {
  const { sessionId, questions, answers } = testState;
  const unanswered = questions.filter(q => !answers[q.id]).length;
  if (unanswered > 0) {
    if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
  }

  const wrap = document.getElementById('test-wrap');
  wrap.innerHTML = `<div class="loading-full" style="min-height:400px"><div class="spinner"></div><p style="margin-top:16px">🤖 AI is analyzing your answers...</p><p style="color:var(--text-muted);font-size:.9rem;margin-top:8px">Identifying gaps · Building study plan · Calculating scores</p></div>`;

  try {
    const payload = questions.map(q => ({ questionId: q.id, selectedAnswer: answers[q.id] || null }));
    const res = await API.tests.submit(sessionId, { answers: payload });
    toast('Analysis complete! 🎉', 'success');
    Router.go('results', { sessionId, analysis: res.analysis });
  } catch (e) {
    toast(e.message, 'error');
  }
}