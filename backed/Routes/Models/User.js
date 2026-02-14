const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  subscription: {
    type: { type: String, enum: ['free', 'premium', 'family'], default: 'free' },
    expiresAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  usage: {
    chatMinutes: { type: Number, default: 0 },
    chatLimit: { type: Number, default: 10 },
    lastReset: { type: Date, default: Date.now }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
