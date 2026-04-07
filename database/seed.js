require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/teacher', require('./routes/teacher'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n KnowGap AI Server running at http://localhost:${PORT}`);

  // Auto-seed only if no users exist
  db.get("SELECT COUNT(*) as count FROM users", async (err, row) => {
    if (row && row.count === 0) {
      console.log('🌱 First run — seeding database...');
      const teacherPass = await bcrypt.hash('teacher123', 10);
      const studentPass = await bcrypt.hash('student123', 10);
      db.run(`INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)`, ['Dr. Sharma', 'teacher@knowgap.com', teacherPass, 'teacher']);
      db.run(`INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)`, ['Rahul Kumar', 'student@knowgap.com', studentPass, 'student']);
      db.run(`INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)`, ['Priya Singh', 'priya@knowgap.com', studentPass, 'student']);
      console.log('✅ Users seeded! Run node database/seed.js separately for full data.');
    } else {
      console.log('✅ Database already has data — skipping seed.');
    }
  });
});