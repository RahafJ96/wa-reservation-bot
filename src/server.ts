import express from 'express';
import dotenv from 'dotenv';
import reservationRoutes from './api/reservationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Check API health
app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'API is running 🚀' });
});

// Reservations API
app.use('/api/reservations', reservationRoutes);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} ✅`);
});
