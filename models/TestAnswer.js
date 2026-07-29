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
      default: 'SKIPPED'
    },

    is_correct: {
      type: Boolean,
      default: false
    },

    confidence_tag: {
      type: String,
      enum: ['sure', 'guessed', 'unsure', null],
      default: null
    },

    response_time_ms: {
      type: Number,
      default: null
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