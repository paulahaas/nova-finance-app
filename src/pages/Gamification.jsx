import Panel from '../components/Panel';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import clsx from 'clsx';

export default function Gamification() {
  const { user } = useAuth();
  const { achievements } = useData();
  const xpForNextLevel = 2000;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Progresso</h1>

      <Panel className="text-center py-10">
        <p className="text-sm text-[var(--color-text-dim)] mb-1">Nível {user?.level ?? 1}</p>
        <p className="text-2xl font-semibold mb-6">Organizador financeiro</p>
        <ProgressBar value={user?.xp ?? 0} max={xpForNextLevel} />
        <p className="text-sm text-[var(--color-text-dim)] mt-3 tabular">
          {user?.xp ?? 0} / {xpForNextLevel} XP
        </p>
      </Panel>

      <div>
        <p className="font-medium mb-3">Conquistas</p>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => (
            <Panel key={a.id} className={clsx('text-center py-6', !a.unlocked && 'opacity-40')}>
              <p className="text-2xl mb-2">{a.unlocked ? '🏆' : '🔒'}</p>
              <p className="text-sm">{a.name}</p>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
