import app from './app.js';
import { isFirebaseAdminConfigured } from './services/firebaseAdmin.js';
import { isOpenFinanceConfigured } from './services/openFinanceService.js';

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`NOVA API listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — Copilot will run in demo mode on the client.');
  }
  if (!isFirebaseAdminConfigured) {
    console.warn('Firebase Admin not configured — authenticated routes (statement import, Open Finance) will return 503.');
  }
  if (!isOpenFinanceConfigured) {
    console.warn('PLUGGY_CLIENT_ID/SECRET not set — bank connections stay manual.');
  }
});
