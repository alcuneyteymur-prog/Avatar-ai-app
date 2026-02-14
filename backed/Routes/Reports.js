const express = require('express');
const Report = require('../models/Report');
const Avatar = require('../models/Avatar');
const { authMiddleware } = require('./auth');
const router = express.Router();

// Sikayet olustur
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { reportedType, reportedId, reason, description } = req.body;
    
    if (reportedType === 'avatar') {
      const avatar = await Avatar.findById(reportedId);
      if (!avatar) return res.status(404).json({ error: 'Avatar bulunamadi' });
      if (avatar.userId.toString() === req.userId) {
        return res.status(403).json({ error: 'Kendi avatarinizi sikayet edemezsiniz' });
      }
    }
    
    const report = new Report({
      reporterId: req.userId,
      reportedType,
      reportedId,
      reason,
      description
    });
    
    await report.save();
    
    if (reason === 'not_my_content' && reportedType === 'avatar') {
      await Avatar.findByIdAndUpdate(reportedId, { isActive: false });
      report.status = 'resolved';
      report.action = 'content_removed';
      report.resolvedAt = new Date();
      await report.save();
    }
    
    res.json({ message: 'Sikayet alindi', reportId: report._id });
  } catch (error) {
    console.error('Sikayet hatasi:', error);
    res.status(500).json({ error: 'Sikayet olusturulamadi' });
  }
});

// Kullanicinin sikayetlerini getir
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Sikayetler getirilemedi' });
  }
});

module.exports = router;
