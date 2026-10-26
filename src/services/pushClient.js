// Browser side of the phone reminders: ask permission, subscribe through the
// app's service worker and hand the subscription to the server.

import { API_URL } from '../config/api';

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function authed(path, getIdToken, body) {
  const token = await getIdToken();
  return fetch(`${API_URL}/api/push/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
}

export async function getPushConfig() {
  try {
    const res = await fetch(`${API_URL}/api/push/config`);
    return res.ok ? res.json() : { configured: false };
  } catch {
    return { configured: false };
  }
}

/** @returns the current subscription of this device, or null */
export async function currentSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function enablePush({ publicKey, getIdToken }) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('As notificações foram bloqueadas. Libere nas configurações do navegador e tente de novo.');
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
  const res = await authed('subscribe', getIdToken, { subscription: subscription.toJSON() });
  if (!res.ok) throw new Error('Não consegui ativar os lembretes agora. Tente de novo.');
}

export async function disablePush({ getIdToken }) {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await authed('unsubscribe', getIdToken, { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}

export async function sendTestPush({ getIdToken }) {
  const res = await authed('test', getIdToken);
  const data = res.ok ? await res.json() : { sent: 0 };
  return data.sent;
}
