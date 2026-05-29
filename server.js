const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();


// Middleware
app.use(cors());

app.use(express.json());

// Serve Frontend
app.use(express.static('public'));

app.use(express.urlencoded({
  extended: true
}));


// Route Imports
const authRoutes =
  require('./routes/auth');

const subjectRoutes =
  require('./routes/subjects');

const questionRoutes =
  require('./routes/questions');

const teacherRoutes =
  require('./routes/teacher');

const testRoutes =
  require('./routes/tests');

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/subjects', subjectRoutes);

app.use('/api/questions', questionRoutes);

app.use('/api/teacher', teacherRoutes);

app.use('/api/tests', testRoutes);



// Default Route — index.html is served by express.static above


// 404 Route
app.use((req, res) => {

  res.status(404).json({
    error: 'Route not found'
  });
});


// Error Handler
app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({
    error: 'Server Error'
  });
});


// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );
});