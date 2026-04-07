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
router.post('/start', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
  const subject_id = parseInt(req.body.subject_id, 10);
  if (!subject_id || isNaN(subject_id)) return res.status(400).json({ error: 'Valid Subject ID required' });

  try {
    const result = await db.query(
      `INSERT INTO test_sessions (student_id, subject_id) VALUES ($1, $2) RETURNING id`,
      [req.user.id, subject_id]
    );
    res.json({ sessionId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session: ' + err.message });
  }
});

// Submit test answers and get AI analysis
router.post('/:sessionId/submit', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
  const { answers } = req.body; // [{questionId, selectedAnswer}]
  const sessionId = parseInt(req.params.sessionId, 10);

  if (!answers || !Array.isArray(answers) || answers.length === 0)
    return res.status(400).json({ error: 'Answers required' });

  try {
    // Get session info
    const sessionResult = await db.query(
      `SELECT ts.*, s.name as subject_name FROM test_sessions ts 
      JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.id = $1 AND ts.student_id = $2`, [sessionId, req.user.id]
    );
    const session = sessionResult.rows[0];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Test already submitted' });

    const questionIds = answers.map(a => a.questionId);
    const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',');
    const questionsResult = await db.query(
      `SELECT q.*, t.name as topic_name FROM questions q 
      JOIN topics t ON q.topic_id = t.id
      WHERE q.id IN (${placeholders})`, questionIds
    );
    const questions = questionsResult.rows;

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
    for (const r of answerRecords) {
      await db.query(
        `INSERT INTO test_answers (session_id, question_id, student_answer, is_correct) VALUES ($1, $2, $3, $4)`,
        r
      );
    }

    // Update session
    await db.query(
      `UPDATE test_sessions SET status='completed', completed_at=CURRENT_TIMESTAMP, 
      total_questions=$1, correct_answers=$2, score_percentage=$3 WHERE id=$4`,
      [totalQ, correct, scorePercent, sessionId]
    );

    // AI Analysis
    const subject = { id: session.subject_id, name: session.subject_name };
    const analysisResult = analyzeGaps(analyzeData, subject);

    // Save gap analysis
    await db.query(
      `INSERT INTO gap_analysis 
      (session_id, student_id, subject_id, overall_score, performance_level, gap_summary, topic_scores, recommendations, priority_topics)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (session_id) DO UPDATE SET
        overall_score=$4, performance_level=$5, gap_summary=$6, topic_scores=$7, recommendations=$8, priority_topics=$9`,
      [
        sessionId, req.user.id, session.subject_id,
        analysisResult.overallScore,
        analysisResult.performanceLevel,
        analysisResult.gapSummary,
        JSON.stringify(analysisResult.topicScores),
        JSON.stringify(analysisResult.studyPlan),
        JSON.stringify(analysisResult.priorityTopics)
      ]
    );

    res.json({
      success: true,
      sessionId: parseInt(sessionId),
      analysis: analysisResult
    });
  } catch (err) {
    console.error('Submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

// Get test result / analysis
router.get('/:sessionId/result', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ga.*, ts.total_questions, ts.correct_answers, ts.completed_at,
      s.name as subject_name, u.name as student_name
      FROM gap_analysis ga
      JOIN test_sessions ts ON ga.session_id = ts.id
      JOIN subjects s ON ga.subject_id = s.id
      JOIN users u ON ga.student_id = u.id
      WHERE ga.session_id = $1`, [req.params.sessionId]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Result not found' });
    res.json({
      ...row,
      topic_scores: JSON.parse(row.topic_scores || '[]'),
      recommendations: JSON.parse(row.recommendations || '{}'),
      priority_topics: JSON.parse(row.priority_topics || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student's test history
router.get('/history', auth, async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
  try {
    const result = await db.query(
      `SELECT ts.*, s.name as subject_name, ga.performance_level, ga.overall_score
      FROM test_sessions ts
      JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN gap_analysis ga ON ts.id = ga.session_id
      WHERE ts.student_id = $1 AND ts.status = 'completed'
      ORDER BY ts.completed_at DESC`, [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
