const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question_text: {
      type: String,
      required: true
    },

    option_a: {
      type: String,
      required: true
    },

    option_b: {
      type: String,
      required: true
    },

    option_c: {
      type: String,
      required: true
    },

    option_d: {
      type: String,
      required: true
    },

    correct_answer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },

    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true
    },

    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Question', questionSchema);