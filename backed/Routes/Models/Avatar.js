const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rpmAvatarId: {
    type: String,
    required: true
  },
  rpmAvatarUrl: {
    type: String,
    required: true
  },
  elevenLabsVoiceId: {
    type: String,
    required: true
  },
  personalityPrompt: {
    type: String,
    default: 'Samimi, sicak ve yardimsever bir kisilik.'
  },
  voiceSampleUrl: {
    type: String
  },
  language: {
    type: String,
    enum: ['tr', 'en', 'de', 'fr', 'es', 'ar', 'zh', 'ja', 'ko'],
    default: 'tr'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  memory: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Avatar', avatarSchema);
