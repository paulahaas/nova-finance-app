import { Link } from 'react-router-dom';
import { ChevronRight, CalendarCheck } from 'lucide-react';
import Panel from '../../components/Panel';
import { useData } from '../../contexts/DataContext';
import { buildInsights } from '../../services/insightsService';

export default function Insights() {
  const { transactions, subscriptions } = useData();
  const insights = buildInsights({ transactions, subscriptions });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insights</h1>

      <Link to="/app/reports/monthly-close" className="block">
        <Panel className="flex items-center gap-4 hover:border-[var(--color-accent)] transition-colors">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent-soft)] shrink-0">
            <CalendarCheck size={20} className="text-[var(--color-accent)]" />
          </span>
          <div className="flex-1">
            <p className="font-medium">Fechamento do mês</p>
            <p className="text-sm text-[var(--color-text-dim)]">Totais por categoria, sugestões de corte e orçamento pro mês seguinte.</p>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-faint)] shrink-0" />
        </Panel>
      </Link>

      {insights.length === 0 ? (
        <Panel className="text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            Ainda não há dados suficientes. Registre ou importe transações e os insights aparecem aqui.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {insights.map((i, idx) => (
            <Panel key={idx} className={idx === 0 ? 'shimmer-border' : ''}>
              <p className="text-sm">
                {i.icon} {i.text}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
