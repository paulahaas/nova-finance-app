// Curated PT-BR training examples for the tier-2 classifier (see
// classifier.js). Covers merchants/descriptions that the tier-1 keyword
// rules (rules.js) won't catch by exact name — generic or less common
// transaction text. Categories match buildDemoCategories() in
// src/data/demoData.js, plus 'Entrada' for income.
//
// This is a small, hand-written seed set, not real user data (spec section
// 32/22: never train on real financial data without consent) — it only
// teaches the classifier the general vocabulary of each category.

export const TRAINING_EXAMPLES = [
  // Alimentação
  { text: 'padaria pao de acucar centro', category: 'Alimentação' },
  { text: 'restaurante prato feito', category: 'Alimentação' },
  { text: 'lanchonete esquina', category: 'Alimentação' },
  { text: 'acougue bom preco', category: 'Alimentação' },
  { text: 'hortifruti sacolao', category: 'Alimentação' },
  { text: 'pizzaria bella napoli', category: 'Alimentação' },
  { text: 'feira livre municipal', category: 'Alimentação' },
  { text: 'quitanda do bairro', category: 'Alimentação' },
  { text: 'sorveteria gelato', category: 'Alimentação' },
  { text: 'compra supermercado semanal', category: 'Alimentação' },
  { text: 'delivery comida japonesa', category: 'Alimentação' },
  { text: 'cafeteria expresso', category: 'Alimentação' },

  // Transporte
  { text: 'taxi corrida centro', category: 'Transporte' },
  { text: 'estacionamento shopping', category: 'Transporte' },
  { text: 'pedagio rodovia', category: 'Transporte' },
  { text: 'oficina mecanica troca oleo', category: 'Transporte' },
  { text: 'lavagem de carro', category: 'Transporte' },
  { text: 'seguro veicular parcela', category: 'Transporte' },
  { text: 'multa transito', category: 'Transporte' },
  { text: 'aluguel de carro locadora', category: 'Transporte' },
  { text: 'bicicletario mensal', category: 'Transporte' },
  { text: 'recarga bilhete transporte', category: 'Transporte' },

  // Moradia
  { text: 'condominio predial mensal', category: 'Moradia' },
  { text: 'conta de gas encanado', category: 'Moradia' },
  { text: 'material de construcao reforma', category: 'Moradia' },
  { text: 'moveis para sala', category: 'Moradia' },
  { text: 'servico de limpeza domestica', category: 'Moradia' },
  { text: 'seguro residencial anual', category: 'Moradia' },
  { text: 'conserto encanador', category: 'Moradia' },
  { text: 'eletricista instalacao', category: 'Moradia' },
  { text: 'assinatura tv a cabo', category: 'Moradia' },
  { text: 'pacote internet fibra optica', category: 'Moradia' },

  // Saúde
  { text: 'consulta medica particular', category: 'Saúde' },
  { text: 'exame laboratorial sangue', category: 'Saúde' },
  { text: 'dentista tratamento canal', category: 'Saúde' },
  { text: 'fisioterapia sessao', category: 'Saúde' },
  { text: 'oculos de grau otica', category: 'Saúde' },
  { text: 'psicologo sessao terapia', category: 'Saúde' },
  { text: 'suplemento vitaminas', category: 'Saúde' },
  { text: 'plano odontologico mensal', category: 'Saúde' },
  { text: 'personal trainer', category: 'Saúde' },
  { text: 'yoga aula mensal', category: 'Saúde' },

  // Educação
  { text: 'mensalidade curso ingles', category: 'Educação' },
  { text: 'material escolar papelaria', category: 'Educação' },
  { text: 'livro tecnico faculdade', category: 'Educação' },
  { text: 'curso online programacao', category: 'Educação' },
  { text: 'matricula pos graduacao', category: 'Educação' },
  { text: 'aula particular reforco', category: 'Educação' },
  { text: 'certificacao profissional exame', category: 'Educação' },
  { text: 'assinatura plataforma de ensino', category: 'Educação' },

  // Entretenimento
  { text: 'ingresso cinema sessao', category: 'Entretenimento' },
  { text: 'show de musica ingresso', category: 'Entretenimento' },
  { text: 'jogo de videogame loja digital', category: 'Entretenimento' },
  { text: 'boliche noite com amigos', category: 'Entretenimento' },
  { text: 'parque de diversoes entrada', category: 'Entretenimento' },
  { text: 'clube noturno entrada', category: 'Entretenimento' },
  { text: 'livraria compra romance', category: 'Entretenimento' },
  { text: 'evento esportivo ingresso', category: 'Entretenimento' },

  // Compras
  { text: 'loja de roupas shopping', category: 'Compras' },
  { text: 'calcados tenis esportivo', category: 'Compras' },
  { text: 'eletronico fone de ouvido', category: 'Compras' },
  { text: 'perfumaria cosmeticos', category: 'Compras' },
  { text: 'presente aniversario loja', category: 'Compras' },
  { text: 'acessorios celular capinha', category: 'Compras' },
  { text: 'loja de departamento', category: 'Compras' },
  { text: 'compra online marketplace', category: 'Compras' },

  // Viagens
  { text: 'passagem de onibus interestadual', category: 'Viagens' },
  { text: 'pousada litoral', category: 'Viagens' },
  { text: 'aluguel de temporada', category: 'Viagens' },
  { text: 'seguro viagem internacional', category: 'Viagens' },
  { text: 'passeio turistico excursao', category: 'Viagens' },
  { text: 'aluguel de carro viagem', category: 'Viagens' },
  { text: 'bagagem extra companhia aerea', category: 'Viagens' },

  // Assinaturas
  { text: 'assinatura revista digital', category: 'Assinaturas' },
  { text: 'servico de streaming musica', category: 'Assinaturas' },
  { text: 'clube de assinatura mensal', category: 'Assinaturas' },
  { text: 'software licenca mensal', category: 'Assinaturas' },
  { text: 'armazenamento em nuvem plano', category: 'Assinaturas' },
  { text: 'aplicativo premium assinatura', category: 'Assinaturas' },

  // Entrada
  { text: 'deposito em conta', category: 'Entrada' },
  { text: 'reembolso despesa', category: 'Entrada' },
  { text: 'restituicao imposto de renda', category: 'Entrada' },
  { text: 'pagamento freelance recebido', category: 'Entrada' },
  { text: 'venda item usado recebido', category: 'Entrada' },
  { text: 'rendimento aplicacao financeira', category: 'Entrada' },
  { text: 'decimo terceiro salario', category: 'Entrada' },
  { text: 'bonus pagamento empresa', category: 'Entrada' },

  // Outros
  { text: 'saque caixa eletronico', category: 'Outros' },
  { text: 'tarifa bancaria mensal', category: 'Outros' },
  { text: 'doacao instituicao', category: 'Outros' },
  { text: 'cartorio taxa servico', category: 'Outros' },
  { text: 'multa administrativa', category: 'Outros' },
  { text: 'pagamento diverso nao identificado', category: 'Outros' },
];
