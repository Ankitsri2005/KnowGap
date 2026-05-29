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

    // =========================================
    // FETCH RESULT FROM BACKEND
    // =========================================
    if (!analysis) {

      const res =
        await API.tests.result(sessionId);

      analysis = {

        overallScore:
          res.overallScore || 0,

        totalQuestions:
          res.totalQuestions || 0,

        correctAnswers:
          res.correctAnswers || 0,

        wrongAnswers:
          res.wrongAnswers || 0,

        performanceLevel:
          res.performanceLevel || 'Beginner',

        topicScores:
          res.topicScores || [],

        priorityTopics:
          res.priorityTopics || [],

        gapSummary:
          res.gapSummary ||
          'Analysis complete.',

        studyPlan:
          typeof res.recommendations === 'object'
            ? res.recommendations
            : {},

        insights: [],

        performanceEmoji:
          getPerfEmoji(
            res.overallScore || 0
          ),

        performanceColor:
          scoreColor(
            res.overallScore || 0
          )
      };
    }

    // =========================================
    // SCORE
    // =========================================
    const score =
      analysis.overallScore || 0;

    const degPct =
      Math.round(score * 3.6);

    // =========================================
    // RENDER PAGE
    // =========================================
    document.getElementById('app').innerHTML = `

      <nav class="navbar">
        <div class="container">

          <span
            class="navbar-brand"
            style="cursor:pointer"
            onclick="Router.go('student')"
          >
            knowGap
          </span>

          <div class="navbar-links">

            <button
              class="btn btn-secondary btn-sm"
              onclick="window.location.href='student.html'"
            >
              📈 All Results
            </button>

            <button
              class="btn btn-primary btn-sm"
              onclick="Router.go('student')"
            >
              Dashboard
            </button>

          </div>
        </div>
      </nav>

      <div
        style="
          max-width:900px;
          margin:0 auto;
          padding:100px 24px 60px
        "
        class="animate-up"
      >

        <!-- HERO SCORE -->
        <div
          class="card"
          style="
            text-align:center;
            padding:48px;
            margin-bottom:24px;
            background:linear-gradient(
              135deg,
              var(--accent),
              rgba(250,247,242,.8)
            );
            border-color:rgba(var(--primary-rgb),.35)
          "
        >

          <div
            style="
              font-size:1rem;
              color:var(--text-muted);
              margin-bottom:8px
            "
          >
            🤖 AI Gap Analysis Report
          </div>

          <h2 style="margin-bottom:32px">
            Your Performance Breakdown
          </h2>

          <div
            style="
              display:flex;
              align-items:center;
              justify-content:center;
              gap:60px;
              flex-wrap:wrap
            "
          >

            <!-- SCORE CIRCLE -->
            <div>

              <div
                style="
                  width:160px;
                  height:160px;
                  border-radius:50%;
                  background:conic-gradient(
                    ${scoreColor(score)}
                    ${degPct}%,
                    var(--bg-input) 0%
                  );
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  position:relative;
                  margin:0 auto
                "
              >

                <div
                  style="
                    width:120px;
                    height:120px;
                    border-radius:50%;
                    background:var(--bg-card);
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center
                  "
                >

                  <div
                    style="
                      font-size:2rem;
                      font-weight:900;
                      color:${scoreColor(score)}
                    "
                  >
                    ${score}%
                  </div>

                  <div
                    style="
                      font-size:.7rem;
                      color:var(--text-muted)
                    "
                  >
                    Overall
                  </div>

                </div>

              </div>

              <div style="margin-top:16px">

                <span style="font-size:1.5rem">
                  ${analysis.performanceEmoji}
                </span>

                <div
                  style="
                    font-weight:700;
                    font-size:1.1rem;
                    margin-top:4px;
                    color:${scoreColor(score)}
                  "
                >
                  ${analysis.performanceLevel}
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

          <!-- SUMMARY -->
          <div
            style="
              margin-top:28px;
              padding:16px 24px;
              background:var(--bg-card2);
              border-radius:12px;
              border-left:3px solid
              ${scoreColor(score)}
            "
          >

            <p
              style="
                color:var(--text-secondary);
                line-height:1.7
              "
            >
              ${analysis.gapSummary}
            </p>

          </div>

        </div>

        <!-- PRIORITY STUDY AREAS -->
        ${analysis.priorityTopics && analysis.priorityTopics.length > 0 ? `
          <div class="card" style="margin-bottom:24px; padding:24px;">
            <h3 style="margin-bottom:6px; font-family:'Playfair Display', Georgia, serif; font-weight:800; display:flex; align-items:center; gap:8px;">
              🚨 Priority Study Areas
            </h3>
            <p style="color:var(--text-muted); font-size:.85rem; margin-bottom:20px">
              Topics requiring immediate attention based on AI analysis
            </p>
            <div style="display:flex; flex-direction:column; gap:16px">
              ${analysis.priorityTopics.map((t, idx) => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:var(--bg-input); border-radius:12px; border:1.5px solid var(--border); border-left:4px solid ${t.color || 'var(--primary)'}">
                  <div style="display:flex; align-items:center; gap:16px">
                    <span class="badge" style="background:rgba(239,68,68,.1); color:${t.color || '#ef4444'}; font-weight:700; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:0.9rem;">
                      #${idx + 1}
                    </span>
                    <div>
                      <div style="font-weight:700; font-size:1.05rem; color:var(--text);">${t.name}</div>
                      <div style="font-size:.8rem; color:var(--text-muted); margin-top:4px;">
                        ${t.urgency} · ${t.score}% mastery
                      </div>
                    </div>
                  </div>
                  <div style="text-align:right">
                    <span style="font-weight:800; color:${t.color || 'var(--text)'}; font-size:1.15rem">${t.score}%</span>
                    <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px">~${t.studyHours}h needed</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- STUDY PLAN -->
        ${analysis.studyPlan &&
        analysis.studyPlan.weeks &&
        analysis.studyPlan.weeks.length
          ? `
          <div
            class="card"
            style="margin-bottom:24px"
          >

            <h3 style="margin-bottom:4px">
              📅 AI-Generated Study Plan
            </h3>

            <p
              style="
                color:var(--text-muted);
                font-size:.85rem;
                margin-bottom:20px
              "
            >
              Estimated total:
              ${analysis.studyPlan.totalEstimatedHours || 0}
              hours
            </p>

            <div
              style="
                display:flex;
                flex-direction:column;
                gap:12px
              "
            >

              ${analysis.studyPlan.weeks.map(w => `

                <div
                  style="
                    padding:20px;
                    background:var(--bg-input);
                    border-radius:12px;
                    border:1px solid var(--border)
                  "
                >

                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      margin-bottom:10px;
                      flex-wrap:wrap;
                      gap:8px
                    "
                  >

                    <div>

                      <span
                        style="font-weight:700"
                      >
                        Week ${w.week}
                      </span>

                      <span
                        style="
                          color:var(--text-muted);
                          margin-left:8px
                        "
                      >
                        · ${w.focus}
                      </span>

                    </div>

                    <span
                      class="badge badge-info"
                    >
                      ⏱ ${w.dailyGoal}
                    </span>

                  </div>

                  <div
                    style="
                      display:flex;
                      gap:8px;
                      flex-wrap:wrap
                    "
                  >

                    ${(w.activities || [])
                      .map(a => `
                        <span
                          class="badge badge-warning"
                        >
                          ${a}
                        </span>
                      `)
                      .join('')}

                  </div>

                </div>

              `).join('')}

            </div>

          </div>
        `
          : ''}

        <!-- AI STUDY RECOMMENDATIONS -->
        ${analysis.topicScores && analysis.topicScores.length > 0 ? `
          <div class="card" style="margin-bottom:24px; padding:24px;">
            <h3 style="margin-bottom:20px; font-family:'Playfair Display', Georgia, serif; font-weight:800; display:flex; align-items:center; gap:8px;">
              💡 AI Study Recommendations
            </h3>
            <div style="display:flex; flex-direction:column; gap:20px">
              ${analysis.topicScores.filter(t => t.score < 80).map((t, idx, arr) => `
                <div style="padding-bottom:20px; margin-bottom:20px; border-bottom:${idx === arr.length - 1 ? 'none' : '1px solid var(--border)'}">
                  <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap">
                    <strong style="font-size:1.1rem; color:var(--text)">${t.name}</strong>
                    <span class="badge" style="background:${t.gapColor}15; color:${t.gapColor}; font-size:0.75rem; font-weight:700; text-transform:uppercase; padding:4px 8px; border-radius:6px;">
                      ${t.gapSeverity || 'Gap'}
                    </span>
                    <span style="font-weight:700; color:${t.gapColor}; font-size:1rem;">${t.score}%</span>
                  </div>
                  <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px">
                    ${(t.recommendations || []).map(rec => `
                      <li style="color:var(--text-secondary); font-size:0.92rem; display:flex; gap:8px; align-items:flex-start; line-height:1.5">
                        <span style="color:var(--text-muted); font-weight:bold;">→</span>
                        <span>${rec}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- BUTTONS -->
        <div
          style="
            display:flex;
            gap:12px;
            flex-wrap:wrap
          "
        >

          <button
            class="btn btn-primary btn-lg"
            onclick="Router.go('student')"
          >
            📚 Take Another Test
          </button>

          <button
            class="btn btn-secondary"
            onclick="window.location.href='student.html'"
          >
            📈 View All Results
          </button>

          <button
            class="btn btn-secondary"
            onclick="window.print()"
          >
            🖨️ Print Report
          </button>

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


// =========================================
// PERFORMANCE EMOJI
// =========================================
function getPerfEmoji(score) {

  if (score >= 85) return '🏆';

  if (score >= 70) return '👍';

  if (score >= 50) return '📊';

  if (score >= 35) return '⚠️';

  return '🚨';
}