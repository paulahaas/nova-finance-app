# NOVA

Seu dinheiro. Sob seu controle.

App de organização financeira pessoal — contas, cartões, metas, orçamento e um assistente (Copilot) pra perguntas tipo "posso comprar isso?". React + Vite no front, Express no back, Firebase/Stripe/Pluggy quando configurados.

## Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Sem mexer em mais nada já dá pra usar o app inteiro (login, bancos, cartões, metas...), só que salvando no `localStorage` em vez de banco de verdade. Pra IA real, pagamento e conexão bancária real, também precisa do backend:

```bash
npm run server
```

## O que tem

Dashboard, bancos/contas/cartões, transações, metas (com foto), assinaturas recorrentes, "posso comprar?", Copilot, relatórios e previsão, plano Free/Pro. Nav própria no mobile, não é o desktop espremido.

## Integrações reais (opcionais)

Cada uma cai pra modo demo se não tiver configurada — nenhuma quebra o app:

- **Firebase** (login + banco de dados) — cria projeto no console, ativa Auth (e-mail/senha + Google) e Firestore, copia as chaves pro `.env`
- **Stripe** (assinatura Pro) — `npm run setup:stripe` já cria o produto/preço pra você depois de colocar a secret key
- **Pluggy** (Open Finance, conexão bancária de verdade) — precisa do Firebase configurado também, já que grava direto no Firestore do usuário

Detalhes de cada variável estão comentados no `.env.example`.

## Estrutura

`src/pages` por área, `src/contexts` decide Firebase vs localStorage, `src/config/plans.js` centraliza os limites do plano Free/Pro. `server/` espelha isso pro lado do backend (copilot, stripe, open-finance).

## Falta

Plano anual na UI, insights automáticos (hoje são fixos), app nativo.
