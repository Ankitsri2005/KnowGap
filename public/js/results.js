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
