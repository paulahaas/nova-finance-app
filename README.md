# NOVA

**Seu dinheiro. Sob seu controle.**

NOVA é um aplicativo de organização financeira pessoal com inteligência artificial: contas bancárias, cartões, metas, orçamento, previsões e um Copilot financeiro — em uma interface escura, minimalista e premium.

## Funcionalidades

- Dashboard com saldo disponível, dinheiro disponível até o próximo salário e orçamento diário
- Bancos, contas e cartões (com limite no plano gratuito)
- Transações com filtros por tipo, banco, categoria e período
- Metas financeiras com cenários de quanto guardar por mês
- Assinaturas recorrentes (total mensal/anual)
- **Posso comprar?** — analisa uma compra contra saldo, renda, cartões e metas
- **Copilot** — assistente financeiro conversacional (limite mensal no plano Free)
- Insights automáticos, previsão financeira e relatórios (básicos no Free, avançados no Pro)
- Alertas e gamificação (XP, nível, conquistas)
- Onboarding guiado e modo de demonstração com dados fictícios (nenhum banco real é necessário para explorar o app)
- Autenticação e dados reais via **Firebase** (Auth + Firestore) e assinatura real via **Stripe Checkout** — ambos opcionais: sem configurá-los, o app roda 100% em modo de demonstração local

## Mobile: uma experiência própria, não o desktop encolhido

Abaixo de `md` (768px), o app troca a sidebar por uma navegação inferior de 5 destinos — **Home · Money · Goals · AI · More** ([`src/layouts/BottomNav.jsx`](src/layouts/BottomNav.jsx)) — e a Home segue uma hierarquia própria para uma mão só (saudação → saldo → dinheiro disponível → **NOVA Pulse** → meta principal → resumo do mês → recomendação do Copilot), não o mesmo empilhamento do desktop. `Money` reúne Bancos e Transações em abas ([`src/pages/money/Money.jsx`](src/pages/money/Money.jsx)) e `More` concentra Insights, Cartões, Assinaturas, Perfil e Configurações ([`src/pages/More.jsx`](src/pages/More.jsx)) — ambos reaproveitam as páginas que o desktop já lista na sidebar, sem duplicar lógica. Todo campo numérico abre teclado apropriado (`inputMode`) e usa fonte de 16px para não disparar o zoom automático do iOS Safari; a navegação inferior e a bottom sheet do NOVA Pro respeitam `env(safe-area-inset-*)` para notch/Dynamic Island/gesture bar.

## Planos

| | NOVA Free | NOVA Pro |
|---|---|---|
| Preço | Grátis | R$ 14,90/mês |
| Bancos | até 2 | ilimitado |
| Metas | até 3 | ilimitado |
| Cartões | até 3 | ilimitado |
| Copilot | 20 mensagens/mês | ilimitado |
| Relatórios e insights avançados | — | ✓ |
| Histórico completo | — | ✓ |
| Exportação de dados | — | ✓ |

Todos os limites e preços vivem em **um único arquivo** — [`src/config/plans.js`](src/config/plans.js) — e todo o código de feature consulta [`src/config/permissions.js`](src/config/permissions.js) (`canUseFeature`, `canAddBank`, `canCreateGoal`, ...) para checar acesso. Mudar um limite ou o preço do Pro não exige tocar em nenhuma tela.

## Tecnologias

- **Frontend**: React 19, Vite, React Router, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend**: Node.js + Express
- **Autenticação e banco de dados**: Firebase Auth + Firestore (`firebase` no cliente, `firebase-admin` no servidor) — com fallback automático para `localStorage` quando não configurado
- **Pagamento**: Stripe Checkout + Billing Portal + webhooks
- **IA**: Anthropic Claude via `@anthropic-ai/sdk`, chamado apenas pelo servidor

## Instalação

```bash
npm install
```

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

## Execução

Frontend (porta 5173):

```bash
npm run dev
```

Backend (porta 8787) — necessário apenas para o Copilot usar IA real; sem ele, o Copilot funciona em modo de demonstração local:

```bash
npm run server
```

Build de produção:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Veja [`.env.example`](.env.example) para a lista completa e os comentários de cada uma. Resumo:

