import { useEffect, useState } from 'react';
import Panel from './Panel';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { currentSubscription, disablePush, enablePush, getPushConfig, pushSupported, sendTestPush } from '../services/pushClient';

/** Phone reminders: one switch per device, at most one notification a day. */
export default function PushSettings() {
  const { getIdToken } = useAuth();
  const [config, setConfig] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const supported = pushSupported();

  useEffect(() => {
    let alive = true;
    getPushConfig().then((c) => alive && setConfig(c));
    if (supported) {
      currentSubscription()
        .then((s) => alive && setSubscribed(Boolean(s)))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [supported]);

  async function run(action, doneMessage) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      if (doneMessage) setMessage(doneMessage);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEnable() {
    await run(async () => {
      await enablePush({ publicKey: config.publicKey, getIdToken });
      setSubscribed(true);
      await sendTestPush({ getIdToken });
    }, 'Lembretes ativados. Mandei uma notificação de teste.');
  }
  async function handleDisable() {
    await run(async () => {
      await disablePush({ getIdToken });
      setSubscribed(false);
    }, 'Lembretes desativados neste aparelho.');
  }
  async function handleTest() {
    await run(async () => {
      const sent = await sendTestPush({ getIdToken });
      if (!sent) throw new Error('Não consegui enviar. Desative e ative de novo.');
    }, 'Teste enviado.');
  }

  return (
    <Panel>
      <p className="font-display font-bold mb-1">Lembretes no celular</p>
      <p className="text-sm text-[var(--color-text-dim)] mb-4">
        Uma notificação por dia, no máximo: orçamento perto do limite, fatura alta, conta fixa que será lançada amanhã e, às segundas, o resumo da semana.
      </p>
      {!supported ? (
        <p className="text-sm text-[var(--color-text-dim)]">
          Este navegador não permite notificações. No iPhone, instale o NOVA na tela inicial (Compartilhar, depois “Adicionar à Tela de Início”) e abra por lá.
        </p>
      ) : config && !config.configured ? (
        <p className="text-sm text-[var(--color-text-dim)]">Os lembretes ainda não estão disponíveis neste servidor.</p>
      ) : subscribed ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleTest} disabled={busy}>
            Enviar um teste
          </Button>
          <Button variant="ghost" onClick={handleDisable} disabled={busy}>
            Desativar neste aparelho
          </Button>
        </div>
      ) : (
        <Button onClick={handleEnable} disabled={busy || !config?.configured}>
          {busy ? 'Ativando...' : 'Ativar lembretes neste aparelho'}
        </Button>
      )}
      {message && <p className="text-sm text-[var(--color-text-dim)] mt-3">{message}</p>}
    </Panel>
  );
}
