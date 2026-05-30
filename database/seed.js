const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/knowgap';

async function connectForSeed() {
  const uris = [process.env.MONGO_URI, LOCAL_URI].filter(Boolean);
  for (const uri of uris) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB Connected');
      return;
    } catch (err) {
      console.log(`Connection failed (${uri.includes('127.0.0.1') ? 'local' : 'cloud'}):`, err.message);
    }
  }
  throw new Error('Could not connect to MongoDB');
}


// ======================================
// SEED FUNCTION
// ======================================
const seedDatabase = async () => {

  try {

    // Clear old data
    await Subject.deleteMany();
    await Topic.deleteMany();
    await Question.deleteMany();

    console.log('Old data cleared');


    // ======================================
    // CREATE TEACHER
    // ======================================
    let teacher = await User.findOne({
      email: 'teacher@gmail.com'
    });

    if (!teacher) {

      const hashedPassword =
        await bcrypt.hash('123456', 10);

      teacher = await User.create({
        name: 'Teacher',
        email: 'teacher@gmail.com',
        password: hashedPassword,
        role: 'teacher'
      });

      console.log('Teacher created');
    }


    // ======================================
    // SUBJECTS
    // ======================================
    const subjectsData = [

      {
        name: 'Mathematics',
        description: 'Math Subject',
        topics: ['Algebra', 'Geometry']
      },

      {
        name: 'Science',
        description: 'Science Subject',
        topics: ['Physics', 'Chemistry']
      },

      {
        name: 'English',
        description: 'English Subject',
        topics: ['Grammar', 'Literature']
      },

      {
        name: 'Computer Science',
        description: 'CS Subject',
        topics: ['Programming', 'DBMS']
      }
    ];


    // ======================================
    // CREATE SUBJECTS & TOPICS
    // ======================================
    for (const sub of subjectsData) {

      const subject = await Subject.create({
        name: sub.name,
        description: sub.description,
        created_by: teacher._id
      });

      console.log(`${sub.name} created`);

      const topicDocs = [];

      for (const topicName of sub.topics) {

        const topic = await Topic.create({
          name: topicName,
          subject_id: subject._id
        });

        topicDocs.push(topic);
      }


      // ======================================
      // CREATE 15 QUESTIONS
      // ======================================
      for (let i = 1; i <= 15; i++) {

        const topic =
          topicDocs[i % topicDocs.length];

        await Question.create({

          question_text:
            `${sub.name} Question ${i}`,

          option_a: 'Option A',

          option_b: 'Option B',

          option_c: 'Option C',

          option_d: 'Option D',

          correct_answer: 'A',

          difficulty:
            i <= 5
              ? 'easy'
              : i <= 10
              ? 'medium'
              : 'hard',

          topic_id: topic._id,

          subject_id: subject._id,

          created_by: teacher._id
        });
      }

      console.log(
        `15 Questions added for ${sub.name}`
      );
    }


    console.log('Database Seeded Successfully');

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit(1);
  }
};


// RUN
connectForSeed()
  .then(() => seedDatabase())
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });