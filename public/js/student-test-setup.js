/* ── STUDENT TEST SETUP (Topic Selection) ── */

let _selectedTopics = new Set();
let _topics = [];

function subjectIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('math') || n.includes('dsa') || n.includes('algorithm')) return '📐';
  if (n.includes('physics')) return '⚛️';
  if (n.includes('computer') || n.includes('cs') || n.includes('program')) return '💻';
  if (n.includes('chem')) return '🧪';
  if (n.includes('bio')) return '🧬';
  if (n.includes('english')) return '📖';
  if (n.includes('science')) return '🔬';
  if (n.includes('aptitude') || n.includes('reason')) return '🧠';
  return '📚';
}

async function renderSetup(subjectId, subjectName) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading topics for ${subjectName}...</p></div>`;

  try {
    const topics = await API.subjects.topics(subjectId);
    _topics = topics;

    const totalQ = topics.reduce((s, t) => s + (t.question_count || 0), 0);
    const maxQ = Math.min(totalQ, 50);
    const defaultQ = Math.min(Math.max(20, 10), maxQ);

    // All selected by default
    _selectedTopics = new Set(topics.map(t => String(t.id || t._id)));

    app.innerHTML = `
      <div>
        <button class="btn btn-secondary btn-sm" style="margin-bottom:24px" onclick="window.history.back()">← Back</button>

        <div class="card" style="padding:32px;text-align:center;margin-bottom:24px">
          <div style="font-size:2.8rem;margin-bottom:12px">${subjectIcon(subjectName)}</div>
          <h2 style="margin:0">${subjectName}</h2>
          <p style="color:var(--text-secondary);margin-top:8px">Select topics to include in your test</p>
        </div>

        <div class="card" style="padding:28px">
          <p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:20px">☑️ Select topics (all selected by default):</p>
          <div id="topic-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:28px">
            ${topics.map(t => {
              const tid = String(t.id || t._id);
              return `
                <div class="topic-option checked" id="tl-${tid}" onclick="toggleTopic('${tid}')">
                  <input type="checkbox" id="topic-${tid}" value="${tid}" checked style="pointer-events:none" />
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600">${t.name}</div>
                    <div style="font-size:.8rem;color:var(--text-muted)">${t.question_count} questions available</div>
                  </div>
                  <span class="q-badge">${t.question_count} Q</span>
                </div>
              `;
            }).join('')}
          </div>

          ${topics.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:16px 0">No topics available for this subject yet.</p>' : ''}

          <div class="slider-wrap">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center">
              <span>Number of Questions:</span>
              <strong id="q-count-label" style="font-size:1.2rem">${defaultQ}</strong>
            </label>
            <input type="range" id="q-count" min="10" max="${maxQ}" value="${defaultQ}"
                   oninput="updateCount(this.value)" />
            <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-muted);margin-top:4px">
              <span>10</span>
              <span>${maxQ}</span>
            </div>
          </div>

          <button class="btn btn-primary btn-full btn-start" id="start-btn" onclick="startTest('${subjectId}')">🚀 Start Test →</button>
        </div>
      </div>
    `;

    updateStartBtn();
  } catch (e) {
    app.innerHTML = `
      <div class="empty-state" style="margin-top:40px">
        <div class="empty-icon">⚠️</div>
        <p>${e.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="window.location.href='student.html'">Go Back</button>
      </div>`;
  }
}

window.toggleTopic = function (id) {
  const cb = document.getElementById(`topic-${id}`);
  cb.checked = !cb.checked;
  const label = document.getElementById(`tl-${id}`);
  if (cb.checked) {
    _selectedTopics.add(id);
    label.classList.add('checked');
  } else {
    _selectedTopics.delete(id);
    label.classList.remove('checked');
  }
  updateStartBtn();
};

function updateCount(val) {
  document.getElementById('q-count-label').textContent = val;
}

function updateStartBtn() {
  const btn = document.getElementById('start-btn');
  if (btn) btn.disabled = _selectedTopics.size === 0;
}

function startTest(subjectId) {
  const topics = Array.from(_selectedTopics);
  if (!topics.length) return toast('Select at least one topic', 'error');
  const limit = document.getElementById('q-count')?.value || 20;
  const params = new URLSearchParams({ subjectId, subjectName: document.querySelector('h2').textContent, topics: topics.join(','), limit });
  window.location.href = 'taketest.html?' + params.toString();
}
