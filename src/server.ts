import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'API is running 🚀' });
});

// TODO: here we will:
// - add /api/reservations endpoints
// - add /api/chat that uses Gemini API to answer user queries

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} ✅`);
});
