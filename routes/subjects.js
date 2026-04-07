const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
function teacherOnly(req, res, next) {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });
  next();
}

// Get all subjects
router.get('/', auth, (req, res) => {
  db.all(`SELECT s.*, u.name as teacher_name,
    (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id) as topic_count,
    (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id) as question_count
    FROM subjects s LEFT JOIN users u ON s.created_by = u.id
    ORDER BY s.name`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create subject (teacher)
router.post('/', auth, teacherOnly, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Subject name required' });
  db.run(`INSERT INTO subjects (name, description, created_by) VALUES (?, ?, ?)`,
    [name, description, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create subject' });
      res.json({ id: this.lastID, name, description });
    });
});

// Get topics for a subject
router.get('/:id/topics', auth, (req, res) => {
  db.all(`SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count
    FROM topics t WHERE t.subject_id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add topic (teacher)
router.post('/:id/topics', auth, teacherOnly, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Topic name required' });
  db.run(`INSERT INTO topics (name, subject_id) VALUES (?, ?)`, [name, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create topic' });
      res.json({ id: this.lastID, name, subject_id: req.params.id });
    });
});

// Delete subject (teacher)
router.delete('/:id', auth, teacherOnly, (req, res) => {
  db.run(`DELETE FROM subjects WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;