| Variável | Onde é usada | Descrição |
|---|---|---|
| `VITE_API_URL` | Frontend | URL do backend (`server/index.js`) |
| `APP_URL` | Backend | URL pública do frontend — usada nas URLs de retorno do Stripe |
| `ANTHROPIC_API_KEY` | Backend | Chave da API da Anthropic para o Copilot. **Nunca** é exposta ao frontend — sem ela, o backend responde 503 e o cliente cai automaticamente no modo de demonstração |
| `VITE_FIREBASE_*` | Frontend | Config pública do projeto Firebase (Auth + Firestore) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Backend | Credenciais da conta de serviço (Firebase Admin), para verificar tokens e para o webhook do Stripe escrever no Firestore |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` | Backend | Assinatura real do NOVA Pro — ver seção Pagamento abaixo |
| `OPEN_FINANCE_CLIENT_ID` / `OPEN_FINANCE_CLIENT_SECRET` | Backend | Reservado para a futura integração com Open Finance |

Todas as variáveis são opcionais individualmente: sem `VITE_FIREBASE_*`, o app usa `localStorage`; sem `STRIPE_*`, assinar o Pro fica em modo de demonstração; sem `ANTHROPIC_API_KEY`, o Copilot usa respostas locais.

## Firebase (Auth + Firestore)

Quando `VITE_FIREBASE_API_KEY`/`VITE_FIREBASE_PROJECT_ID` **não** estão definidas, o app roda 100% em modo de demonstração local (`localStorage`, ver [`src/services/storageService.js`](src/services/storageService.js)) — é assim que o projeto funciona logo após o `npm install`, sem nenhum setup. Quando estão definidas, `src/services/firebase.js` inicializa o Firebase de verdade e todo o app passa a usar:

- **Auth**: e-mail/senha e Google, via `src/contexts/authProviders/firebaseAuthProvider.js`
- **Firestore**: um documento `users/{uid}` para o perfil (renda, dia do salário, plano, assinatura, ...) e subcoleções `users/{uid}/banks|accounts|cards|transactions|goals|subscriptions`, via `src/contexts/dataProviders/firestoreDataProvider.js`

O ponto de troca entre os dois modos é só o `isFirebaseConfigured` exportado por `firebase.js` — nenhuma tela sabe qual dos dois está ativo.

**Como configurar:**

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Authentication** → métodos de login **E-mail/senha** e **Google**
3. Crie um banco **Firestore** (modo produção)
4. Em *Configurações do projeto → Geral → Seus apps*, crie um app Web e copie as chaves para `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` no `.env`
5. Em *Configurações do projeto → Contas de serviço*, clique em **Gerar nova chave privada** e copie `project_id`, `client_email` e `private_key` do JSON baixado para `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
6. Publique as regras de segurança (garantem que cada usuário só acessa seus próprios dados — seção 42 do escopo):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project SEU_PROJECT_ID
   ```

   (ou cole o conteúdo de [`firestore.rules`](firestore.rules) manualmente no console do Firestore)

Diferente do modo demo, uma conta real criada via Firebase **começa vazia** — sem bancos/metas fictícios — porque é o caminho de produção de verdade.

## Inteligência artificial (Copilot)

- O frontend nunca guarda uma API key. Ele chama `POST /api/copilot` (ver [`src/services/aiService.js`](src/services/aiService.js)).
- O backend ([`server/routes/copilot.js`](server/routes/copilot.js) + [`server/services/aiService.js`](server/services/aiService.js)) usa a Claude API com a chave lida de `ANTHROPIC_API_KEY`.
- Se a chave não estiver configurada, o backend recusa a chamada e o cliente usa uma resposta local baseada em regras — sempre deixando claro que está em modo de demonstração.

## Open Finance

Ainda não implementado. O cadastro de bancos/contas é manual. A camada de dados (Firestore ou `localStorage`, dependendo do modo) foi desenhada para que, quando uma integração real com Open Finance existir, ela apenas escreva nas mesmas coleções (`banks`, `accounts`, `transactions`) — sem exigir mudanças na interface.

## Pagamento (assinatura NOVA Pro via Stripe)

Sem `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` configuradas, assinar o NOVA Pro roda em **modo de demonstração**, claramente identificado na tela `/pro`, que apenas altera o plano localmente/no Firestore sem cobrar nada. Com essas variáveis definidas, o fluxo passa a ser real: Stripe Checkout hospeda o pagamento (o app nunca vê dados de cartão), e um webhook mantém o plano do usuário sincronizado no Firestore.

**Como configurar (requer Firebase configurado — o webhook grava no Firestore):**

1. Crie uma conta em [dashboard.stripe.com](https://dashboard.stripe.com) (comece em modo de teste)
2. Copie a **Secret key** (*Desenvolvedores → Chaves de API*) para `STRIPE_SECRET_KEY`
3. Crie o produto "NOVA Pro" com o preço mensal automaticamente:

   ```bash
   npm run setup:stripe
   ```

   Isso cria um Product + Price recorrente no Stripe usando o valor de `PLANS.pro.price.monthly` em [`src/config/plans.js`](src/config/plans.js) — mudar o preço ali e rodar o script de novo nunca duplica o Price (é idempotente por `lookup_key`). Copie o `price_...` impresso para `STRIPE_PRICE_ID`.
4. Para testar webhooks localmente, use a [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:8787/api/stripe/webhook
   ```

   Copie o `whsec_...` impresso para `STRIPE_WEBHOOK_SECRET`. Em produção, crie o endpoint em *Desenvolvedores → Webhooks* apontando para `https://SEU_DOMINIO/api/stripe/webhook`, escutando `checkout.session.completed`, `customer.subscription.updated` e `customer.subscription.deleted`.
