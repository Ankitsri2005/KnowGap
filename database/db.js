const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A','B','C','D')),
        difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
        topic_id INTEGER NOT NULL REFERENCES topics(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_sessions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        score_percentage REAL DEFAULT 0,
        status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed'))
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_answers (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES test_sessions(id),
        question_id INTEGER NOT NULL REFERENCES questions(id),
        student_answer TEXT,
        is_correct INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gap_analysis (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL UNIQUE REFERENCES test_sessions(id),
        student_id INTEGER NOT NULL REFERENCES users(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        overall_score REAL,
        performance_level TEXT,
        gap_summary TEXT,
        topic_scores TEXT,
        recommendations TEXT,
        priority_topics TEXT,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ PostgreSQL tables initialized');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  } finally {
    client.release();
  }
}

// ─── Compatibility helpers (match old SQLite-style callback API) ───

const db = {
  // For SELECT that returns multiple rows
  all(query, params, callback) {
    pool.query(query, params)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err, null));
  },

  // For SELECT that returns one row
  get(query, params, callback) {
    pool.query(query, params)
      .then(result => callback(null, result.rows[0] || null))
      .catch(err => callback(err, null));
  },

  // For INSERT/UPDATE/DELETE
  run(query, params, callback) {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2 etc.
    let idx = 0;
    const pgQuery = query.replace(/\?/g, () => `$${++idx}`);

    pool.query(pgQuery, params)
      .then(result => {
        if (callback) {
          // Simulate SQLite's this.lastID using RETURNING id
          callback.call({ lastID: result.rows?.[0]?.id, changes: result.rowCount }, null);
        }
      })
      .catch(err => {
        if (callback) callback.call({}, err);
      });
  },

  // For raw queries with $1 style params (new code can use this directly)
  query(text, params) {
    return pool.query(text, params);
  },

  // Expose pool and init
  pool,
  initDB
};

module.exports = db;
