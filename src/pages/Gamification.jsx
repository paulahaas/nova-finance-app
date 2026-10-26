import Panel from '../components/Panel';
import ProgressBar from '../components/ProgressBar';
import { useData } from '../contexts/DataContext';
import { levelFromXp, xpFromActivity } from '../services/achievementsService';
import clsx from 'clsx';

export default function Gamification() {
  const { achievements, transactions, monthlyReports, recurringBills } = useData();
  const xp = xpFromActivity({
    transactions: transactions.length,
    achievementsUnlocked: achievements.filter((a) => a.unlocked).length,
    monthlyReports: monthlyReports.length,
    recurringBills: recurringBills.length,
  });
  const { level, title, xpInLevel, xpForNext } = levelFromXp(xp);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Progresso</h1>

      <Panel className="text-center py-10">
        <p className="text-sm text-[var(--color-text-dim)] mb-1">Nível {level}</p>
        <p className="font-display text-2xl font-extrabold mb-6">{title}</p>
        <ProgressBar value={xpInLevel} max={xpForNext} />
        <p className="text-sm text-[var(--color-text-dim)] mt-3 tabular">
          {xpInLevel} / {xpForNext} XP
        </p>
        <p className="text-xs text-[var(--color-text-faint)] mt-4 max-w-xs mx-auto">
          Você ganha XP registrando gastos, fechando o mês, cadastrando contas fixas e desbloqueando conquistas.
        </p>
      </Panel>

      <div>
        <p className="font-display font-bold mb-3">Conquistas</p>
        {achievements.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--color-text-dim)]">As conquistas aparecem quando você cria a meta prioritária do Intercâmbio.</p>
          </Panel>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <Panel key={a.id} className={clsx('text-center py-6', !a.unlocked && 'opacity-50')}>
                <p className="text-2xl mb-2">{a.unlocked ? '🏆' : '🔒'}</p>
                <p className="text-sm font-semibold">{a.name}</p>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
