const express = require('express');

const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Subject = require('../models/Subject');

const { auth, teacherOnly } = require('../middleware/authMiddleware');

const router = express.Router();


// ======================================
// CREATE CLASSROOM
// ======================================
router.post('/', auth, teacherOnly, async (req, res) => {

  try {

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Classroom name required'
      });
    }

    const classroom = await Classroom.create({
      name,
      teacher_id: req.user.id,
      students: [],
      subjects: []
    });

    res.status(201).json({
      success: true,
      classroom: {
        id: classroom._id,
        name: classroom.name
      }
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// GET TEACHER'S CLASSROOMS
// ======================================
router.get('/', auth, teacherOnly, async (req, res) => {

  try {

    const classrooms = await Classroom.find({
      teacher_id: req.user.id
    })
      .populate('students', 'name email')
      .populate('subjects', 'name description')
      .lean();

    res.json(classrooms);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// GET SINGLE CLASSROOM
// ======================================
router.get('/:id', auth, teacherOnly, async (req, res) => {

  try {

    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher_id: req.user.id
    })
      .populate('students', 'name email')
      .populate('subjects', 'name description')
      .lean();

    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found'
      });
    }

    res.json(classroom);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// ADD STUDENT TO CLASSROOM (by email)
// ======================================
router.post('/:id/students', auth, teacherOnly, async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Student email required'
      });
    }

    // Find classroom
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher_id: req.user.id
    });

    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found'
      });
    }

    // Find student by email
    const student = await User.findOne({
      email,
      role: 'student'
    });

    if (!student) {
      return res.status(404).json({
        error: 'No student found with that email'
      });
    }

    // Check if already enrolled
    if (classroom.students.includes(student._id)) {
      return res.status(409).json({
        error: 'Student already in this classroom'
      });
    }

    // Add student
    classroom.students.push(student._id);
    await classroom.save();

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// REMOVE STUDENT FROM CLASSROOM
// ======================================
router.delete('/:id/students/:sid', auth, teacherOnly, async (req, res) => {

  try {

    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher_id: req.user.id
    });

    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found'
      });
    }

    classroom.students = classroom.students.filter(
      s => s.toString() !== req.params.sid
    );

    await classroom.save();

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// ASSIGN SUBJECT TO CLASSROOM
// ======================================
router.post('/:id/subjects', auth, teacherOnly, async (req, res) => {

  try {

    const { subject_id } = req.body;

    if (!subject_id) {
      return res.status(400).json({
        error: 'Subject ID required'
      });
    }

    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher_id: req.user.id
    });

    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found'
      });
    }

    // Check subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({
        error: 'Subject not found'
      });
    }

    // Check if already assigned
    if (classroom.subjects.includes(subject._id)) {
      return res.status(409).json({
        error: 'Subject already assigned to this classroom'
      });
    }

    classroom.subjects.push(subject._id);
    await classroom.save();

    res.json({
      success: true,
      subject: {
        id: subject._id,
        name: subject.name
      }
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// REMOVE SUBJECT FROM CLASSROOM
// ======================================
router.delete('/:id/subjects/:subid', auth, teacherOnly, async (req, res) => {

  try {

    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher_id: req.user.id
    });

    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found'
      });
    }

    classroom.subjects = classroom.subjects.filter(
      s => s.toString() !== req.params.subid
    );

    await classroom.save();

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================
// STUDENT: GET MY CLASSROOM
// ======================================
router.get('/my/info', auth, async (req, res) => {

  try {

    if (req.user.role !== 'student') {
      return res.status(403).json({
        error: 'Students only'
      });
    }

    const classrooms = await Classroom.find({
      students: req.user.id
    })
      .populate('teacher_id', 'name email')
      .populate('subjects', 'name description')
      .lean();

    res.json(classrooms);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


module.exports = router;
