/* ── STUDENT GAP ANALYSIS REPORT (Phase 5) ── */

async function renderStudentReport(testId) {
  const app = document.getElementById('main-content');
  if (!app) return;
  app.innerHTML = `<div class="loading-full"><div class="spinner"></div><p>Loading report...</p></div>`;

  try {
    const res = await API.tests.result(testId);

    const score = res.scorePercentage || res.overall_score || 0;
    const fm = res.forensicMatrix || {};
    const totalQ = res.totalQuestions || 0;
    const correct = res.correctAnswers || 0;
    const wrong = res.wrongAnswers || 0;
    const hiddenGapCount = fm.hiddenGapCount || 0;
    const misconceptionCount = fm.misconceptionCount || 0;
    const recognizedGapCount = fm.recognizedGapCount || 0;
    const masteredCount = fm.masteredCount || 0;
    const guessedCount = hiddenGapCount + recognizedGapCount;
    const guessedPct = totalQ > 0 ? Math.round((guessedCount / totalQ) * 100) : 0;
    const lgs = computeLGSReport(fm, totalQ);
    const profileCat = deriveProfileReport(fm);
    const profileLabel = profileDisplayReport(profileCat);
    const retestRisk = res.retestRisk || 0;
    const retestDrop = Math.round(score - retestRisk);
    const topicScores = res.topicScores || [];
    const avgRT = res.avgResponseTime;
    const classMedian = res.classMedianResponse;
    const degPct = Math.round(score * 3.6);
    const scoreCol = scoreColorReport(score);

    const rtStatus = avgRT != null && classMedian != null
      ? avgRT > classMedian * 1.3 ? 'slower' : avgRT < classMedian * 0.7 ? 'faster' : 'normal'
      : 'unknown';
    const rtLabel = rtStatus === 'slower' ? '🟡 Slower than average — indicates uncertainty'
      : rtStatus === 'faster' ? '🟢 Faster than average — confident recall'
      : rtStatus === 'normal' ? '🔵 On par with class average' : '⚪ Data unavailable';
    const rtColor = rtStatus === 'slower' ? '#f59e0b' : rtStatus === 'faster' ? '#22c55e' : '#3b82f6';

    const profileIcon = profileCat === 'hiddenGap' ? '🔴'
      : profileCat === 'misconception' ? '🟠'
      : profileCat === 'recognizedGap' ? '🔵'
      : '🟢';

    app.innerHTML = `
      <div class="animate-up">

        <!-- ← Back to Dashboard -->
        <button class="btn btn-secondary btn-sm" style="margin-bottom:20px" onclick="window.location.href='student.html'">← Back to Dashboard</button>

        <h2 style="margin-bottom:20px">YOUR GAP ANALYSIS REPORT</h2>

        <!-- Hero Banner -->
        <div class="card" style="padding:24px 28px;margin-bottom:28px;background:linear-gradient(135deg,rgba(179,84,30,.06),rgba(179,84,30,.02));border:1px solid var(--accent-border)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
            <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
              <div style="text-align:center">
                <div style="font-size:2.5rem;font-weight:800;color:${scoreCol};line-height:1">${score}%</div>
                <div style="font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Score</div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:10px">
                <span style="padding:6px 14px;border-radius:8px;font-size:.82rem;font-weight:600;background:rgba(239,68,68,.12);color:#ef4444">${profileIcon} ${profileLabel}</span>
                <span style="padding:6px 14px;border-radius:8px;font-size:.82rem;font-weight:600;background:rgba(245,158,11,.12);color:#f59e0b">⚠️ LGS: ${lgs.toFixed(2)}</span>
                <span style="padding:6px 14px;border-radius:8px;font-size:.82rem;font-weight:600;background:rgba(59,130,246,.12);color:#3b82f6">📉 Predicted Retest: ${retestRisk}%</span>
              </div>
            </div>
            ${retestDrop > 0 ? `
            <span style="font-size:.85rem;font-weight:700;color:#ef4444;background:rgba(239,68,68,.1);padding:6px 14px;border-radius:8px">↓${retestDrop}% vs confident peers</span>` : ''}
          </div>
        </div>

        <!-- Donut Chart + Stats -->
        <div class="card" style="padding:28px;margin-bottom:28px">
          <div style="display:flex;align-items:center;gap:40px;flex-wrap:wrap;justify-content:center">
            <div style="width:180px;height:180px;border-radius:50%;background:conic-gradient(${scoreCol} ${degPct}deg, var(--bg-input) 0deg);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <div style="width:120px;height:120px;border-radius:50%;background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center">
                <div style="font-size:2rem;font-weight:800;color:${scoreCol};line-height:1">${score}%</div>
                <div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">Proficiency</div>
              </div>
            </div>
            <div style="display:flex;gap:28px;flex-wrap:wrap">
              <div style="text-align:center">
                <div style="font-size:1.8rem;font-weight:800;color:#22c55e">${correct}</div>
                <div style="font-size:.8rem;color:var(--text-muted)">Correct</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:1.8rem;font-weight:800;color:#ef4444">${wrong}</div>
                <div style="font-size:.8rem;color:var(--text-muted)">Wrong</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:1.8rem;font-weight:800;color:var(--text)">${totalQ}</div>
                <div style="font-size:.8rem;color:var(--text-muted)">Total</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confidence Breakdown -->
        <div class="card" style="padding:24px;margin-bottom:28px">
          <h3 style="margin-bottom:16px">CONFIDENCE BREAKDOWN</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="padding:14px 18px;border-radius:12px;border:1.5px solid rgba(34,197,94,.3);background:rgba(34,197,94,.06);display:flex;align-items:center;justify-content:space-between;gap:12px">
              <span style="font-size:.85rem;font-weight:600">✅ Correct + Sure <span style="font-size:.72rem;color:var(--text-muted);font-weight:400">(Truly Knows)</span></span>
              <span style="font-size:1.3rem;font-weight:800;color:#22c55e">${masteredCount}</span>
            </div>
            <div style="padding:14px 18px;border-radius:12px;border:1.5px solid rgba(239,68,68,.3);background:rgba(239,68,68,.06);display:flex;align-items:center;justify-content:space-between;gap:12px">
              <span style="font-size:.85rem;font-weight:600">⚠️ Correct + Guessed <span style="font-size:.72rem;color:var(--text-muted);font-weight:400">(Hidden Gap)</span></span>
              <span style="font-size:1.3rem;font-weight:800;color:#ef4444">${hiddenGapCount}</span>
            </div>
            <div style="padding:14px 18px;border-radius:12px;border:1.5px solid rgba(245,158,11,.3);background:rgba(245,158,11,.06);display:flex;align-items:center;justify-content:space-between;gap:12px">
              <span style="font-size:.85rem;font-weight:600">❌ Wrong + Sure <span style="font-size:.72rem;color:var(--text-muted);font-weight:400">(Misconception)</span></span>
              <span style="font-size:1.3rem;font-weight:800;color:#f59e0b">${misconceptionCount}</span>
            </div>
            <div style="padding:14px 18px;border-radius:12px;border:1.5px solid rgba(59,130,246,.3);background:rgba(59,130,246,.06);display:flex;align-items:center;justify-content:space-between;gap:12px">
              <span style="font-size:.85rem;font-weight:600">❌ Wrong + Guessed <span style="font-size:.72rem;color:var(--text-muted);font-weight:400">(Normal Gap)</span></span>
              <span style="font-size:1.3rem;font-weight:800;color:#3b82f6">${recognizedGapCount}</span>
            </div>
          </div>
        </div>

        <!-- Hidden Gap Alert -->
        ${hiddenGapCount > 0 ? `
        <div class="critical-alert" style="margin-bottom:28px">
          <h3>🚨 HIDDEN GAP ALERT</h3>
          <div style="color:var(--text-secondary);font-size:.95rem;margin-bottom:16px;line-height:1.7">
            <p>You scored <strong style="color:${scoreCol}">${score}%</strong> but tagged <strong>${guessedPct}%</strong> as "Guessed." Students like you typically score <strong style="color:#ef4444">${retestRisk}%</strong> on retests — a <strong>${Math.abs(retestDrop)}%</strong> drop.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="window.location.href='student.html'">📚 View Study Plan</button>
            <button class="btn btn-secondary btn-sm" onclick="openRetestModal('${res.subjectId || ''}','${encodeURIComponent(res.subjectName || '')}')">🔄 Schedule Retest</button>
          </div>
        </div>` : `
        <div class="card" style="padding:20px;margin-bottom:28px;background:rgba(34,197,94,.06);border-left:5px solid #22c55e">
          <h3 style="color:#22c55e">✅ No Hidden Gaps Detected</h3>
          <p style="color:var(--text-secondary);font-size:.9rem">Your confidence aligns well with your performance. Keep up the good work!</p>
        </div>`}

        <!-- Response Time Analysis -->
        <div class="card" style="padding:24px;margin-bottom:28px;border-left:4px solid ${rtColor}">
          <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:12px">⏱️ RESPONSE TIME ANALYSIS</div>
          <div style="display:flex;gap:40px;flex-wrap:wrap;align-items:center">
            <div style="display:flex;gap:32px;flex-wrap:wrap">
              <div>
                <div style="font-size:.8rem;color:var(--text-muted)">Your Average</div>
                <div style="font-size:1.6rem;font-weight:800">${avgRT != null ? avgRT + 's' : 'N/A'}</div>
              </div>
              <div>
                <div style="font-size:.8rem;color:var(--text-muted)">Class Median</div>
                <div style="font-size:1.6rem;font-weight:800">${classMedian != null ? classMedian + 's' : 'N/A'}</div>
              </div>
            </div>
            <span style="font-size:1rem;font-weight:700;color:${rtColor}">${rtLabel}</span>
          </div>
        </div>

        <!-- Topic-wise Gaps -->
        ${topicScores.length > 0 ? `
        <div class="card" style="padding:24px;margin-bottom:28px">
          <h3 style="margin-bottom:16px">TOPIC-WISE GAPS</h3>
          <div>
            ${topicScores.map(t => {
              const ts = t.score || 0;
              const tc = scoreColorReport(ts);
              const label = ts < 50 ? '🔴 Critical' : ts < 70 ? '🟠 Needs Work' : '🟢 Strong';
              return `
                <div style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="font-weight:600;font-size:.9rem">${t.name || 'General'}</span>
                    <span style="font-weight:700;color:${tc}">${ts}% ${label}</span>
                  </div>
                  <div style="height:10px;background:var(--bg-input);border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${Math.max(4, ts)}%;background:${tc};border-radius:99px;transition:width .6s ease"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Action Buttons -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px">
          <button class="btn btn-primary" onclick="window.print()">📥 Download PDF Report</button>
          <button class="btn btn-secondary" onclick="shareReport('${testId}')">📧 Share with Parent</button>
          <button class="btn btn-secondary" onclick="window.location.href='student-test-setup.html?subjectId=${res.subjectId || ''}&subjectName=${encodeURIComponent(res.subjectName || '')}'">🔄 Take Retest</button>
          <button class="btn btn-secondary" onclick="window.location.href='student.html'">← Back to Dashboard</button>
        </div>
      </div>
    `;
  } catch (e) {
    if (e.message && (e.message.toLowerCase().includes('token') || e.message.toLowerCase().includes('unauthorized'))) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    const errApp = document.getElementById('main-content');
    if (errApp) errApp.innerHTML = `
      <div class="empty-state" style="margin-top:40px">
        <div class="empty-icon">⚠️</div>
        <p>${e.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="window.location.href='student.html'">Go Back</button>
      </div>`;
  }
}

/* ── SCHEDULE RETEST MODAL ── */
function openRetestModal(subjectId, subjectName) {
  const existing = document.getElementById('retest-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'retest-modal';
  modal.className = 'modal-backdrop open';
  modal.onclick = function (e) { if (e.target === modal) closeRetestModal(); };

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <span style="font-weight:700">📅 Schedule Retest</span>
        <button class="modal-close" onclick="closeRetestModal()">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin-bottom:20px">Select a date and time to schedule your retest for <strong>${decodeURIComponent(subjectName)}</strong>.</p>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="retest-date" min="${minDate}" value="${minDate}">
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="retest-time" value="10:00">
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input type="text" class="form-input" id="retest-notes" placeholder="Any preparation notes...">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeRetestModal()">Cancel</button>
        <button class="btn btn-primary" onclick="confirmRetest('${subjectId}','${subjectName}')">✅ Schedule Retest</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function closeRetestModal() {
  const modal = document.getElementById('retest-modal');
  if (modal) modal.remove();
}

function confirmRetest(subjectId, subjectName) {
  const date = document.getElementById('retest-date')?.value;
  const time = document.getElementById('retest-time')?.value;
  const notes = document.getElementById('retest-notes')?.value || '';

  if (!date || !time) {
    toast('Please select both date and time', 'warning');
    return;
  }

  const formatted = new Date(`${date}T${time}`);
  const msg = `✅ Retest scheduled for ${formatted.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at ${formatted.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  closeRetestModal();
  toast(msg, 'success');

  // Navigate to retest after brief delay
  setTimeout(() => {
    window.location.href = `student-test-setup.html?subjectId=${subjectId}&subjectName=${encodeURIComponent(decodeURIComponent(subjectName || ''))}`;
  }, 1500);
}

/* ── SHARE ── */
function shareReport(sessionId) {
  const url = window.location.origin + '/student-report.html?testId=' + sessionId;
  if (navigator.share) {
    navigator.share({ title: 'knowGap Gap Analysis Report', url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      toast('Report link copied to clipboard!', 'success');
    }).catch(() => {
      prompt('Copy this link to share:', url);
    });
  }
}

/* ── HELPERS ── */
function computeLGSReport(fm, total) {
  const m = fm.masteredCount || 0;
  const h = fm.hiddenGapCount || 0;
  const r = fm.recognizedGapCount || 0;
  const mc = fm.misconceptionCount || 0;
  const t = total || Math.max(1, m + h + r + mc);
  return Math.min(1, Math.round(((h * 2 + mc * 1.5 + r * 0.5) / t) * 100) / 100);
}

function deriveProfileReport(fm) {
  const m = fm.masteredCount || 0;
  const h = fm.hiddenGapCount || 0;
  const r = fm.recognizedGapCount || 0;
  const mc = fm.misconceptionCount || 0;
  const max = Math.max(m, h, r, mc);
  if (max === 0) return 'normal';
  if (max === h) return 'hiddenGap';
  if (max === mc) return 'misconception';
  if (max === r) return 'recognizedGap';
  return 'normal';
}

function profileDisplayReport(cat) {
  const map = {
    hiddenGap: 'Hidden Gap',
    misconception: 'Misconception',
    recognizedGap: 'Recognized Gap',
    normal: 'Normal Mastery'
  };
  return map[cat] || 'Normal Mastery';
}

function scoreColorReport(s) {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}
