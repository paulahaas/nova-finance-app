// Firebase Admin init, used server-side to (a) verify the ID tokens the
// frontend sends on authenticated requests, and (b) let the Stripe webhook
// write subscription state directly to Firestore — the Admin SDK bypasses
// firestore.rules, which is exactly why only the webhook (never a
// user-facing route) should use it for writes.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Private keys are usually stored in .env with literal "\n" sequences —
// convert them back to real newlines.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export const isFirebaseAdminConfigured = Boolean(projectId && clientEmail && privateKey);

const app = isFirebaseAdminConfigured
  ? (getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }))
  : null;

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;

export async function verifyIdToken(token) {
  if (!adminAuth) throw new Error('Firebase Admin is not configured');
  return adminAuth.verifyIdToken(token);
}
