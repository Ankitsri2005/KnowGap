const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { analyzeGaps } = require('../ai/gapAnalyzer');
const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Start a test session
router.post('/start', auth, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
  const subject_id = parseInt(req.body.subject_id, 10);
  if (!subject_id || isNaN(subject_id)) return res.status(400).json({ error: 'Valid Subject ID required' });

  db.run(`INSERT INTO test_sessions (student_id, subject_id) VALUES (?, ?)`,
    [req.user.id, subject_id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to start session: ' + err.message });
      res.json({ sessionId: this.lastID });
    });
});

// Submit test answers and get AI analysis
router.post('/:sessionId/submit', auth, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
  const { answers } = req.body; // [{questionId, selectedAnswer}]
  const sessionId = parseInt(req.params.sessionId, 10);

  if (!answers || !Array.isArray(answers) || answers.length === 0)
    return res.status(400).json({ error: 'Answers required' });

  // Get session info
  db.get(`SELECT ts.*, s.name as subject_name FROM test_sessions ts 
    JOIN subjects s ON ts.subject_id = s.id
    WHERE ts.id = ? AND ts.student_id = ?`, [sessionId, req.user.id], (err, session) => {
    if (err || !session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Test already submitted' });

    const questionIds = answers.map(a => a.questionId);
    db.all(`SELECT q.*, t.name as topic_name FROM questions q 
      JOIN topics t ON q.topic_id = t.id
      WHERE q.id IN (${questionIds.map(() => '?').join(',')})`, questionIds, (err, questions) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch questions' });

      const qMap = {};
      questions.forEach(q => qMap[q.id] = q);

      let correct = 0;
      const answerRecords = [];
      const analyzeData = [];

      answers.forEach(({ questionId, selectedAnswer }) => {
        const q = qMap[questionId];
        if (!q) return;
        const isCorrect = q.correct_answer === selectedAnswer ? 1 : 0;
        if (isCorrect) correct++;
        answerRecords.push([sessionId, questionId, selectedAnswer, isCorrect]);
        analyzeData.push({
          questionId: q.id,
          questionText: q.question_text,
          topicId: q.topic_id,
          topicName: q.topic_name,
          difficulty: q.difficulty,
          studentAnswer: selectedAnswer,
          correctAnswer: q.correct_answer,
          isCorrect: isCorrect === 1
        });
      });

      const totalQ = answerRecords.length;
      const scorePercent = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;

      // Insert answers
      const stmt = db.prepare(`INSERT INTO test_answers (session_id, question_id, student_answer, is_correct) VALUES (?, ?, ?, ?)`);
      answerRecords.forEach(r => stmt.run(r));
      stmt.finalize();

      // Update session
      db.run(`UPDATE test_sessions SET status='completed', completed_at=CURRENT_TIMESTAMP, 
        total_questions=?, correct_answers=?, score_percentage=? WHERE id=?`,
        [totalQ, correct, scorePercent, sessionId]);

      // AI Analysis
      const subject = { id: session.subject_id, name: session.subject_name };
      const analysisResult = analyzeGaps(analyzeData, subject);

      // Save gap analysis
      db.run(`INSERT OR REPLACE INTO gap_analysis 
        (session_id, student_id, subject_id, overall_score, performance_level, gap_summary, topic_scores, recommendations, priority_topics)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId, req.user.id, session.subject_id,
          analysisResult.overallScore,
          analysisResult.performanceLevel,
          analysisResult.gapSummary,
          JSON.stringify(analysisResult.topicScores),
          JSON.stringify(analysisResult.studyPlan),
          JSON.stringify(analysisResult.priorityTopics)
        ]);

      res.json({
        success: true,
        sessionId: parseInt(sessionId),
        analysis: analysisResult
      });
    });
  });
});

// Get test result / analysis
router.get('/:sessionId/result', auth, (req, res) => {
  db.get(`SELECT ga.*, ts.total_questions, ts.correct_answers, ts.completed_at,
    s.name as subject_name, u.name as student_name
    FROM gap_analysis ga
    JOIN test_sessions ts ON ga.session_id = ts.id
    JOIN subjects s ON ga.subject_id = s.id
    JOIN users u ON ga.student_id = u.id
    WHERE ga.session_id = ?`, [req.params.sessionId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Result not found' });
    res.json({
      ...row,
      topic_scores: JSON.parse(row.topic_scores || '[]'),
      recommendations: JSON.parse(row.recommendations || '{}'),
      priority_topics: JSON.parse(row.priority_topics || '[]')
    });
  });
});

// Get student's test history
router.get('/history', auth, (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
  db.all(`SELECT ts.*, s.name as subject_name, ga.performance_level, ga.overall_score
    FROM test_sessions ts
    JOIN subjects s ON ts.subject_id = s.id
    LEFT JOIN gap_analysis ga ON ts.id = ga.session_id
    WHERE ts.student_id = ? AND ts.status = 'completed'
    ORDER BY ts.completed_at DESC`, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
