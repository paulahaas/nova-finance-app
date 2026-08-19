// Client for the Stripe-backed subscription endpoints (server/routes/stripe.js).
// Requires a signed-in Firebase user — every call attaches the user's ID
// token so the backend can verify identity before touching Stripe/Firestore.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function getGatewayStatus() {
  try {
    const res = await fetch(`${API_URL}/api/stripe/status`);
    if (!res.ok) return { gatewayConfigured: false };
    return res.json();
  } catch {
    return { gatewayConfigured: false };
  }
}

async function authedPost(path, getIdToken) {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function startCheckout(getIdToken) {
  return authedPost('/api/stripe/create-checkout-session', getIdToken);
}

export function openBillingPortal(getIdToken) {
  return authedPost('/api/stripe/create-portal-session', getIdToken);
}
