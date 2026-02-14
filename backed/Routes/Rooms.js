const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Avatar = require('../models/Avatar');
const { authMiddleware } = require('./auth');
const router = express.Router();

// Oda olustur
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { avatarId, name, maxParticipants = 4 } = req.body;
    const userId = req.userId;

    const avatar = await Avatar.findOne({ _id: avatarId, userId });
    if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });

    const inviteCode = uuidv4().substring(0, 8).toUpperCase();

    const room = new Room({
      hostId: userId,
      avatarId,
      name: name || 'Yeni Oda',
      inviteCode,
      maxParticipants,
      participants: [{ userId }]
    });

    await room.save();

    res.json({
      roomId: room._id,
      inviteCode: room.inviteCode,
      name: room.name,
      maxParticipants: room.maxParticipants
    });
  } catch (error) {
    console.error('Oda olusturma hatasi:', error);
    res.status(500).json({ error: 'Oda olusturulamadi' });
  }
});

// Odaya katil
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.userId;

    const room = await Room.findOne({ inviteCode, isActive: true });
    if (!room) return res.status(404).json({ error: 'Oda bulunamadi' });

    if (room.participants.length >= room.maxParticipants) {
      return res.status(403).json({ error: 'Oda dolu' });
    }

    const alreadyJoined = room.participants.some(p => p.userId.toString() === userId);
    if (!alreadyJoined) {
      room.participants.push({ userId });
      await room.save();
    }

    const avatar = await Avatar.findById(room.avatarId);

    res.json({
      roomId: room._id,
      name: room.name,
      avatar: {
        id: avatar._id,
        name: avatar.name,
        url: avatar.rpmAvatarUrl
      },
      participants: room.participants.length,
      maxParticipants: room.maxParticipants
    });
  } catch (error) {
    console.error('Odaya katilma hatasi:', error);
    res.status(500).json({ error: 'Odaya katilamadi' });
  }
});

// Oda bilgisi
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('avatarId', 'name rpmAvatarUrl')
      .populate('participants.userId', 'name');

    if (!room) return res.status(404).json({ error: 'Oda bulunamadi' });

    const isParticipant = room.participants.some(p => p.userId._id.toString() === req.userId);
    if (!isParticipant) return res.status(403).json({ error: 'Erisiminiz yok' });

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Oda bilgisi getirilemedi' });
  }
});

// Odadan ayril
router.post('/:roomId/leave', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Oda bulunamadi' });

    room.participants = room.participants.filter(p => p.userId.toString() !== req.userId);
    if (room.participants.length === 0) room.isActive = false;

    await room.save();
    res.json({ message: 'Odadan ayrildiniz' });
  } catch (error) {
    res.status(500).json({ error: 'Islem basarisiz' });
  }
});

// Odayi kapat
router.post('/:roomId/close', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Oda bulunamadi' });
    if (room.hostId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Sadece oda sahibi kapatabilir' });
    }

    room.isActive = false;
    await room.save();
    res.json({ message: 'Oda kapatildi' });
  } catch (error) {
    res.status(500).json({ error: 'Islem basarisiz' });
  }
});

module.exports = router;
