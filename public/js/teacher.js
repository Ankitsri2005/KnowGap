/* ── TEACHER DASHBOARD ── */

// Subject icon helper (also used in student.js)
function subjectIcon(name)
{
    const n = (name || '').toLowerCase();
    if (n.includes('math')) return '📐';
    if (n.includes('physics')) return '⚛️';
    if (n.includes('computer') || n.includes('cs')) return '💻';
    if (n.includes('chem')) return '🧪';
    if (n.includes('bio')) return '🧬';
    if (n.includes('english')) return '📖';
    return '📚';
}

async function renderTeacher()
{
    const app = document.getElementById('main-content');
    if (!app) return;
    app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading dashboard...</p></div>`;

    try
    {
        const data = await API.teacher.overview();
        app.innerHTML = `
      <div style="margin-bottom:32px">
        <h2>Welcome, <span class="gradient-text">${State.user.name}</span> 👩‍🏫</h2>
        <p style="color:var(--text-secondary);margin-top:4px">Here's your classroom overview</p>
      </div>

      <div class="grid-4" style="margin-bottom:32px">
        ${[
          ['👨‍🎓', data.totalStudents, 'Total Students', 'var(--primary)'],
          ['📝', data.totalTests, 'Tests Completed', 'var(--secondary)'],
          ['❓', data.totalQuestions, 'Questions in Bank', 'var(--accent)'],
          ['📊', (data.avgScore || 0) + '%', 'Class Avg Score', scoreColor(data.avgScore || 0)]
        ].map(([icon, val, label, color]) => `
          <div class="stat-card">
            <div class="stat-icon">${icon}</div>
            <div class="stat-value" style="color:${color}">${val}</div>
            <div class="stat-label">${label}</div>
          </div>
        `).join('')}
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <!-- Recent Tests -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border)">
            <h3>📋 Recent Tests</h3>
          </div>
          ${data.recentTests.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-icon">📭</div><p>No tests yet</p></div>' :
            `<table class="table">
              <thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>${data.recentTests.map(t => `
                <tr>
                  <td><strong>${t.student_name}</strong></td>
                  <td>${t.subject_name}</td>
                  <td><span style="font-weight:700;color:${scoreColor(t.score_percentage)}">${Math.round(t.score_percentage)}%</span></td>
                  <td style="color:var(--text-muted)">${timeAgo(t.completed_at)}</td>
                </tr>
              `).join('')}</tbody>
            </table>`}
        </div>

        <!-- Critical Students -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <h3>🚨 Critical Students (score &lt; 40%)</h3>
          </div>
          ${data.criticalStudents.length === 0 ?
            '<div class="empty-state" style="padding:30px"><div class="empty-icon">✅</div><p>No critical students!</p></div>' :
            `<div style="padding:16px;display:flex;flex-direction:column;gap:10px">
              ${data.criticalStudents.map(s => `
                <div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px">
                  <div style="width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;color:var(--danger)">${s.name[0]}</div>
                  <div style="flex:1">
                    <div style="font-weight:600;font-size:.9rem">${s.name}</div>
                    <div style="font-size:.75rem;color:var(--text-muted)">${s.subject_name}</div>
                  </div>
                  <span style="color:var(--danger);font-weight:800">${Math.round(s.overall_score)}%</span>
                </div>
              `).join('')}
            </div>`}
        </div>
      </div>`;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
}

/* ── TEACHER: Students List ── */
async function renderTeacherStudents()
{
    document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
    try
    {
        const students = await API.teacher.students();
        document.getElementById('main-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <h2>👨‍🎓 All Students</h2>
        <input id="search-students" type="text" class="form-input" placeholder="Search students..." style="max-width:260px" oninput="filterStudents(this.value)"/>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="table" id="students-table">
          <thead><tr><th>Name</th><th>Email</th><th>Tests Taken</th><th>Avg Score</th><th>Last Test</th><th>Action</th></tr></thead>
          <tbody id="students-tbody">
            ${students.map(s => `
              <tr data-name="${s.name.toLowerCase()}">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(99,102,241,.2);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary)">${s.name[0]}</div>
                    <strong>${s.name}</strong>
                  </div>
                </td>
                <td style="color:var(--text-muted)">${s.email}</td>
                <td>${s.total_tests || 0}</td>
                <td><span style="font-weight:700;color:${scoreColor(s.avg_score||0)}">${s.avg_score || 'N/A'}</span></td>
                <td style="color:var(--text-muted)">${timeAgo(s.last_test)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="viewStudent(${s.id},'${s.name}')">View Detail</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
}

window.filterStudents = function(q)
{
    document.querySelectorAll('#students-tbody tr').forEach(row =>
    {
        row.style.display = row.dataset.name.includes(q.toLowerCase()) ? '' : 'none';
    });
};

