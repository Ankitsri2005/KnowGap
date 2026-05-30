/* ── AI RESULTS / GAP ANALYSIS PAGE ── */

async function renderResults(params) {

  const { sessionId } =
    params || Router.params;

  let analysis =
    (params || Router.params).analysis;

  document.getElementById('app').innerHTML = `
    <div class="loading-full" style="min-height:100vh">
      <div class="spinner"></div>
      <p>Loading AI report...</p>
    </div>
  `;

  try {

    if (!sessionId) {
      throw new Error('Missing test session. Open your report from the dashboard history.');
    }

    // =========================================
    // FETCH RESULT FROM BACKEND
    // =========================================
    if (!analysis) {
      const cached = sessionStorage.getItem(`kg-results-${sessionId}`);
      if (cached) {
        try {
          analysis = JSON.parse(cached);
          sessionStorage.removeItem(`kg-results-${sessionId}`);
        } catch (_) { /* ignore bad cache */ }
      }
    }

    if (!analysis) {

      const res =
        await API.tests.result(sessionId);

      const totalQuestions =
        res.totalQuestions || 0;

      const correctAnswers =
        res.correctAnswers || 0;

      const wrongAnswers =
        res.wrongAnswers || 0;

      const overallScore =
        res.scorePercentage ||
        res.overall_score ||
        Math.round(
          (correctAnswers / Math.max(totalQuestions, 1)) * 100
        );

        analysis = {
          overallScore,

          totalQuestions,

          correctAnswers,

          wrongAnswers,

          performanceLevel:
            res.performanceLevel || 'Beginner',

          topicScores:
            res.topicScores || [],

          priorityTopics:
            res.priorityTopics || [],

          gapSummary:
            res.gapSummary || 'Analysis complete.',

          studyPlan:
            typeof res.recommendations === 'object'
              ? res.recommendations
              : {},

          insights: [],

          performanceEmoji:
            getPerfEmoji(overallScore),

          performanceColor:
            scoreColor(overallScore)
        };
    }

    analysis = normalizeResultsAnalysis(analysis);

    const score = analysis.overallScore || 0;
    const degPct = Math.round(score * 3.6);
    const color = scoreColor(score);
    const priority = getPriorityTopics(analysis);
    const recTopics = getRecommendationTopics(analysis);
    const studyPlan = analysis.studyPlan;

    const degPct =
      Math.round(score * 3.6);

    // =========================================
    // RENDER PAGE
    // =========================================
    document.getElementById('app').innerHTML = `
      <div class="results-page animate-up">

        <div class="results-card results-hero">
          <div style="font-size:1rem;color:var(--text-muted);margin-bottom:8px">🤖 AI Gap Analysis Report</div>
          <h2 style="margin-bottom:32px">Your Performance Breakdown</h2>

          <div style="display:flex;align-items:center;justify-content:center;gap:60px;flex-wrap:wrap">
            <div>
              <div class="results-score-ring" style="background:conic-gradient(${color} ${degPct}%, var(--bg-input) 0%)">
                <div class="results-score-inner">
                  <div style="font-size:2rem;font-weight:900;color:${color}">${score}%</div>
                  <div style="font-size:.7rem;color:var(--text-muted)">Overall</div>
                </div>

              </div>

              <div style="margin-top:16px">
                <span style="font-size:1.5rem">${analysis.performanceEmoji || getPerfEmoji(score)}</span>
                <div style="font-weight:700;font-size:1.1rem;margin-top:4px;color:${color}">${analysis.performanceLevel}</div>
              </div>
            </div>

            <div class="results-stats">
              ${[
                ['📝 Total Questions', analysis.totalQuestions],
                ['✅ Correct Answers', analysis.correctAnswers],
                ['❌ Wrong Answers', analysis.wrongAnswers],
                ['🎯 Score', score + '%']
              ].map(([label, val]) => `
                <div class="results-stat-row">
                  <span style="color:var(--text-secondary)">${label}</span>
                  <strong>${val ?? '—'}</strong>
                </div>

              </div>

            </div>

            <!-- STATS -->
            <div style="text-align:left">

              ${[
                [
                  '📝 Total Questions',
                  analysis.totalQuestions
                ],

                [
                  '✅ Correct Answers',
                  analysis.correctAnswers
                ],

                [
                  '❌ Wrong Answers',
                  analysis.wrongAnswers
                ],

                [
                  '🎯 Score',
                  score + '%'
                ]

              ].map(([label, val]) => `

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    gap:40px;
                    padding:10px 0;
                    border-bottom:1px solid var(--border)
                  "
                >

                  <span
                    style="
                      color:var(--text-secondary)
                    "
                  >
                    ${label}
                  </span>

                  <strong>${val}</strong>

                </div>

              `).join('')}

            </div>

          </div>

          <div class="results-summary" style="border-left-color:${color}">
            <p>${escapeHtml(analysis.gapSummary || 'Analysis complete.')}</p>
          </div>

        </div>

        ${priority.length ? `
        <div class="results-card">
          <h3 class="results-card-title">🚨 Priority Study Areas</h3>
          <p class="results-card-sub">Topics requiring immediate attention based on AI analysis</p>
          <div class="priority-list">
            ${priority.map((t, i) => `
              <div class="priority-item">
                <div class="priority-rank">#${i + 1}</div>
                <div class="priority-body">
                  <div class="priority-topic">${escapeHtml(t.name)}</div>
                  <div class="priority-meta">${escapeHtml(t.urgencyLabel)} · ${t.score}% mastery</div>
                </div>
                <div class="priority-stats">
                  <div class="priority-pct">${t.score}%</div>
                  <div class="priority-hours">~${t.studyHours}h needed</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${studyPlan.weeks && studyPlan.weeks.length ? `
        <div class="results-card">
          <h3 class="results-card-title">🗓️ AI-Generated Study Plan</h3>
          <p class="results-card-sub">Estimated total: ${studyPlan.totalEstimatedHours || 0} hours</p>
          <div class="study-week-list">
            ${studyPlan.weeks.map(w => `
              <div class="study-week-card">
                <div class="study-week-head">
                  <div class="study-week-title">
                    Week ${w.week}<span class="study-week-focus"> · ${escapeHtml(w.focus)}</span>
                  </div>
                  <span class="study-time-badge">⏱ ${formatDailyGoal(w.dailyGoal)}</span>
                </div>
                <div class="study-tags">
                  ${(w.activities || []).map(a => `<span class="study-tag">${escapeHtml(a)}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${recTopics.length ? `
        <div class="results-card">
          <h3 class="results-card-title">💡 AI Study Recommendations</h3>
          <p class="results-card-sub">Personalized actions for your weakest topics</p>
          ${recTopics.map(t => `
            <div class="rec-topic-block">
              <div class="rec-topic-head">
                <div class="rec-topic-name">${escapeHtml(t.name)}</div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <span class="rec-gap-badge">${escapeHtml(t.gapLabel)}</span>
                  <span class="rec-score-pct">${t.score}%</span>
                </div>
              </div>
              <ul class="rec-list">
                ${t.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="results-actions">
          <button class="btn btn-primary btn-lg" onclick="Router.go('student')">📚 Take Another Test</button>
          <button class="btn btn-secondary" onclick="window.location.href='student.html'">📈 View All Results</button>
          <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Report</button>
        </div>
      </div>
    `;

  } catch (e) {

    document.getElementById('app').innerHTML = `

      <div class="loading-full">

        <p>⚠️ ${e.message}</p>

        <button
          class="btn btn-primary"
          onclick="Router.go('student')"
        >
          Go Back
        </button>

      </div>
    `;
  }
}


function normalizeResultsAnalysis(analysis) {
  const topicScores = (analysis.topicScores || []).map(normalizeTopic);
  let studyPlan = analysis.studyPlan;

  if (!studyPlan || !studyPlan.weeks) {
    const rec = analysis.studyPlan || analysis.recommendations;
    if (rec && typeof rec === 'object' && rec.weeks) studyPlan = rec;
    else studyPlan = { weeks: [], totalEstimatedHours: 0 };
  }

  if (!studyPlan.totalEstimatedHours && studyPlan.weeks?.length) {
    const topics = studyPlan.weeks.flatMap(w => w.topics || []);
    studyPlan.totalEstimatedHours = topics.reduce((s, t) => s + (t.studyHours || 0), 0)
      || (analysis.priorityTopics || []).reduce((s, t) => s + (t.studyHours || 0), 0);
  }

  return {
    ...analysis,
    topicScores,
    priorityTopics: (analysis.priorityTopics || []).map(normalizeTopic),
    studyPlan
  };
}

function normalizeTopic(t) {
  const name = t.name || t.topicName || 'Topic';
  const score = t.score ?? t.overall_score ?? 0;
  return {
    name,
    score,
    studyHours: t.studyHours ?? estimateHoursFromScore(score),
    gapSeverity: t.gapSeverity || t.urgency || gapLabelFromScore(score),
    urgency: t.urgency,
    recommendations: t.recommendations || defaultRecommendations(name, score)
  };
}

function gapLabelFromScore(score) {
  if (score < 40) return 'Critical Gap';
  if (score < 60) return 'Significant Gap';
  if (score < 75) return 'Moderate Gap';
  return 'Minor Gap';
}

function estimateHoursFromScore(score) {
  if (score >= 80) return 0;
  if (score < 40) return 4;
  if (score < 60) return 3;
  return 2;
}

function defaultRecommendations(name, score) {
  const topic = `"${name}"`;
  if (score < 40) {
    return [
      `Start from the very basics of ${topic}`,
      'Watch video tutorials before attempting problems',
      `Practice at least 20 questions daily on ${topic}`
    ];
  }
  if (score < 60) {
    return [
      `Review core concepts and definitions in ${topic}`,
      'Work through example problems step-by-step',
      `Practice 10–15 questions per day on ${topic}`
    ];
  }
  return [
    `Review weak areas within ${topic}`,
    'Take mini-quizzes to self-assess progress',
    'Focus on understanding why, not just what'
  ];
}

function getPriorityTopics(analysis) {
  const fromPriority = (analysis.priorityTopics || [])
    .filter(t => (t.score ?? 100) < 75)
    .map(t => ({
      name: t.name,
      score: t.score ?? 0,
      studyHours: t.studyHours ?? estimateHoursFromScore(t.score),
      urgencyLabel: formatUrgency(t.gapSeverity || t.urgency || gapLabelFromScore(t.score))
    }));

  if (fromPriority.length) return fromPriority.slice(0, 5);

  return (analysis.topicScores || [])
    .filter(t => t.score < 75)
    .slice(0, 5)
    .map(t => ({
      name: t.name,
      score: t.score,
      studyHours: t.studyHours,
      urgencyLabel: formatUrgency(t.gapSeverity)
    }));
}

function getRecommendationTopics(analysis) {
  const weak = (analysis.topicScores || []).filter(t => t.score < 75);
  return weak.slice(0, 6).map(t => ({
    name: t.name,
    score: t.score,
    gapLabel: formatUrgency(t.gapSeverity).toUpperCase(),
    recommendations: t.recommendations
  }));
}

function formatUrgency(label) {
  if (!label) return 'Gap';
  if (label.includes('Gap')) return label;
  return label + ' Gap';
}

function formatDailyGoal(goal) {
  if (!goal) return '1 HOUR/DAY';
  const m = String(goal).match(/(\d+)/);
  const n = m ? m[1] : '1';
  return `${n} HOUR${n === '1' ? '' : 'S'}/DAY`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getPerfEmoji(score) {

  if (score >= 85) return '🏆';

  if (score >= 70) return '👍';

  if (score >= 50) return '📊';

  if (score >= 35) return '⚠️';

  return '🚨';
}