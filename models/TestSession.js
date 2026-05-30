const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },

    total_questions: {
      type: Number,
      default: 0
    },

    correct_answers: {
      type: Number,
      default: 0
    },

    score_percentage: {
      type: Number,
      default: 0
    },

    completed_at: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'TestSession',
  testSessionSchema
);