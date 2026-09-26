import { Link } from 'react-router-dom';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateLong } from '../../utils/format';

export default function Goals() {
  const { goals } = useData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Minhas metas</h1>

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
