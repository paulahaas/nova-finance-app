// Demo / seed data used in demonstration mode so the app can be explored
// without connecting real banks. Mirrors the `banks`, `accounts`,
// `transactions`, `cards`, `goals` and `subscriptions` collections
// described in the database structure (see README).

const todayISO = () => new Date().toISOString();

export function buildDemoUser() {
  return {
    id: 'demo-user',
    name: 'Pedro',
    email: 'pedro@example.com',
    plan: 'free',
    income: 4000,
    payDay: 5,
    hasCard: true,
    hasDebt: false,
    goalIntent: 'viajar',
    aiMessagesUsed: 12,
    xp: 1240,
    level: 12,
    createdAt: todayISO(),
  };
}

export function buildDemoBanks() {
  return [
    { id: 'bank-1', name: 'Nubank', institution: 'Nu Pagamentos', createdAt: todayISO() },
    { id: 'bank-2', name: 'Banco do Brasil', institution: 'Banco do Brasil', createdAt: todayISO() },
  ];
}

export function buildDemoAccounts() {
  return [
    { id: 'acc-1', bankId: 'bank-1', name: 'Conta principal', type: 'digital', balance: 2450.0 },
    { id: 'acc-2', bankId: 'bank-2', name: 'Conta corrente', type: 'corrente', balance: 790.5 },
  ];
}

export function buildDemoCards() {
  return [
    {
      id: 'card-1',
      bankId: 'bank-1',
      name: 'Nubank',
      limit: 4000,
      used: 1850,
      currentInvoice: 1240,
      nextInvoice: 610,
      dueDay: 10,
    },
  ];
}

export function buildDemoCategories() {
  return [
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Entretenimento',
    'Compras',
    'Viagens',
    'Assinaturas',
    'Outros',
  ];
}

export function buildDemoTransactions() {
  const now = new Date();
  const day = (offset) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset).toISOString();
  return [
    { id: 't1', bankId: 'bank-1', description: 'Salário', category: 'Entrada', amount: 4000, type: 'income', date: day(14) },
    { id: 't2', bankId: 'bank-1', description: 'Netflix', category: 'Assinaturas', amount: -39.9, type: 'expense', date: day(13) },
    { id: 't3', bankId: 'bank-1', description: 'Spotify', category: 'Assinaturas', amount: -21.9, type: 'expense', date: day(13) },
    { id: 't4', bankId: 'bank-2', description: 'Aluguel', category: 'Moradia', amount: -1400, type: 'expense', date: day(12) },
    { id: 't5', bankId: 'bank-1', description: 'Supermercado', category: 'Alimentação', amount: -380.4, type: 'expense', date: day(9) },
    { id: 't6', bankId: 'bank-1', description: 'iFood', category: 'Alimentação', amount: -64.2, type: 'expense', date: day(7) },
    { id: 't7', bankId: 'bank-2', description: 'Uber', category: 'Transporte', amount: -128.7, type: 'expense', date: day(6) },
    { id: 't8', bankId: 'bank-1', description: 'Cinema', category: 'Entretenimento', amount: -58.0, type: 'expense', date: day(4) },
    { id: 't9', bankId: 'bank-1', description: 'Amazon', category: 'Compras', amount: -19.9, type: 'expense', date: day(3) },
    { id: 't10', bankId: 'bank-2', description: 'Farmácia', category: 'Saúde', amount: -73.5, type: 'expense', date: day(2) },
    { id: 't11', bankId: 'bank-1', description: 'Freelance', category: 'Entrada', amount: 650, type: 'income', date: day(1) },
  ];
}

export function buildDemoGoals() {
  return [
    {
      id: 'goal-1',
      name: 'Inglaterra 2027',
      emoji: '🇬🇧',
      target: 15000,
      saved: 9750,
      deadline: '2027-02-01',
      monthlyContribution: 438.8,
      createdAt: todayISO(),
    },
    {
      id: 'goal-2',
      name: 'Reserva de emergência',
      emoji: '🛟',
      target: 12000,
      saved: 4200,
      deadline: '2026-12-01',
      monthlyContribution: 200,
      createdAt: todayISO(),
    },
  ];
}

export function buildDemoSubscriptions() {
  return [
    { id: 'sub-1', name: 'Netflix', amount: 39.9, cycle: 'monthly', category: 'Entretenimento' },
    { id: 'sub-2', name: 'Spotify', amount: 21.9, cycle: 'monthly', category: 'Entretenimento' },
    { id: 'sub-3', name: 'Amazon Prime', amount: 19.9, cycle: 'monthly', category: 'Compras' },
  ];
}

export function buildDemoAlerts() {
  return [
    { id: 'al-1', type: 'invoice', icon: '⚠️', message: 'Sua fatura da Nubank aumentou 27% em relação ao mês passado.' },
    { id: 'al-2', type: 'goal', icon: '🎯', message: 'Você está perto de completar sua meta Inglaterra 2027.' },
    { id: 'al-3', type: 'savings', icon: '💰', message: 'Você economizou R$ 300 a mais do que no mês anterior.' },
  ];
}

export function buildDemoAchievements() {
  return [
    { id: 'ach-1', name: 'Primeira meta', unlocked: true },
    { id: 'ach-2', name: 'Primeiro R$ 1.000 economizado', unlocked: true },
    { id: 'ach-3', name: 'Primeiro mês dentro do orçamento', unlocked: true },
    { id: 'ach-4', name: '30 dias acompanhando as finanças', unlocked: false },
  ];
}
