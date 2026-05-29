const mongoose = require('mongoose');

const testAnswerSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSession',
      required: true
    },

    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },

    student_answer: {
      type: String,
      required: false
    },

    is_correct: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'TestAnswer',
  testAnswerSchema
);