const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbDir = path.dirname(process.env.DB_PATH || './database/knowgap.db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(process.env.DB_PATH || './database/knowgap.db', (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('✅ Connected to SQLite database');
});

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A','B','C','D')),
    difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
    topic_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(topic_id) REFERENCES topics(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS test_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    score_percentage REAL DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed')),
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS test_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    student_answer TEXT,
    is_correct INTEGER DEFAULT 0,
    FOREIGN KEY(session_id) REFERENCES test_sessions(id),
    FOREIGN KEY(question_id) REFERENCES questions(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS gap_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL UNIQUE,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    overall_score REAL,
    performance_level TEXT,
    gap_summary TEXT,
    topic_scores TEXT,
    recommendations TEXT,
    priority_topics TEXT,
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES test_sessions(id),
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  )`);
});

module.exports = db;
