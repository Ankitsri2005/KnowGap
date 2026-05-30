const mongoose = require('mongoose');

const gapAnalysisSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSession',
      unique: true
    },

    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },

    overall_score: Number,

    performance_level: String,

    gap_summary: String,

    topic_scores: {
      type: Array,
      default: []
    },

    recommendations: {
      type: Object
    },

    priority_topics: [
      {
        name: {
          type: String
        },

        score: {
          type: Number
        },

        urgency: {
          type: String
        },

        color: {
          type: String
        },

        studyHours: {
          type: Number
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'GapAnalysis',
  gapAnalysisSchema
);