import { MessageCircle, Plus } from 'lucide-react';
import Panel from '../components/Panel';
import Button from '../components/Button';

// Support contact. Update the number here if it ever changes — it's the
// only place it's hard-coded.
const WHATSAPP_NUMBER = '5548991390799'; // country code 55 + area code 48
const WHATSAPP_DISPLAY = '+55 48 99139-0799';
const WHATSAPP_MESSAGE = 'Olá! Estou com uma dúvida sobre o NOVA.';

const STEPS = [
  ['Dê um nome ao cartão', 'Em Cartões, toque em “Adicionar cartão” e escolha o nome, como “Cartão Nubank”. É só isso.'],
  ['Conte o que gastou', 'No Copilot ou no botão (+) da Home, escreva do seu jeito: “gastei 45 no ifood”.'],
  ['Acompanhe', 'O NOVA organiza por categoria, mostra quanto você ainda pode gastar e avisa quando algo sai do combinado.'],
];

const FAQ = [
  ['O NOVA acessa a minha conta do banco?', 'Não. Ele nunca se conecta ao seu banco. Quem passa os gastos é você, pelo chat, pelo botão (+) ou importando o extrato.'],
  ['Preciso colocar o número do cartão?', 'Não. Pedimos só um nome. Se quiser, você pode informar os últimos 4 dígitos, a validade, o limite e o dia do vencimento, mas nada disso é obrigatório. Nunca guardamos o número completo, o CVV nem a senha.'],
  ['Como registro um gasto?', 'Escreva no Copilot ou no botão (+) da Home: “gastei 45 no ifood”, “uber 18,90 ontem, no nubank”. Antes de salvar, o NOVA mostra o que entendeu e você confirma.'],
  ['Como registro uma compra parcelada?', 'Diga o valor total e as parcelas: “tênis 300 em 3x”. O NOVA divide pelos meses seguintes.'],
  ['Errei um valor. Como corrijo?', 'Diga ao Copilot: “o uber foi 21” corrige o valor, e “apaga o último” remove o último lançamento.'],
  ['Como cadastro aluguel e outras contas que se repetem?', 'Em Mais, abra “Contas fixas”. Você cadastra uma vez e o NOVA lança sozinho todo mês, no dia combinado.'],
  ['Como instalo o NOVA no celular?', 'Abra o site no navegador do celular e use “Adicionar à tela inicial” no menu. Ele fica com ícone próprio e abre como um app.'],
  ['Esqueci a senha.', 'Na tela de entrada, digite seu e-mail e toque em “Esqueci minha senha”. Enviamos um link para criar uma nova.'],
  ['Posso levar meus dados comigo?', 'Pode. Em Ajustes você baixa as transações em CSV (abre no Excel) ou um backup completo em JSON.'],
];

export default function Help() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Como podemos ajudar?</h1>
        <p className="text-sm text-[var(--color-text-dim)] mt-1">O jeito mais rápido de usar o NOVA, em três passos.</p>
      </div>

      <ol className="space-y-3">
        {STEPS.map(([title, text], i) => (
          <li key={title}>
            <Panel className="!p-5 flex gap-4 items-start">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] font-display text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-display font-bold">{title}</p>
                <p className="text-sm text-[var(--color-text-dim)] mt-1">{text}</p>
              </div>
            </Panel>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-text-dim)] mb-4">Perguntas frequentes</h2>
        <div className="space-y-2">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                {question}
                <Plus size={18} className="shrink-0 text-[var(--color-text-dim)] transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-dim)]">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <Panel className="text-center py-10">
        <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent-soft)]">
          <MessageCircle size={26} className="text-[var(--color-accent)]" />
        </div>
        <p className="font-display font-bold mb-1">Ainda com dúvida? Fale com a gente</p>
        <p className="text-sm text-[var(--color-text-dim)] mb-6">
          Atendimento 24 horas pelo WhatsApp, para explicar como o NOVA funciona ou ajudar se algo não saiu como esperado.
        </p>
        <Button as="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
          Falar no WhatsApp
        </Button>
        <p className="text-sm text-[var(--color-text-faint)] mt-4 tabular">{WHATSAPP_DISPLAY}</p>
      </Panel>

      <section className="rounded-3xl bg-[var(--color-ink)] px-6 py-8 text-white">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Sobre nós</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/80">
          <p>
            O NOVA existe para ajudar você a organizar o seu dinheiro, sem complicação. Você conta o que gastou e a gente organiza: categorias, orçamento, metas e avisos.
          </p>
          <p>
            <b className="text-white">O que não fazemos.</b> Não pedimos o número completo do cartão, o CVV nem senhas de banco, e não acessamos a sua conta bancária. Um cartão aqui é só um nome que você escolhe.
          </p>
          <p>
            <b className="text-white">O que guardamos.</b> Só o que você informa: seus gastos, metas e contas fixas e, se quiser, os últimos 4 dígitos e a validade de um cartão. Esses dados ficam na sua conta, protegidos por login e senha.
          </p>
          <p>
            <b className="text-white">Sobre o Copilot.</b> Quando você conversa com ele, as mensagens e os valores que você registrou são enviados a um serviço de inteligência artificial, apenas para gerar a resposta.
          </p>
        </div>
      </section>
    </div>
  );
}
