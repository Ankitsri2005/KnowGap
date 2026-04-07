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
router.get('/overview', auth, teacherOnly, (req, res) => {
  const queries = {
    totalStudents: `SELECT COUNT(*) as count FROM users WHERE role='student'`,
    totalTests: `SELECT COUNT(*) as count FROM test_sessions WHERE status='completed'`,
    totalQuestions: `SELECT COUNT(*) as count FROM questions`,
    avgScore: `SELECT ROUND(AVG(score_percentage),1) as avg FROM test_sessions WHERE status='completed'`,
    recentTests: `SELECT ts.*, u.name as student_name, s.name as subject_name, ga.performance_level
      FROM test_sessions ts JOIN users u ON ts.student_id=u.id JOIN subjects s ON ts.subject_id=s.id
      LEFT JOIN gap_analysis ga ON ts.id=ga.session_id
      WHERE ts.status='completed' ORDER BY ts.completed_at DESC LIMIT 10`,
    criticalStudents: `SELECT u.name, u.email, ga.overall_score, s.name as subject_name, ga.analyzed_at
      FROM gap_analysis ga JOIN users u ON ga.student_id=u.id JOIN subjects s ON ga.subject_id=s.id
      WHERE ga.overall_score < 40 ORDER BY ga.overall_score ASC LIMIT 10`
  };

  Promise.all([
    new Promise(r => db.get(queries.totalStudents, [], (e, row) => r(row?.count || 0))),
    new Promise(r => db.get(queries.totalTests, [], (e, row) => r(row?.count || 0))),
    new Promise(r => db.get(queries.totalQuestions, [], (e, row) => r(row?.count || 0))),
    new Promise(r => db.get(queries.avgScore, [], (e, row) => r(row?.avg || 0))),
    new Promise(r => db.all(queries.recentTests, [], (e, rows) => r(rows || []))),
    new Promise(r => db.all(queries.criticalStudents, [], (e, rows) => r(rows || [])))
  ]).then(([totalStudents, totalTests, totalQuestions, avgScore, recentTests, criticalStudents]) => {
    res.json({ totalStudents, totalTests, totalQuestions, avgScore, recentTests, criticalStudents });
  });
});

// All students with their performance
router.get('/students', auth, teacherOnly, (req, res) => {
  db.all(`SELECT u.id, u.name, u.email, u.created_at,
    COUNT(ts.id) as total_tests,
    ROUND(AVG(ts.score_percentage), 1) as avg_score,
    MAX(ts.completed_at) as last_test
    FROM users u LEFT JOIN test_sessions ts ON u.id=ts.student_id AND ts.status='completed'
    WHERE u.role='student' GROUP BY u.id ORDER BY u.name`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Student detail view for teacher
router.get('/students/:id', auth, teacherOnly, (req, res) => {
  db.all(`SELECT ts.*, s.name as subject_name, ga.overall_score, ga.performance_level, ga.priority_topics
    FROM test_sessions ts JOIN subjects s ON ts.subject_id=s.id
    LEFT JOIN gap_analysis ga ON ts.id=ga.session_id
    WHERE ts.student_id=? AND ts.status='completed' ORDER BY ts.completed_at DESC`,
    [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Subject performance stats
router.get('/stats/subjects', auth, teacherOnly, (req, res) => {
  db.all(`SELECT s.name, 
    COUNT(ts.id) as attempts,
    ROUND(AVG(ts.score_percentage), 1) as avg_score,
    COUNT(CASE WHEN ts.score_percentage >= 70 THEN 1 END) as passed,
    COUNT(CASE WHEN ts.score_percentage < 40 THEN 1 END) as critical
    FROM subjects s LEFT JOIN test_sessions ts ON s.id=ts.subject_id AND ts.status='completed'
    GROUP BY s.id ORDER BY avg_score ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Score distribution
router.get('/stats/distribution', auth, teacherOnly, (req, res) => {
  db.all(`SELECT 
    CASE 
      WHEN score_percentage >= 85 THEN 'Excellent (85-100)'
      WHEN score_percentage >= 70 THEN 'Good (70-84)'
      WHEN score_percentage >= 50 THEN 'Average (50-69)'
      WHEN score_percentage >= 35 THEN 'Below Average (35-49)'
      ELSE 'Poor (0-34)'
    END as range,
    COUNT(*) as count
    FROM test_sessions WHERE status='completed' GROUP BY range ORDER BY min(score_percentage) DESC`,
    [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
