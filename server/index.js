import app from './app.js';
import { aiProvider } from './services/aiService.js';
import { isFirebaseAdminConfigured } from './services/firebaseAdmin.js';
import { isOpenFinanceConfigured } from './services/openFinanceService.js';

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`NOVA API listening on http://localhost:${PORT}`);
  if (!aiProvider()) {
    console.warn('Neither ANTHROPIC_API_KEY nor LLM_API_KEY is set — the Copilot falls back to keyword answers.');
  }
  if (!isFirebaseAdminConfigured) {
    console.warn('Firebase Admin not configured — authenticated routes (statement import, Open Finance) will return 503.');
  }
  if (!isOpenFinanceConfigured) {
    console.warn('PLUGGY_CLIENT_ID/SECRET not set — bank connections stay manual.');
  }
});
