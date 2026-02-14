const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Avatar = require('../models/Avatar');
const { authMiddleware } = require('./auth');
const avatarService = require('../services/avatarService');
const elevenLabsService = require('../services/elevenLabsService');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece ses ve goruntu dosyalari yuklenebilir'));
    }
  }
});

// Tum avatarlari getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const avatars = await Avatar.find({ userId: req.userId });
    res.json(avatars);
  } catch (error) {
    res.status(500).json({ error: 'Avatarlar getirilemedi' });
  }
});

// Avatar olustur
router.post('/create', authMiddleware, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'voice', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, personalityPrompt, language } = req.body;
    const userId = req.userId;

    let photoUrl = null;
    if (req.files?.photo) {
      photoUrl = `data:${req.files.photo[0].mimetype};base64,${req.files.photo[0].buffer.toString('base64')}`;
    }

    let avatarData;
    try {
      if (photoUrl) {
        avatarData = await avatarService.createAvatarFromPhoto(photoUrl);
      } else {
        avatarData = {
          avatarId: uuidv4(),
          avatarUrl: avatarService.getDefaultAvatarUrl()
        };
      }
    } catch (error) {
      avatarData = {
        avatarId: uuidv4(),
        avatarUrl: avatarService.getDefaultAvatarUrl()
      };
    }

    let voiceId = 'pNInz6obpgDQGcFmaJgB';
    if (req.files?.voice) {
      try {
        voiceId = await elevenLabsService.cloneVoice(req.files.voice[0].buffer, name);
      } catch (error) {
        console.error('Ses klonlama hatasi:', error);
      }
    }

    const avatar = new Avatar({
      userId,
      name,
      rpmAvatarId: avatarData.avatarId,
      rpmAvatarUrl: avatarData.avatarUrl,
      elevenLabsVoiceId: voiceId,
      personalityPrompt: personalityPrompt || 'Samimi ve sicak bir kisilik.',
      language: language || 'tr',
      voiceSampleUrl: req.files?.voice ? 'uploaded' : null
    });

    await avatar.save();
    res.json(avatar);
  } catch (error) {
    console.error('Avatar olusturma hatasi:', error);
    res.status(500).json({ error: 'Avatar olusturulamadi' });
  }
});

// Avatar getir
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const avatar = await Avatar.findOne({ _id: req.params.id, userId: req.userId });
    if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });
    res.json(avatar);
  } catch (error) {
    res.status(500).json({ error: 'Avatar getirilemedi' });
  }
});

// Avatar sil
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const avatar = await Avatar.findOne({ _id: req.params.id, userId: req.userId });
    if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });

    if (avatar.elevenLabsVoiceId && avatar.elevenLabsVoiceId !== 'pNInz6obpgDQGcFmaJgB') {
      await elevenLabsService.deleteVoice(avatar.elevenLabsVoiceId);
    }

    await Avatar.deleteOne({ _id: req.params.id });
    res.json({ message: 'Avatar silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Avatar silinemedi' });
  }
});

module.exports = router;
