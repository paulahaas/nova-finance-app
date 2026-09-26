import { verifyIdToken, isFirebaseAdminConfigured } from '../services/firebaseAdmin.js';
import { OWNER_UID } from '../../src/config/owner.js';

// Verifies the Firebase ID token sent as "Authorization: Bearer <token>"
// and attaches the decoded token (uid, email, ...) to req.user. Only the
// app's single owner is let through — anyone else who managed to create a
// Firebase Auth account gets a 403.
// Requires FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY — see .env.example.
export async function requireAuth(req, res, next) {
  if (!isFirebaseAdminConfigured) {
    return res.status(503).json({ error: 'Server auth is not configured (Firebase Admin credentials missing)' });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  let decoded;
  try {
    decoded = await verifyIdToken(header.replace('Bearer ', ''));
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (decoded.uid !== OWNER_UID) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  req.user = decoded;
  next();
}
