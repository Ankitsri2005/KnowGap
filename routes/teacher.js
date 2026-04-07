const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
function teacherOnly(req, res, next) {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });
  next();
}

// Teacher dashboard overview
router.get('/overview', auth, teacherOnly, async (req, res) => {
  try {
    const [totalStudents, totalTests, totalQuestions, avgScore, recentTests, criticalStudents] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM users WHERE role='student'`),
      db.query(`SELECT COUNT(*) as count FROM test_sessions WHERE status='completed'`),
      db.query(`SELECT COUNT(*) as count FROM questions`),
      db.query(`SELECT ROUND(AVG(score_percentage)::numeric, 1) as avg FROM test_sessions WHERE status='completed'`),
      db.query(`SELECT ts.*, u.name as student_name, s.name as subject_name, ga.performance_level
        FROM test_sessions ts JOIN users u ON ts.student_id=u.id JOIN subjects s ON ts.subject_id=s.id
        LEFT JOIN gap_analysis ga ON ts.id=ga.session_id
        WHERE ts.status='completed' ORDER BY ts.completed_at DESC LIMIT 10`),
      db.query(`SELECT u.name, u.email, ga.overall_score, s.name as subject_name, ga.analyzed_at
        FROM gap_analysis ga JOIN users u ON ga.student_id=u.id JOIN subjects s ON ga.subject_id=s.id
        WHERE ga.overall_score < 40 ORDER BY ga.overall_score ASC LIMIT 10`)
    ]);

    res.json({
      totalStudents: parseInt(totalStudents.rows[0]?.count) || 0,
      totalTests: parseInt(totalTests.rows[0]?.count) || 0,
      totalQuestions: parseInt(totalQuestions.rows[0]?.count) || 0,
      avgScore: parseFloat(avgScore.rows[0]?.avg) || 0,
      recentTests: recentTests.rows || [],
      criticalStudents: criticalStudents.rows || []
    });
  } catch (err) {
    console.error('Overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// All students with their performance
router.get('/students', auth, teacherOnly, async (req, res) => {
  try {
    const result = await db.query(`SELECT u.id, u.name, u.email, u.created_at,
      COUNT(ts.id) as total_tests,
      ROUND(AVG(ts.score_percentage)::numeric, 1) as avg_score,
      MAX(ts.completed_at) as last_test
      FROM users u LEFT JOIN test_sessions ts ON u.id=ts.student_id AND ts.status='completed'
      WHERE u.role='student' GROUP BY u.id, u.name, u.email, u.created_at ORDER BY u.name`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student detail view for teacher
router.get('/students/:id', auth, teacherOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ts.*, s.name as subject_name, ga.overall_score, ga.performance_level, ga.priority_topics
      FROM test_sessions ts JOIN subjects s ON ts.subject_id=s.id
      LEFT JOIN gap_analysis ga ON ts.id=ga.session_id
      WHERE ts.student_id=$1 AND ts.status='completed' ORDER BY ts.completed_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subject performance stats
router.get('/stats/subjects', auth, teacherOnly, async (req, res) => {
  try {
    const result = await db.query(`SELECT s.name, 
      COUNT(ts.id) as attempts,
      ROUND(AVG(ts.score_percentage)::numeric, 1) as avg_score,
      COUNT(CASE WHEN ts.score_percentage >= 70 THEN 1 END) as passed,
      COUNT(CASE WHEN ts.score_percentage < 40 THEN 1 END) as critical
      FROM subjects s LEFT JOIN test_sessions ts ON s.id=ts.subject_id AND ts.status='completed'
      GROUP BY s.id, s.name ORDER BY avg_score ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Score distribution
router.get('/stats/distribution', auth, teacherOnly, async (req, res) => {
  try {
    const result = await db.query(`SELECT 
      CASE 
        WHEN score_percentage >= 85 THEN 'Excellent (85-100)'
        WHEN score_percentage >= 70 THEN 'Good (70-84)'
        WHEN score_percentage >= 50 THEN 'Average (50-69)'
        WHEN score_percentage >= 35 THEN 'Below Average (35-49)'
        ELSE 'Poor (0-34)'
      END as range,
      COUNT(*) as count
      FROM test_sessions WHERE status='completed' GROUP BY range ORDER BY MIN(score_percentage) DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
