import express from 'express';
import dotenv from 'dotenv';
import reservationRoutes from './api/reservationRoutes';
import chatRoutes from './api/chatRoutes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// User Interface
app.use(express.static(path.join(__dirname, '..', 'public')));

// Check API health
app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'API is running 🚀' });
});

// Reservations API
app.use('/api/reservations', reservationRoutes);

// Chat API
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} ✅`);
});
