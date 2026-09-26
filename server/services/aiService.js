// Copilot AI service. The Anthropic API key lives only here, read from an
// environment variable — it must never be shipped to the frontend bundle.
// The user's data is loaded from Firestore on the server (never trusted from
// the request body) and handed to the model as context.

import Anthropic from '@anthropic-ai/sdk';
import { adminDb } from './firebaseAdmin.js';
import { buildCopilotContext } from '../../src/services/copilotContext.js';

export const isAiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

// Sonnet 5 for the conversation: strong enough to do the arithmetic and
// reason about the user's month, at $2/$10 per million tokens. Override with
// COPILOT_MODEL if needed.
const MODEL = process.env.COPILOT_MODEL || 'claude-sonnet-5';

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `Você é o Copilot do NOVA, o assistente financeiro pessoal de uma única pessoa: a dona do app. Você conversa com ela em português do Brasil.

Como responder:
- Seja direto e honesto, sem ser duro. Se um gasto foi um exagero ou se ela não vai bater uma meta no ritmo atual, diga com clareza e com respeito, e sugira o próximo passo concreto.
- Use apenas os dados da seção "Dados da usuária" e o que ela disser na conversa. Nunca invente saldo, gasto, data ou valor. Se faltar dado para responder, diga o que falta e como ela pode informar (registrando transações, cadastrando cartão ou meta).
- Faça as contas com cuidado e mostre o valor final em reais (ex.: R$ 1.234,56). Quando comparar meses, cite os números.
- Respostas curtas: em geral até 5 frases ou uma lista curta. Só se estenda se ela pedir detalhes. Sem títulos em markdown.
- Não recomende produtos de investimento específicos nem prometa retorno. Pode explicar conceitos e ajudar a organizar o orçamento.
- Ela pode estar planejando algo grande (veja "Sobre ela" e as metas). Leve isso em conta nas dicas, sem repetir o assunto a toda resposta.`;

/**
 * Validates and trims the conversation history sent by the client so only
 * plain user/assistant text reaches the model.
 * @returns {{ role: 'user'|'assistant', content: string }[]}
 */
export function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const clean = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 4000) }));
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
}

async function loadUserData(uid) {
  const userRef = adminDb.collection('users').doc(uid);
  const list = async (name, query = (ref) => ref) => {
    const snap = await query(userRef.collection(name)).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  const [profile, banks, accounts, cards, transactions, goals, subscriptions] = await Promise.all([
    userRef.get(),
    list('banks'),
    list('accounts'),
    list('cards'),
    list('transactions', (ref) => ref.orderBy('date', 'desc').limit(1500)),
    list('goals'),
    list('subscriptions'),
  ]);

  return { user: profile.exists ? profile.data() : {}, banks, accounts, cards, transactions, goals, subscriptions };
}

export async function generateCopilotReply({ uid, message, history }) {
  const data = await loadUserData(uid);
  const dataBlock = `Dados da usuária (atualizados agora):\n\n${buildCopilotContext(data)}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: 'medium' },
    // The data block is identical across messages of the same conversation,
    // so it is cached and later turns read it at a fraction of the price.
    system: [
      { type: 'text', text: SYSTEM_PROMPT },
      { type: 'text', text: dataBlock, cache_control: { type: 'ephemeral' } },
    ],
    messages: [...sanitizeHistory(history), { role: 'user', content: message }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text) throw new Error(`empty reply (stop_reason=${response.stop_reason})`);
  return text;
}
