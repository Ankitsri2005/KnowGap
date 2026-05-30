const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const {
  QUESTION_BANK,
  SUBJECTS_META,
} = require('./questionBank');

const PLACEHOLDER_FILTER = {
  option_a: 'Option A',
  option_b: 'Option B',
  option_c: 'Option C',
  option_d: 'Option D',
};

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

async function insertQuestionsForTopic(topic, subjectId, teacherId, items) {
  if (!items?.length) return 0;

  const docs = items.map((item) => ({
    ...item,
    topic_id: topic._id,
    subject_id: subjectId,
    created_by: teacherId,
  }));

  await Question.insertMany(docs);
  return docs.length;
}

async function seedSubjectFromBank(subjectMeta, teacherId) {
  const bank = QUESTION_BANK[subjectMeta.name];
  if (!bank) {
    throw new Error(`No question bank for subject: ${subjectMeta.name}`);
  }

  let subject = await Subject.findOne({ name: subjectMeta.name });

  if (!subject) {
    subject = await Subject.create({
      name: subjectMeta.name,
      description: subjectMeta.description,
      created_by: teacherId,
    });
  }

  let totalQuestions = 0;

  for (const topicName of Object.keys(bank)) {
    let topic = await Topic.findOne({
      name: topicName,
      subject_id: subject._id,
    });

    if (!topic) {
      topic = await Topic.create({
        name: topicName,
        subject_id: subject._id,
      });
    }

    const existing = await Question.countDocuments({ topic_id: topic._id });
    if (existing >= bank[topicName].length) {
      totalQuestions += existing;
      continue;
    }

    await Question.deleteMany({ topic_id: topic._id });
    totalQuestions += await insertQuestionsForTopic(
      topic,
      subject._id,
      teacherId,
      bank[topicName]
    );
  }

  return { subject, totalQuestions };
}

async function createSubjectsAndQuestions(teacherId) {
  let subjects = 0;
  let questions = 0;

  for (const meta of SUBJECTS_META) {
    const result = await seedSubjectFromBank(meta, teacherId);
    subjects += 1;
    questions += result.totalQuestions;
  }

  return { subjects, questions };
}

async function hasPlaceholderQuestions() {
  const count = await Question.countDocuments(PLACEHOLDER_FILTER);
  return count > 0;
}

/**
 * Replace old placeholder seed (Option A/B/C/D) with the real question bank.
 */
async function upgradeQuestionsFromBank() {
  const needsUpgrade = await hasPlaceholderQuestions();
  const total = await Question.countDocuments();

  if (!needsUpgrade && total > 0) {
    return { upgraded: false, questionCount: total };
  }

  if (total === 0 && !(await Subject.countDocuments())) {
    return { upgraded: false, questionCount: 0 };
  }

  const teacher = await ensureSeedTeacher();

  if (total > 0) {
    await Question.deleteMany({});
  }

  const { questions } = await createSubjectsAndQuestions(teacher._id);

  return { upgraded: true, questionCount: questions };
}

/**
 * Seeds subjects and questions only when the database has no subjects.
 */
async function seedIfEmpty() {
  const subjectCount = await Subject.countDocuments();
  if (subjectCount > 0) {
    const upgrade = await upgradeQuestionsFromBank();
    if (upgrade.upgraded) {
      return {
        seeded: false,
        upgraded: true,
        subjectCount,
        questionCount: upgrade.questionCount,
      };
    }
    return { seeded: false, subjectCount };
  }

  const teacher = await ensureSeedTeacher();
  const { subjects, questions } = await createSubjectsAndQuestions(teacher._id);

  return {
    seeded: true,
    subjectCount: subjects,
    questionCount: questions,
  };
}

module.exports = {
  SUBJECTS_META,
  QUESTION_BANK,
  ensureSeedTeacher,
  createSubjectsAndQuestions,
  seedIfEmpty,
  upgradeQuestionsFromBank,
  hasPlaceholderQuestions,
};
