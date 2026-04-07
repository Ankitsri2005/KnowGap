require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

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

// Initialize DB tables first, then start server
db.initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n knowGap Server running at http://localhost:${PORT}`);
    
    // Seed after tables are ready
    try {
      const seed = require('./database/seed.js');
      if (typeof seed === 'function') {
        seed();
      }
    } catch (err) {
      console.error("Failed to run seed script:", err.message);
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});