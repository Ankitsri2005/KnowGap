/* ── AI RESULTS / GAP ANALYSIS PAGE ── */

function normalizeTopic(t) {
  const score = t.score ?? 0;
  return {
    name: t.name || t.topicName || 'Topic',
    score,
    total: t.total,
    correct: t.correct,
    gapSeverity: t.gapSeverity || 'Gap',
    gapColor: t.gapColor || scoreColor(score),
    recommendations: Array.isArray(t.recommendations)
      ? t.recommendations
      : [],
    studyHours: t.studyHours ?? estimateHours(score),
  };
}

function estimateHours(score) {
  if (score >= 80) return 0;
  if (score < 40) return 4;
  if (score < 60) return 3;
  return 2;
}

function normalizeFromAnalysis(raw) {
  if (raw.overallScore !== undefined) {
    return {
      overallScore: raw.overallScore,
      totalQuestions: raw.totalQuestions || 0,
      correctAnswers: raw.correctAnswers || 0,
      wrongAnswers: raw.wrongAnswers || 0,
      performanceLevel: raw.performanceLevel || 'Beginner',
      subjectName: raw.subjectName || 'Subject',
      forensicMatrix: raw.forensicMatrix || {},
      retestRisk: raw.retestRisk || 0,
      hiddenGapCount: raw.hiddenGapCount || 0,
      misconceptionCount: raw.misconceptionCount || 0,
      topicScores: (raw.topicScores || []).map(normalizeTopic),
      priorityTopics: (raw.priorityTopics || []).map((p) => ({
        name: p.name,
        score: p.score ?? 0,
        urgency: p.urgency || p.gapSeverity || 'Critical Gap',
        color: p.color || scoreColor(p.score ?? 0),
        studyHours: p.studyHours ?? estimateHours(p.score ?? 0),
      })),
      gapSummary: raw.gapSummary || '',
      studyPlan: raw.studyPlan || { weeks: [], totalEstimatedHours: 0 },
      insights: raw.insights || [],
      performanceEmoji:
        raw.performanceEmoji || getPerfEmoji(raw.overallScore),
      performanceColor:
        raw.performanceColor || scoreColor(raw.overallScore),
    };
  }

  return buildAnalysisFromApi(raw);
}

function buildAnalysisFromApi(res) {
  const totalQuestions = res.totalQuestions || 0;
  const correctAnswers = res.correctAnswers || 0;
  const wrongAnswers =
    res.wrongAnswers ??
    Math.max(0, totalQuestions - correctAnswers);
  const overallScore =
    res.scorePercentage ??
    res.overall_score ??
    Math.round(
      (correctAnswers / Math.max(totalQuestions, 1)) * 100
    );

  let studyPlan = res.recommendations;
  if (!studyPlan || typeof studyPlan !== 'object' || !studyPlan.weeks) {
    studyPlan = { weeks: [], totalEstimatedHours: 0 };
  }

  const topicScores = (res.topicScores || []).map(normalizeTopic);
  const priorityTopics = (res.priorityTopics || []).map((p) => ({
    name: p.name || p.topicName || 'Topic',
    score: p.score ?? 0,
    urgency: p.urgency || p.gapSeverity || 'Critical Gap',
    color: p.color || scoreColor(p.score ?? 0),
    studyHours: p.studyHours ?? estimateHours(p.score ?? 0),
  }));

  return {
    overallScore,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    performanceLevel: res.performanceLevel || 'Beginner',
    subjectName: res.subjectName || 'Subject',
    forensicMatrix: res.forensicMatrix || {},
    retestRisk: res.retestRisk || 0,
    hiddenGapCount: res.hiddenGapCount || 0,
    misconceptionCount: res.misconceptionCount || 0,
    topicScores,
    priorityTopics:
      priorityTopics.length > 0
        ? priorityTopics
        : topicScores
            .filter((t) => t.score < 75)
            .slice(0, 5)
            .map((t) => ({
              name: t.name,
              score: t.score,
              urgency: t.gapSeverity,
              color: t.gapColor,
              studyHours: t.studyHours,
            })),
    gapSummary: res.gapSummary || 'Analysis complete.',
    studyPlan,
    insights: res.insights || [],
    performanceEmoji: getPerfEmoji(overallScore),
    performanceColor: scoreColor(overallScore),
  };
}

