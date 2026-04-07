/* ── STUDENT DASHBOARD ── */
async function renderStudent() {
  const app = document.getElementById('main-content');
  if (!app) return; // fail safe
  
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading your dashboard...</p></div>`;

  try {
    // 1. Fetch data from backend
    const [subjects, history] = await Promise.all([API.subjects.all(), API.tests.history()]);
    
    // 2. Calculate average stats
    const totalTests = history.length;
    const avgScore = totalTests ? Math.round(history.reduce((s, t) => s + (t.overall_score || 0), 0) / totalTests) : 0;
    const passed = history.filter(t => (t.overall_score || 0) >= 70).length;

    // 3. Render HTML
    app.innerHTML = `
      <div style="margin-bottom:32px">
        <h2>Welcome back 👋</h2>
        <p style="color:var(--text-secondary);margin-top:4px">Ready to discover your learning gaps today?</p>
      </div>

      <div class="grid-4" style="margin-bottom:32px">
        <div class="stat-card">
           <div class="stat-icon">📝</div>
           <div class="stat-value" style="color:var(--primary)">${totalTests}</div>
           <div class="stat-label">Tests Taken</div>
        </div>
        <div class="stat-card">
           <div class="stat-icon">📊</div>
           <div class="stat-value" style="color:${scoreColor(avgScore)}">${avgScore}%</div>
           <div class="stat-label">Avg Score</div>
        </div>
        <div class="stat-card">
           <div class="stat-icon">✅</div>
           <div class="stat-value" style="color:var(--success)">${passed}</div>
           <div class="stat-label">Passed (≥70%)</div>
        </div>
        <div class="stat-card">
           <div class="stat-icon">🏆</div>
           <div class="stat-value" style="color:var(--secondary)">${subjects.length}</div>
           <div class="stat-label">Subjects Available</div>
        </div>
      </div>

      <h3 style="margin-bottom:20px">📚 Choose a Subject to Test</h3>
      <div class="grid-3" style="margin-bottom:40px">
        ${subjects.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No subjects available yet. Ask your teacher to add some!</p></div>' :
          subjects.map(s => `
          <div class="card" style="cursor:pointer;position:relative;overflow:hidden" onclick="window.location.href='/taketest.html?subjectId=${s.id}&subjectName=${s.name}'">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--primary),var(--secondary))"></div>
            <div style="font-size:2rem;margin-bottom:12px">${subjectIcon(s.name)}</div>
            <h3 style="margin-bottom:8px">${s.name}</h3>
            <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:16px">${s.description || 'Challenge yourself!'}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span class="badge badge-info">📋 ${s.topic_count} Topics</span>
              <span class="badge badge-warning">❓ ${s.question_count} Questions</span>
            </div>
            <button class="btn btn-primary btn-sm" style="margin-top:16px;width:100%">Start Test →</button>
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
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${e.message}</p></div>`;
  }
}

async function renderStudentHistory() {
  const app = document.getElementById('main-content');
  if(!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading history...</p></div>`;
  try {
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
  } catch(e) { toast(e.message, 'error'); }
}

function subjectIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('math')) return '📐';
  if (n.includes('physics')) return '⚛️';
  if (n.includes('computer') || n.includes('cs')) return '💻';
  if (n.includes('chem')) return '🧪';
  if (n.includes('bio')) return '🧬';
  if (n.includes('english')) return '📖';
  return '📚';
}
