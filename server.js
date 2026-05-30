const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const { seedIfEmpty } = require('./database/seedContent');

dotenv.config();
validateEnv();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

function getCorsOptions() {
  const allowed = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowed?.length) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };
}

app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    const Subject = require('./models/Subject');
    const subjectCount = await Subject.countDocuments();
    res.json({
      ok: true,
      uptime: process.uptime(),
      subjectCount,
    });
  } catch {
    res.json({ ok: true, uptime: process.uptime() });
  }
});

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

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }

  if (isProduction) {
    console.error(err.message);
  } else {
    console.error(err.stack);
  }

  res.status(500).json({ error: 'Server Error' });
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function printServerUrls() {
  const local = `http://localhost:${PORT}`;
  const loopback = `http://127.0.0.1:${PORT}`;
  const mode = isProduction ? 'production' : 'development';

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  knowGap — ${mode}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Open in browser:  ${local}`);
  console.log(`  Alternate:        ${loopback}`);
  console.log(`  API health:       ${local}/api/health`);
  console.log(`  Login:            ${local}/login.html`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

const startServer = async () => {
  const localPreview = `http://localhost:${PORT}`;
  console.log('');
  console.log(`Starting knowGap → ${localPreview}`);
  console.log('(URL is active after MongoDB connects)\n');

  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    if (process.env.AUTO_SEED !== 'false') {
      const result = await seedIfEmpty();
      if (result.seeded) {
        console.log(
          `Seeded ${result.subjectCount} subjects, ${result.questionCount} questions.`
        );
      } else if (result.upgraded) {
        console.log(
          `Upgraded ${result.questionCount} placeholder questions to the curated bank.`
        );
      }
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Fix MONGO_URI in .env (see .env.example), then run npm start again.');
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    printServerUrls();
  });
};

startServer();
