/* ── AI RESULTS / GAP ANALYSIS PAGE ── */
async function renderResults(params) {
  const { sessionId } = params || Router.params;
  let analysis = (params || Router.params).analysis;
  document.getElementById('app').innerHTML = `<div class="loading-full" style="min-height:100vh"><div class="spinner"></div><p>Loading AI report...</p></div>`;

  try {
    if (!analysis) {
      const res = await API.tests.result(sessionId);
      analysis = {
        overallScore: res.overall_score,
        totalQuestions: res.total_questions,
        correctAnswers: res.correct_answers,
        wrongAnswers: res.total_questions - res.correct_answers,
        performanceLevel: res.performance_level,
        topicScores: res.topic_scores || [],
        priorityTopics: res.priority_topics || [],
        gapSummary: res.gap_summary || '',
        studyPlan: typeof res.recommendations === 'object' ? res.recommendations : {},
        insights: [],
        performanceEmoji: getPerfEmoji(res.overall_score),
        performanceColor: scoreColor(res.overall_score)
      };
    }

    const score = analysis.overallScore;
    const degPct = Math.round(score * 3.6);

    document.getElementById('app').innerHTML = `
      <nav class="navbar">
        <div class="container">
          <span class="navbar-brand" style="cursor:pointer" onclick="Router.go('student')">🧠 KnowGap AI</span>
          <div class="navbar-links">
            <button class="btn btn-secondary btn-sm" onclick="window.location.href='/student.html'">📈 All Results</button>
            <button class="btn btn-primary btn-sm" onclick="Router.go('student')">Dashboard</button>
          </div>
        </div>
      </nav>

      <div style="max-width:900px;margin:0 auto;padding:100px 24px 60px" class="animate-up">

        <!-- HERO SCORE -->
        <div class="card" style="text-align:center;padding:48px;margin-bottom:24px;background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(6,182,212,.05));border-color:rgba(99,102,241,.3)">
          <div style="font-size:1rem;color:var(--text-muted);margin-bottom:8px">🤖 AI Gap Analysis Report</div>
          <h2 style="margin-bottom:32px">Your Performance Breakdown</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:60px;flex-wrap:wrap">
            <div>
              <div style="width:160px;height:160px;border-radius:50%;background:conic-gradient(${scoreColor(score)} ${degPct * 1}%, var(--bg-input) 0%);display:flex;align-items:center;justify-content:center;position:relative;margin:0 auto">
                <div style="width:120px;height:120px;border-radius:50%;background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center">
                  <div style="font-size:2rem;font-weight:900;color:${scoreColor(score)}">${score}%</div>
                  <div style="font-size:.7rem;color:var(--text-muted)">Overall</div>
                </div>
              </div>
              <div style="margin-top:16px">
                <span style="font-size:1.5rem">${analysis.performanceEmoji || getPerfEmoji(score)}</span>
                <div style="font-weight:700;font-size:1.1rem;margin-top:4px;color:${scoreColor(score)}">${analysis.performanceLevel}</div>
              </div>
            </div>
            <div style="text-align:left">
              ${[
                ['📝 Total Questions', analysis.totalQuestions],
                ['✅ Correct Answers', analysis.correctAnswers],
                ['❌ Wrong Answers', analysis.wrongAnswers],
                ['🎯 Score', score + '%']
              ].map(([label, val]) => `
                <div style="display:flex;justify-content:space-between;gap:40px;padding:10px 0;border-bottom:1px solid var(--border)">
                  <span style="color:var(--text-secondary)">${label}</span>
                  <strong>${val}</strong>
                </div>
              `).join('')}
            </div>
          </div>
          <div style="margin-top:28px;padding:16px 24px;background:var(--bg-card2);border-radius:12px;border-left:3px solid ${scoreColor(score)}">
            <p style="color:var(--text-secondary);line-height:1.7">${analysis.gapSummary || 'Analysis complete. Review your topic scores below.'}</p>
          </div>
        </div>

        <!-- AI INSIGHTS -->
        ${analysis.insights && analysis.insights.length ? `
          <div style="margin-bottom:24px">
            <h3 style="margin-bottom:16px">🔍 AI Insights</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${analysis.insights.map(ins => `
                <div class="insight-card ${ins.type}">
                  <span class="insight-icon">${ins.icon}</span>
                  <div>
                    <div style="font-weight:600;margin-bottom:4px">${ins.title}</div>
                    <div style="font-size:.9rem;color:var(--text-secondary)">${ins.message}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TOPIC BREAKDOWN -->
        ${analysis.topicScores && analysis.topicScores.length ? `
          <div class="card" style="margin-bottom:24px">
            <h3 style="margin-bottom:20px">📊 Topic-by-Topic Analysis</h3>
            ${analysis.topicScores.map(t => `
              <div class="topic-row">
                <div>
                  <div class="topic-name">${t.name}</div>
                  <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">${t.correct}/${t.total} correct · <span style="color:${t.gapColor}">${t.gapSeverity}</span></div>
                </div>
                <div class="topic-bar-container">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${t.score}%;background:${t.gapColor}"></div>
                  </div>
                </div>
                <div style="text-align:right;min-width:60px">
                  <div style="font-size:1.2rem;font-weight:800;color:${t.gapColor}">${t.score}%</div>
                  ${t.mastered ? '<div style="font-size:.7rem;color:var(--success)">✅ Mastered</div>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- PRIORITY GAPS -->
        ${analysis.priorityTopics && analysis.priorityTopics.length ? `
          <div class="card" style="margin-bottom:24px;border-color:rgba(239,68,68,.3)">
            <h3 style="margin-bottom:4px">🚨 Priority Study Areas</h3>
            <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:20px">Topics requiring immediate attention based on AI analysis</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              ${analysis.priorityTopics.map((t, i) => `
                <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--bg-input);border-radius:12px;border-left:3px solid ${t.color}">
                  <div style="width:32px;height:32px;border-radius:50%;background:${t.color}22;color:${t.color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0">#${i+1}</div>
                  <div style="flex:1">
                    <div style="font-weight:600">${t.name}</div>
                    <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">${t.urgency} · ${t.score}% mastery</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-weight:700;color:${t.color}">${t.score}%</div>
                    ${t.studyHours > 0 ? `<div style="font-size:.75rem;color:var(--text-muted)">~${t.studyHours}h needed</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- STUDY PLAN -->
        ${analysis.studyPlan && analysis.studyPlan.weeks && analysis.studyPlan.weeks.length ? `
          <div class="card" style="margin-bottom:24px">
            <h3 style="margin-bottom:4px">📅 AI-Generated Study Plan</h3>
            <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:20px">Estimated total: ${analysis.studyPlan.totalEstimatedHours || 0} hours</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              ${analysis.studyPlan.weeks.map(w => `
                <div style="padding:20px;background:var(--bg-input);border-radius:12px;border:1px solid var(--border)">
                  <div style="display:flex;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
                    <div>
                      <span style="font-weight:700">Week ${w.week}</span>
                      <span style="color:var(--text-muted);margin-left:8px">· ${w.focus}</span>
                    </div>
                    <span class="badge badge-info">⏱ ${w.dailyGoal}</span>
                  </div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap">
                    ${(w.activities || []).map(a => `<span class="badge badge-warning">${a}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TOPIC RECOMMENDATIONS -->
        ${analysis.topicScores && analysis.topicScores.some(t => !t.mastered) ? `
          <div class="card" style="margin-bottom:32px">
            <h3 style="margin-bottom:20px">💡 AI Study Recommendations</h3>
            ${analysis.topicScores.filter(t => !t.mastered).slice(0, 4).map(t => `
              <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
                  <span style="font-weight:700">${t.name}</span>
                  <span class="badge" style="background:${t.gapColor}22;color:${t.gapColor};border-color:${t.gapColor}44">${t.gapSeverity}</span>
                  <span style="color:${t.gapColor};font-weight:700">${t.score}%</span>
                </div>
                <ul style="list-style:none;display:flex;flex-direction:column;gap:6px">
                  ${(t.recommendations || []).slice(0, 3).map(r => `
                    <li style="display:flex;gap:8px;font-size:.875rem;color:var(--text-secondary)">
                      <span style="color:var(--primary);flex-shrink:0">→</span>${r}
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" onclick="Router.go('student')">📚 Take Another Test</button>
          <button class="btn btn-secondary" onclick="window.location.href='/student.html'">📈 View All Results</button>
          <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Report</button>
        </div>
      </div>`;
  } catch(e) {
    document.getElementById('app').innerHTML = `<div class="loading-full"><p>⚠️ ${e.message}</p><button class="btn btn-primary" onclick="Router.go('student')">Go Back</button></div>`;
  }
}

function getPerfEmoji(score) {
  if (score >= 85) return '🏆';
  if (score >= 70) return '👍';
  if (score >= 50) return '📊';
  if (score >= 35) return '⚠️';
  return '🚨';
}
