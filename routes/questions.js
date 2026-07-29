const express = require('express');

const Question = require('../models/Question');

const {auth, teacherOnly} = require('../middleware/authMiddleware');

const router = express.Router();


// GET QUESTIONS FOR STUDENT
router.get('/subject/:subjectId', auth, async (req, res) => {

  try {

    const { topics, limit } = req.query;

    let filter = {
      subject_id: req.params.subjectId
    };

    // Topic filter
    if (topics) {

      const topicIds = topics.split(',');

      filter.topic_id = {
        $in: topicIds
      };
    }

    let questions = await Question.find(filter)
      .populate('topic_id', 'name')
      .lean();

    // Shuffle questions
    questions = questions.sort(() => 0.5 - Math.random());

    // Limit questions
    if (limit) {
      questions = questions.slice(0, parseInt(limit));
    }

    // Remove correct answer
    const sanitized = questions.map(q => {

      return {
        id: q._id.toString(),

        question_text: q.question_text,

        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,

        difficulty: q.difficulty,

        topic_id: q.topic_id?._id,

        topic_name: q.topic_id?.name
      };
    });

    res.json(sanitized);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

// ADD MULTIPLE QUESTIONS
router.post('/bulkquestions', auth, teacherOnly, async (req, res) => {

  try {

    const questions = req.body;

    // Check array
    if (!Array.isArray(questions) || questions.length === 0) {

      return res.status(400).json({
        error: 'Please provide an array of questions'
      });
    }

    // Validate questions
    for (const q of questions) {

      if (
        !q.question_text ||
        !q.option_a ||
        !q.option_b ||
        !q.option_c ||
        !q.option_d ||
        !q.correct_answer ||
        !q.topic_id ||
        !q.subject_id
      ) {

        return res.status(400).json({
          error: 'All fields required'
        });
      }

      // Validate correct answer
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {

        return res.status(400).json({
          error: 'correct_answer must be A, B, C or D'
        });
      }
    }

    // Prepare data
    const formattedQuestions = questions.map(q => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty || 'medium',
      topic_id: q.topic_id,
      subject_id: q.subject_id,
      created_by: req.user.id
    }));

    // Insert many
    const savedQuestions = await Question.insertMany(formattedQuestions);

    res.status(201).json({
      success: true,
      total: savedQuestions.length,
      questions: savedQuestions
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});


// ADD QUESTION
router.post('/', auth, teacherOnly, async (req, res) => {

  try {

    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      topic_id,
      subject_id
    } = req.body;

    if (
      !question_text ||
      !option_a ||
      !option_b ||
      !option_c ||
      !option_d ||
      !correct_answer ||
      !topic_id ||
      !subject_id
    ) {
      return res.status(400).json({
        error: 'All fields required'
      });
    }

    const question = await Question.create({
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty: difficulty,
      topic_id,
      subject_id,
      created_by: req.user.id
    });

    res.status(201).json({
      id: question._id,
      message: 'Question added successfully'
    });

  } catch (error) {

    res.status(500).json({
      error: 'Failed to add question'
    });
  }
});


// GET ALL QUESTIONS FOR TEACHER
router.get('/manage/:subjectId', auth, teacherOnly, async (req, res) => {

  try {

    const questions = await Question.find({
      subject_id: req.params.subjectId
    })
      .populate('topic_id', 'name')
      .sort({ createdAt: -1 });

    const formatted = questions.map(q => ({
      ...q.toObject(),
      id: q._id,
      topic_name: q.topic_id?.name
    }));

res.json(formatted);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// CHECK SINGLE ANSWER (used by quiz interface for navigator colors)
router.post('/check', auth, async (req, res) => {
  try {
    const { questionId, selectedAnswer } = req.body;
    if (!questionId || !selectedAnswer) {
      return res.status(400).json({ error: 'questionId and selectedAnswer required' });
    }
    const q = await Question.findById(questionId).lean();
    if (!q) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const isCorrect = q.correct_answer === selectedAnswer;
    res.json({ isCorrect });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE QUESTION
router.delete('/:id', auth, teacherOnly, async (req, res) => {

  try {

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// UPDATE QUESTION
router.put('/:id', auth, teacherOnly, async (req, res) => {

  try {

    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty
    } = req.body;

    await Question.findByIdAndUpdate(
      req.params.id,
      {
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        difficulty
      },
      {
        new: true
      }
    );

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;