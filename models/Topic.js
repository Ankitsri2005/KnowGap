const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Topic', topicSchema);