5. Rode `npm run server` e `npm run dev` — "Assinar NOVA Pro" agora redireciona para o Stripe Checkout de verdade, e "Gerenciar assinatura" no Perfil abre o Billing Portal do Stripe.

O fluxo completo vive em [`server/routes/stripe.js`](server/routes/stripe.js) + [`server/services/paymentService.js`](server/services/paymentService.js). Os campos `plan`, `subscriptionStatus`, `subscriptionId`, `stripeCustomerId`, `subscriptionStart`, `subscriptionEnd` no documento `users/{uid}` são escritos exclusivamente pelo webhook (usando o Admin SDK, que ignora `firestore.rules`) — o cliente nunca pode se auto-promover a Pro escrevendo direto no Firestore.

O plano anual (seção 36 do escopo do produto) já está previsto em `PLANS[...].price.annual` em `src/config/plans.js`, pronto para virar um segundo Price no Stripe e ser exposto na UI quando fizer sentido.

## Estrutura do projeto

```
NOVA/
├── public/
├── src/
│   ├── assets/
│   ├── components/         # Button, Panel, Input, ProgressBar, UpgradeSheet, RequireAuth...
│   ├── pages/               # uma pasta por área (auth, onboarding, banks, goals, money, ...)
│   │   ├── money/Money.jsx      # hub mobile — abas Contas/Transações
│   │   └── More.jsx             # menu mobile — Insights, Cartões, Assinaturas, Perfil...
│   ├── layouts/             # AppLayout, Sidebar (desktop), BottomNav (mobile, 5 destinos)
│   ├── hooks/
│   ├── services/            # firebase.js, aiService, financeService, insightsService, paymentService, storageService
│   ├── contexts/
│   │   ├── AuthContext.jsx      # picks firebaseAuthProvider or localAuthProvider
│   │   ├── DataContext.jsx      # picks firestoreDataProvider or localDataProvider
│   │   ├── authProviders/
│   │   └── dataProviders/
│   ├── utils/                # format.js, authErrors.js
│   ├── data/                 # demoData.js (local/demo mode only)
│   ├── config/                # plans.js, permissions.js — regras de plano centralizadas
│   ├── App.jsx
│   └── main.jsx
├── server/
│   ├── routes/                # copilot.js, stripe.js, plans.js
│   ├── services/              # aiService.js, paymentService.js (Stripe), firebaseAdmin.js
│   ├── middleware/            # auth.js — verifica o ID token do Firebase
│   └── index.js
├── scripts/
│   └── create-stripe-price.js  # cria o Product/Price do NOVA Pro no Stripe
├── firestore.rules              # cada usuário só acessa seus próprios dados
├── firestore.indexes.json
├── firebase.json
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vite.config.js
```

## Deploy

- **Frontend**: qualquer host de estáticos (Vercel, Netlify, Cloudflare Pages) apontando `VITE_API_URL` para o backend publicado e com as `VITE_FIREBASE_*` de produção
- **Backend**: qualquer runtime Node.js (Render, Fly.io, Railway, um servidor próprio) com as variáveis de ambiente do `.env` configuradas — lembre de trocar o endpoint do webhook do Stripe para a URL pública do backend
- **Firestore**: publique `firestore.rules` no projeto de produção (`npx firebase-tools deploy --only firestore:rules --project SEU_PROJECT_ID`)

## Roadmap previsto

- Integração real com Open Finance
- Plano anual na UI (o Price já está previsto em `src/config/plans.js`)
- Apps mobile nativos
- Novos recursos de IA no Copilot
- Motor de insights/alertas/gamificação server-side (hoje são estáticos no modo Firebase — ver `alerts`/`achievements` em `src/contexts/dataProviders/firestoreDataProvider.js`)
