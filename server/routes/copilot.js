import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminDb } from '../services/firebaseAdmin.js';
import { generateCopilotReply, extractExpenseWithAi, isAiConfigured } from '../services/aiService.js';
import { parseExpenseMessage, fromAiExtraction, looksLikeExpenseMessage } from '../../src/services/expenseParser.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { message, history } = req.body ?? {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: 'message too long' });
  }
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'AI backend not configured' });
  }

  try {
    const reply = await generateCopilotReply({ uid: req.user.uid, message: message.trim(), history });
    res.json({ reply });
  } catch (err) {
    console.error('[copilot] AI request failed:', err.status ? `${err.status} ${err.message}` : err.message);
    res.status(err.status === 429 ? 429 : 502).json({ error: 'AI request failed' });
  }
});

// "gastei 45 no ifood" -> a transaction draft to confirm, never saved here.
// The regex parser (free, instant) handles the phrasing the spec asks for;
// the AI is only asked when that parser can't make sense of the message —
// this keeps the common case fast and free while still using "IA de
// verdade" for the messages that actually need it.
router.post('/parse-expense', requireAuth, async (req, res) => {
  const { message } = req.body ?? {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const uid = req.user.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const [cardsSnap, rulesSnap, txSnap] = await Promise.all([
      userRef.collection('cards').get(),
      userRef.collection('userCategoryRules').get(),
      userRef.collection('transactions').orderBy('date', 'desc').limit(20).get(),
    ]);
    const options = {
      cards: cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      userRules: rulesSnap.docs.map((d) => d.data()),
      recentTransactions: txSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    let result = parseExpenseMessage(message, options);

    if (result.intent === 'none' && isAiConfigured() && looksLikeExpenseMessage(message)) {
      const aiJson = await extractExpenseWithAi(message).catch(() => null);
      result = fromAiExtraction(aiJson, options);
    }

    res.json(result);
  } catch (err) {
    console.error('[copilot] parse-expense failed:', err.message);
    res.status(500).json({ error: 'Não consegui interpretar essa mensagem.' });
  }
});

export default router;
