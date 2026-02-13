const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'https://avatar-ai.vercel.app'],
    methods: ['GET', 'POST']
  }
});

// Guvenlik
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'https://avatar-ai.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Cok fazla istek' }
});
app.use('/api/', apiLimiter);

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/avatar-ai')
  .then(() => console.log('MongoDB bagli'))
  .catch(err => console.error('MongoDB hata:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/avatars', require('./routes/avatars'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/reports', require('./routes/reports'));

// Socket.io
const rooms = new Map();
io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userId, avatarId }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) rooms.set(roomId, { participants: [] });
    const room = rooms.get(roomId);
    room.participants.push({ socketId: socket.id, userId });
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
  });

  socket.on('send-message', ({ roomId, message, sender }) => {
    socket.to(roomId).emit('receive-message', { message, sender });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      room.participants = room.participants.filter(p => p.socketId !== socket.id);
      if (room.participants.length === 0) rooms.delete(roomId);
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('Sunucu calisiyor:', PORT);
});
