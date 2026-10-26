// Web Push (free, standard browser push): the browser gives the app a
// subscription, the server keeps it and sends notifications with the VAPID
// keys. The keys live only in the server's environment.

import { createHash } from 'node:crypto';
import webpush from 'web-push';
import { adminDb } from './firebaseAdmin.js';

export const isPushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://nova-finance-app.vercel.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  configured = true;
}

const subsRef = (uid) => adminDb.collection('users').doc(uid).collection('pushSubscriptions');
const idFor = (endpoint) => createHash('sha256').update(endpoint).digest('hex').slice(0, 40);

export function isValidSubscription(sub) {
  return Boolean(
    sub &&
      typeof sub.endpoint === 'string' &&
      sub.endpoint.startsWith('https://') &&
      sub.endpoint.length < 1000 &&
      sub.keys &&
      typeof sub.keys.p256dh === 'string' &&
      typeof sub.keys.auth === 'string'
  );
}

export function saveSubscription(uid, subscription) {
  return subsRef(uid).doc(idFor(subscription.endpoint)).set({ subscription, createdAt: new Date().toISOString() });
}

export function removeSubscription(uid, endpoint) {
  return subsRef(uid).doc(idFor(endpoint)).delete();
}

/** Sends to every device she enabled; devices that are gone (404/410) are dropped. @returns the number sent */
export async function sendToUser(uid, payload) {
  configure();
  const snap = await subsRef(uid).get();
  let sent = 0;
  await Promise.all(
    snap.docs.map(async (doc) => {
      try {
        await webpush.sendNotification(doc.data().subscription, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) await doc.ref.delete();
        else console.error('[push] send failed:', err.statusCode ?? err.message);
      }
    })
  );
  return sent;
}
