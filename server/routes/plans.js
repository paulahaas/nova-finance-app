import { Router } from 'express';
import { PLANS } from '../../src/config/plans.js';

const router = Router();

// Serves the same plan definitions used by the frontend, so a future
// server-authoritative permission check never drifts from the client copy.
router.get('/', (_req, res) => {
  res.json(PLANS);
});

export default router;
