require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

app.listen(PORT, () => {
  console.log(`\n knowGap Server running at http://localhost:${PORT}`);
  
  // This triggers the seeding logic once the server starts
  try {
    require('./database/seed.js');
  } catch (err) {
    console.error("Failed to run seed script:", err.message);
  }
});