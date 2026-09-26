import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import copilotRouter from './routes/copilot.js';
import stripeRouter from './routes/stripe.js';
import plansRouter from './routes/plans.js';
import openFinanceRouter from './routes/openFinance.js';
import statementsRouter from './routes/statements.js';
import { isFirebaseAdminConfigured } from './services/firebaseAdmin.js';
import { isStripeConfigured } from './services/paymentService.js';
import { isOpenFinanceConfigured } from './services/openFinanceService.js';

// The Express app without app.listen(): server/index.js listens on a port
// for local dev, and api/index.js exports this same app as a Vercel
// Function in production.
const app = express();

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

export default app;
