# NOVA

Seu dinheiro. Sob seu controle.

App de organização financeira pessoal: contas, cartões, metas, orçamento, previsões e um assistente (Copilot) pra responder dúvidas do tipo "posso comprar isso?". Tema escuro, minimalista.

Rode sem configurar nada e o app já funciona inteiro em modo demonstração (dados fictícios no `localStorage`). Configure Firebase/Stripe/Pluggy e ele vira um app de produção de verdade — login real, banco de dados real, assinatura e conexão bancária reais.

## Stack

- React 19 + Vite + Tailwind v4, React Router, Recharts
- Node/Express no backend (só necessário pro Copilot com IA real, Stripe e Open Finance)
- Firebase (Auth + Firestore) quando configurado — senão cai pra `localStorage`
- Stripe pra assinatura do plano Pro
- Pluggy pra conexão bancária real (Open Finance)

## Rodando local

```bash
npm install
cp .env.example .env
npm run dev
```

Abre em `localhost:5173`. Isso já é suficiente pra usar o app inteiro — criar conta, adicionar bancos/cartões/transações/metas, tudo fica salvo no navegador.

Se quiser o backend também (IA de verdade, pagamento, Open Finance):

```bash
npm run server
```

## Funcionalidades

- Dashboard com saldo, dinheiro disponível até o próximo salário e gasto por dia
- Bancos, contas e cartões (crédito/débito, com limite, fatura e vencimento)
- Transações com filtro por tipo/banco/categoria
- Metas com foto de capa e projeção de quanto guardar por mês
- Assinaturas recorrentes com total mensal/anual
- "Posso comprar?" — cruza uma compra com saldo, renda e metas antes de você decidir
- Copilot conversacional (usa IA real se configurada, senão responde com regras usando seus próprios dados)
- Relatórios, insights e previsão financeira
- Navegação própria pro mobile (bottom nav, não é o desktop encolhido)
- Plano Free x Pro com limites configuráveis num arquivo só (`src/config/plans.js`)

## Variáveis de ambiente

Tudo em `.env.example`, com comentário em cada uma. As que importam:

- `ANTHROPIC_API_KEY` — Copilot com IA de verdade (Claude). Sem isso, respostas locais.
- `VITE_FIREBASE_*` + `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` — conta e banco de dados reais
- `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID`/`STRIPE_WEBHOOK_SECRET` — assinatura Pro real
- `PLUGGY_CLIENT_ID`/`PLUGGY_CLIENT_SECRET`/`PLUGGY_WEBHOOK_SECRET` — conexão bancária real

Cada uma é opcional e independente das outras — sem Firebase o app usa `localStorage`, sem Stripe o upgrade fica em modo demo, sem Pluggy o cadastro de banco continua manual.

## Firebase

1. Cria um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ativa Authentication (e-mail/senha + Google) e cria um Firestore em modo produção
3. Registra um app Web e copia as chaves pro `.env` (`VITE_FIREBASE_*`)
4. Em Configurações → Contas de serviço, gera uma chave privada e copia `project_id`/`client_email`/`private_key` pro `.env`
5. Sobe as regras: `npx firebase-tools deploy --only firestore:rules --project SEU_PROJECT_ID`

Uma conta criada de verdade (não a demo) começa vazia — sem os bancos/metas de exemplo.

## Stripe (assinatura Pro)

1. Conta em [dashboard.stripe.com](https://dashboard.stripe.com), modo teste pra começar
2. Secret key pro `.env`
3. `npm run setup:stripe` cria o produto e o preço automaticamente a partir de `src/config/plans.js`
4. Pra testar webhook local: `stripe listen --forward-to localhost:8787/api/stripe/webhook`

## Open Finance (Pluggy)

Conexão bancária real usando a [Pluggy](https://pluggy.ai) como intermediária — o app nunca vê a senha do banco do usuário, isso acontece dentro do widget deles. Precisa de Firebase configurado (a sincronização escreve no Firestore).

1. Conta em [dashboard.pluggy.ai](https://dashboard.pluggy.ai) (tem sandbox grátis)
2. `CLIENT_ID`/`CLIENT_SECRET` pro `.env`
3. Registra o webhook (`/api/open-finance/webhook`) com um header `X-Webhook-Secret` igual ao que você definir em `PLUGGY_WEBHOOK_SECRET`

Sem essas variáveis o botão de conectar banco automaticamente simplesmente não aparece — cadastro manual continua normal.

## Estrutura

```
src/
  pages/         uma pasta por área (banks, cards, goals, transactions, copilot, ...)
  components/    Button, Panel, Input, ProgressBar, UpgradeSheet...
  contexts/      Auth e Data — cada um escolhe entre Firebase ou localStorage
  services/      cálculos financeiros, IA, pagamento, open finance
  config/        plans.js e permissions.js — regras de plano num lugar só

server/
  routes/        copilot, stripe, open-finance
  services/       mesma coisa, do lado do backend
```

## Deploy

Frontend em qualquer host estático (Vercel, Netlify), backend em qualquer runtime Node (Render, Railway). Lembrar de trocar o endpoint do webhook do Stripe/Pluggy pra URL pública depois do deploy.

## O que falta

- Plano anual (o preço já existe em `plans.js`, só falta expor na UI)
- Insights/alertas gerados automaticamente no backend (hoje são fixos)
- App mobile nativo
