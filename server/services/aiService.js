// Copilot AI service. The Anthropic API key lives only here, read from an
// environment variable — it must never be shipped to the frontend bundle.
// If ANTHROPIC_API_KEY is not set, the caller (routes/copilot.js) falls
// back to demo mode instead of trying to reach this module.

import Anthropic from '@anthropic-ai/sdk';

let client = null;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `Você é o Copilot do NOVA, um assistente financeiro pessoal.
Responda de forma direta, curta (no máximo 3 frases) e prática, em português do Brasil.
Use os dados financeiros fornecidos no contexto para embasar a resposta. Nunca invente saldos ou valores que não foram informados.`;

export async function generateCopilotReply({ message, context }) {
  const anthropic = getClient();

  const contextSummary = `Contexto financeiro do usuário:
- Dinheiro disponível até o próximo salário: ${context?.available ?? 'desconhecido'}
- Renda mensal: ${context?.monthlyIncome ?? 'desconhecida'}
- Orçamento diário: ${context?.dailyBudget ?? 'desconhecido'}
- Metas ativas: ${(context?.goals ?? []).map((g) => `${g.name} (${g.saved}/${g.target})`).join(', ') || 'nenhuma'}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `${contextSummary}\n\nPergunta do usuário: ${message}` }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}
