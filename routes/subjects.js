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

// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`SELECT s.*, u.name as teacher_name,
      (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id) as topic_count,
      (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id) as question_count
      FROM subjects s LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.name`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create subject (teacher)
router.post('/', auth, teacherOnly, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Subject name required' });
  try {
    const result = await db.query(
      `INSERT INTO subjects (name, description, created_by) VALUES ($1, $2, $3) RETURNING id`,
      [name, description, req.user.id]
    );
    res.json({ id: result.rows[0].id, name, description });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Get topics for a subject
router.get('/:id/topics', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count
      FROM topics t WHERE t.subject_id = $1`, [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add topic (teacher)
router.post('/:id/topics', auth, teacherOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Topic name required' });
  try {
    const result = await db.query(
      `INSERT INTO topics (name, subject_id) VALUES ($1, $2) RETURNING id`,
      [name, req.params.id]
    );
    res.json({ id: result.rows[0].id, name, subject_id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Delete subject (teacher)
router.delete('/:id', auth, teacherOnly, async (req, res) => {
  try {
    await db.query(`DELETE FROM subjects WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
