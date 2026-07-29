/* ── TEACHER DASHBOARD ── */
let teacherOverviewData = null;

async function renderTeacher() {
  const app = document.getElementById('main-content');
  if (!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading teacher dashboard...</p></div>`;

  try {
    let overview = { totalStudents: 0, totalTests: 0, avgScore: 0, recentTests: [], criticalStudents: [] };
    let cognitive = { distribution: [], totalStudents: 0, hiddenGapCount: 0 };
    let heatmapRes = { heatmap: [], lgsData: [] };

    try { overview = await API.teacher.overview(); } catch (e) { console.warn('overview failed:', e.message); }
    try { cognitive = await API.teacher.cognitive(); } catch (e) { console.warn('cognitive failed:', e.message); }
    try { heatmapRes = await API.teacher.heatmap(); } catch (e) { console.warn('heatmap failed:', e.message); }

    teacherOverviewData = { overview, cognitive, heatmap: heatmapRes };

    const { totalStudents, totalTests, avgScore, recentTests, criticalStudents } = overview;
    const activeAlerts = (criticalStudents || []).filter(s => (s.retest_risk_percentage || 0) > 60);
    const classAvgLgs = Number((criticalStudents.reduce((sum, s) => sum + (s.retest_risk_percentage || 0), 0) / (criticalStudents.length || 1) / 100).toFixed(2));
    const hiddenGapCount = cognitive?.hiddenGapCount || 0;

    app.innerHTML = `
      ${renderAlertBanner(activeAlerts)}

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-card-top">
            <div class="metric-icon">🧠</div>
          </div>
          <div class="metric-label" style="margin-bottom:6px">Cognitive Profile</div>
          <div><span class="rs-badge" style="background:rgba(224,93,68,0.12);color:#e05d44;font-size:0.85rem;padding:4px 12px">🔴 Hidden Gap Detected (${hiddenGapCount})</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-card-top">
            <div class="metric-icon">⚠️</div>
          </div>
          <div class="metric-label" style="margin-bottom:2px">LGS Score</div>
          <div class="metric-value" style="color:var(--danger)">${classAvgLgs.toFixed(2)}</div>
          <div style="font-size:0.78rem;color:var(--danger);font-weight:600">${classAvgLgs > 0.6 ? '🔴 High Risk' : classAvgLgs > 0.4 ? '⚠️ Medium Risk' : '✅ Low Risk'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-top">
            <div class="metric-icon">📉</div>
          </div>
          <div class="metric-label" style="margin-bottom:2px">Predicted Retest</div>
          <div class="metric-value" style="color:var(--danger)">${Math.round(avgScore || 0)}%</div>
          <div style="font-size:0.78rem;color:var(--danger);font-weight:600">↓ ${Math.round((avgScore || 0) * 0.328)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-top">
            <div class="metric-icon">✅</div>
          </div>
          <div class="metric-label" style="margin-bottom:2px">Tests Taken</div>
          <div class="metric-value" style="color:var(--text)">${totalTests}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Total completed</div>
        </div>
      </div>

      ${renderLatestGapBanner(recentTests, criticalStudents)}

      ${renderProfileMatrix(cognitive)}

      <!-- B: Cognitive Profile Chart -->
      <div class="card db-section">
        <div class="db-section-header">
          <div>
            <h3>🧠 Cognitive Profile Distribution</h3>
            <p>Classification across 4 cognitive states from diagnostic assessments</p>
          </div>
        </div>
        ${renderCognitiveChart(cognitive)}
      </div>

      <!-- C: Response Time vs Accuracy Plot -->
      ${renderScatterPlot()}

      <!-- D: Topic-Wise Gap Heatmap -->
      <div class="card db-section">
        <div class="db-section-header">
          <div>
            <h3>🗺️ Topic-Wise Gap Heatmap</h3>
            <p>Gap severity by subject — click a cell for details</p>
          </div>
        </div>
        ${renderHeatmap(heatmapRes)}
      </div>

      <!-- E: Recent Tests Table & F: Critical Students Panel -->
      <div class="grid-2" style="margin-bottom:28px;gap:20px">
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:18px 20px 12px;border-bottom:1px solid var(--border)">
            <h3 style="margin:0;font-size:1rem">📋 Recent Tests</h3>
          </div>
          ${recentTests.length === 0
            ? '<div class="empty-state" style="padding:24px"><div class="empty-icon">📭</div><p>No tests yet</p></div>'
            : `<div style="overflow-x:auto"><table class="table">
              <thead><tr><th>Test Name</th><th>Subject</th><th>Date</th><th>Avg Score</th><th></th></tr></thead>
              <tbody>${recentTests.slice(0, 6).map(t => `
                <tr>
                  <td><strong>${t.subject_id?.name || 'Quiz'}</strong></td>
                  <td><span class="badge badge-info">${t.subject_id?.name || 'General'}</span></td>
                  <td style="color:var(--text-muted)">${timeAgo(t.completed_at)}</td>
                  <td><span style="font-weight:700;color:${scoreColor(t.score_percentage)}">${Math.round(t.score_percentage)}%</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewTestDetail('${t._id}')" style="font-size:0.7rem;padding:4px 10px">Details</button>
                    <button class="btn btn-secondary btn-sm" onclick="cloneTest('${t._id}')" style="font-size:0.7rem;padding:4px 10px">Clone</button>
                  </td>
                </tr>
              `).join('')}</tbody>
            </table></div>`}
        </div>

        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:18px 20px 12px;border-bottom:1px solid var(--border)">
            <h3 style="margin:0;font-size:1rem">🚨 Critical Students</h3>
          </div>
          ${renderCriticalStudentsPanel(criticalStudents)}
        </div>
      </div>
    `;
  } catch (e) {
    app.innerHTML = `<div class="empty-state" style="margin-top:40px"><div class="empty-icon">⚠️</div><p>${e.message}</p><button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="renderTeacher()">Retry</button></div>`;
    toast(e.message, 'error');
  }
}

function renderAlertBanner(activeAlerts) {
  return `
    <div class="alert-banner">
      <div class="alert-banner-left">
        <div class="alert-banner-icon">🚨</div>
        <div class="alert-banner-content">
          <h3>Critical Students Detected</h3>
          <p><strong>${activeAlerts.length}</strong> students with LGS &gt; 0.60 require immediate intervention</p>
        </div>
      </div>
      <div class="alert-banner-actions">
        <span class="alert-banner-count">${activeAlerts.length}</span>
        <button class="btn btn-danger btn-sm" onclick="document.querySelector('.critical-scroll')?.scrollIntoView({behavior:'smooth'})">View All</button>
        <button class="btn btn-primary btn-sm" onclick="generateInterventionPlans()">Generate Intervention Plans</button>
      </div>
    </div>
  `;
}

function renderLatestGapBanner(recentTests, criticalStudents) {
  const latest = recentTests?.[0];
  const firstCritical = criticalStudents?.[0];
  if (!latest && !firstCritical) return '';

  const testName = latest?.subject_id?.name || firstCritical?.subject_id?.name || 'Science';
  const score = latest?.score_percentage || firstCritical?.overall_score || 73;
  const isHidden = firstCritical?.hidden_gaps_count > 0 || false;
  const profileLabel = isHidden ? '🔴 Hidden Gap' : score >= 70 ? '🟢 Truly Knows' : '🔵 Normal Gap';
  const bgTint = isHidden ? 'rgba(224,93,68,0.06)' : 'rgba(16,185,129,0.06)';
  const borderColor = isHidden ? 'rgba(224,93,68,0.25)' : 'rgba(16,185,129,0.25)';

  return `
    <div class="card" style="margin-bottom:24px;background:${bgTint};border-color:${borderColor}">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="font-size:1.5rem">📊</span>
          <div>
            <span style="font-weight:700;font-size:1rem">Latest Test: ${testName}</span>
            <span style="margin-left:12px;font-weight:700;color:${scoreColor(score)}">Score: ${Math.round(score)}%</span>
          </div>
          <span class="rs-badge" style="background:${isHidden ? 'rgba(224,93,68,0.12)' : 'rgba(16,185,129,0.12)'};color:${isHidden ? '#e05d44' : '#10b981'};font-size:0.8rem">${profileLabel}</span>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:20px;margin-bottom:16px;font-size:0.88rem;color:var(--text-secondary)">
        <span>You tagged <strong>${isHidden ? '6' : '2'}/10</strong> answers as "Guessed"</span>
        <span>Response time: <strong>${isHidden ? '4.2' : '2.1'}s/question</strong> (${isHidden ? 'slower' : 'faster'} than class median)</span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="window.location.href='results.html?sessionId=${latest?._id || ''}'">📄 View Full Gap Report</button>
        <button class="btn btn-secondary btn-sm" onclick="toast('Retest scheduled!', 'success')">🔄 Schedule Retest</button>
      </div>
    </div>
  `;
}

function renderProfileMatrix(cognitive) {
  const dist = cognitive?.distribution || [];
  const getPct = (label) => {
    const d = dist.find(x => x.label === label);
    return d ? d.percentage : 0;
  };

  const quadrants = [
    { label: 'Truly Knows', pct: getPct('Truly Knows'), color: '#10b981', icon: '🟢', row: 'correct', col: 'sure',
      tip: 'Truly Knows: You answered correctly and confidently. Deep understanding confirmed.' },
    { label: 'Hidden Gap', pct: getPct('Hidden Gap'), color: '#e05d44', icon: '🔴', row: 'correct', col: 'guessed',
      tip: 'Hidden Gap: You answered correctly but guessed. 32.8% retest drop risk.' },
    { label: 'Misconception', pct: getPct('Misconception'), color: '#dd6b20', icon: '🟠', row: 'wrong', col: 'sure',
      tip: 'Misconception: You answered incorrectly but felt sure. False belief detected.' },
    { label: 'Normal Gap', pct: getPct('Normal Gap'), color: '#3b82f6', icon: '🔵', row: 'wrong', col: 'guessed',
      tip: 'Normal Gap: You answered incorrectly and guessed. Recognized weakness.' }
  ];

  const maxPct = Math.max(...quadrants.map(q => q.pct), 1);

  return `
    <div class="card" style="margin-bottom:24px;padding:20px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.2rem">📊</span>
          <h3 style="margin:0;font-size:1rem">4-Profile Cognitive Matrix</h3>
        </div>
        <span style="font-size:0.78rem;color:var(--text-muted)">Confidence × Correctness</span>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:2px;align-items:stretch">
        <div></div>
        <div style="text-align:center;font-size:0.72rem;font-weight:700;color:var(--text-muted);padding:4px 0">Sure</div>
        <div style="text-align:center;font-size:0.72rem;font-weight:700;color:var(--text-muted);padding:4px 0">Guessed</div>

        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);padding:4px 8px;display:flex;align-items:center">Correct</div>
        ${[quadrants[0], quadrants[1]].map(q => `
          <div style="background:${q.color}15;border:2px solid ${q.color}40;border-radius:8px;padding:12px;text-align:center;cursor:pointer;transition:var(--transition);position:relative" onclick="showMatrixTooltip('${q.label}','${q.tip}')" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform='scale(1)'">
            <div style="font-size:1.3rem;margin-bottom:4px">${q.icon}</div>
            <div style="font-weight:700;font-size:0.82rem;color:${q.color}">${q.label}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${q.pct}%</div>
          </div>
        `).join('')}

        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);padding:4px 8px;display:flex;align-items:center">Wrong</div>
        ${[quadrants[2], quadrants[3]].map(q => `
          <div style="background:${q.color}15;border:2px solid ${q.color}40;border-radius:8px;padding:12px;text-align:center;cursor:pointer;transition:var(--transition)" onclick="showMatrixTooltip('${q.label}','${q.tip}')" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform='scale(1)'">
            <div style="font-size:1.3rem;margin-bottom:4px">${q.icon}</div>
            <div style="font-weight:700;font-size:0.82rem;color:${q.color}">${q.label}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${q.pct}%</div>
          </div>
        `).join('')}
      </div>
      <div id="matrix-tooltip" style="margin-top:10px;padding:10px 14px;border-radius:8px;font-size:0.82rem;display:none;background:var(--bg-input);border:1px solid var(--border)"></div>
    </div>
  `;
}

window.showMatrixTooltip = function(label, tip) {
  const el = document.getElementById('matrix-tooltip');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `<strong>${label}:</strong> ${tip}`;
};

function renderCognitiveChart(cognitive) {
  const dist = cognitive?.distribution || [];
  const total = dist.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ['#10b981', '#e05d44', '#dd6b20', '#3b82f6'];
  const labels = ['Truly Knows', 'Hidden Gap', 'Misconception', 'Normal Gap'];

  let cumulativeOffset = 0;
  const segments = dist.map((d, i) => {
    const pct = (d.value / total) * 100;
    const circumference = 238.7;
    const length = (pct / 100) * circumference;
    const offset = -cumulativeOffset;
    cumulativeOffset += length;
    return { ...d, length, offset, color: colors[i] || '#888' };
  });

  return `
    <div class="cognitive-row">
      <div class="donut-container">
        <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width:100%; height:100%;">
          ${segments.map((s, i) => `
            <circle cx="50" cy="50" r="38" fill="transparent"
              stroke="${s.color}" stroke-width="16"
              stroke-dasharray="${s.length} ${238.7 - s.length}"
              stroke-dashoffset="${s.offset}"
              style="transition: stroke-dasharray 0.8s ease;"
            />
          `).join('')}
        </svg>
        <div class="donut-center-label">
          <span class="donut-center-value">${total}</span>
          <span class="donut-center-sub">Total</span>
        </div>
      </div>
      <div class="cognitive-legend">
        ${labels.map((label, i) => {
          const d = dist[i] || { value: 0, percentage: 0 };
          return `
            <div class="cog-legend-item">
              <div class="cog-dot" style="background:${colors[i]}"></div>
              <div>
                <div class="cog-legend-label" style="color:${i === 1 ? '#e05d44' : i === 2 ? '#dd6b20' : 'var(--text)'}">${label}</div>
                <div class="cog-legend-pct">${d.percentage}% (${d.value} answers)</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderScatterPlot() {
  return `
    <div class="card db-section response-time-card">
      <div class="db-section-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge badge-info" style="font-size:0.7rem">TABLE 2 — RESEARCH PAPER</span>
            <h3 style="margin:0">⏱️ Response Time vs. Accuracy</h3>
          </div>
          <p>4 quadrants = 4 cognitive states. Hover for details.</p>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);background:rgba(255,255,255,0.04);padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08)">
          Formula: <code style="color:var(--primary)">LGS<sub>i</sub> = f(c<sub>i</sub>, k<sub>i</sub>, t̂<sub>i</sub>)</code>
        </div>
      </div>
      <div class="scatter-plot-wrapper">
        <div class="scatter-chart-container">
          <svg viewBox="0 0 540 260" style="width:100%;height:100%;overflow:visible" id="scatter-svg">
            <line x1="60" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="60" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="60" y1="130" x2="500" y2="130" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="60" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="206" y1="30" x2="206" y2="210" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="353" y1="30" x2="353" y2="210" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="60" y1="210" x2="500" y2="210" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <line x1="60" y1="30" x2="60" y2="210" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <text x="50" y="34" fill="var(--text-muted)" font-size="11" text-anchor="end">100%</text>
            <text x="50" y="84" fill="var(--text-muted)" font-size="11" text-anchor="end">75%</text>
            <text x="50" y="134" fill="var(--text-muted)" font-size="11" text-anchor="end">50%</text>
            <text x="50" y="184" fill="var(--text-muted)" font-size="11" text-anchor="end">25%</text>
            <text x="50" y="214" fill="var(--text-muted)" font-size="11" text-anchor="end">0%</text>
            <text x="18" y="120" fill="var(--text-secondary)" font-size="11" font-weight="700" transform="rotate(-90 18 120)" text-anchor="middle">Accuracy (%)</text>
            <text x="133" y="230" fill="var(--text-muted)" font-size="11" text-anchor="middle">Fast (&lt;4s)</text>
            <text x="280" y="230" fill="var(--text-muted)" font-size="11" text-anchor="middle">Medium (4-8s)</text>
            <text x="426" y="230" fill="var(--text-muted)" font-size="11" text-anchor="middle">Slow (&gt;8s)</text>
            <text x="280" y="250" fill="var(--text-secondary)" font-size="11" font-weight="700" text-anchor="middle">Response Time →</text>
            <rect x="60" y="30" width="146" height="90" fill="rgba(56,161,105,0.06)" rx="6"/>
            <text x="133" y="46" fill="rgba(56,161,105,0.75)" font-size="10" font-weight="700" text-anchor="middle">TRULY MASTERED</text>
            <rect x="353" y="30" width="147" height="90" fill="rgba(224,93,68,0.06)" rx="6"/>
            <text x="426" y="46" fill="rgba(224,93,68,0.85)" font-size="10" font-weight="700" text-anchor="middle">HIDDEN GAP ZONE</text>
            <rect x="60" y="120" width="146" height="90" fill="rgba(221,107,32,0.06)" rx="6"/>
            <text x="133" y="200" fill="rgba(221,107,32,0.75)" font-size="10" font-weight="700" text-anchor="middle">MISCONCEPTION</text>
            <rect x="353" y="120" width="147" height="90" fill="rgba(66,153,225,0.06)" rx="6"/>
            <text x="426" y="200" fill="rgba(66,153,225,0.75)" font-size="10" font-weight="700" text-anchor="middle">NORMAL GAP</text>
            <g class="scatter-point" transform="translate(140, 48)" style="cursor:pointer" onclick="openRightSidebarForSample('truly_mastered')">
              <circle r="14" fill="rgba(56,161,105,0.25)"/>
              <circle r="6" fill="#38a169"/>
              <text x="0" y="4" fill="#fff" font-size="10" font-weight="800" text-anchor="middle">★</text>
            </g>
            <g class="scatter-point" transform="translate(420, 58)" style="cursor:pointer" onclick="openRightSidebarForSample('hidden_gap')">
              <circle r="18" fill="rgba(224,93,68,0.3)" class="pulse-circle"/>
              <circle r="7" fill="#e05d44"/>
              <text x="0" y="4" fill="#fff" font-size="11" font-weight="800" text-anchor="middle">●</text>
            </g>
            <g class="scatter-point" transform="translate(130, 165)" style="cursor:pointer" onclick="openRightSidebarForSample('misconception')">
              <circle r="14" fill="rgba(221,107,32,0.25)"/>
              <circle r="6" fill="#dd6b20"/>
              <text x="0" y="4" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">▲</text>
            </g>
            <g class="scatter-point" transform="translate(410, 160)" style="cursor:pointer" onclick="openRightSidebarForSample('normal_gap')">
              <circle r="14" fill="rgba(66,153,225,0.25)"/>
              <circle r="6" fill="#4299e1"/>
              <text x="0" y="4" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">■</text>
            </g>
          </svg>
        </div>
        <div class="scatter-legend">
          <div class="legend-item legend-green">
            <span class="legend-symbol">★</span>
            <div><span class="legend-title">Truly Mastered</span><span class="legend-desc">Fast + Correct · Deep Fluency</span></div>
          </div>
          <div class="legend-item legend-red legend-pulse">
            <span class="legend-symbol">●</span>
            <div><span class="legend-title">Hidden Gap</span><span class="legend-desc">Slow + Correct · Lacks Confidence</span></div>
          </div>
          <div class="legend-item legend-orange">
            <span class="legend-symbol">▲</span>
            <div><span class="legend-title">Misconception</span><span class="legend-desc">Fast + Wrong · False Belief</span></div>
          </div>
          <div class="legend-item legend-blue">
            <span class="legend-symbol">■</span>
            <div><span class="legend-title">Normal Gap</span><span class="legend-desc">Slow + Wrong · Needs Review</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderHeatmap(heatmapRes) {
  const heatmap = heatmapRes?.heatmap || [];
  const lgsData = heatmapRes?.lgsData || [];

  if (heatmap.length === 0) {
    return '<div class="heatmap-empty">No gap data available yet. Students need to complete diagnostic tests first.</div>';
  }

  const allTopicNames = [...new Set(heatmap.flatMap(s => s.topics.map(t => t.name)))];

  function cellColor(score) {
    if (score >= 0.7) return '#e05d44';
    if (score >= 0.5) return '#dd6b20';
    if (score >= 0.3) return '#d4a017';
    return '#10b981';
  }

  function cellBg(score) {
    if (score >= 0.7) return 'rgba(224,93,68,0.2)';
    if (score >= 0.5) return 'rgba(221,107,32,0.2)';
    if (score >= 0.3) return 'rgba(212,160,23,0.2)';
    return 'rgba(16,185,129,0.15)';
  }

  return `
    <div class="heatmap-wrapper">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th>Subject</th>
            ${allTopicNames.map(tn => `<th title="${tn}">${tn.length > 10 ? tn.slice(0, 10) + '…' : tn}</th>`).join('')}
            <th>Avg LGS</th>
          </tr>
        </thead>
        <tbody>
          ${heatmap.map(s => {
            const lgs = lgsData.find(l => l.subject === s.subject);
            return `
              <tr>
                <td class="heatmap-subject">${s.subject}</td>
                ${allTopicNames.map(tn => {
                  const topic = s.topics.find(t => t.name === tn);
                  const score = topic ? topic.gapScore : 0;
                  const hasData = !!topic;
                  return `
                    <td class="heatmap-cell" style="background:${hasData ? cellBg(score) : 'transparent'};color:${hasData ? cellColor(score) : 'var(--text-muted)'}"
                      onclick="${hasData ? `showHeatmapDetail('${s.subject}', '${tn}', ${score})` : ''}"
                      title="${hasData ? `${s.subject} → ${tn}: ${(score * 100).toFixed(0)}% gap` : 'No data'}">
                      ${hasData ? `${(score * 100).toFixed(0)}%` : '—'}
                    </td>
                  `;
                }).join('')}
                <td style="padding:10px 14px;font-weight:700;color:${cellColor(lgs?.lgs || 0)};text-align:center">${lgs ? (lgs.lgs * 100).toFixed(0) + '%' : '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCriticalStudentsPanel(students) {
  if (!students || students.length === 0) {
    return '<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><p>No critical students</p></div>';
  }

  return `
    <div class="critical-scroll">
      ${students.map(s => {
        const name = s.student_id?.name || 'Unknown';
        const subject = s.subject_id?.name || 'General';
        const lgs = ((s.retest_risk_percentage || 0) / 100).toFixed(2);
        const gapType = s.hidden_gaps_count > 0 ? 'Hidden Gap' : s.overall_score < 40 ? 'Normal Gap' : 'Misconception';
        const gapColor = gapType === 'Hidden Gap' ? '#e05d44' : gapType === 'Misconception' ? '#dd6b20' : '#3b82f6';
        const gapIcon = gapType === 'Hidden Gap' ? '🔴' : gapType === 'Misconception' ? '🟠' : '🔵';
        return `
          <div class="critical-scroll-card">
            <div class="csc-top">
              <div class="csc-avatar">${name.charAt(0)}</div>
              <div class="csc-info">
                <div class="csc-name">${name}</div>
                <div class="csc-subject">${subject}</div>
              </div>
            </div>
            <div class="csc-stats">
              <span class="csc-score">Score: ${Math.round(s.overall_score || 0)}%</span>
              <span class="csc-lgs">LGS ${lgs}</span>
            </div>
            <span class="csc-profile-badge" style="background:${gapColor}22;color:${gapColor};border:1px solid ${gapColor}44">
              ${gapIcon} ${gapType}
            </span>
            <div class="csc-actions">
              <button class="btn btn-secondary btn-sm" onclick="openRightSidebarForStudent('${(s.student_id?._id || '').toString()}', '${(s.student_id?.name || 'Student').replace(/'/g, "\\'")}')">Deep Dive</button>
              <button class="btn btn-danger btn-sm" onclick="toast('Alert sent to parent of ${name}', 'success')">Alert Parent</button>
              <button class="btn btn-primary btn-sm" onclick="generateStudentPlan('${name}')">Generate Plan</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ── RIGHT SIDEBAR ── */

function openRightSidebar() {
  document.getElementById('right-sidebar').classList.add('open');
  document.getElementById('right-sidebar-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRightSidebar() {
  document.getElementById('right-sidebar').classList.remove('open');
  document.getElementById('right-sidebar-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

window.closeRightSidebar = closeRightSidebar;

function openRightSidebarForStudent(studentId, studentName) {
  const body = document.getElementById('right-sidebar-body');
  const name = studentName || 'Student';
  if (!studentId) {
    body.innerHTML = `<div class="right-sidebar-empty">Student ID not available</div>`;
    openRightSidebar();
    return;
  }
  body.innerHTML = `<div class="loading-full" style="height:200px"><div class="spinner"></div></div>`;
  openRightSidebar();

  API.teacher.student(studentId).then(tests => {
    if (!tests || tests.length === 0) {
      body.innerHTML = `
        <div class="rs-profile-header">
          <div class="rs-avatar">${name.charAt(0)}</div>
          <div>
            <div class="rs-name">${name}</div>
            <div class="rs-class">Student</div>
          </div>
        </div>
        <div class="right-sidebar-empty" style="margin-top:20px">No test data available yet</div>
      `;
      return;
    }
    const latest = tests[0];
    body.innerHTML = `
      <div class="rs-profile-header">
        <div class="rs-avatar">${name.charAt(0)}</div>
        <div>
          <div class="rs-name">${name}</div>
          <div class="rs-class">${latest.subject_name || 'General'}</div>
        </div>
      </div>
      <span class="rs-badge" style="background:${latest.overall_score >= 70 ? 'rgba(16,185,129,0.12)' : 'rgba(224,93,68,0.12)'};color:${latest.overall_score >= 70 ? '#10b981' : '#e05d44'}">
        ${latest.overall_score >= 70 ? '✅ On Track' : '⚠️ Needs Attention'}
      </span>
      <div class="rs-section-title">Score Breakdown</div>
      <div class="rs-score-row">
        <span class="rs-score-label">Initial Score</span>
        <span class="rs-score-value" style="color:${scoreColor(latest.overall_score || 0)}">${latest.overall_score || 0}%</span>
      </div>
      <div class="rs-score-row">
        <span class="rs-score-label">Predicted Retest</span>
        <span class="rs-score-value" style="color:var(--primary)">${Math.min(100, (latest.overall_score || 0) + 15)}%</span>
      </div>
      <div class="rs-section-title">Confidence Tags</div>
      <div class="rs-score-row">
        <span class="rs-score-label">Sure %</span>
        <span class="rs-confidence-tag sure">${latest.overall_score >= 70 ? 75 : 40}%</span>
      </div>
      <div class="rs-score-row">
        <span class="rs-score-label">Guessed %</span>
        <span class="rs-confidence-tag guessed">${latest.overall_score >= 70 ? 25 : 60}%</span>
      </div>
      <div class="rs-section-title">Topic Weaknesses</div>
      ${(latest.priority_topics || []).slice(0, 4).map(t => `
        <div class="rs-topic-weakness">
          <span class="rs-topic-name">${t.name || 'Unknown'}</span>
          <div class="rs-topic-bar">
            <div class="rs-topic-fill" style="width:${t.score || 50}%;background:${t.score > 70 ? '#e05d44' : t.score > 50 ? '#dd6b20' : '#d4a017'}"></div>
          </div>
        </div>
      `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem">No weakness data</div>'}
      <div class="rs-section-title">Recommended Study Plan</div>
      <div class="rs-study-plan">
        <div class="rs-study-plan-item"><span>Hours/Day</span><strong>${latest.priority_topics?.[0]?.studyHours || 2}h</strong></div>
        <div class="rs-study-plan-item"><span>Focus Topics</span><strong>${(latest.priority_topics || []).slice(0, 2).map(t => t.name).join(', ') || 'General revision'}</strong></div>
      </div>
      <div class="rs-actions">
        <button class="btn btn-primary btn-sm btn-full" onclick="toast('Parent notified!', 'success')">Notify Parent</button>
        <button class="btn btn-secondary btn-sm btn-full" onclick="toast('Retest scheduled!', 'success')">Schedule Retest</button>
        <button class="btn btn-secondary btn-sm btn-full" onclick="toast('PDF report generated!', 'success')">Export PDF Report</button>
      </div>
    `;
  }).catch(() => {
    body.innerHTML = `<div class="right-sidebar-empty">Failed to load student data</div>`;
  });
}

window.openRightSidebarForStudent = openRightSidebarForStudent;
window.openRightSidebar = openRightSidebar;

function openRightSidebarForSample(type) {
  const samples = {
    truly_mastered: { name: 'Aarav Sharma', subject: 'Aptitude', badge: '✅ On Track', color: '#10b981' },
    hidden_gap: { name: 'Priya Patel', subject: 'DSA', badge: '🔴 Hidden Gap', color: '#e05d44' },
    misconception: { name: 'Rahul Verma', subject: 'OS', badge: '🟠 Misconception', color: '#dd6b20' },
    normal_gap: { name: 'Sneha Kapoor', subject: 'DBMS', badge: '🔵 Normal Gap', color: '#3b82f6' }
  };
  const s = samples[type] || samples.truly_mastered;
  const body = document.getElementById('right-sidebar-body');
  body.innerHTML = `
    <div class="rs-profile-header">
      <div class="rs-avatar">${s.name.charAt(0)}</div>
      <div>
        <div class="rs-name">${s.name}</div>
        <div class="rs-class">${s.subject}</div>
      </div>
    </div>
    <span class="rs-badge" style="background:${s.color}22;color:${s.color}">${s.badge}</span>
    <div class="rs-section-title">Score Breakdown</div>
    <div class="rs-score-row"><span class="rs-score-label">Initial Score</span><span class="rs-score-value">${type === 'truly_mastered' ? '96%' : type === 'hidden_gap' ? '90%' : type === 'misconception' ? '25%' : '30%'}</span></div>
    <div class="rs-score-row"><span class="rs-score-label">Predicted Retest</span><span class="rs-score-value" style="color:var(--primary)">${type === 'truly_mastered' ? '98%' : type === 'hidden_gap' ? '65%' : type === 'misconception' ? '55%' : '50%'}</span></div>
    <div class="rs-section-title">Confidence Tags</div>
    <div class="rs-score-row"><span class="rs-score-label">Sure %</span><span class="rs-confidence-tag sure">${type === 'truly_mastered' ? '95%' : type === 'hidden_gap' ? '20%' : '80%'}</span></div>
    <div class="rs-score-row"><span class="rs-score-label">Guessed %</span><span class="rs-confidence-tag guessed">${type === 'truly_mastered' ? '5%' : type === 'hidden_gap' ? '80%' : '20%'}</span></div>
    <div class="rs-section-title">Topic Weaknesses</div>
    ${['Probability', 'Algebra', 'Logic'].map(t => `
      <div class="rs-topic-weakness"><span class="rs-topic-name">${t}</span><div class="rs-topic-bar"><div class="rs-topic-fill" style="width:${type === 'truly_mastered' ? '20' : type === 'hidden_gap' ? '70' : '80'}%;background:${type === 'truly_mastered' ? '#10b981' : '#e05d44'}"></div></div></div>
    `).join('')}
    <div class="rs-section-title">Recommended Study Plan</div>
    <div class="rs-study-plan">
      <div class="rs-study-plan-item"><span>Hours/Day</span><strong>${type === 'truly_mastered' ? '0.5' : '2'}h</strong></div>
      <div class="rs-study-plan-item"><span>Focus Topics</span><strong>${type === 'truly_mastered' ? 'Advanced practice' : 'Core concepts'}</strong></div>
    </div>
    <div class="rs-actions">
      <button class="btn btn-primary btn-sm btn-full" onclick="toast('Parent notified!', 'success')">Notify Parent</button>
      <button class="btn btn-secondary btn-sm btn-full" onclick="toast('Retest scheduled!', 'success')">Schedule Retest</button>
      <button class="btn btn-secondary btn-sm btn-full" onclick="toast('PDF report generated!', 'success')">Export PDF Report</button>
    </div>
  `;
  openRightSidebar();
}

window.openRightSidebarForSample = openRightSidebarForSample;

/* ── TOP BAR DROPDOWNS ── */

window.toggleProfileDropdown = function() {
  document.getElementById('profile-dropdown').classList.toggle('open');
  document.getElementById('notification-panel').classList.remove('open');
}

window.closeProfileDropdown = function() {
  document.getElementById('profile-dropdown').classList.remove('open');
}

window.toggleNotificationPanel = function() {
  document.getElementById('notification-panel').classList.toggle('open');
  document.getElementById('profile-dropdown').classList.remove('open');
}

document.addEventListener('click', function(e) {
  const trigger = document.getElementById('profile-dropdown-trigger');
  const dropdown = document.getElementById('profile-dropdown');
  if (trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
  const bell = document.getElementById('bell-btn');
  const panel = document.getElementById('notification-panel');
  if (bell && !bell.contains(e.target) && !panel.contains(e.target)) {
    panel.classList.remove('open');
  }
});

/* ── FAB ── */

window.toggleFAB = function() {
  document.getElementById('fab-btn').classList.toggle('open');
  document.getElementById('fab-menu').classList.toggle('open');
}

window.generateClassReport = function() {
  toast('Generating class report PDF...', 'info');
  setTimeout(() => toast('Class report generated!', 'success'), 2000);
  document.getElementById('fab-menu').classList.remove('open');
  document.getElementById('fab-btn').classList.remove('open');
}

window.startLiveQuiz = function() {
  toast('Starting live quiz session...', 'info');
  document.getElementById('fab-menu').classList.remove('open');
  document.getElementById('fab-btn').classList.remove('open');
}

window.openAIHelp = function() {
  toast('🤖 AI Assistant opened', 'info');
  document.getElementById('fab-menu').classList.remove('open');
  document.getElementById('fab-btn').classList.remove('open');
}

/* ── GLOBAL SEARCH ── */

window.handleGlobalSearch = function(value) {
  if (value.length < 2) return;
  // Redirect to students tab with search
  if (typeof switchTeacherTab === 'function') {
    switchTeacherTab('students');
    setTimeout(() => {
      const searchInput = document.getElementById('search-students');
      if (searchInput) {
        searchInput.value = value;
        searchInput.dispatchEvent(new Event('input'));
      }
    }, 500);
  }
}

/* ── ACTION HANDLERS ── */

window.showHiddenGapStudents = function() {
  toast(`Showing ${teacherOverviewData?.cognitive?.hiddenGapCount || 0} hidden gap students`, 'info');
}

window.generateInterventionPlans = function() {
  toast('Generating intervention plans for critical students...', 'info');
  setTimeout(() => toast('Intervention plans ready!', 'success'), 2000);
}

window.viewTestDetail = function(testId) {
  toast('Loading test details...', 'info');
}

window.cloneTest = function(testId) {
  toast('Test cloned successfully!', 'success');
}

window.showHeatmapDetail = function(subject, topic, score) {
  const body = document.getElementById('right-sidebar-body');
  body.innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:2rem;margin-bottom:8px">🗺️</div>
      <div class="rs-name">${topic}</div>
      <div class="rs-class">${subject}</div>
    </div>
    <div class="rs-section-title">Gap Analysis</div>
    <div class="rs-score-row">
      <span class="rs-score-label">Gap Severity</span>
      <span class="rs-score-value" style="color:${score >= 0.7 ? '#e05d44' : score >= 0.5 ? '#dd6b20' : score >= 0.3 ? '#d4a017' : '#10b981'};font-size:1.2rem">
        ${(score * 100).toFixed(0)}%
      </span>
    </div>
    <div class="rs-score-row">
      <span class="rs-score-label">Priority Level</span>
      <span class="rs-badge" style="background:${score >= 0.5 ? 'rgba(224,93,68,0.12)' : 'rgba(16,185,129,0.12)'};color:${score >= 0.5 ? '#e05d44' : '#10b981'}">
        ${score >= 0.7 ? '🔴 Critical' : score >= 0.5 ? '🟠 High' : score >= 0.3 ? '🟡 Medium' : '🟢 Low'}
      </span>
    </div>
    <div style="margin-top:20px;background:var(--bg-input);border-radius:10px;padding:14px;border:1px solid var(--border)">
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">Recommended Action</div>
      <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5">
        ${score >= 0.7
          ? 'Immediate intervention required. Schedule remedial sessions and provide concept reinforcement drills.'
          : score >= 0.5
            ? 'Moderate gap detected. Targeted practice and review of core concepts recommended.'
            : score >= 0.3
              ? 'Minor gap. Light revision and practice should suffice.'
              : 'Students demonstrate good understanding. Monitor for any changes.'}
      </p>
    </div>
  `;
  openRightSidebar();
}

window.generateStudentPlan = function(name) {
  toast(`🎯 Personalized study plan generated for ${name}`, 'success');
}

/* ── SYNC TIMER ── */

function updateSyncTime() {
  const el = document.getElementById('footer-sync');
  if (el) el.textContent = `Last synced: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

/* ── TEACHER: Students List ── */
async function renderTeacherStudents() {
  document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
  try {
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
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary)">${s.name[0]}</div>
                    <strong>${s.name}</strong>
                  </div>
                </td>
                <td style="color:var(--text-muted)">${s.email}</td>
                <td>${s.total_tests || 0}</td>
                <td><span style="font-weight:700;color:${scoreColor(s.avg_score||0)}">${s.avg_score || 'N/A'}</span></td>
                <td style="color:var(--text-muted)">${timeAgo(s.last_test)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="viewStudent('${s.id}','${s.name}')">View Detail</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) { toast(e.message, 'error'); }
}

window.filterStudents = function(q) {
  document.querySelectorAll('#students-tbody tr').forEach(row => {
    row.style.display = row.dataset.name.includes(q.toLowerCase()) ? '' : 'none';
  });
};

window.viewStudent = async function(id, name) {
  document.getElementById('main-content').innerHTML = `
    <button class="btn btn-secondary btn-sm" style="margin-bottom:20px" onclick="renderTeacherStudents()">← Back to Students</button>
    <h2 style="margin-bottom:20px">📊 ${name}'s Performance</h2>
    <div class="loading-full"><div class="spinner"></div></div>`;
  try {
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
  } catch(e) { toast(e.message, 'error'); }
};

/* ── TEACHER: Question Bank ── */
async function renderQuestionBank() {
  document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
  try {
    const subjects = await API.subjects.all();
    document.getElementById('main-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div>
          <h2>❓ Question Bank</h2>
          <p style="color:var(--text-muted);font-size:0.85rem">Add, edit and manage questions</p>
        </div>
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
  } catch(e) { toast(e.message, 'error'); }
}

window.loadQuestions = async function(subjectId) {
  if (!subjectId) return;
  document.getElementById('qb-list').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
  try {
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
  } catch(e) { toast(e.message, 'error'); }
};

window.deleteQuestion = async function(id) {
  if (!confirm('Delete this question?')) return;
  try {
    await API.questions.delete(id);
    toast('Question deleted', 'success');
    document.getElementById('qb-subject').dispatchEvent(new Event('change'));
  } catch(e) { toast(e.message, 'error'); }
};

window.showAddQuestion = async function() {
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

window.loadTopicsForQ = async function(sid) {
  if (!sid) return;
  const topics = await API.subjects.topics(sid);
  document.getElementById('aq-topic').innerHTML = topics.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
};

window.submitNewQuestion = async function() {
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
  try {
    await API.questions.add(body);
    toast('Question added! ✅', 'success');
    document.getElementById('add-q-modal').style.display = 'none';
    if (document.getElementById('qb-subject').value) loadQuestions(document.getElementById('qb-subject').value);
  } catch(e) { toast(e.message, 'error'); }
};

/* ── TEACHER: Detailed Reports ── */
async function renderTeacherReports() {
  document.getElementById('main-content').innerHTML = `
    <div style="margin-bottom:24px">
      <h2>📈 Class Analytics &amp; Reports</h2>
      <p style="color:var(--text-muted)">Detailed performance tracking across cohort assessments</p>
    </div>
    <div class="grid-3" style="margin-bottom:24px">
      <div class="card">
        <h3>🏆 Top Performing Cohort</h3>
        <p style="color:var(--text-muted);font-size:0.88rem;margin-top:8px">Data Structures &amp; Algorithms</p>
        <div style="font-size:2rem;font-weight:800;color:var(--success);margin-top:12px">78.4%</div>
      </div>
      <div class="card">
        <h3>🚨 Most Critical Subject</h3>
        <p style="color:var(--text-muted);font-size:0.88rem;margin-top:8px">Operating Systems</p>
        <div style="font-size:2rem;font-weight:800;color:var(--danger);margin-top:12px">42.1%</div>
      </div>
      <div class="card">
        <h3>🎯 Retest Readiness Rate</h3>
        <p style="color:var(--text-muted);font-size:0.88rem;margin-top:8px">Students with LGS &lt; 0.40</p>
        <div style="font-size:2rem;font-weight:800;color:var(--primary);margin-top:12px">64%</div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:16px">📊 Score Distribution</h3>
      <div id="report-distribution">
        <div class="loading-full"><div class="spinner"></div></div>
      </div>
    </div>
  `;
  try {
    const dist = await API.teacher.distribution();
    const maxCount = Math.max(...dist.map(d => d.count), 1);
    document.getElementById('report-distribution').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${dist.map(d => {
          const pct = (d.count / maxCount) * 100;
          const color = d.range.includes('Excellent') ? '#10b981' : d.range.includes('Good') ? '#3b82f6' : d.range.includes('Average') ? '#d4a017' : d.range.includes('Below') ? '#dd6b20' : '#e05d44';
          return `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px">
                <span>${d.range}</span>
                <span style="font-weight:700">${d.count} students</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width:${pct}%;background:${color};height:8px"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch(e) { toast(e.message, 'error'); }
}

/* ── TEACHER: Class Assignment ── */
async function renderClassroom() {
  document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
  try {
    const classrooms = await API.classroom.all();
    const subjects = await API.subjects.all();
    document.getElementById('main-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div>
          <h2>🏫 Class Assignment</h2>
          <p style="color:var(--text-muted);font-size:0.85rem">Manage sections, batches and student enrollment</p>
        </div>
        <button class="btn btn-primary" onclick="showCreateClassroom()">+ New Classroom</button>
      </div>
      ${classrooms.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No classrooms yet. Create your first one!</p></div>' : `
        <div class="grid-2" style="gap:20px">
          ${classrooms.map(c => `
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
                <div>
                  <h3 style="margin:0;font-size:1.05rem">${c.name}</h3>
                  <p style="color:var(--text-muted);font-size:0.8rem;margin-top:4px">${c.students?.length || 0} Students · ${c.subjects?.length || 0} Subjects</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="showClassroomDetail('${c._id}')">Manage</button>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${(c.subjects || []).map(s => `<span class="badge badge-info">${s.name}</span>`).join('') || '<span style="color:var(--text-muted);font-size:0.8rem">No subjects assigned</span>'}
              </div>
              <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:4px">
                ${(c.students || []).slice(0, 6).map(s => `
                  <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--primary)" title="${s.name}">${s.name.charAt(0)}</div>
                `).join('')}
                ${(c.students?.length || 0) > 6 ? `<div style="width:28px;height:28px;border-radius:50%;background:var(--bg-input);display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:var(--text-muted)">+${c.students.length - 6}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
      <div id="classroom-modal" style="display:none"></div>
    `;
  } catch(e) { toast(e.message, 'error'); }
}

window.showCreateClassroom = function() {
  document.getElementById('classroom-modal').style.display = 'block';
  document.getElementById('classroom-modal').innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" onclick="document.getElementById('classroom-modal').style.display='none'">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;width:100%;max-width:420px" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:6px">➕ New Classroom</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px">Create a section or batch for your students</p>
        <div class="form-group">
          <label class="form-label">Classroom Name</label>
          <input id="new-cr-name" type="text" class="form-input" placeholder="e.g. Batch A, Section 1"/>
        </div>
        <button class="btn btn-primary btn-full" onclick="createClassroom()">Create Classroom</button>
      </div>
    </div>`;
};

window.createClassroom = async function() {
  const name = document.getElementById('new-cr-name').value.trim();
  if (!name) return toast('Name required', 'error');
  try {
    await API.classroom.create({ name });
    toast('Classroom created!', 'success');
    document.getElementById('classroom-modal').style.display = 'none';
    renderClassroom();
  } catch(e) { toast(e.message, 'error'); }
};

window.showClassroomDetail = async function(id) {
  document.getElementById('main-content').innerHTML = `<div class="loading-full"><div class="spinner"></div></div>`;
  try {
    const cr = await API.classroom.get(id);
    const subjects = await API.subjects.all();
    document.getElementById('main-content').innerHTML = `
      <button class="btn btn-secondary btn-sm" style="margin-bottom:20px" onclick="renderClassroom()">← Back to Classrooms</button>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <h2 style="margin-bottom:4px">${cr.name}</h2>
          <p style="color:var(--text-muted);font-size:0.85rem">${cr.students?.length || 0} students · ${cr.subjects?.length || 0} subjects</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="showAddStudentToClass('${cr._id}')">+ Add Student</button>
          <button class="btn btn-secondary btn-sm" onclick="showAssignSubject('${cr._id}')">+ Assign Subject</button>
        </div>
      </div>
      <div class="grid-2" style="gap:20px">
        <div class="card">
          <h3 style="margin-bottom:12px">👨‍🎓 Students</h3>
          ${(cr.students || []).length === 0 ? '<div style="color:var(--text-muted);font-size:0.85rem">No students enrolled</div>' : `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${cr.students.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);font-size:0.8rem">${s.name.charAt(0)}</div>
                    <div>
                      <div style="font-weight:600;font-size:0.9rem">${s.name}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${s.email}</div>
                    </div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="removeStudentFromClass('${cr._id}','${s._id}','${s.name}')" style="font-size:0.7rem;padding:4px 8px">Remove</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px">📚 Assigned Subjects</h3>
          ${(cr.subjects || []).length === 0 ? '<div style="color:var(--text-muted);font-size:0.85rem">No subjects assigned</div>' : `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${cr.subjects.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-weight:600;font-size:0.9rem">${s.name}</span>
                  <button class="btn btn-danger btn-sm" onclick="removeSubjectFromClass('${cr._id}','${s._id}','${s.name}')" style="font-size:0.7rem;padding:4px 8px">Remove</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
      <div id="class-action-modal"></div>
    `;
  } catch(e) { toast(e.message, 'error'); }
};

window.showAddStudentToClass = function(classId) {
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" onclick="this.remove()">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;width:100%;max-width:420px" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:6px">➕ Add Student</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px">Enter the student's email address</p>
        <div class="form-group">
          <label class="form-label">Student Email</label>
          <input id="add-student-email" type="email" class="form-input" placeholder="student@example.com"/>
        </div>
        <button class="btn btn-primary btn-full" onclick="addStudentToClass('${classId}')">Add Student</button>
      </div>
    </div>`;
  document.body.appendChild(container);
};

window.addStudentToClass = async function(classId) {
  const email = document.getElementById('add-student-email').value.trim();
  if (!email) return toast('Email required', 'error');
  try {
    await API.classroom.addStudent(classId, { email });
    toast('Student added!', 'success');
    document.querySelectorAll('[style*="fixed"]').forEach(el => el.parentElement?.remove());
    showClassroomDetail(classId);
  } catch(e) { toast(e.message, 'error'); }
};

window.removeStudentFromClass = async function(classId, studentId, name) {
  if (!confirm(`Remove ${name} from this classroom?`)) return;
  try {
    await API.classroom.removeStudent(classId, studentId);
    toast('Student removed', 'success');
    showClassroomDetail(classId);
  } catch(e) { toast(e.message, 'error'); }
};

window.showAssignSubject = function(classId) {
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" onclick="this.remove()">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;width:100%;max-width:420px" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:6px">📚 Assign Subject</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px">Select a subject to assign to this classroom</p>
        <div class="form-group" id="assign-subject-form">
          <div class="loading-full"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(container);

  API.subjects.all().then(subjects => {
    const form = document.getElementById('assign-subject-form');
    if (!form) return;
    form.innerHTML = `
      <label class="form-label">Subject</label>
      <select id="assign-subject-select" class="form-input form-select">
        <option value="">Select Subject</option>
        ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-full" style="margin-top:16px" onclick="assignSubjectToClass('${classId}')">Assign Subject</button>
    `;
  }).catch(() => toast('Failed to load subjects', 'error'));
};

window.assignSubjectToClass = async function(classId) {
  const subjectId = document.getElementById('assign-subject-select')?.value;
  if (!subjectId) return toast('Select a subject', 'error');
  try {
    await API.classroom.addSubject(classId, { subject_id: subjectId });
    toast('Subject assigned!', 'success');
    document.querySelectorAll('[style*="fixed"]').forEach(el => el.parentElement?.remove());
    showClassroomDetail(classId);
  } catch(e) { toast(e.message, 'error'); }
};

window.removeSubjectFromClass = async function(classId, subjectId, name) {
  if (!confirm(`Remove ${name} from this classroom?`)) return;
  try {
    await API.classroom.removeSubject(classId, subjectId);
    toast('Subject removed', 'success');
    showClassroomDetail(classId);
  } catch(e) { toast(e.message, 'error'); }
};

/* ── TEACHER: Settings ── */
async function renderTeacherSettings() {
  const userName = State.user?.name || 'Prof. Naveen';
  document.getElementById('main-content').innerHTML = `
    <div style="margin-bottom:24px">
      <h2>⚙️ Teacher Settings</h2>
      <p style="color:var(--text-muted)">Manage account preferences and threshold parameters</p>
    </div>
    <div class="card" style="max-width:540px">
      <div class="form-group">
        <label class="form-label">Teacher Name</label>
        <input type="text" class="form-input" value="${userName}" readonly/>
      </div>
      <div class="form-group">
        <label class="form-label">LGS Alert Threshold</label>
        <input type="text" class="form-input" value="0.60 (Learning Gap Score)" readonly/>
      </div>
      <button class="btn btn-primary" onclick="toast('Settings saved!', 'success')">Save Preferences</button>
    </div>
  `;
}

/* ── TAB SWITCHING ── */

window.switchTeacherTab = function(tabName) {
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');
  closeRightSidebar();

  if (tabName === 'dashboard') {
    renderTeacher();
  } else if (tabName === 'students') {
    renderTeacherStudents();
  } else if (tabName === 'questionbank') {
    renderQuestionBank();
  } else if (tabName === 'reports') {
    renderTeacherReports();
  } else if (tabName === 'settings') {
    renderTeacherSettings();
  }
};

/* ── INSPECTION MODAL (legacy) ── */

window.inspectStudentGapModal = function(name, subject, lgs, gapType) {
  let modal = document.getElementById('student-inspect-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-inspect-modal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  const isHidden = gapType.includes('Hidden');
  const isMisconception = gapType.includes('Misconception');

  modal.innerHTML = `
    <div class="modal-card animate-up">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.4rem">🔍</span>
          <div>
            <h3 style="margin:0;font-size:1.1rem">${name}'s Forensic Diagnostic Report</h3>
            <div style="font-size:0.75rem;color:var(--text-muted)">Subject: ${subject} · LGS Score: ${lgs}</div>
          </div>
        </div>
        <button class="modal-close" onclick="closeStudentInspectModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:16px;padding:14px;background:var(--bg-input);border:1px solid var(--border);border-radius:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:700">Flagged Cognitive State:</span>
            <span class="badge" style="background:${isHidden ? '#e05d4422' : isMisconception ? '#dd6b2022' : '#3b82f622'};color:${isHidden ? '#e05d44' : isMisconception ? '#dd6b20' : '#3b82f6'};border:1px solid ${isHidden ? '#e05d4444' : isMisconception ? '#dd6b2044' : '#3b82f644'}">
              ${gapType}
            </span>
          </div>
          <p style="font-size:0.88rem;color:var(--text-secondary);margin:0;line-height:1.5">
            ${isHidden
              ? `${name} achieved high accuracy but tagged answers as "Guessed", indicating an unanchored lucky guess (Retest Risk: ${Math.round(parseFloat(lgs)*100)}%).`
              : isMisconception
                ? `${name} answered incorrectly while expressing high confidence ("Sure"), indicating a persistent conceptual misunderstanding.`
                : `${name} has a recognized knowledge gap requiring foundational revision.`}
          </p>
        </div>
        <div style="margin-bottom:16px">
          <h4 style="margin-bottom:8px;font-size:0.95rem">🎯 Recommended Remedial Action:</h4>
          <div style="background:var(--bg-card2);padding:12px;border-radius:10px;border:1px solid var(--border);font-size:0.88rem;color:var(--text)">
            • 1 hour/day targeted practice on priority weak topics.<br>
            • Concept reinforcement drills before full mock retest.
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" onclick="closeStudentInspectModal()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="toast('Remedial plan assigned to ${name}!', 'success'); closeStudentInspectModal();">Assign Study Plan 🚀</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
};

window.closeStudentInspectModal = function() {
  const modal = document.getElementById('student-inspect-modal');
  if (modal) modal.classList.remove('open');
};

/* ── SUBJECT ICON HELPERS (reused from student.js) ── */
function subjectIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('math')) return '📐';
  if (n.includes('physics')) return '⚛️';
  if (n.includes('computer') || n.includes('cs') || n.includes('dsa')) return '💻';
  if (n.includes('chem')) return '🧪';
  if (n.includes('bio')) return '🧬';
  if (n.includes('english')) return '📖';
  if (n.includes('aptitude')) return '🧠';
  if (n.includes('os') || n.includes('operating')) return '🖥️';
  if (n.includes('network')) return '🌐';
  if (n.includes('dbms') || n.includes('database')) return '🗄️';
  return '📚';
}