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

// Get questions for a subject (for test, limit to topic selection)
router.get('/subject/:subjectId', auth, (req, res) => {
  const { topics, limit } = req.query;
  let query = `SELECT q.*, t.name as topic_name FROM questions q 
    JOIN topics t ON q.topic_id = t.id WHERE q.subject_id = ?`;
  let params = [req.params.subjectId];

  if (topics) {
    const topicIds = topics.split(',').map(Number).filter(Boolean);
    if (topicIds.length > 0) {
      query += ` AND q.topic_id IN (${topicIds.map(() => '?').join(',')})`;
      params = [...params, ...topicIds];
    }
  }

  query += ` ORDER BY RANDOM()`;
  if (limit) { query += ` LIMIT ?`; params.push(parseInt(limit)); }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Don't send correct_answer to student
    const sanitized = rows.map(({ correct_answer, ...q }) => q);
    res.json(sanitized);
  });
});

// Add question (teacher)
router.post('/', auth, teacherOnly, (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic_id, subject_id } = req.body;
  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer || !topic_id || !subject_id)
    return res.status(400).json({ error: 'All fields required' });
  if (!['A','B','C','D'].includes(correct_answer))
    return res.status(400).json({ error: 'correct_answer must be A, B, C, or D' });

  db.run(`INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic_id, subject_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty || 'medium', topic_id, subject_id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to add question' });
      res.json({ id: this.lastID, message: 'Question added successfully' });
    });
});

// Get all questions for a subject (for teacher management)
router.get('/manage/:subjectId', auth, teacherOnly, (req, res) => {
  db.all(`SELECT q.*, t.name as topic_name FROM questions q 
    JOIN topics t ON q.topic_id = t.id WHERE q.subject_id = ?
    ORDER BY t.name, q.id`, [req.params.subjectId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete question (teacher)
router.delete('/:id', auth, teacherOnly, (req, res) => {
  db.run(`DELETE FROM questions WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Update question
router.put('/:id', auth, teacherOnly, (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty } = req.body;
  db.run(`UPDATE questions SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?, difficulty=? WHERE id=?`,
    [question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

module.exports = router;
