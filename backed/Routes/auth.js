const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// JWT middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Yetkisiz erisim' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Gecersiz token' });
  }
};

// Kayit
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Bu email kayitli' });

    const user = new User({ email, password, name });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, subscription: user.subscription } });
  } catch (error) {
    res.status(500).json({ error: 'Kayit yapilamadi' });
  }
});

// Giris
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Kullanici bulunamadi' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Sifre hatali' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, subscription: user.subscription, usage: user.usage } });
  } catch (error) {
    res.status(500).json({ error: 'Giris yapilamadi' });
  }
});

// Profil
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Profil getirilemedi' });
  }
});

// Hesap silme
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const Avatar = require('../models/Avatar');
    const Room = require('../models/Room');
    const elevenLabsService = require('../services/elevenLabsService');

    const avatars = await Avatar.find({ userId });
    for (const avatar of avatars) {
      if (avatar.elevenLabsVoiceId) await elevenLabsService.deleteVoice(avatar.elevenLabsVoiceId);
    }
    await Avatar.deleteMany({ userId });
    await Room.deleteMany({ hostId: userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Hesap silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Hesap silinemedi' });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
