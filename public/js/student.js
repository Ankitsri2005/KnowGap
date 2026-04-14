/* ── STUDENT DASHBOARD ── */
async function renderStudent()
{
    const app = document.getElementById('main-content');
    if (!app) return; // fail safe

    app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading your dashboard...</p></div>`;

    try
    {
        // 1. Fetch data from backend
        const [subjects, history] = await Promise.all([API.subjects.all(), API.tests.history()]);

        // 2. Calculate average stats
        const totalTests = history.length;
        const avgScore = totalTests ? Math.round(history.reduce((s, t) => s + (t.overall_score || 0), 0) / totalTests) : 0;
        const passed = history.filter(t => (t.overall_score || 0) >= 70).length;

        // 3. Render HTML
        app.innerHTML = `
      <div style="background: #ffffff; border: 1px solid var(--border); border-radius: 24px; color: #1a1a1a; padding: 40px; margin-bottom: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); position: relative; overflow: hidden;">
        <!-- Abstract decorative rings matching interface orange -->
        <div style="position: absolute; right: 0; top: 0; height: 100%; width: 40%; background: linear-gradient(135deg, rgba(230,126,34,0.05) 0%, rgba(230,126,34,0) 100%);"></div>
        <div style="position: absolute; right: -5%; top: -50%; width: 350px; height: 350px; border-radius: 50%; border: 40px solid rgba(230,126,34,0.04);"></div>

        <div style="position: relative; z-index: 2; margin-bottom: 35px;">
          <h2 style="font-family:'Playfair Display', serif; font-size: 2.2rem; color: #1a1a1a; margin-bottom: 6px;">Welcome back <span style="display:inline-block; animation: wave 2s infinite; transform-origin: 70% 70%;">👋</span></h2>
          <p style="color: var(--text-secondary); font-size: 1.05rem;">Your forensic learning engine is ready to uncover knowledge gaps.</p>
        </div>

        <div style="display: flex; gap: 20px; position: relative; z-index: 2; background: rgba(250,249,246,0.6); padding: 24px; border-radius: 16px; border: 1px solid var(--border); flex-wrap: wrap;">
          
          <div style="flex: 1; min-width: 130px; position: relative;">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 8px;">Tests Taken</div>
            <div style="display: flex; align-items: baseline; gap: 10px;">
              <span style="font-size: 2.4rem; font-weight: 700; font-family:'Playfair Display', serif; line-height: 1; color: var(--primary);">${totalTests}</span>
            </div>
            <div style="position: absolute; right: 0; top: 10%; height: 80%; width: 1px; background: var(--border);"></div>
          </div>
          
          <div style="flex: 1; min-width: 130px; position: relative;">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 8px;">Avg Score</div>
            <div style="display: flex; align-items: baseline; gap: 10px;">
              <span style="font-size: 2.4rem; font-weight: 700; font-family:'Playfair Display', serif; line-height: 1; color: ${scoreColor(avgScore)}">${avgScore}%</span>
            </div>
            <div style="position: absolute; right: 0; top: 10%; height: 80%; width: 1px; background: var(--border);"></div>
          </div>
          
          <div style="flex: 1; min-width: 130px; position: relative;">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 8px;">Proficiency</div>
            <div style="display: flex; align-items: baseline; gap: 10px;">
              <span style="font-size: 2.4rem; font-weight: 700; font-family:'Playfair Display', serif; line-height: 1; color: var(--success);">${passed}</span>
            </div>
            <div style="position: absolute; right: 0; top: 10%; height: 80%; width: 1px; background: var(--border);"></div>
          </div>
          
          <div style="flex: 1; min-width: 130px;">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 8px;">Subjects</div>
            <div style="display: flex; align-items: baseline; gap: 10px;">
              <span style="font-size: 2.4rem; font-weight: 700; font-family:'Playfair Display', serif; line-height: 1; color: var(--primary);">${subjects.length}</span>
            </div>
          </div>

        </div>
      </div>

      <h3 style="margin-bottom:20px">📚 Choose a Subject to Test</h3>
      <div style="display:flex; flex-direction: column; gap: 16px; margin-bottom: 40px; max-width: 800px;">
        ${subjects.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No subjects available yet. Ask your teacher to add some!</p></div>' :
          subjects.map(s => `
          <div style="display:flex; align-items:center; justify-content:space-between; background:#ffffff; border-radius:12px; padding:16px 24px; cursor:pointer; transition:all 0.2s ease; border:1px solid var(--border); box-shadow:0 2px 4px rgba(0,0,0,0.02);" onclick="window.location.href='/taketest.html?subjectId=${s.id}&subjectName=${s.name}'" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateX(6px)'" onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateX(0)'">
            <div style="display:flex; align-items:center;">
              <div>
                <div style="color:#1a1a1a; font-weight:700; font-family:'Playfair Display', serif; font-size:1.2rem; margin-bottom:4px;">${s.name}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">${s.topic_count} Topics &nbsp;•&nbsp; ${s.question_count} Questions</div>
              </div>
            </div>
            <div style="color:var(--primary); font-weight:600; font-size:0.95rem; background:#fff2e5; padding:8px 16px; border-radius:8px;">Take Test →</div>
          </div>
        `).join('')}
      </div>

      ${history.length > 0 ? `
        <h3 style="margin-bottom:20px">📈 Recent Test History</h3>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr>
              <th>Subject</th><th>Score</th><th>Performance</th><th>Questions</th><th>Date</th><th></th>
            </tr></thead>
            <tbody>
              ${history.slice(0, 8).map(t => `
                <tr>
                  <td><strong>${t.subject_name}</strong></td>
                  <td><span style="font-weight:700;color:${scoreColor(t.overall_score || 0)}">${t.overall_score || 0}%</span></td>
                  <td><span class="badge ${scoreBadge(t.overall_score || 0)}">${t.performance_level || 'N/A'}</span></td>
                  <td>${t.correct_answers}/${t.total_questions}</td>
                  <td style="color:var(--text-muted)">${timeAgo(t.completed_at)}</td>
                  <td><button class="btn btn-secondary btn-sm" onclick="window.location.href='/results.html?sessionId=${t.id}'">View Report</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
    }
    catch (e)
    {
        app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${e.message}</p></div>`;
    }
}

async function renderStudentHistory()
{
    const app = document.getElementById('main-content');
    if (!app) return;
    app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading history...</p></div>`;
    try
    {
        const history = await API.tests.history();
        app.innerHTML = `
      <h2 style="margin-bottom:24px">📈 My Test History</h2>
      ${history.length === 0 ? `<div class="empty-state"><div class="empty-icon">📭</div><p>No tests taken yet. <a href="#" onclick="renderStudent()" style="color:var(--primary-light)">Take your first test!</a></p></div>` : `
        <div style="display:flex;flex-direction:column;gap:16px">
          ${history.map(t => `
            <div class="card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
              <div>
                <div style="font-weight:700;font-size:1.05rem">${t.subject_name}</div>
                <div style="font-size:.85rem;color:var(--text-muted);margin-top:4px">${timeAgo(t.completed_at)} · ${t.total_questions} questions</div>
              </div>
              <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                <div style="text-align:center">
                  <div style="font-size:1.8rem;font-weight:800;color:${scoreColor(t.overall_score||0)}">${t.overall_score||0}%</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">Score</div>
                </div>
                <span class="badge ${scoreBadge(t.overall_score||0)}">${t.performance_level||'N/A'}</span>
                <button class="btn btn-primary btn-sm" onclick="window.location.href='/results.html?sessionId=${t.id}'">View AI Report →</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
    }
    catch (e)
    {
        toast(e.message, 'error');
    }
}

function subjectIcon(name)
{
    const n = name.toLowerCase();
    if (n.includes('math')) return '📐';
    if (n.includes('physics')) return '⚛️';
    if (n.includes('computer') || n.includes('cs')) return '💻';
    if (n.includes('chem')) return '🧪';
    if (n.includes('bio')) return '🧬';
    if (n.includes('english')) return '📖';
    return '📚';
}

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = "/login.html";
    } else {
        const nameEl = document.getElementById('student-name');
        if (nameEl) nameEl.innerText = user.name;
    }
    renderStudent();
});