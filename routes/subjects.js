const express = require('express');

const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');

const {auth, teacherOnly} = require('../middleware/authMiddleware');

const router = express.Router();


// ==========================
// GET ALL SUBJECTS
// ==========================
router.get('/', auth, async (req, res) => {

  try {

    const subjects = await Subject.find()
      .populate('created_by', 'name')
      .lean();

    // Add topic count & question count
    const updatedSubjects = await Promise.all(

      subjects.map(async (subject) => {

        const topic_count = await Topic.countDocuments({
          subject_id: subject._id
        });

        const question_count = await Question.countDocuments({
          subject_id: subject._id
        });

        return {
          ...subject,
          teacher_name: subject.created_by?.name || 'Unknown',
          topic_count,
          question_count
        };
      })
    );

    res.json(updatedSubjects);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ==========================
// CREATE SUBJECT
// ==========================
router.post('/', auth, teacherOnly, async (req, res) => {

  try {

    const {
      name,
      description
    } = req.body;

    if (!name) {

      return res.status(400).json({
        error: 'Subject name required'
      });
    }

    const existingSubject = await Subject.findOne({ name });

    if (existingSubject) {

      return res.status(409).json({
        error: 'Subject already exists'
      });
    }

    const subject = await Subject.create({
      name,
      description,
      created_by: req.user.id
    });

    res.status(201).json({
      id: subject._id,
      name: subject.name,
      description: subject.description
    });

  } catch (error) {

    res.status(500).json({
      error: 'Failed to create subject'
    });
  }
});

router.post('/bulksubjects', auth, teacherOnly, async (req, res) => {

  try {

    const subjects = req.body;

    // Check if body is array
    if (!Array.isArray(subjects) || subjects.length === 0) {

      return res.status(400).json({
        error: 'Please provide an array of subjects'
      });
    }

    // Check empty names
    for (const subject of subjects) {

      if (!subject.name) {

        return res.status(400).json({
          error: 'Subject name required'
        });
      }
    }

    // Get all subject names
    const subjectNames = subjects.map(subject => subject.name);

    // Check duplicates in database
    const existingSubjects = await Subject.find({
      name: { $in: subjectNames }
    });

    if (existingSubjects.length > 0) {

      return res.status(409).json({
        error: 'Some subjects already exist',
        existing: existingSubjects.map(sub => sub.name)
      });
    }

    // Prepare data
    const subjectData = subjects.map(subject => ({
      name: subject.name,
      description: subject.description,
      created_by: req.user.id
    }));

    // Insert multiple subjects
    const savedSubjects = await Subject.insertMany(subjectData);

    res.status(201).json({
      message: 'Subjects added successfully',
      subjects: savedSubjects
    });

  } catch (error) {

    res.status(500).json({
      error: 'Failed to create subjects'
    });
  }
});


// ==========================
// GET TOPICS OF SUBJECT
// ==========================
router.get('/:id/topics', auth, async (req, res) => {

  try {

    const topics = await Topic.find({
      subject_id: req.params.id
    }).lean();

    const updatedTopics = await Promise.all(

      topics.map(async (topic) => {

        const question_count = await Question.countDocuments({
          topic_id: topic._id
        });

        return {
          ...topic,
          question_count
        };
      })
    );

    res.json(updatedTopics);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});


// ==========================
// ADD TOPIC
// ==========================
router.post('/:id/topics', auth, teacherOnly, async (req, res) => {

  try {

    const { name } = req.body;

    if (!name) {

      return res.status(400).json({
        error: 'Topic name required'
      });
    }

    const topic = await Topic.create({
      name,
      subject_id: req.params.id
    });

    res.status(201).json({
      id: topic._id,
      name: topic.name,
      subject_id: topic.subject_id
    });

  } catch (error) {

    res.status(500).json({
      error: 'Failed to create topic'
    });
  }
});


// ==========================
// DELETE SUBJECT
// ==========================
router.delete('/:id', auth, teacherOnly, async (req, res) => {

  try {

    // Delete subject
    await Subject.findByIdAndDelete(req.params.id);

    // Delete related topics
    await Topic.deleteMany({
      subject_id: req.params.id
    });

    // Delete related questions
    await Question.deleteMany({
      subject_id: req.params.id
    });

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