import { MessageCircle } from 'lucide-react';
import Panel from '../components/Panel';
import Button from '../components/Button';

// Support contact. Update the number here if it ever changes — it's the
// only place it's hard-coded.
const WHATSAPP_NUMBER = '5548991390799'; // country code 55 + area code 48
const WHATSAPP_DISPLAY = '+55 48 99139-0799';
const WHATSAPP_MESSAGE = 'Olá! Estou com uma dúvida sobre o NOVA.';

export default function Help() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Precisa de ajuda?</h1>

      <Panel className="text-center py-10">
        <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent-soft)]">
          <MessageCircle size={26} className="text-[var(--color-accent)]" />
        </div>
        <p className="font-medium mb-1">Fale direto com a gente</p>
        <p className="text-sm text-[var(--color-text-dim)] mb-6">
          Qualquer dúvida sobre o NOVA — contas, cobrança, ou algo que não funcionou como esperado — responde rápido pelo WhatsApp.
        </p>
        <Button as="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
          Falar no WhatsApp
        </Button>
        <p className="text-sm text-[var(--color-text-faint)] mt-4 tabular">{WHATSAPP_DISPLAY}</p>
      </Panel>
    </div>
  );
}
