const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');

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

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
  });
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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
};

startServer();
