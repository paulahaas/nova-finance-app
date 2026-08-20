import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkImportQuota, parseStatementForUser, confirmStatementImport } from '../services/statement/importService.js';

const router = Router();

router.get('/quota', requireAuth, async (req, res) => {
  try {
    const quota = await checkImportQuota(req.user.uid);
    res.json(quota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parse', requireAuth, async (req, res) => {
  const { filename, content, bankId, columnMap } = req.body ?? {};
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content are required' });
  }
  try {
    const result = await parseStatementForUser({ uid: req.user.uid, filename, content, bankId, columnMap });
    res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

router.post('/confirm', requireAuth, async (req, res) => {
  const { batchId, bankId, filename, format, transactions } = req.body ?? {};
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'transactions is required' });
  }
  try {
    const result = await confirmStatementImport({ uid: req.user.uid, batchId, bankId, filename, format, transactions });
    res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

export default router;
