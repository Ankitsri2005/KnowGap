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
router.get('/subject/:subjectId', auth, async (req, res) => {
  const { topics, limit } = req.query;
  let query = `SELECT q.*, t.name as topic_name FROM questions q 
    JOIN topics t ON q.topic_id = t.id WHERE q.subject_id = $1`;
  let params = [req.params.subjectId];
  let paramIdx = 1;

  if (topics) {
    const topicIds = topics.split(',').map(Number).filter(Boolean);
    if (topicIds.length > 0) {
      const placeholders = topicIds.map(() => `$${++paramIdx}`).join(',');
      query += ` AND q.topic_id IN (${placeholders})`;
      params = [...params, ...topicIds];
    }
  }

  query += ` ORDER BY RANDOM()`;
  if (limit) { query += ` LIMIT $${++paramIdx}`; params.push(parseInt(limit)); }

  try {
    const result = await db.query(query, params);
    // Don't send correct_answer to student
    const sanitized = result.rows.map(({ correct_answer, ...q }) => q);
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add question (teacher)
router.post('/', auth, teacherOnly, async (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic_id, subject_id } = req.body;
  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer || !topic_id || !subject_id)
    return res.status(400).json({ error: 'All fields required' });
  if (!['A','B','C','D'].includes(correct_answer))
    return res.status(400).json({ error: 'correct_answer must be A, B, C, or D' });

  try {
    const result = await db.query(
      `INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic_id, subject_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty || 'medium', topic_id, subject_id, req.user.id]
    );
    res.json({ id: result.rows[0].id, message: 'Question added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Get all questions for a subject (for teacher management)
router.get('/manage/:subjectId', auth, teacherOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT q.*, t.name as topic_name FROM questions q 
      JOIN topics t ON q.topic_id = t.id WHERE q.subject_id = $1
      ORDER BY t.name, q.id`, [req.params.subjectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete question (teacher)
router.delete('/:id', auth, teacherOnly, async (req, res) => {
  try {
    await db.query(`DELETE FROM questions WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update question
router.put('/:id', auth, teacherOnly, async (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty } = req.body;
  try {
    await db.query(
      `UPDATE questions SET question_text=$1, option_a=$2, option_b=$3, option_c=$4, option_d=$5, correct_answer=$6, difficulty=$7 WHERE id=$8`,
      [question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
