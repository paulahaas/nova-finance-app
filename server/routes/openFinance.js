import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  isOpenFinanceConfigured,
  createConnectToken,
  syncItem,
  handleWebhookEvent,
  isValidWebhookSecret,
} from '../services/openFinanceService.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({ gatewayConfigured: isOpenFinanceConfigured });
});

router.post('/connect-token', requireAuth, async (req, res) => {
  try {
    const accessToken = await createConnectToken({ uid: req.user.uid, itemId: req.body?.itemId });
    res.json({ accessToken });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

router.post('/sync', requireAuth, async (req, res) => {
  const { itemId } = req.body ?? {};
  if (!itemId) return res.status(400).json({ error: 'itemId is required' });
  try {
    const result = await syncItem({ uid: req.user.uid, itemId });
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// Register this URL in the Pluggy dashboard with a custom header
// `X-Webhook-Secret: <PLUGGY_WEBHOOK_SECRET>` — see openFinanceService.js
// for why (Pluggy doesn't document a signature scheme, only custom headers).
router.post('/webhook', async (req, res) => {
  if (!isValidWebhookSecret(req.headers['x-webhook-secret'])) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }
  try {
    await handleWebhookEvent(req.body);
    res.json({ received: true });
  } catch (err) {
    console.error('[open-finance webhook] processing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
