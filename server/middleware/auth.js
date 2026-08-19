import { verifyIdToken, isFirebaseAdminConfigured } from '../services/firebaseAdmin.js';

// Verifies the Firebase ID token sent as "Authorization: Bearer <token>"
// and attaches the decoded token (uid, email, ...) to req.user.
// Requires FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY — see .env.example.
export async function requireAuth(req, res, next) {
  if (!isFirebaseAdminConfigured) {
    return res.status(503).json({ error: 'Server auth is not configured (Firebase Admin credentials missing)' });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    req.user = await verifyIdToken(header.replace('Bearer ', ''));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
