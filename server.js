const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();


// Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const questionRoutes = require('./routes/questions');
const teacherRoutes = require('./routes/teacher');
const testRoutes = require('./routes/tests');

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/tests', testRoutes);

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'KnowGap API is running'
  });
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server Error' });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log('');
  console.log('  ✓ knowGap is running');
  console.log(`  Website:  ${url}`);
  console.log(`  Login:    ${url}/login.html`);
  console.log(`  API:      ${url}/api`);
  console.log('');
  console.log('  Demo teacher: teacher@gmail.com / 123456');
  console.log('  (Run "npm run seed" in KnowGap folder if database is empty)');
  console.log('');
});
