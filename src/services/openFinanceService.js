// Client for the Open Finance endpoints (server/routes/openFinance.js).
// Requires a signed-in Firebase user, same as paymentService.js.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function getGatewayStatus() {
  try {
    const res = await fetch(`${API_URL}/api/open-finance/status`);
    if (!res.ok) return { gatewayConfigured: false };
    return res.json();
  } catch {
    return { gatewayConfigured: false };
  }
}

export async function getConnectToken(getIdToken) {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/api/open-finance/connect-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao iniciar conexão');
  return data.accessToken;
}

export async function syncItem(getIdToken, itemId) {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/api/open-finance/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ itemId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar conta');
  return data;
}
