const express = require('express');

const User = require('../models/User');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const TestSession = require('../models/TestSession');
const GapAnalysis = require('../models/GapAnalysis');

const {auth, teacherOnly} = require('../middleware/authMiddleware');

const router = express.Router();


// ======================================
// DASHBOARD OVERVIEW
// ======================================
router.get('/overview', auth, teacherOnly, async (req, res) => {

  try {

    const totalStudents = await User.countDocuments({
      role: 'student'
    });

    const totalTests = await TestSession.countDocuments({
      status: 'completed'
    });

    const totalQuestions = await Question.countDocuments();

    // Average Score
    const avgResult = await TestSession.aggregate([
      {
        $match: {
          status: 'completed'
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

    // Recent Tests
    const recentTests = await TestSession.find({
      status: 'completed'
    })
      .populate('student_id', 'name')
      .populate('subject_id', 'name')
      .sort({ completed_at: -1 })
      .limit(10)
      .lean();

    // Critical / High-Risk Students (low score, high retest risk, or hidden gaps)
    const criticalStudents = await GapAnalysis.find({
      $or: [
        { overall_score: { $lt: 60 } },
        { retest_risk_percentage: { $gt: 40 } },
        { hidden_gaps_count: { $gt: 0 } }
      ]
    })
      .populate('student_id', 'name email')
      .populate('subject_id', 'name')
      .sort({ retest_risk_percentage: -1, overall_score: 1 })
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

    const students = await User.find({
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


// ======================================
// COGNITIVE PROFILE DISTRIBUTION
// ======================================
router.get('/stats/cognitive', auth, teacherOnly, async (req, res) => {
  try {
    const analyses = await GapAnalysis.find()
      .populate('student_id', 'name')
      .lean();

    let trulyKnows = 0;
    let hiddenGap = 0;
    let misconception = 0;
    let normalGap = 0;

    analyses.forEach(a => {
      const fm = a.forensic_matrix || {};
      trulyKnows += fm.trulyKnows || 0;
      hiddenGap += fm.hiddenGap || 0;
      misconception += fm.misconception || 0;
      normalGap += fm.normalGap || 0;
    });

    const total = trulyKnows + hiddenGap + misconception + normalGap || 1;

    res.json({
      distribution: [
        { label: 'Truly Knows', value: trulyKnows, percentage: Math.round((trulyKnows / total) * 100), color: '#10b981' },
        { label: 'Hidden Gap', value: hiddenGap, percentage: Math.round((hiddenGap / total) * 100), color: '#e05d44' },
        { label: 'Misconception', value: misconception, percentage: Math.round((misconception / total) * 100), color: '#dd6b20' },
        { label: 'Normal Gap', value: normalGap, percentage: Math.round((normalGap / total) * 100), color: '#3b82f6' }
      ],
      totalStudents: analyses.length,
      hiddenGapCount: analyses.filter(a => (a.forensic_matrix?.hiddenGap || 0) > 0).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// TOPIC-WISE GAP HEATMAP DATA
// ======================================
router.get('/stats/heatmap', auth, teacherOnly, async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const subjects = await Subject.find().lean();
    const analyses = await GapAnalysis.find()
      .populate('subject_id', 'name')
      .populate('student_id', 'name email')
      .lean();

    const heatmap = subjects.map(subject => {
      const subjectAnalyses = analyses.filter(
        a => a.subject_id && a.subject_id._id.toString() === subject._id.toString()
      );

      const topicMap = {};
      subjectAnalyses.forEach(a => {
        (a.topic_scores || []).forEach(ts => {
          if (!topicMap[ts.name]) {
            topicMap[ts.name] = { scores: [], studentCount: 0 };
          }
          topicMap[ts.name].scores.push(ts.score || 0);
          topicMap[ts.name].studentCount++;
        });

        (a.priority_topics || []).forEach(pt => {
          if (!topicMap[pt.name]) {
            topicMap[pt.name] = { scores: [], studentCount: 0 };
          }
          topicMap[pt.name].scores.push(pt.score !== undefined ? (100 - pt.score) / 100 : 0.5);
          topicMap[pt.name].studentCount++;
        });
      });

      const topics = Object.entries(topicMap).map(([name, data]) => ({
        name,
        gapScore: data.scores.length > 0
          ? Number((data.scores.reduce((s, v) => s + v, 0) / data.scores.length).toFixed(2))
          : 0,
        students: data.studentCount
      }));

      return {
        subject: subject.name,
        topics
      };
    });

    // Also compute overall LGS per subject
    const lgsData = subjects.map(subject => {
      const subjectAnalyses = analyses.filter(
        a => a.subject_id && a.subject_id._id.toString() === subject._id.toString()
      );
      const avgLgs = subjectAnalyses.length > 0
        ? Number((subjectAnalyses.reduce((s, a) => s + (a.retest_risk_percentage || 0) / 100, 0) / subjectAnalyses.length).toFixed(2))
        : 0;
      return {
        subject: subject.name,
        lgs: avgLgs,
        studentCount: subjectAnalyses.length
      };
    });

    res.json({ heatmap, lgsData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;