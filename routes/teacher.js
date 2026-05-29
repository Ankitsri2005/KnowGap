const express = require('express');

const User = require('../models/User');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const TestSession = require('../models/TestSession');
const GapAnalysis = require('../models/GapAnalysis');
const Classroom = require('../models/Classroom');

const {auth, teacherOnly} = require('../middleware/authMiddleware');

const router = express.Router();


// ======================================
// DASHBOARD OVERVIEW
// ======================================
router.get('/overview', auth, teacherOnly, async (req, res) => {

  try {

    // Get teacher's classroom student IDs
    const myClassrooms = await Classroom.find({
      teacher_id: req.user.id
    }).lean();

    const myStudentIds = [...new Set(
      myClassrooms.flatMap(c => c.students.map(s => s.toString()))
    )];

    const totalStudents = myStudentIds.length;

    const totalTests = await TestSession.countDocuments({
      status: 'completed',
      student_id: { $in: myStudentIds }
    });

    const totalQuestions = await Question.countDocuments();

    // Average Score
    const avgResult = await TestSession.aggregate([
      {
        $match: {
          status: 'completed',
          student_id: { $in: myStudentIds.map(id => new (require('mongoose').Types.ObjectId)(id)) }
        }
      },
      {
        $group: {
          _id: null,
          avgScore: {
            $avg: '$score_percentage'
          }
        }
      }
    ]);

    const avgScore = avgResult[0]?.avgScore || 0;

    // Recent Tests (only from my students)
    const recentTests = await TestSession.find({
      status: 'completed',
      student_id: { $in: myStudentIds }
    })
      .populate('student_id', 'name')
      .populate('subject_id', 'name')
      .sort({ completed_at: -1 })
      .limit(10)
      .lean();

    // Critical Students (only from my students)
    const criticalStudents = await GapAnalysis.find({
      overall_score: { $lt: 40 },
      student_id: { $in: myStudentIds }
    })
      .populate('student_id', 'name email')
      .populate('subject_id', 'name')
      .sort({ overall_score: 1 })
      .limit(10)
      .lean();

    res.json({
      totalStudents,
      totalTests,
      totalQuestions,
      avgScore: Number(avgScore.toFixed(1)),
      recentTests,
      criticalStudents
    });

  } catch (error) {

    console.error('Overview Error:', error.message);

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// ALL STUDENTS PERFORMANCE
// ======================================
router.get('/students', auth, teacherOnly, async (req, res) => {

  try {

    // Get teacher's classroom student IDs
    const myClassrooms = await Classroom.find({
      teacher_id: req.user.id
    }).lean();

    const myStudentIds = [...new Set(
      myClassrooms.flatMap(c => c.students.map(s => s.toString()))
    )];

    const students = await User.find({
      _id: { $in: myStudentIds },
      role: 'student'
    }).lean();

    const studentPerformance = await Promise.all(

      students.map(async (student) => {

        const tests = await TestSession.find({
          student_id: student._id,
          status: 'completed'
        });

        const total_tests = tests.length;

        const avg_score =
          total_tests > 0
            ? tests.reduce(
                (sum, t) => sum + t.score_percentage,
                0
              ) / total_tests
            : 0;

        const last_test =
          total_tests > 0
            ? tests.sort(
                (a, b) =>
                  new Date(b.completed_at) -
                  new Date(a.completed_at)
              )[0].completed_at
            : null;

        return {
          id: student._id,
          name: student.name,
          email: student.email,
          created_at: student.createdAt,
          total_tests,
          avg_score: Number(avg_score.toFixed(1)),
          last_test
        };
      })
    );

    res.json(studentPerformance);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// SINGLE STUDENT DETAILS
// ======================================
router.get('/students/:id', auth, teacherOnly, async (req, res) => {

  try {

    const tests = await TestSession.find({
      student_id: req.params.id,
      status: 'completed'
    })
      .populate('subject_id', 'name')
      .lean();

    const detailedResults = await Promise.all(

      tests.map(async (test) => {

        const gap = await GapAnalysis.findOne({
          session_id: test._id
        });

        return {
          ...test,
          subject_name: test.subject_id?.name,
          overall_score: gap?.overall_score || 0,
          performance_level:
            gap?.performance_level || 'N/A',
          priority_topics:
            gap?.priority_topics || []
        };
      })
    );

    res.json(detailedResults);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// SUBJECT PERFORMANCE STATS
// ======================================
router.get('/stats/subjects', auth, teacherOnly, async (req, res) => {

  try {

    const subjects = await Subject.find().lean();

    const stats = await Promise.all(

      subjects.map(async (subject) => {

        const tests = await TestSession.find({
          subject_id: subject._id,
          status: 'completed'
        });

        const attempts = tests.length;

        const avg_score =
          attempts > 0
            ? tests.reduce(
                (sum, t) => sum + t.score_percentage,
                0
              ) / attempts
            : 0;

        const passed = tests.filter(
          t => t.score_percentage >= 70
        ).length;

        const critical = tests.filter(
          t => t.score_percentage < 40
        ).length;

        return {
          name: subject.name,
          attempts,
          avg_score: Number(avg_score.toFixed(1)),
          passed,
          critical
        };
      })
    );

    res.json(stats);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// SCORE DISTRIBUTION
// ======================================
router.get('/stats/distribution', auth, teacherOnly, async (req, res) => {

  try {

    const tests = await TestSession.find({
      status: 'completed'
    });

    const distribution = {
      'Excellent (85-100)': 0,
      'Good (70-84)': 0,
      'Average (50-69)': 0,
      'Below Average (35-49)': 0,
      'Poor (0-34)': 0
    };

    tests.forEach(test => {

      const score = test.score_percentage;

      if (score >= 85) {
        distribution['Excellent (85-100)']++;
      }
      else if (score >= 70) {
        distribution['Good (70-84)']++;
      }
      else if (score >= 50) {
        distribution['Average (50-69)']++;
      }
      else if (score >= 35) {
        distribution['Below Average (35-49)']++;
      }
      else {
        distribution['Poor (0-34)']++;
      }
    });

    const formatted = Object.entries(distribution)
      .map(([range, count]) => ({
        range,
        count
      }));

    res.json(formatted);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


module.exports = router;