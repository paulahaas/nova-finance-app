// Tier-1 categorization: keyword/merchant rules, checked before the
// statistical classifier (tier 2). Ordered roughly by specificity — first
// match wins. Matches against normalizeDescription()'s output (uppercase,
// accents stripped, noise removed), so keywords here are already in that
// shape.

export const KEYWORD_RULES = [
  { keywords: ['IFOOD', 'UBER EATS', 'RAPPI', 'JAMES DELIVERY'], category: 'Alimentação', subcategory: 'Delivery' },
  { keywords: ['RESTAURANTE', 'LANCHONETE', 'PADARIA', 'CAFE', 'BAR '], category: 'Alimentação', subcategory: 'Restaurante' },
  { keywords: ['MERCADO', 'SUPERMERCADO', 'CARREFOUR', 'ANGELONI', 'PAO DE ACUCAR', 'EXTRA', 'ATACADAO'], category: 'Alimentação', subcategory: 'Supermercado' },

  { keywords: ['UBER', '99 ', '99POP', 'CABIFY'], category: 'Transporte', subcategory: 'Uber' },
  { keywords: ['POSTO', 'SHELL', 'IPIRANGA', 'PETROBRAS', 'COMBUSTIVEL'], category: 'Transporte', subcategory: 'Combustível' },
  { keywords: ['METRO', 'ONIBUS', 'BILHETE UNICO', 'BRT'], category: 'Transporte', subcategory: 'Transporte público' },
  { keywords: ['ESTACIONAMENTO', 'PEDAGIO', 'OFICINA', 'AUTOPEÇAS'], category: 'Transporte', subcategory: 'Manutenção' },

  { keywords: ['NETFLIX', 'SPOTIFY', 'PRIME VIDEO', 'DISNEY', 'HBO MAX', 'YOUTUBE PREMIUM', 'ICLOUD', 'GOOGLE ONE'], category: 'Assinaturas' },

  { keywords: ['FARMACIA', 'DROGASIL', 'DROGARIA', 'PACHECO', 'RAIA'], category: 'Saúde', subcategory: 'Farmácia' },
  { keywords: ['HOSPITAL', 'CLINICA', 'CONSULTA', 'LABORATORIO', 'PLANO DE SAUDE', 'UNIMED', 'AMIL'], category: 'Saúde' },
  { keywords: ['ACADEMIA', 'SMART FIT', 'GYMPASS', 'TOTALPASS'], category: 'Saúde', subcategory: 'Academia' },

  { keywords: ['AMAZON', 'MERCADO LIVRE', 'SHOPEE', 'ALIEXPRESS', 'SHEIN', 'MAGAZINE LUIZA', 'MAGALU'], category: 'Compras' },

  { keywords: ['ALUGUEL', 'CONDOMINIO', 'IMOBILIARIA'], category: 'Moradia', subcategory: 'Aluguel' },
  { keywords: ['LUZ', 'ENERGIA', 'CELESC', 'CEMIG', 'COPEL', 'ELETROPAULO'], category: 'Moradia', subcategory: 'Energia' },
  { keywords: ['AGUA', 'SANEAMENTO', 'CASAN', 'SABESP'], category: 'Moradia', subcategory: 'Água' },
  { keywords: ['INTERNET', 'VIVO FIBRA', 'CLARO', 'OI FIBRA', 'NET VIRTUA', 'TELEFONE', 'CELULAR', 'CLARO MOVEL', 'VIVO MOVEL'], category: 'Moradia', subcategory: 'Internet/Telefone' },

  { keywords: ['FACULDADE', 'UNIVERSIDADE', 'CURSO', 'ESCOLA', 'MENSALIDADE ESCOLAR', 'UDEMY', 'ALURA'], category: 'Educação' },

  { keywords: ['CINEMA', 'INGRESSO', 'SHOW', 'TEATRO', 'BALADA'], category: 'Entretenimento' },

  { keywords: ['CIA AEREA', 'LATAM', 'GOL LINHAS', 'AZUL LINHAS', 'HOTEL', 'AIRBNB', 'DECOLAR', 'BOOKING'], category: 'Viagens' },

  { keywords: ['SEGURO', 'PORTO SEGURO', 'BRADESCO SEGUROS'], category: 'Contas' },
  { keywords: ['IMPOSTO', 'IPTU', 'IPVA', 'DARF', 'DAS ', 'RECEITA FEDERAL'], category: 'Impostos' },

  { keywords: ['SALARIO', 'PAGAMENTO SALARIO', 'FOLHA DE PAGAMENTO'], category: 'Entrada', subcategory: 'Salário' },
  { keywords: ['PIX RECEBIDO', 'TRANSFERENCIA RECEBIDA', 'TED RECEBIDA'], category: 'Entrada', subcategory: 'Transferência' },
];

// Picks the LONGEST matching keyword across all rules, not the first rule
// in array order — otherwise a generic keyword ("MERCADO" -> Alimentação)
// can shadow a more specific one that contains it ("MERCADO LIVRE" ->
// Compras), since both would technically match via .includes().
export function applyKeywordRules(normalizedDescription) {
  let best = null;
  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (normalizedDescription.includes(kw) && (!best || kw.length > best.keyword.length)) {
        best = { keyword: kw, category: rule.category, subcategory: rule.subcategory ?? null };
      }
    }
  }
  return best ? { category: best.category, subcategory: best.subcategory } : null;
}
