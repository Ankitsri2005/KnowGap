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

// Serve frontend automatically falls back to express.static('public')

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n KnowGap AI Server running at http://localhost:${PORT}`);
  
});
