// Open Finance integration (section 17). NOVA never connects to Banco
// Central directly — that's only for regulated institutions. Instead this
// goes through Pluggy (https://pluggy.ai), a certified Open Finance
// aggregator: they run the bank-consent flow and hand back normalized
// accounts/transactions, which we mirror into the same Firestore
// collections the rest of the app already reads from
// (users/{uid}/banks|accounts|transactions), tagged with source:
// 'open-finance' so they're distinguishable from manually-added ones.
//
// Verified against Pluggy's own docs/SDK source (docs.pluggy.ai,
// github.com/pluggyai/pluggy-node, github.com/pluggyai/quickstart) — not
// guessed.

import { PluggyClient } from 'pluggy-sdk';
import { adminDb } from './firebaseAdmin.js';

const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

export const isOpenFinanceConfigured = Boolean(clientId && clientSecret);

const pluggy = isOpenFinanceConfigured ? new PluggyClient({ clientId, clientSecret }) : null;

export async function createConnectToken({ uid, itemId }) {
  if (!isOpenFinanceConfigured) throw new Error('Open Finance is not configured');
  // clientUserId round-trips through webhook payloads, which is how the
  // webhook handler below knows which NOVA user an item update belongs to.
  const { accessToken } = await pluggy.createConnectToken(itemId, { clientUserId: uid });
  return accessToken;
}

const ACCOUNT_TYPE_MAP = { BANK: 'digital', CREDIT: 'cartão' };

async function syncAccountsAndTransactions(uid, itemId) {
  const item = await pluggy.fetchItem(itemId);
  const { results: pluggyAccounts } = await pluggy.fetchAccounts(itemId);

  const banksRef = adminDb.collection('users').doc(uid).collection('banks');
  const accountsRef = adminDb.collection('users').doc(uid).collection('accounts');
  const transactionsRef = adminDb.collection('users').doc(uid).collection('transactions');

  // One NOVA "bank" per Pluggy item (institution connection).
  const bankDocId = `pluggy_${itemId}`;
  await banksRef.doc(bankDocId).set(
    {
      name: item.connector?.name ?? 'Banco conectado',
      institution: item.connector?.name ?? null,
      source: 'open-finance',
      pluggyItemId: itemId,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const account of pluggyAccounts) {
    const accountDocId = `pluggy_${account.id}`;
    await accountsRef.doc(accountDocId).set(
      {
        bankId: bankDocId,
        name: account.name ?? account.marketingName ?? 'Conta',
        type: ACCOUNT_TYPE_MAP[account.type] ?? 'digital',
        balance: account.balance ?? 0,
        source: 'open-finance',
        pluggyAccountId: account.id,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const transactions = await pluggy.fetchAllTransactions(account.id, { dateFrom });
    for (const tx of transactions) {
      const txDocId = `pluggy_${tx.id}`;
      await transactionsRef.doc(txDocId).set(
        {
          bankId: bankDocId,
          accountId: accountDocId,
          description: tx.description ?? 'Transação',
          category: tx.category ?? 'Outros',
          amount: tx.amount,
          type: tx.amount >= 0 ? 'income' : 'expense',
          date: tx.date,
          source: 'open-finance',
          pluggyTransactionId: tx.id,
        },
        { merge: true }
      );
    }
  }

  return { bankId: bankDocId, accountCount: pluggyAccounts.length };
}

export async function syncItem({ uid, itemId }) {
  if (!isOpenFinanceConfigured) throw new Error('Open Finance is not configured');
  return syncAccountsAndTransactions(uid, itemId);
}

// Pluggy doesn't document a request-signing scheme for webhooks — it does
// support attaching custom headers to the webhook URL you register with
// them (see createWebhook), so we use that: register the URL with a
// `X-Webhook-Secret` header set to PLUGGY_WEBHOOK_SECRET, checked here.
export function isValidWebhookSecret(headerValue) {
  const expected = process.env.PLUGGY_WEBHOOK_SECRET;
  return Boolean(expected) && headerValue === expected;
}

export async function handleWebhookEvent(payload) {
  const { event, itemId, clientUserId } = payload ?? {};
  if (!clientUserId) {
    console.warn('[open-finance webhook] event missing clientUserId, skipping', event);
    return;
  }
  if (event === 'item/updated' || event === 'item/created' || event === 'transactions/created') {
    await syncAccountsAndTransactions(clientUserId, itemId);
  }
  // item/error, item/deleted, etc. are logged but not synced — surfacing
  // connection errors to the user is a frontend concern for later.
}
