const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedType: {
    type: String,
    enum: ['avatar', 'user', 'message', 'room'],
    required: true
  },
  reportedId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'not_my_content',
      'impersonation',
      'inappropriate',
      'violence',
      'hate_speech',
      'other'
    ],
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'rejected'],
    default: 'pending'
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'account_suspended', 'account_banned']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Report', reportSchema);
