import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminDb } from '../services/firebaseAdmin.js';
import { generateMonthlyNarrative, estimateCountryWithAi, isAiConfigured } from '../services/aiService.js';
import { buildMonthlyClose, monthKeyLabel } from '../../src/services/monthlyCloseService.js';

const router = Router();

// "Fechamento do mês": the report itself is free to compute (deterministic,
// src/services/monthlyCloseService.js) and gets a short AI narrative on top
// only when AI is configured — saved per month so re-opening it later
// doesn't silently change, and so there's a history to look back at.
router.post('/monthly-close', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const list = async (name) => (await userRef.collection(name).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

    const [transactions, subscriptions, goals] = await Promise.all([
      userRef
        .collection('transactions')
        .orderBy('date', 'desc')
        .limit(2000)
        .get()
        .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      list('subscriptions'),
      list('goals'),
    ]);

    const now = new Date();
    const report = buildMonthlyClose({ transactions, subscriptions, goals }, now);

    let narrative = null;
    if (isAiConfigured()) {
      narrative = await generateMonthlyNarrative(report).catch(() => null);
    }

    const month = monthKeyLabel(now);
    const payload = { month, generatedAt: new Date().toISOString(), report, narrative };
    await userRef.collection('monthlyReports').doc(month).set(payload, { merge: true });

    res.json(payload);
  } catch (err) {
    console.error('[reports] monthly-close failed:', err.message);
    res.status(500).json({ error: 'Não consegui gerar o fechamento do mês.' });
  }
});

// A rough, clearly-labeled starting point for the "Intercâmbio" country
// comparison tool — she edits every field before saving, see
// src/pages/goals/TravelGoal.jsx.
router.post('/country-estimate', requireAuth, async (req, res) => {
  const { country } = req.body ?? {};
  if (!country || typeof country !== 'string' || !country.trim()) {
    return res.status(400).json({ error: 'country is required' });
  }
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'AI backend not configured' });
  }

  try {
    const estimate = await estimateCountryWithAi(country.trim());
    if (!estimate) return res.status(502).json({ error: 'Não consegui estimar esse país.' });
    res.json(estimate);
  } catch (err) {
    console.error('[reports] country-estimate failed:', err.message);
    res.status(502).json({ error: 'Não consegui estimar esse país.' });
  }
});

export default router;
