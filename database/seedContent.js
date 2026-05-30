const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');

const SUBJECTS_DATA = [
  {
    name: 'Mathematics',
    description: 'Math Subject',
    topics: ['Algebra', 'Geometry'],
  },
  {
    name: 'Science',
    description: 'Science Subject',
    topics: ['Physics', 'Chemistry'],
  },
  {
    name: 'English',
    description: 'English Subject',
    topics: ['Grammar', 'Literature'],
  },
  {
    name: 'Computer Science',
    description: 'CS Subject',
    topics: ['Programming', 'DBMS'],
  },
];

async function ensureSeedTeacher() {
  let teacher = await User.findOne({ email: 'teacher@gmail.com' });

  if (!teacher) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    teacher = await User.create({
      name: 'Teacher',
      email: 'teacher@gmail.com',
      password: hashedPassword,
      role: 'teacher',
    });
  }

  return teacher;
}

async function createSubjectsAndQuestions(teacherId) {
  for (const sub of SUBJECTS_DATA) {
    const existing = await Subject.findOne({ name: sub.name });
    if (existing) {
      continue;
    }

    const subject = await Subject.create({
      name: sub.name,
      description: sub.description,
      created_by: teacherId,
    });

    const topicDocs = [];
    for (const topicName of sub.topics) {
      const topic = await Topic.create({
        name: topicName,
        subject_id: subject._id,
      });
      topicDocs.push(topic);
    }

    for (let i = 1; i <= 15; i++) {
      const topic = topicDocs[i % topicDocs.length];
      await Question.create({
        question_text: `${sub.name} Question ${i}`,
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A',
        difficulty: i <= 5 ? 'easy' : i <= 10 ? 'medium' : 'hard',
        topic_id: topic._id,
        subject_id: subject._id,
        created_by: teacherId,
      });
    }
  }
}

/**
 * Seeds demo subjects/questions only when the database has none.
 * Safe to run on every server start in production.
 */
async function seedIfEmpty() {
  const subjectCount = await Subject.countDocuments();
  if (subjectCount > 0) {
    return { seeded: false, subjectCount };
  }

  const teacher = await ensureSeedTeacher();
  await createSubjectsAndQuestions(teacher._id);

  const after = await Subject.countDocuments();
  return { seeded: true, subjectCount: after };
}

module.exports = {
  SUBJECTS_DATA,
  ensureSeedTeacher,
  createSubjectsAndQuestions,
  seedIfEmpty,
};
