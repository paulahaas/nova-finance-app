import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminDb } from '../services/firebaseAdmin.js';
import { isPushConfigured, isValidSubscription, removeSubscription, saveSubscription, sendToUser } from '../services/pushService.js';
import { buildDigest } from '../../src/services/dailyDigest.js';
import { OWNER_UID } from '../../src/config/owner.js';

const router = Router();

// The public VAPID key the browser needs to subscribe (it is public by design).
router.get('/config', (_req, res) => {
  res.json({ configured: isPushConfigured(), publicKey: isPushConfigured() ? process.env.VAPID_PUBLIC_KEY : null });
});

router.post('/subscribe', requireAuth, async (req, res) => {
  if (!isPushConfigured()) return res.status(503).json({ error: 'Push not configured' });
  const { subscription } = req.body ?? {};
  if (!isValidSubscription(subscription)) return res.status(400).json({ error: 'invalid subscription' });
  await saveSubscription(req.user.uid, subscription);
  res.json({ ok: true });
});

router.post('/unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body ?? {};
  if (typeof endpoint !== 'string') return res.status(400).json({ error: 'endpoint is required' });
  await removeSubscription(req.user.uid, endpoint);
  res.json({ ok: true });
});

router.post('/test', requireAuth, async (req, res) => {
  if (!isPushConfigured()) return res.status(503).json({ error: 'Push not configured' });
  const sent = await sendToUser(req.user.uid, { title: 'NOVA', body: 'Lembretes ativados. É assim que os avisos vão aparecer.', url: '/app' });
  res.json({ sent });
});

// Called once a day by Vercel Cron (vercel.json). Vercel sends
// "Authorization: Bearer $CRON_SECRET"; anything else is refused.
router.get('/daily', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });
  if (!isPushConfigured()) return res.json({ skipped: 'push not configured' });

  try {
    const userRef = adminDb.collection('users').doc(OWNER_UID);
    const list = async (name) => (await userRef.collection(name).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
    const [profile, cards, subscriptions, categoryBudgets, recurringBills, txSnap] = await Promise.all([
      userRef.get(),
      list('cards'),
      list('subscriptions'),
      list('categoryBudgets'),
      list('recurringBills'),
      userRef.collection('transactions').orderBy('date', 'desc').limit(1500).get(),
    ]);
    const transactions = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // "now" in Brasília time (UTC-3, no daylight saving), so "tomorrow" and
    // "Monday" mean what they mean to her.
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const localNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes());

    const state = profile.data()?.pushSent ?? {};
    const { payload, sent } = buildDigest({ cards, subscriptions, categoryBudgets, transactions, recurringBills }, state, localNow);
    if (!payload) return res.json({ sent: 0 });

    const delivered = await sendToUser(OWNER_UID, payload);
    if (delivered > 0) await userRef.set({ pushSent: { ...state, ...sent } }, { merge: true });
    res.json({ sent: delivered });
  } catch (err) {
    console.error('[push] daily digest failed:', err.message);
    res.status(500).json({ error: 'digest failed' });
  }
});

export default router;
