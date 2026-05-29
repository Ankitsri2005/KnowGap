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

    topic_scores: [
      {
        id: String,
        name: String,
        score: Number,
        total: Number,
        correct: Number,
        wrong: Number,
        gapSeverity: String,
        gapColor: String,
        priority: Number,
        difficultyBreakdown: mongoose.Schema.Types.Mixed,
        recommendations: [String],
        studyHours: Number,
        mastered: Boolean
      }
    ],

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