async function renderResults(params) {
  const sessionId =
    (params || Router.params || {}).sessionId;

  if (!sessionId) {
    document.getElementById('app').innerHTML = `
      <div class="empty-state">
        <p>No test session found.</p>
        <button class="btn btn-primary" onclick="window.location.href='student.html'">Go to Dashboard</button>
      </div>`;
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="loading-full" style="min-height:40vh">
      <div class="spinner"></div>
      <p>Loading AI report...</p>
    </div>`;

  try {
    let analysis = null;
    const cacheKey = `knowgap_result_${sessionId}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        analysis = normalizeFromAnalysis(JSON.parse(cached));
        sessionStorage.removeItem(cacheKey);
      } catch (_) {
        /* use API */
      }
    }

    if (!analysis) {
      const res = await API.tests.result(sessionId);
      analysis = buildAnalysisFromApi(res);
    }

    const score = analysis.overallScore || 0;
    const degPct = Math.round(score * 3.6);

    document.getElementById('app').innerHTML = `
      <div class="results-report animate-up">

        <!-- Performance breakdown -->
        <div class="card results-hero">
          <div class="results-hero-label">🤖 AI Gap Analysis Report</div>
          <h2 style="margin-bottom:28px;text-align:center">Your Performance Breakdown</h2>

          <div class="results-hero-grid">
            <div class="results-score-wrap">
              <div class="results-donut" style="background:conic-gradient(${scoreColor(score)} ${degPct}%, var(--bg-input) 0%)">
                <div class="results-donut-inner">
                  <div class="results-donut-value" style="color:${scoreColor(score)}">${score}%</div>
                  <div class="results-donut-label">Overall</div>
                </div>
              </div>
              <div style="margin-top:16px;text-align:center">
                <span style="font-size:1.5rem">${analysis.performanceEmoji}</span>
                <div style="font-weight:700;font-size:1.05rem;margin-top:4px;color:${scoreColor(score)}">
                  ${analysis.performanceLevel}
                </div>
              </div>
            </div>

            <div class="results-stats">
              ${[
                ['📝', 'Total Questions', analysis.totalQuestions],
                ['✅', 'Correct Answers', analysis.correctAnswers],
                ['❌', 'Wrong Answers', analysis.wrongAnswers],
                ['🎯', 'Score', score + '%'],
              ]
                .map(
                  ([icon, label, val]) => `
                <div class="results-stat-row">
                  <span>${icon} ${label}</span>
                  <strong>${val}</strong>
                </div>`
                )
                .join('')}
            </div>
          </div>

          <div class="results-summary" style="border-left-color:${scoreColor(score)}">
            <p>${analysis.gapSummary}</p>
          </div>
        </div>

        <!-- Topic-by-topic -->
        ${
          analysis.topicScores.length
            ? `
        <div class="card" style="margin-bottom:24px">
          <h3 style="margin-bottom:4px">📊 Topic-by-Topic Analysis</h3>
          <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:20px">${analysis.subjectName}</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            ${analysis.topicScores
              .map(
                (t) => `
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                  <span style="font-weight:600">${t.name}</span>
                  <span style="font-weight:700;color:${scoreColor(t.score)}">${t.score}%</span>
                </div>
                <div style="height:10px;background:var(--bg-input);border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${t.score}%;background:${scoreColor(t.score)};border-radius:99px;transition:width .6s"></div>
                </div>
                <div style="font-size:.8rem;color:var(--text-muted);margin-top:6px">
                  ${t.correct != null ? `${t.correct}/${t.total} correct` : ''}
                  · <span style="color:${t.gapColor}">${t.gapSeverity}</span>
                </div>
              </div>`
              )
              .join('')}
          </div>
        </div>`
            : ''
        }

        <!-- Response Time Scatter Plot (Table 2) -->
        <div class="card response-time-card" style="margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge badge-info" style="font-size:0.7rem">TABLE 2 — RESEARCH PAPER</span>
                <h3 style="margin:0">⏱️ Response Time vs. Accuracy Analysis</h3>
              </div>
              <p style="color:var(--text-muted);font-size:.85rem">Cognitive State Classification mapping response speed against accuracy</p>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);background:rgba(255,255,255,0.04);padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08)">
              Formula: <code style="color:var(--primary)">LGS<sub>i</sub> = f(c<sub>i</sub>, k<sub>i</sub>, t̂<sub>i</sub>)</code>
            </div>
          </div>

          <div class="scatter-plot-wrapper">
            <div class="scatter-chart-container" style="position:relative;width:100%;height:300px">
              <svg viewBox="0 0 540 260" style="width:100%;height:100%;overflow:visible">
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

                <text x="280" y="250" fill="var(--text-secondary)" font-size="11" font-weight="700" text-anchor="middle">Response Time (Speed) →</text>

                <rect x="60" y="30" width="146" height="90" fill="rgba(56,161,105,0.06)" rx="6"/>
                <text x="133" y="46" fill="rgba(56,161,105,0.75)" font-size="10" font-weight="700" text-anchor="middle">TRULY MASTERED</text>

                <rect x="353" y="30" width="147" height="90" fill="rgba(224,93,68,0.06)" rx="6"/>
                <text x="426" y="46" fill="rgba(224,93,68,0.85)" font-size="10" font-weight="700" text-anchor="middle">HIDDEN GAP ZONE</text>

                <rect x="60" y="120" width="146" height="90" fill="rgba(221,107,32,0.06)" rx="6"/>
                <text x="133" y="200" fill="rgba(221,107,32,0.75)" font-size="10" font-weight="700" text-anchor="middle">MISCONCEPTION</text>

                <rect x="353" y="120" width="147" height="90" fill="rgba(66,153,225,0.06)" rx="6"/>
                <text x="426" y="200" fill="rgba(66,153,225,0.75)" font-size="10" font-weight="700" text-anchor="middle">NORMAL GAP</text>

                <!-- Data Points -->
                <g class="scatter-point" transform="translate(140, 48)">
                  <circle r="14" fill="rgba(56,161,105,0.25)"/>
                  <circle r="6" fill="#38a169"/>
                  <text x="0" y="4" fill="#fff" font-size="10" font-weight="800" text-anchor="middle">★</text>
                  <text x="0" y="-12" fill="#68d391" font-size="10" font-weight="700" text-anchor="middle">★ Truly Mastered</text>
                </g>

                <g class="scatter-point" transform="translate(420, 58)">
                  <circle r="18" fill="rgba(224,93,68,0.3)" class="pulse-circle"/>
                  <circle r="7" fill="#e05d44"/>
                  <text x="0" y="4" fill="#fff" font-size="11" font-weight="800" text-anchor="middle">●</text>
                  <text x="0" y="-14" fill="#fc8181" font-size="11" font-weight="800" text-anchor="middle">● Hidden Gap</text>
                </g>

                <g class="scatter-point" transform="translate(130, 165)">
                  <circle r="14" fill="rgba(221,107,32,0.25)"/>
                  <circle r="6" fill="#dd6b20"/>
                  <text x="0" y="4" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">▲</text>
                  <text x="0" y="18" fill="#f6ad55" font-size="10" font-weight="700" text-anchor="middle">▲ Misconception</text>
                </g>

                <g class="scatter-point" transform="translate(410, 160)">
                  <circle r="14" fill="rgba(66,153,225,0.25)"/>
                  <circle r="6" fill="#4299e1"/>
                  <text x="0" y="4" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">■</text>
                  <text x="0" y="18" fill="#90cdf4" font-size="10" font-weight="700" text-anchor="middle">■ Normal Gap</text>
                </g>
              </svg>
            </div>

            <div class="scatter-legend">
              <div class="legend-item legend-green">
                <span class="legend-symbol">★</span>
                <div>
                  <span class="legend-title">Truly Mastered</span>
                  <span class="legend-desc">Very Fast + Correct</span>
                </div>
              </div>
              <div class="legend-item legend-red legend-pulse">
                <span class="legend-symbol">●</span>
                <div>
                  <span class="legend-title">Hidden Gap 🔴</span>
                  <span class="legend-desc">Very Slow + Correct</span>
                </div>
              </div>
              <div class="legend-item legend-orange">
                <span class="legend-symbol">▲</span>
                <div>
                  <span class="legend-title">Misconception</span>
                  <span class="legend-desc">Very Fast + Wrong</span>
                </div>
              </div>
              <div class="legend-item legend-blue">
                <span class="legend-symbol">■</span>
                <div>
                  <span class="legend-title">Normal Gap</span>
                  <span class="legend-desc">Very Slow + Wrong</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority study areas -->
        ${
          analysis.priorityTopics.length
            ? `
        <div class="card" style="margin-bottom:24px">
          <h3 style="margin-bottom:4px">🚨 Priority Study Areas</h3>
          <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:20px">
            Topics requiring immediate attention based on AI analysis
          </p>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${analysis.priorityTopics
              .map(
                (p, i) => `
              <div class="priority-row" style="border-left:4px solid ${p.color || '#ef4444'}">
                <div>
                  <div style="font-weight:700">#${i + 1} ${p.name}</div>
                  <div style="font-size:.85rem;color:var(--text-muted);margin-top:4px">
                    ${p.urgency} · ${p.score}% mastery
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:800;color:${p.color || '#ef4444'}">${p.score}%</div>
                  <div style="font-size:.8rem;color:var(--text-muted)">~${p.studyHours}h needed</div>
                </div>
              </div>`
              )
              .join('')}
          </div>
        </div>`
            : ''
        }

        <!-- Study plan -->
        ${
          analysis.studyPlan?.weeks?.length
            ? `
        <div class="card" style="margin-bottom:24px">
          <h3 style="margin-bottom:4px">🗓️ AI-Generated Study Plan</h3>
          <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:20px">
            Estimated total: ${analysis.studyPlan.totalEstimatedHours || 0} hours
          </p>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${analysis.studyPlan.weeks
              .map(
                (w) => `
              <div class="study-week-card">
                <div style="display:flex;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
                  <div>
                    <span style="font-weight:700">Week ${w.week}</span>
                    <span style="color:var(--text-muted);margin-left:8px">· ${w.focus}</span>
                  </div>
                  <span class="badge badge-info">⏱ ${w.dailyGoal}</span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${(w.activities || [])
                    .map(
                      (a) =>
                        `<span class="badge badge-warning">${a}</span>`
                    )
                    .join('')}
                </div>
              </div>`
              )
              .join('')}
          </div>
        </div>`
            : ''
        }

        <!-- AI recommendations -->
        ${
          analysis.topicScores.some((t) => t.recommendations.length)
            ? `
        <div class="card" style="margin-bottom:24px">
          <h3 style="margin-bottom:20px">💡 AI Study Recommendations</h3>
          <div style="display:flex;flex-direction:column;gap:20px">
            ${analysis.topicScores
              .filter((t) => t.recommendations.length && t.score < 75)
              .map(
                (t) => `
              <div style="padding-bottom:20px;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
                  <strong>${t.name}</strong>
                  <span class="badge badge-danger">${t.gapSeverity}</span>
                  <span style="font-weight:700;color:${scoreColor(t.score)}">${t.score}%</span>
                </div>
                <ul style="list-style:none;padding:0;margin:0">
                  ${t.recommendations
                    .map(
                      (r) => `
                    <li style="padding:6px 0;color:var(--text-secondary)">→ ${r}</li>`
                    )
                    .join('')}
                </ul>
              </div>`
              )
              .join('')}
          </div>
        </div>`
            : ''
        }

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px">
          <button class="btn btn-primary btn-lg" onclick="window.location.href='student.html'">📝 Take Another Test</button>
          <button class="btn btn-secondary" onclick="window.location.href='student.html'">📈 View All Results</button>
          <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Report</button>
        </div>
      </div>`;
  } catch (e) {
    document.getElementById('app').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>${e.message}</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="window.location.href='student.html'">Go Back</button>
      </div>`;
  }
}

function getPerfEmoji(score) {
  if (score >= 85) return '🏆';
  if (score >= 70) return '👍';
  if (score >= 50) return '📊';
  if (score >= 35) return '⚠️';
  return '🚨';
}
