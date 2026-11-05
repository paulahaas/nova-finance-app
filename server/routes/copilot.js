import { Router } from 'express';
import { generateCopilotReply } from '../services/aiService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// requireAuth keeps the Anthropic key from being an open, unauthenticated
// proxy: without it anyone who finds the URL can spend the key's quota.
router.post('/', requireAuth, async (req, res) => {
  const { message, context } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI backend not configured (demo mode active on the client)' });
  }

  try {
    const reply = await generateCopilotReply({ message, context });
    res.json({ reply });
  } catch (err) {
    console.error('[copilot] AI request failed:', err.message);
    res.status(502).json({ error: 'AI request failed' });
  }
});

export default router;
