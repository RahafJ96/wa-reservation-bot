import { Router } from 'express';
import { handleUserMessage } from '../bot/conversationManager';

const router = Router();

/**
 * POST /api/chat
 * Body: { conversationId: string, message: string }
 */
router.post('/', async (req, res) => {
  const { conversationId, message } = req.body;
  console.log(conversationId, message, 'conversationId, message ');

  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in request body" });
  }

  // If no conversationId given, we can just use a default (for quick testing)
  const convId = conversationId || 'default';

  try {
    const reply = await handleUserMessage(convId, message);
    res.json({ conversationId: convId, reply });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
