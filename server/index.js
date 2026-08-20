import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import copilotRouter from './routes/copilot.js';
import stripeRouter from './routes/stripe.js';
import plansRouter from './routes/plans.js';
import openFinanceRouter from './routes/openFinance.js';
import statementsRouter from './routes/statements.js';
import { isFirebaseAdminConfigured } from './services/firebaseAdmin.js';
import { isStripeConfigured, isWebhookConfigured } from './services/paymentService.js';
import { isOpenFinanceConfigured } from './services/openFinanceService.js';

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());

// Stripe's webhook signature check needs the raw, untouched request body —
// this must be registered before the global express.json() below (which
// no-ops on a body express.raw() already parsed, so ordering is safe).
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
// 5mb (not the 100kb default) so a full bank statement's text fits in one
// request — statements are sent as JSON, not multipart, to avoid pulling in
// a file-upload dependency for what's ultimately just a text payload.
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    firebaseAdminConfigured: isFirebaseAdminConfigured,
    stripeConfigured: isStripeConfigured,
    openFinanceConfigured: isOpenFinanceConfigured,
    statementImportConfigured: isFirebaseAdminConfigured,
  });
});

app.use('/api/copilot', copilotRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/plans', plansRouter);
app.use('/api/open-finance', openFinanceRouter);
app.use('/api/statements', statementsRouter);

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
