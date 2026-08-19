import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { PLANS, PLAN_IDS, formatPrice } from '../../config/plans';
import { getGatewayStatus, startCheckout } from '../../services/paymentService';

const BENEFITS = [
  'Bancos ilimitados',
  'Contas ilimitadas',
  'Cartões ilimitados',
  'Metas ilimitadas',
  'Copilot ampliado',
  'Insights avançados',
  'Relatórios avançados',
  'Previsões avançadas',
  'Histórico completo',
  'Exportação de dados',
  'Novos recursos premium',
];

export default function ProPlan() {
  const { user, upgradeToPro, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isPro = user?.plan === 'pro';
  const price = PLANS[PLAN_IDS.PRO].price.monthly;

  useEffect(() => {
    getGatewayStatus().then((s) => setGatewayConfigured(s.gatewayConfigured));
  }, []);

  async function handleSubscribe() {
    setError('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (!gatewayConfigured) {
      // Demo mode: no real Stripe gateway is configured, so this simply
      // flips the local plan flag. See server/services/paymentService.js
      // for the real Checkout/webhook flow once Stripe is connected.
      await upgradeToPro();
      navigate('/app/profile');
      return;
    }

    setSubmitting(true);
    try {
      const { url } = await startCheckout(getIdToken);
      window.location.href = url; // hand off to Stripe Checkout
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-12 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center mb-2">NOVA Pro</h1>
      <p className="text-[var(--color-text-dim)] text-center mb-10">
        Tenha controle completo da sua vida financeira.
      </p>

      <Panel>
        <p className="text-4xl font-semibold text-center tabular mb-1">
          {formatPrice(price)}
          <span className="text-base font-normal text-[var(--color-text-dim)]">/mês</span>
        </p>
        {!gatewayConfigured && (
          <p className="text-center text-xs text-[var(--color-warning)] mt-2">
            Modo de demonstração — nenhum gateway de pagamento configurado
          </p>
        )}

        <ul className="space-y-2.5 my-8">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-accent)]">✓</span> {b}
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-[var(--color-negative)] mb-4">{error}</p>}

        {isPro ? (
          <div className="text-center">
            <p className="text-sm text-[var(--color-positive)] mb-4">Você já é assinante NOVA Pro.</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/app/profile')}>
              Gerenciar assinatura
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={handleSubscribe} disabled={submitting}>
            {submitting ? 'Redirecionando...' : 'Assinar NOVA Pro'}
          </Button>
        )}
      </Panel>

      <p className="text-xs text-center text-[var(--color-text-faint)] mt-6">
        Você pode cancelar quando quiser, sem burocracia.
      </p>
    </div>
  );
}
