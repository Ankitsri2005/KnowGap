const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const mongoose = require('mongoose');

const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const {
  ensureSeedTeacher,
  createSubjectsAndQuestions,
} = require('./seedContent');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function seedDatabase() {
  try {
    await Subject.deleteMany();
    await Topic.deleteMany();
    await Question.deleteMany();
    console.log('Old subjects, topics, and questions cleared');

    const teacher = await ensureSeedTeacher();
    console.log('Using teacher:', teacher.email);

    await createSubjectsAndQuestions(teacher._id);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
