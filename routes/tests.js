const express = require('express');

const TestSession = require('../models/TestSession');
const TestAnswer = require('../models/TestAnswer');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const GapAnalysis = require('../models/GapAnalysis');

const { analyzeGaps } = require('../ai/gapAnalyzer');

const {auth, teacherOnly} = require('../middleware/authMiddleware');

const router = express.Router();


// ======================================
// START TEST SESSION
// ======================================
router.post('/start', auth, async (req, res) => {

  try {

    if (req.user.role !== 'student') {

      return res.status(403).json({
        error: 'Students only'
      });
    }

    const { subject_id } = req.body;

    if (!subject_id) {

      return res.status(400).json({
        error: 'Subject ID required'
      });
    }

    // IMPORTANT
    const session =
      await TestSession.create({

        student_id: req.user.id,

        subject_id: subject_id,

        status: 'pending'
      });

    res.json({

      success: true,

      sessionId: session._id
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// SUBMIT TEST
// ======================================
router.post('/:sessionId/submit', auth, async (req, res) => {

  try {

    // ======================================
    // ONLY STUDENTS
    // ======================================
    if (req.user.role !== 'student') {

      return res.status(403).json({
        error: 'Students only'
      });
    }

    const { answers } = req.body;

    // ======================================
    // VALIDATE ANSWERS
    // ======================================
    if (
      !answers ||
      !Array.isArray(answers) ||
      answers.length === 0
    ) {

      return res.status(400).json({
        error: 'Answers required'
      });
    }

    // ======================================
    // FIND SESSION
    // ======================================
    const session = await TestSession.findOne({

      _id: req.params.sessionId,

      student_id: req.user.id

    }).populate('subject_id');

    if (!session) {

      return res.status(404).json({
        error: 'Session not found'
      });
    }

    if (session.status === 'completed') {

      return res.status(400).json({
        error: 'Test already submitted'
      });
    }

    // ======================================
    // GET QUESTIONS
    // ======================================
    const question_ids = answers.map(
      a => a.questionId
    );

    const questions = await Question.find({

      _id: { $in: question_ids }

    })
      .populate('topic_id', 'name')

      .lean();

    // ======================================
    // CREATE QUESTION MAP
    // ======================================
    const qMap = {};

    questions.forEach(q => {

      qMap[q._id.toString()] = q;
    });

    let correct = 0;

    const analyzeData = [];

    // ======================================
    // SAVE ANSWERS
    // ======================================
    for (const answer of answers) {

      const q =
        qMap[String(answer.questionId)];

      if (!q) continue;

      const selected =
        answer.selectedAnswer || null;

      const is_correct =
        selected !== null &&
        q.correct_answer === selected;

      if (is_correct) correct++;

      // Save Answer
      await TestAnswer.create({

        session_id: session._id,

        question_id: q._id,

        student_answer: selected || 'SKIPPED',

        is_correct: is_correct
      });

      // Analysis Data (camelCase for gapAnalyzer)
      analyzeData.push({

        questionId: q._id,

        questionText:
          q.question_text,

        topicId:
          q.topic_id?._id,

        topicName:
          q.topic_id?.name || 'General',

        difficulty:
          q.difficulty,

        studentAnswer: selected,

        correctAnswer:
          q.correct_answer,

        isCorrect: is_correct
      });
    }

    // ======================================
    // SCORE
    // ======================================
    const totalQ = answers.length;

    const scorePercent =
      totalQ > 0
        ? Math.round(
            (correct / totalQ) * 100
          )
        : 0;

    // ======================================
    // UPDATE SESSION
    // ======================================
    session.status = 'completed';

    session.completed_at = new Date();

    session.total_questions = totalQ;

    session.correct_answers = correct;

    session.score_percentage = scorePercent;

    await session.save();

    // ======================================
    // AI GAP ANALYSIS
    // ======================================
    const analysisResult = analyzeGaps(

      analyzeData,

      {
        id: session.subject_id._id,

        name: session.subject_id.name
      }
    );

    // ======================================
    // SAVE GAP ANALYSIS
    // ======================================
    await GapAnalysis.findOneAndUpdate(

      {
        session_id: session._id
      },

      {
        session_id: session._id,

        student_id: req.user.id,

        subject_id:
          session.subject_id._id,

        overall_score: scorePercent,

        performance_level:
          analysisResult.performanceLevel,

        gap_summary:
          analysisResult.gapSummary,

        topic_scores:
          analysisResult.topicScores,

        recommendations:
          analysisResult.studyPlan,

        priority_topics:
          analysisResult.priorityTopics
      },

      {
        upsert: true,
        new: true
      }
    );

    // ======================================
    // RESPONSE
    // ======================================
    res.json({

      success: true,

      sessionId: session._id,

      analysis: {
        ...analysisResult,
        subjectName: session.subject_id?.name
      }
    });

  } catch (error) {

    console.log('===================');

    console.log(error);

    console.log('===================');

    res.status(500).json({

      error:
        error.message ||
        'Failed to submit test'
    });
  }
});


// ======================================
// GET TEST RESULT
// ======================================
  router.get('/:sessionId/result', auth, async (req, res) => {

  try {

    // GAP ANALYSIS
    const result = await GapAnalysis.findOne({

      session_id: req.params.sessionId

    })
      .populate('student_id', 'name')

      .populate('subject_id', 'name')

      .populate('session_id');

    if (!result) {

      return res.status(404).json({
        error: 'Result not found'
      });
    }

    // TEST SESSION
    const session = await TestSession.findById(
      req.params.sessionId
    );

    if (!session) {

      return res.status(404).json({
        error: 'Session not found'
      });
    }

    
    console.log('SESSION DATA');
    console.log(session);

    // RESPONSE FOR FRONTEND
    res.json({

      overall_score:
        session.score_percentage || 0,

      performanceLevel:
        result.performance_level || 'Beginner',

      gapSummary:
        result.gap_summary || '',

      topicScores:
        result.topic_scores || [],

      recommendations:
        result.recommendations || [],

      priorityTopics:
        result.priority_topics || [],

      totalQuestions:
        session.total_questions || 0,

      correctAnswers:
        session.correct_answers || 0,

      wrongAnswers:
        (session.total_questions || 0) -
        (session.correct_answers || 0),

      scorePercentage:
        session.score_percentage || 0,

      subjectName:
        result.subject_id?.name || 'Subject'
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// TEST HISTORY
// ======================================
router.get('/history', auth, async (req, res) => {

  try {

    const student_id =
      req.user.role === 'student'
        ? req.user.id
        : req.query.student_id;

    const history = await TestSession.find({
      student_id: student_id,
      status: 'completed'
    })
      .populate('subject_id', 'name')
      .sort({ completed_at: -1 })
      .lean();

    const formatted = await Promise.all(

      history.map(async session => {

        const analysis =
          await GapAnalysis.findOne({
            session_id: session._id
          });

        return {
          ...session,
          subject_name:
            session.subject_id?.name,
          performance_level:
            analysis?.performance_level,
          overall_score:
            analysis?.overall_score
        };
      })
    );

    res.json(formatted);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


module.exports = router;