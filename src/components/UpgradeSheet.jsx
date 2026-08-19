import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { formatPrice, PLANS, PLAN_IDS } from '../config/plans';

const BENEFITS = [
  'Bancos ilimitados',
  'Contas ilimitadas',
  'Cartões ilimitados',
  'Metas ilimitadas',
  'Copilot ampliado',
  'Insights avançados',
  'Relatórios avançados',
];

export default function UpgradeSheet({ title = 'Desbloqueie o NOVA Pro', description, onClose }) {
  const navigate = useNavigate();
  const price = PLANS[PLAN_IDS.PRO].price.monthly;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full md:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 pb-safe animate-fade-in-up">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--color-graphite)] md:hidden" />
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        {description && <p className="text-[var(--color-text-dim)] mb-6">{description}</p>}

        <ul className="space-y-2 mb-6">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <span className="text-[var(--color-accent)]">✓</span> {b}
            </li>
          ))}
        </ul>

        <p className="text-3xl font-semibold mb-6 tabular">
          {formatPrice(price)}
          <span className="text-base font-normal text-[var(--color-text-dim)]">/mês</span>
        </p>

        <div className="flex flex-col gap-3">
          <Button variant="primary" onClick={() => navigate('/pro')}>
            Assinar NOVA Pro
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Continuar no plano gratuito
          </Button>
        </div>
      </div>
    </div>
  );
}