window.viewStudent = async function(id, name)
{
    document.getElementById('main-content').innerHTML = `
    <button class="btn btn-secondary btn-sm" style="margin-bottom:20px" onclick="renderTeacherStudents()">← Back to Students</button>
    <h2 style="margin-bottom:20px">📊 ${name}'s Performance</h2>
    <div class="loading-full"><div class="spinner"></div></div>`;
    try
    {
        const tests = await API.teacher.student(id);
        document.getElementById('main-content').innerHTML = `
      <button class="btn btn-secondary btn-sm" style="margin-bottom:20px" onclick="renderTeacherStudents()">← Back to Students</button>
      <h2 style="margin-bottom:20px">📊 ${name}'s Performance</h2>
      ${tests.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No tests taken yet</p></div>' : `
        <div style="display:flex;flex-direction:column;gap:14px">
          ${tests.map(t => `
            <div class="card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
              <div>
                <div style="font-weight:700">${t.subject_name}</div>
                <div style="font-size:.85rem;color:var(--text-muted)">${timeAgo(t.completed_at)} · ${t.total_questions} questions</div>
                ${t.priority_topics ? (() => {
                  try { const pt = JSON.parse(t.priority_topics); return pt.length ? `<div style="margin-top:6px;font-size:.8rem;color:var(--danger)">⚠ Gaps: ${pt.slice(0,2).map(p=>p.name).join(', ')}</div>` : ''; } catch { return ''; }
                })() : ''}
              </div>
              <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                <div style="text-align:center">
                  <div style="font-size:1.8rem;font-weight:800;color:${scoreColor(t.overall_score||0)}">${t.overall_score||0}%</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">Score</div>
                </div>
                <span class="badge ${scoreBadge(t.overall_score||0)}">${t.performance_level||'N/A'}</span>
              </div>
            </div>
          `).join('')}
        </div>`}`;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
};

/* ── TEACHER: Question Bank ── */
async function renderQuestionBank()
{
    document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
    try
    {
        const subjects = await API.subjects.all();
        document.getElementById('main-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <h2>❓ Question Bank</h2>
        <button class="btn btn-primary" onclick="showAddQuestion()">+ Add Question</button>
      </div>
      <div class="form-group" style="max-width:300px">
        <select id="qb-subject" class="form-input form-select" onchange="loadQuestions(this.value)">
          <option value="">-- Select Subject --</option>
          ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div id="qb-list"></div>
      <div id="add-q-modal" style="display:none"></div>`;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
}

window.loadQuestions = async function(subjectId)
{
    if (!subjectId) return;
    document.getElementById('qb-list').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
    try
    {
        const qs = await API.questions.manage(subjectId);
        document.getElementById('qb-list').innerHTML = `
      <div style="margin-top:16px;color:var(--text-muted);font-size:.85rem;margin-bottom:10px">${qs.length} questions found</div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="table">
          <thead><tr><th>#</th><th>Question</th><th>Topic</th><th>Difficulty</th><th>Answer</th><th></th></tr></thead>
          <tbody>
            ${qs.map((q, i) => `
              <tr>
                <td style="color:var(--text-muted)">${i+1}</td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${q.question_text}">${q.question_text}</td>
                <td><span class="badge badge-info">${q.topic_name}</span></td>
                <td><span class="badge ${q.difficulty==='easy'?'badge-success':q.difficulty==='hard'?'badge-danger':'badge-warning'}">${q.difficulty}</span></td>
                <td style="font-weight:700;color:var(--success)">${q.correct_answer}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteQuestion(${q.id})">🗑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
};

window.deleteQuestion = async function(id)
{
    if (!confirm('Delete this question?')) return;
    try
    {
        await API.questions.delete(id);
        toast('Question deleted', 'success');
        document.getElementById('qb-subject').dispatchEvent(new Event('change'));
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
};

window.showAddQuestion = async function()
{
    const subjects = await API.subjects.all();
    document.getElementById('add-q-modal').style.display = 'block';
    document.getElementById('add-q-modal').innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
          <h3>➕ Add New Question</h3>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('add-q-modal').style.display='none'">✕</button>
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select id="aq-subject" class="form-input form-select" onchange="loadTopicsForQ(this.value)">
            <option value="">Select Subject</option>
            ${subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Topic</label>
          <select id="aq-topic" class="form-input form-select"><option value="">Select Subject first</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Question Text</label>
          <textarea id="aq-text" class="form-input" rows="3" placeholder="Enter the question..."></textarea>
        </div>
        ${['A','B','C','D'].map(o=>`
          <div class="form-group">
            <label class="form-label">Option ${o}</label>
            <input id="aq-opt${o}" type="text" class="form-input" placeholder="Option ${o}"/>
          </div>
        `).join('')}
        <div class="form-group">
          <label class="form-label">Correct Answer</label>
          <select id="aq-answer" class="form-input form-select">
            ${['A','B','C','D'].map(o=>`<option value="${o}">Option ${o}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Difficulty</label>
          <select id="aq-diff" class="form-input form-select">
            <option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option>
          </select>
        </div>
        <button class="btn btn-primary btn-full" onclick="submitNewQuestion()">💾 Save Question</button>
      </div>
    </div>`;
};

window.loadTopicsForQ = async function(sid)
{
    if (!sid) return;
    const topics = await API.subjects.topics(sid);
    document.getElementById('aq-topic').innerHTML = topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
};

window.submitNewQuestion = async function()
{
    const body = {
        subject_id: parseInt(document.getElementById('aq-subject').value),
        topic_id: parseInt(document.getElementById('aq-topic').value),
        question_text: document.getElementById('aq-text').value.trim(),
        option_a: document.getElementById('aq-optA').value.trim(),
        option_b: document.getElementById('aq-optB').value.trim(),
        option_c: document.getElementById('aq-optC').value.trim(),
        option_d: document.getElementById('aq-optD').value.trim(),
        correct_answer: document.getElementById('aq-answer').value,
        difficulty: document.getElementById('aq-diff').value
    };
    if (!body.subject_id || !body.topic_id || !body.question_text || !body.option_a) return toast('Fill all fields', 'error');
    try
    {
        await API.questions.add(body);
        toast('Question added! ✅', 'success');
        document.getElementById('add-q-modal').style.display = 'none';
        if (document.getElementById('qb-subject').value) loadQuestions(document.getElementById('qb-subject').value);
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
};

/* ── TEACHER: Manage Subjects ── */
async function renderManageSubjects()
{
    document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
    try
    {
        const subjects = await API.subjects.all();
        document.getElementById('main-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <h2>📚 Manage Subjects</h2>
        <button class="btn btn-primary" onclick="showAddSubject()">+ Add Subject</button>
      </div>
      <div class="grid-3">
        ${subjects.map(s=>`
          <div class="card" style="cursor:pointer;position:relative;overflow:hidden;padding:24px;border-radius:16px;background:#fff;border:1px solid var(--border);border-top:4px solid var(--primary);box-shadow:0 4px 6px rgba(0,0,0,0.02);">
            <div style="font-size:2rem;margin-bottom:16px">${subjectIcon(s.name)}</div>
            <h3 style="margin-bottom:8px;font-family:'Playfair Display', serif;color:#000;font-size:1.3rem">${s.name}</h3>
            <p style="color:var(--text-muted);font-size:.9rem;line-height:1.5;margin-bottom:20px;min-height:40px">${s.description||'Manage topics and questions.'}</p>
            <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">
              <span class="badge" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:20px;padding:4px 12px;font-size:0.75rem;font-weight:700">📋 ${s.topic_count} TOPICS</span>
              <span class="badge" style="background:#ffedd5;color:#c2410c;border:1px solid #fed7aa;border-radius:20px;padding:4px 12px;font-size:0.75rem;font-weight:700">❓ ${s.question_count} QUESTIONS</span>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%;border-radius:8px;font-weight:600;padding:10px" onclick="showAddTopic(${s.id},'${s.name}')">+ Add Topic</button>
          </div>
        `).join('')}
      </div>
      <div id="subject-modal"></div>`;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
}

window.showAddSubject = function()
{
    const container = document.createElement('div');
    container.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" onclick="this.parentElement.remove()">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;width:100%;max-width:420px" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:20px">➕ Add Subject</h3>
        <div class="form-group"><label class="form-label">Subject Name</label><input id="new-subj-name" type="text" class="form-input" placeholder="e.g. Biology"/></div>
        <div class="form-group"><label class="form-label">Description</label><input id="new-subj-desc" type="text" class="form-input" placeholder="Brief description"/></div>
        <button class="btn btn-primary btn-full" onclick="addSubject()">Create Subject</button>
      </div>
    </div>`;
    document.body.appendChild(container);
};

window.addSubject = async function()
{
    const name = document.getElementById('new-subj-name').value.trim();
    const description = document.getElementById('new-subj-desc').value.trim();
    if (!name) return toast('Name required', 'error');
    try
    {
        await API.subjects.create(
        {
            name,
            description
        });
        toast('Subject created!', 'success');
        document.querySelector('[onclick*="stopPropagation"]').closest('[style*="fixed"]').parentElement.remove();
        renderManageSubjects();
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
};

window.showAddTopic = function(subjectId, subjectName)
{
    const container = document.createElement('div');
    container.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" onclick="this.parentElement.remove()">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;width:100%;max-width:420px" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:6px">➕ Add Topic</h3>
        <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:20px">Subject: ${subjectName}</p>
        <div class="form-group"><label class="form-label">Topic Name</label><input id="new-topic-name" type="text" class="form-input" placeholder="e.g. Differential Equations"/></div>
        <button class="btn btn-primary btn-full" onclick="addTopic(${subjectId})">Create Topic</button>
      </div>
    </div>`;
    document.body.appendChild(container);
};

window.addTopic = async function(subjectId)
{
    const name = document.getElementById('new-topic-name').value.trim();
    if (!name) return toast('Topic name required', 'error');
    try
    {
        await API.subjects.addTopic(subjectId,
        {
            name
        });
        toast('Topic added!', 'success');
        document.querySelectorAll('[style*="fixed"]').forEach(el => el.parentElement.remove());
        renderManageSubjects();
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        window.location.href = "/login.html";
    } else {
        const nameEl = document.getElementById('teacher-name');
        if (nameEl) nameEl.innerText = user.name;
    }
    if (typeof renderTeacher === 'function') renderTeacher();
});