import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createCheckoutSession,
  createBillingPortalSession,
  handleWebhookEvent,
  isStripeConfigured,
} from '../services/paymentService.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({ gatewayConfigured: isStripeConfigured });
});

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { url } = await createCheckoutSession({ uid: req.user.uid, email: req.user.email });
    res.json({ url });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

router.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const { url } = await createBillingPortalSession({ uid: req.user.uid });
    res.json({ url });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// Mounted with express.raw() in server/index.js — Stripe's signature
// verification needs the untouched request body, not JSON-parsed.
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  try {
    await handleWebhookEvent(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] signature/processing error:', err.message);
    res.status(400).json({ error: `Webhook error: ${err.message}` });
  }
});

export default router;
