// Everything the card pages say about each type of card. Nothing here needs
// data from the bank: the NOVA never connects to the user's account, she
// tells it what she spent.
export const CARD_TYPES = ['credit', 'debit', 'both'];

export const CARD_COPY = {
  credit: {
    label: 'Crédito',
    name: 'Cartão de crédito',
    index: 1,
    desc: 'Compre agora, pague na fatura. Dê um nome ao cartão, como “Cartão Nubank”, e pronto. Limite e fatura você só informa se quiser.',
    line: 'Só o nome · o resto é opcional',
    giant: 'CRÉDITO',
    giantSize: 5.4,
    giantMax: 190,
    tileSub: 'só o nome, o resto é opcional',
    tag: 'Adicionar crédito',
    p1: 'Você não precisa informar nada do banco. O NOVA não acessa sua conta: quem passa os gastos é você, pelo chat ou importando o extrato.',
    p2: 'Comprou parcelado? “tênis 300 em 3x” vira três parcelas, uma em cada mês. Se você informar o limite, o NOVA avisa quando a fatura passar de 70% dele.',
    chips: [['iFood', '− R$ 45'], ['Uber', '− R$ 18,90'], ['Tênis', '3x R$ 100']],
    lead: 'Para quem paga no fim do mês e quer registrar os gastos do cartão.',
    items: [
      ['Nome', 'do seu jeito: Cartão Nubank, Cartão Banco do Brasil'],
      ['Gastos', 'você passa pelo chat ou importando o extrato'],
      ['Limite', 'opcional, para ver quanto já usou'],
      ['Vencimento', 'opcional, o dia em que a fatura vence'],
      ['Alerta', 'aviso quando a fatura passa de 70% do limite informado'],
    ],
    cta: 'Adicionar cartão de crédito',
  },
  debit: {
    label: 'Débito',
    name: 'Cartão de débito',
    index: 2,
    desc: 'O dinheiro sai direto da conta. Dê um nome ao cartão e pronto, sem fatura e sem limite para controlar.',
    line: 'Só o nome · gastos pelo chat',
    giant: 'DÉBITO',
    giantSize: 4.7,
    giantMax: 230,
    tileSub: 'só o nome, gastos pelo chat',
    tag: 'Adicionar débito',
    p1: 'O cartão de débito não gera fatura: o valor sai da conta na hora. No NOVA, cada gasto entra como transação, com data e categoria, e aparece no resumo do mês.',
    p2: 'Diga “gastei 18 no mercado” para o Copilot ou importe o extrato da conta. Os dois caminhos alimentam o mesmo histórico, e o NOVA não precisa acessar o seu banco.',
    chips: [['Mercado', '− R$ 18'], ['Pix', '+ R$ 90'], ['Padaria', '− R$ 12']],
    lead: 'Para quem prefere gastar só o que já tem na conta.',
    items: [
      ['Nome', 'do seu jeito: Cartão Nubank, Cartão Banco do Brasil'],
      ['Gastos', 'você passa pelo chat ou importando o extrato'],
      ['Sem fatura', 'nada de limite nem vencimento para acompanhar'],
      ['Categorias', 'o NOVA sugere a categoria de cada gasto'],
      ['Resumo', 'os gastos entram no resumo do mês'],
    ],
    cta: 'Adicionar cartão de débito',
  },
  both: {
    label: 'Crédito e débito',
    name: 'Cartão de crédito e débito',
    index: 3,
    desc: 'Crédito e débito no mesmo cartão. Um cadastro só, com o nome que você escolher. O resto é opcional.',
    line: 'Só o nome · um cadastro só',
    giant: 'DUPLO',
    giantSize: 4.5,
    giantMax: 240,
    tileSub: 'os dois em um só cadastro',
    tag: 'Adicionar crédito e débito',
    p1: 'Muitos cartões fazem as duas coisas. Cadastre uma vez, com o nome que quiser, e use o mesmo cartão para os gastos no débito e no crédito.',
    p2: 'O parcelamento pelo chat e a importação de extrato funcionam do mesmo jeito, sem repetir o cartão na sua lista. Limite e vencimento entram só se você quiser.',
    chips: [['iFood', '− R$ 45'], ['Mercado', '− R$ 18'], ['Tênis', '3x R$ 100']],
    lead: 'Para o cartão que serve de débito e de crédito, tudo no mesmo lugar.',
    items: [
      ['Nome', 'do seu jeito: Cartão Nubank, Cartão Banco do Brasil'],
      ['Um cadastro só', 'o cartão aparece uma vez na sua lista'],
      ['Gastos', 'pelo chat ou extrato, nos dois jeitos de pagar'],
      ['Parcelas', '“tênis 300 em 3x” divide pelos meses seguintes'],
      ['Opcional', 'limite e vencimento, se você quiser acompanhar'],
    ],
    cta: 'Adicionar cartão de crédito e débito',
  },
};

/** Size of the giant word so any word fits the width (7 letters ≈ 5.4). */
export function giantSizeFor(word) {
  return word.length * 0.74 + 0.3;
}
