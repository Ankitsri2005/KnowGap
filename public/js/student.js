/* ── STUDENT DASHBOARD ── */
/* ── GLOBALS ── */
let _subjects = [];
let _history = [];
let _subjectDiagnostics = {};

/* ── ENTRY ── */
async function renderStudent() {
  const app = document.getElementById('main-content');
  if (!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading your dashboard...</p></div>`;

  try {
    const [subjects, history] = await Promise.all([API.subjects.all(), API.tests.history()]);
    _subjects = subjects;
    _history = history;

    // Build per-subject diagnostics from latest test per subject
    _subjectDiagnostics = {};
    const subjectLatestMap = {};
    history.forEach(t => {
      const sid = t.subject_id?._id || t.subject_id;
      if (sid && (!subjectLatestMap[sid] || new Date(t.completed_at) > new Date(subjectLatestMap[sid].completed_at))) {
        subjectLatestMap[sid] = t;
      }
    });

    await Promise.all(Object.entries(subjectLatestMap).map(async ([sid, session]) => {
      try {
        const r = await API.tests.result(session._id);
        const fm = r?.forensicMatrix || {};
        _subjectDiagnostics[sid] = {
          profile: deriveProfile(fm),
          lgs: computeLGS(fm, r?.totalQuestions || 0),
          score: r?.scorePercentage || session.overall_score || 0,
          retestRisk: r?.retestRisk || 0,
          sessionId: session._id
        };
      } catch (_) {
        const fm = session.forensic_matrix || {};
        _subjectDiagnostics[sid] = {
          profile: deriveProfile(fm),
          lgs: computeLGS(fm, session.total_questions || 0),
          score: session.overall_score || 0,
          retestRisk: 0,
          sessionId: session._id
        };
      }
    }));

    app.innerHTML = renderDashboard();
  } catch (e) {
    if (e.message && (e.message.toLowerCase().includes('token') || e.message.toLowerCase().includes('unauthorized'))) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    app.innerHTML = `<div class="empty-state" style="margin-top:40px"><div class="empty-icon">⚠️</div><p>${e.message}</p><button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="localStorage.clear(); window.location.href='login.html'">🔐 Log In Again</button></div>`;
  }
}

/* ── RENDER DASHBOARD ── */
function renderDashboard() {
  const history = _history;
  const subjects = _subjects;

  // Overall LGS from most recent test
  const latest = history.length > 0 ? history[0] : null;
  const latestDiag = latest ? (_subjectDiagnostics[latest.subject_id?._id || latest.subject_id] || {}) : {};
  const overallProfile = latestDiag.profile || 'normal';
  const overallLGS = latestDiag.lgs || 0;
  const overallRetestRisk = latestDiag.retestRisk || (history.length > 0
    ? Math.round((Object.values(_subjectDiagnostics).reduce((sum, d) => sum + (d.lgs || 0), 0) / Math.max(1, Object.keys(_subjectDiagnostics).length)) * 100) || 0
    : 0);

  const profileLabel = profileDisplay(overallProfile);
  const profileColor = overallProfile === 'hiddenGap' ? '#e74c3c' : overallProfile === 'misconception' ? '#f39c12' : '#2ecc71';
  const lgsColor = overallLGS > 0.6 ? '#e74c3c' : overallLGS < 0.3 ? '#2ecc71' : '#f39c12';
  const retestDelta = latest?.overall_score ? Math.round((overallRetestRisk - (100 - latest.overall_score))) : 0;

  // Subject cards
  const subjectCardsHtml = subjects.map(s => {
    const sid = s._id;
    const diag = _subjectDiagnostics[sid];
    const hasTested = !!diag;
    const profile = diag?.profile || 'new';
    const lgs = diag?.lgs ?? 0;
    const score = diag?.score ?? null;

    let borderColor, bgTint, cardLabel, icon, btnLabel, btnClass;
    if (!hasTested) {
      borderColor = '#3498db';
      bgTint = 'rgba(52,152,219,.06)';
      cardLabel = '📝 Not Tested Yet';
      icon = '📝';
      btnLabel = '▶ Start Test';
      btnClass = 'btn-secondary';
    } else if (profile === 'mastered') {
      borderColor = '#2ecc71';
      bgTint = 'rgba(46,204,113,.08)';
      cardLabel = '🟢 Truly Knows';
      icon = '🟢';
      btnLabel = '▶ Start Test';
      btnClass = 'btn-secondary';
    } else if (profile === 'hiddenGap') {
      borderColor = '#e74c3c';
      bgTint = 'rgba(231,76,60,.08)';
      cardLabel = '🔴 Hidden Gap';
      icon = '🔴';
      btnLabel = '🎯 Retake Test';
      btnClass = 'btn-primary';
    } else if (profile === 'misconception') {
      borderColor = '#f39c12';
      bgTint = 'rgba(243,156,18,.08)';
      cardLabel = '🟠 Misconception';
      icon = '🟠';
      btnLabel = '🎯 Retake Test';
      btnClass = 'btn-primary';
    } else {
      borderColor = '#3498db';
      bgTint = 'rgba(52,152,219,.06)';
      cardLabel = '🔵 Normal Gap';
      icon = '🔵';
      btnLabel = '🎯 Retake Test';
      btnClass = 'btn-primary';
    }

    return `
      <div class="card" style="cursor:default;border-left:4px solid ${borderColor};background:${bgTint};display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="font-size:1.8rem;margin-bottom:8px">${s.icon || subjectIcon(s.name)}</div>
          <h3 style="margin-bottom:4px;font-size:1.05rem">${s.name}</h3>
          <div style="font-size:.8rem;font-weight:600;color:${borderColor};margin-bottom:8px">${cardLabel}</div>
          ${hasTested ? `
            <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:4px">
              LGS: <span style="font-weight:700;color:${lgs > 0.6 ? '#e74c3c' : lgs < 0.3 ? '#2ecc71' : '#f39c12'}">${lgs.toFixed(2)}</span>
            </div>
            <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px">
              Last Score: <span style="font-weight:700;color:${scoreColor(score)}">${score}%</span>
            </div>
          ` : `
            <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px">${s.description || 'Challenge yourself!'}</p>
          `}
        </div>
        <button class="btn ${btnClass} btn-sm btn-full" onclick="window.location.href='student-test-setup.html?subjectId=${s._id}&subjectName=${encodeURIComponent(s.name)}'">${btnLabel}</button>
      </div>
    `;
  }).join('');

  // History table
  const historyHtml = history.length > 0 ? `
    <h3 style="margin-bottom:20px">📈 Recent Test History</h3>
    <div class="card" style="padding:0;overflow:hidden">
      <table class="table">
        <thead><tr>
          <th>Score</th><th>Performance</th><th>Questions</th><th>Date</th><th></th>
        </tr></thead>
        <tbody>
          ${history.slice(0, 8).map(t => {
            const cp = t.cognitive_profile || '';
            const cpDisplay = cp === 'mastered' ? '🟢 Truly Knows'
              : cp === 'hiddenGap' ? '🔴 Hidden Gap'
              : cp === 'misconception' ? '🟠 Misconception'
              : cp === 'recognizedGap' ? '🔵 Normal Gap'
              : t.performance_level || 'N/A';
            const cpColor = cp === 'mastered' ? '#2ecc71'
              : cp === 'hiddenGap' ? '#e74c3c'
              : cp === 'misconception' ? '#f39c12'
              : cp === 'recognizedGap' ? '#3498db'
              : 'var(--text-muted)';
            return `
              <tr>
                <td><span style="font-weight:800;font-size:1.15rem;color:${scoreColor(t.overall_score || 0)}">${t.overall_score || 0}%</span></td>
                <td><span style="font-weight:600;font-size:.85rem;color:${cpColor}">${cpDisplay}</span></td>
                <td style="color:var(--text-secondary)">${t.correct_answers}/${t.total_questions}</td>
                <td style="color:var(--text-muted)">${timeAgo(t.completed_at)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="window.location.href='student-report.html?testId=${t._id}'">View Report</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
    <div style="margin-bottom:32px">
      <h2>Welcome back 👋</h2>
      <p style="color:var(--text-secondary);margin-top:4px">Ready to discover your learning gaps today?</p>
    </div>

    <div class="grid-3" style="margin-bottom:28px">
      <div class="stat-card" style="background:linear-gradient(135deg,rgba(231,76,60,.12),rgba(231,76,60,.04));border-left:3px solid #e74c3c">
        <div class="stat-icon" style="font-size:1.6rem">🧠</div>
        <div class="stat-label" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Cognitive Profile</div>
        <div class="stat-value" style="color:${profileColor};font-size:1.1rem">${profileLabel}</div>
      </div>
      <div class="stat-card" style="background:linear-gradient(135deg,rgba(243,156,18,.12),rgba(243,156,18,.04));border-left:3px solid ${lgsColor}">
        <div class="stat-icon" style="font-size:1.6rem">⚠️</div>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="stat-label" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">LGS Score</div>
          <span style="cursor:help;position:relative;font-size:.9rem;color:var(--text-muted)" title="Learning Gap Score = α(1−confidence) + β|correct−confidence| + γ(response time)">ⓘ</span>
        </div>
        <div class="stat-value" style="color:${lgsColor};font-size:1.1rem">${overallLGS.toFixed(2)}${overallLGS > 0.6 ? ' <span style="font-size:.75rem;font-weight:500">(High Risk)</span>' : overallLGS < 0.3 ? ' <span style="font-size:.75rem;font-weight:500">(Low Risk)</span>' : ' <span style="font-size:.75rem;font-weight:500">(Moderate)</span>'}</div>
      </div>
      <div class="stat-card" style="background:linear-gradient(135deg,rgba(231,76,60,.12),rgba(231,76,60,.04));border-left:3px solid #e74c3c">
        <div class="stat-icon" style="font-size:1.6rem">📉</div>
        <div class="stat-label" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Predicted Retest</div>
        <div class="stat-value" style="color:#e74c3c;font-size:1.1rem">${overallRetestRisk}%${retestDelta !== 0 ? ` <span style="font-size:.8rem;font-weight:500">↓${Math.abs(retestDelta)}%</span>` : ''}</div>
      </div>
    </div>

    <h3 style="margin-bottom:16px">📚 Ready to Test? Pick a subject:</h3>
    <div class="grid-3" style="margin-bottom:40px">
      ${subjects.length === 0
        ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No subjects available yet. Ask your teacher to add some!</p></div>'
        : subjectCardsHtml
      }
    </div>

    ${historyHtml}
  `;
}

/* ── 4-PROFILE MATRIX (mini-widget) ── */
function renderProfileMatrixWidget(fm, total) {
  const masteredCount = fm.masteredCount || 0;
  const hiddenGapCount = fm.hiddenGapCount || 0;
  const recognizedGapCount = fm.recognizedGapCount || 0;
  const misconceptionCount = fm.misconceptionCount || 0;

  // Determine dominant quadrant
  const counts = [
    { key: 'mastered', label: 'Normal\nMastery', desc: 'Sure + Correct — Truly knows the concept', count: masteredCount, color: '#2ecc71' },
    { key: 'hiddenGap', label: 'Hidden\nGap', desc: 'Guessed + Correct — Lucky guess masks a gap', count: hiddenGapCount, color: '#e74c3c' },
    { key: 'recognized', label: 'Recognized\nGap', desc: 'Guessed + Wrong — Aware of the weakness', count: recognizedGapCount, color: '#f39c12' },
    { key: 'misconception', label: 'Miscon-\nception', desc: 'Sure + Wrong — Confidently wrong (overconfident)', count: misconceptionCount, color: '#9b59b6' }
  ];

  const maxCount = Math.max(...counts.map(c => c.count));
  const totalQ = total || Math.max(1, masteredCount + hiddenGapCount + recognizedGapCount + misconceptionCount);

  return `
    <div style="margin-bottom:24px">
      <h3 style="margin-bottom:12px">🧩 4-Profile Cognitive Matrix</h3>
      <div class="card" style="padding:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${counts.map(c => {
            const pct = totalQ > 0 ? Math.round(c.count / totalQ * 100) : 0;
            const isDominant = c.count === maxCount && c.count > 0;
            return `
              <div style="background:${c.color}${isDominant ? '22' : '0a'};border:2px solid ${c.color}${isDominant ? 'cc' : '44'};border-radius:10px;padding:12px;text-align:center;cursor:help;transition:all .2s"
                   title="${c.desc}">
                <div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:${c.color};font-weight:700;white-space:pre-line;margin-bottom:4px">${c.label}</div>
                <div style="font-size:1.5rem;font-weight:800;color:${c.color}">${c.count}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">${pct}%</div>
                ${isDominant ? '<div style="font-size:.6rem;color:' + c.color + ';margin-top:4px">◀ CURRENT</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ── TAB SWITCHING ── */
async function switchStudentTab(tab) {
  // Update sidebar
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  const navMap = { dashboard: 'nav-student-dashboard', reports: 'nav-student-reports', plans: 'nav-student-plans', retests: 'nav-student-retests' };
  const navEl = document.getElementById(navMap[tab]);
  if (navEl) navEl.classList.add('active');

  switch (tab) {
    case 'dashboard': renderStudent(); break;
    case 'reports': renderStudentReports(); break;
    case 'plans': renderStudentPlans(); break;
    case 'retests': renderStudentRetests(); break;
  }
}

/* ── TAB: MY GAP REPORTS ── */
async function renderStudentReports() {
  const app = document.getElementById('main-content');
  if (!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading reports...</p></div>`;
  try {
    const history = await API.tests.history();
    app.innerHTML = `
      <h2 style="margin-bottom:24px">📄 My Gap Reports</h2>
      ${history.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📭</div><p>No gap reports yet. Take your first test!</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="switchStudentTab('dashboard')">Take a Test →</button></div>`
        : `<div style="display:flex;flex-direction:column;gap:12px">${history.map(t => `
          <div class="card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 20px">
            <div>
              <div style="font-weight:700">${t.subject_name}</div>
              <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">${timeAgo(t.completed_at)} · ${t.total_questions} questions · ${t.performance_level || 'N/A'}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-weight:700;font-size:1.2rem;color:${scoreColor(t.overall_score||0)}">${t.overall_score||0}%</span>
              <button class="btn btn-primary btn-sm" onclick="window.location.href='student-report.html?testId=${t._id}'">📄 View Report</button>
            </div>
          </div>
        `).join('')}</div>`}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

/* ── TAB: STUDY PLANS ── */
async function renderStudentPlans() {
  const app = document.getElementById('main-content');
  if (!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading study plans...</p></div>`;

  try {
    const [subjects, history] = await Promise.all([API.subjects.all(), API.tests.history()]);

    if (history.length === 0) {
      app.innerHTML = `
        <h2 style="margin-bottom:24px">📚 Study Plans</h2>
        <div class="card" style="padding:40px;text-align:center">
          <div style="font-size:3rem;margin-bottom:16px">📭</div>
          <h3 style="margin-bottom:8px">No Tests Taken Yet</h3>
          <p style="color:var(--text-muted)">Take a diagnostic test to get your personalized AI-generated study plan.</p>
          <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="switchStudentTab('dashboard')">Take a Test →</button>
        </div>
      `;
      return;
    }

    const latest = history[0];
    const res = await API.tests.result(latest._id);

    const subjectId = latest.subject_id?._id || latest.subject_id;
    const subject = subjects.find(s => s._id === subjectId);
    const subjectName = subject?.name || latest.subject_name || 'Subject';

    const fm = res?.forensicMatrix || {};
    const profile = deriveProfile(fm);
    const lgs = computeLGS(fm, res?.totalQuestions || latest.total_questions || 0);

    const studyPlan = res?.recommendations || { weeks: [], totalEstimatedHours: 0 };
    const profileLabel = profileDisplay(profile);
    const profileColor = profile === 'hiddenGap' ? '#e74c3c' : profile === 'misconception' ? '#f39c12' : '#2ecc71';
    const lgsColor = lgs > 0.6 ? '#e74c3c' : lgs < 0.3 ? '#2ecc71' : '#f39c12';

    const weeksHtml = studyPlan.weeks?.length
      ? studyPlan.weeks.map((w, wi) => {
          const activities = w.activities || ['Review basics', 'Practice problems', 'Self-quiz'];
          const weekTopics = w.topics || [];

          const dayItems = weekTopics.length > 0
            ? weekTopics.map((t, di) => {
                const min = Math.round((t.studyHours || 2) * 60 / Math.max(1, weekTopics.length));
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px;margin-bottom:6px">
                    <div>
                      <span style="font-weight:600;color:var(--text-secondary);margin-right:8px">Day ${di + 1}:</span>
                      <span style="font-weight:500">${t.name}</span>
                      <span style="color:var(--text-muted);font-size:.85rem;margin-left:8px">(${min} min)</span>
                    </div>
                    <button class="btn btn-primary btn-sm" style="padding:4px 12px;font-size:.75rem">Start</button>
                  </div>
                `;
              }).join('')
            : activities.map((a, di) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px;margin-bottom:6px">
                  <div>
                    <span style="font-weight:600;color:var(--text-secondary);margin-right:8px">Day ${di + 1}:</span>
                    <span style="font-weight:500">${a}</span>
                    <span style="color:var(--text-muted);font-size:.85rem;margin-left:8px">(45 min)</span>
                  </div>
                  <button class="btn btn-primary btn-sm" style="padding:4px 12px;font-size:.75rem">Start</button>
                </div>
              `).join('');

          return `
            <div class="study-week-card" style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
                <div style="font-weight:700;font-size:1.05rem">Week ${w.week}: ${w.focus}</div>
                <span class="badge badge-info">⏱ ${w.dailyGoal || '2 hours/day'}</span>
              </div>
              <div>
                ${dayItems}
              </div>
            </div>
          `;
        }).join('')
      : '<div class="card" style="padding:24px;text-align:center;color:var(--text-muted)">Study plan data not available for this test.</div>';

    app.innerHTML = `
      <h2 style="margin-bottom:24px">📚 Study Plans</h2>
      <div class="card" style="padding:28px">
        <div style="margin-bottom:20px">
          <div style="font-size:1.4rem;font-weight:800;margin-bottom:8px">📚 Your AI-Generated Study Plan</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.85rem;color:var(--text-muted)">
            <span>Based on: <span style="font-weight:600;color:${profileColor}">${profileLabel}</span> in ${subjectName}</span>
            <span>|</span>
            <span>LGS: <span style="font-weight:700;color:${lgsColor}">${lgs.toFixed(2)}</span></span>
            <span>|</span>
            <span>Estimated total: <span style="font-weight:600">${studyPlan.totalEstimatedHours || 0} hours</span></span>
          </div>
        </div>

        ${weeksHtml}

        <div style="margin-top:20px">
          <button class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px" onclick="toast('PDF download coming soon!', 'info')">
            📥 Download Plan as PDF
          </button>
        </div>
      </div>
    `;
  } catch (e) {
    app.innerHTML = `
      <h2 style="margin-bottom:24px">📚 Study Plans</h2>
      <div class="card" style="padding:40px;text-align:center">
        <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
        <h3 style="margin-bottom:8px">Could not load study plans</h3>
        <p style="color:var(--text-muted)">${e.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="switchStudentTab('plans')">Retry</button>
      </div>
    `;
  }
}

/* ── TAB: RETESTS ── */
async function renderStudentRetests() {
  const app = document.getElementById('main-content');
  if (!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading retests...</p></div>`;
  try {
    const history = await API.tests.history();
    const failed = history.filter(t => (t.overall_score || 0) < 70);
    app.innerHTML = `
      <h2 style="margin-bottom:24px">📅 Retests</h2>
      ${failed.length === 0
        ? `<div class="card" style="padding:40px;text-align:center">
            <div style="font-size:3rem;margin-bottom:16px">🎉</div>
            <h3 style="margin-bottom:8px">No Retests Needed!</h3>
            <p style="color:var(--text-muted)">You've passed all your recent tests. Keep up the great work!</p>
          </div>`
        : `<div style="display:flex;flex-direction:column;gap:12px">${failed.map(t => `
          <div class="card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 20px;border-left:4px solid #e74c3c">
            <div>
              <div style="font-weight:700">${t.subject_name}</div>
              <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">Score: ${t.overall_score||0}% · ${timeAgo(t.completed_at)}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="window.location.href='student-test-setup.html?subjectId=${t.subject_id?._id || t.subject_id}&subjectName=${encodeURIComponent(t.subject_name)}'">🔄 Retake Test</button>
              <button class="btn btn-secondary btn-sm" onclick="window.location.href='student-report.html?testId=${t._id}'">View Report</button>
            </div>
          </div>
        `).join('')}</div>`}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

/* ── HELPERS ── */

function subjectIcon(name) {
  const n = name ? name.toLowerCase() : '';
  if (n.includes('math') || n.includes('dsa') || n.includes('algorithm')) return '📊';
  if (n.includes('physics')) return '⚛️';
  if (n.includes('computer') || n.includes('cs') || n.includes('program')) return '💻';
  if (n.includes('chem')) return '🧪';
  if (n.includes('bio')) return '🧬';
  if (n.includes('english')) return '📖';
  if (n.includes('science')) return '🔬';
  if (n.includes('aptitude') || n.includes('reason')) return '🧠';
  return '📚';
}

function deriveProfile(fm) {
  const m = fm.masteredCount || 0;
  const h = fm.hiddenGapCount || 0;
  const r = fm.recognizedGapCount || 0;
  const mc = fm.misconceptionCount || 0;
  const max = Math.max(m, h, r, mc);
  if (max === 0) return 'mastered';
  if (max === h) return 'hiddenGap';
  if (max === mc) return 'misconception';
  if (max === r) return 'recognizedGap';
  return 'mastered';
}

function profileDisplay(cat) {
  const map = {
    mastered: '🟢 Truly Knows',
    hiddenGap: '🔴 Hidden Gap',
    misconception: '🟠 Misconception',
    recognizedGap: '🔵 Normal Gap'
  };
  return map[cat] || '🟢 Truly Knows';
}

function computeLGS(fm, total) {
  const m = fm.masteredCount || 0;
  const h = fm.hiddenGapCount || 0;
  const r = fm.recognizedGapCount || 0;
  const mc = fm.misconceptionCount || 0;
  const t = total || Math.max(1, m + h + r + mc);
  // LGS = weighted gap-to-total ratio (higher = more gaps)
  return Math.min(1, Math.round(((h * 2 + mc * 1.5 + r * 0.5) / t) * 100) / 100);
}

function scoreColor(s) {
  if (s >= 80) return '#2ecc71';
  if (s >= 60) return '#f39c12';
  return '#e74c3c';
}

function scoreBadge(s) {
  if (s >= 80) return 'badge-success';
  if (s >= 60) return 'badge-warning';
  return 'badge-danger';
}

function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}
