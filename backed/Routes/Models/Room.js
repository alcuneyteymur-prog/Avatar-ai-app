const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  avatarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Avatar',
    required: true
  },
  name: {
    type: String,
    default: 'Yeni Oda'
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  maxParticipants: {
    type: Number,
    default: 4
  },
  isActive: {
    type: Boolean,
    default: true
  },
  gameType: {
    type: String,
    enum: ['none', 'tavla', 'okey'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
