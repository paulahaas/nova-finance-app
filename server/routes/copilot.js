import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../middleware/auth.js';
import { generateCopilotReply, isAiConfigured } from '../services/aiService.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { message, history } = req.body ?? {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: 'message too long' });
  }
  if (!isAiConfigured) {
    return res.status(503).json({ error: 'AI backend not configured' });
  }

  try {
    const reply = await generateCopilotReply({ uid: req.user.uid, message: message.trim(), history });
    res.json({ reply });
  } catch (err) {
    console.error('[copilot] AI request failed:', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err.message);
    const status = err instanceof Anthropic.RateLimitError ? 429 : 502;
    res.status(status).json({ error: 'AI request failed' });
  }
});

export default router;
