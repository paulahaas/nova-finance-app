import { Link } from 'react-router-dom';
import { ChevronRight, Plane } from 'lucide-react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateLong } from '../../utils/format';

export default function Goals() {
  const { goals } = useData();
  const priorityGoal = goals.find((g) => g.priority);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Minhas metas</h1>

      <Link to="/app/goals/travel" className="block">
        <Panel className="flex items-center gap-4 hover:border-[var(--color-accent)] transition-colors shimmer-border">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent-soft)] shrink-0">
            <Plane size={20} className="text-[var(--color-accent)]" />
          </span>
          <div className="flex-1">
            <p className="font-medium">{priorityGoal ? `⭐ ${priorityGoal.name}` : 'Criar meta prioritária: Intercâmbio'}</p>
            <p className="text-sm text-[var(--color-text-dim)]">
              {priorityGoal ? 'Fases, países e checklist do intercâmbio.' : 'Fases, comparação de países e checklist com prazos.'}
            </p>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-faint)] shrink-0" />
        </Panel>
      </Link>

      <div className="space-y-4">
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <Panel key={g.id}>
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {g.image ? (
                    <img src={g.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <span className="text-xl shrink-0">{g.emoji}</span>
                  )}
                  <p className="font-medium truncate">{g.name}</p>
                </div>
                <p className="text-sm text-[var(--color-text-dim)] shrink-0">{pct}%</p>
              </div>
              <ProgressBar value={g.saved} max={g.target} animateOnMount glowNearComplete />
              <div className="flex justify-between mt-3 text-sm text-[var(--color-text-dim)]">
                <span>
                  {formatCurrency(g.saved)} de {formatCurrency(g.target)}
                </span>
                <span>Previsão: {formatDateLong(g.deadline)}</span>
              </div>
            </Panel>
          );
        })}
      </div>

      <Button as={Link} to="/app/goals/new" variant="outline" className="w-full">
        + Nova meta
      </Button>
    </div>
  );
}
