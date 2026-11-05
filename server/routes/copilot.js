import { Router } from 'express';
import { generateCopilotReply } from '../services/aiService.js';
import { requireAuth } from '../middleware/auth.js';
import { adminDb } from '../services/firebaseAdmin.js';
import { canUseCopilot } from '../../src/config/permissions.js';

const router = Router();

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

/**
 * Checks the caller's monthly Copilot quota against their plan and, if
 * allowed, counts this message — atomically, so parallel requests can't
 * slip past the limit. The count lives on the user doc
 * (aiMessagesUsed + aiMessagesMonth), which firestore.rules make
 * read-only for the client.
 */
async function consumeCopilotMessage(uid) {
  const ref = adminDb.collection('users').doc(uid);
  const month = currentMonth();
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const used = data.aiMessagesMonth === month ? data.aiMessagesUsed ?? 0 : 0;
    const permission = canUseCopilot({ plan: data.plan ?? 'free' }, used);
    if (!permission.allowed) return permission;
    tx.set(ref, { aiMessagesUsed: used + 1, aiMessagesMonth: month }, { merge: true });
    return { ...permission, used: used + 1 };
  });
}

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
    const quota = await consumeCopilotMessage(req.user.uid);
    if (!quota.allowed) {
      return res.status(403).json({ error: 'Limite mensal de mensagens do Copilot atingido.' });
    }
  } catch (err) {
    console.error('[copilot] quota check failed:', err.message);
    return res.status(500).json({ error: 'quota check failed' });
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
