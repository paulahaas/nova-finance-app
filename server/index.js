import app from './app.js';
import { isFirebaseAdminConfigured } from './services/firebaseAdmin.js';
import { isStripeConfigured, isWebhookConfigured } from './services/paymentService.js';
import { isOpenFinanceConfigured } from './services/openFinanceService.js';

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`NOVA API listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — Copilot will run in demo mode on the client.');
  }
  if (!isFirebaseAdminConfigured) {
    console.warn('Firebase Admin not configured — authenticated routes (Stripe, Open Finance) will return 503.');
  }
  if (!isStripeConfigured) {
    console.warn('Stripe not configured — subscribing to NOVA Pro will run in demo mode on the client.');
  } else if (!isWebhookConfigured) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — subscription status updates from Stripe will not sync.');
  }
  if (!isOpenFinanceConfigured) {
    console.warn('PLUGGY_CLIENT_ID/SECRET not set — bank connections stay manual (demo mode) on the client.');
  }
});
