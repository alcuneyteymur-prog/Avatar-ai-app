const express = require('express');
const Avatar = require('../models/Avatar');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const openaiService = require('../services/openaiService');
const elevenLabsService = require('../services/elevenLabsService');
const router = express.Router();

// Metin sohbeti
router.post('/text', authMiddleware, async (req, res) => {
  try {
    const { avatarId, message } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (user.subscription.type === 'free' && user.usage.chatMinutes >= user.usage.chatLimit) {
      return res.status(403).json({ error: 'Aylik limitiniz doldu. Premium yukseltin.', upgrade: true });
    }

    const avatar = await Avatar.findOne({ _id: avatarId, userId });
    if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });

    const response = await openaiService.generateResponse(message, avatar.personalityPrompt, avatar.memory, avatar.language);

    avatar.memory.push({ role: 'user', content: message });
    avatar.memory.push({ role: 'assistant', content: response });
    if (avatar.memory.length > 50) avatar.memory = avatar.memory.slice(-50);
    await avatar.save();

    user.usage.chatMinutes += 1;
    await user.save();

    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Sohbet hatasi:', error);
    res.status(500).json({ error: 'Yanit olusturulamadi' });
  }
});

// Sesli sohbet
router.post('/voice', authMiddleware, async (req, res) => {
  try {
    const { avatarId, message } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (user.subscription.type === 'free' && user.usage.chatMinutes >= user.usage.chatLimit) {
      return res.status(403).json({ error: 'Aylik limitiniz doldu. Premium yukseltin.', upgrade: true });
    }

    const avatar = await Avatar.findOne({ _id: avatarId, userId });
    if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });

    const response = await openaiService.generateResponse(message, avatar.personalityPrompt, avatar.memory, avatar.language);
    const audioBuffer = await elevenLabsService.textToSpeech(response, avatar.elevenLabsVoiceId, avatar.language);

    avatar.memory.push({ role: 'user', content: message });
    avatar.memory.push({ role: 'assistant', content: response });
    if (avatar.memory.length > 50) avatar.memory = avatar.memory.slice(-50);
    await avatar.save();

    user.usage.chatMinutes += 1;
    await user.save();

    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    console.error('Sesli sohbet hatasi:', error);
    res.status(500).json({ error: 'Sesli yanit olusturulamadi' });
  }
});

// Hafizayi temizle
router.post('/clear-memory', authMiddleware, async (req, res) => {
  try {
    const { avatarId } = req.body;
    const avatar = await Avatar.findOne({ _id: avatarId, userId: req.userId });
    if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });

    avatar.memory = [];
    await avatar.save();
    res.json({ message: 'Hafiza temizlendi' });
  } catch (error) {
    res.status(500).json({ error: 'Hafiza temizlenemedi' });
  }
});

module.exports = router;
