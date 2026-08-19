import { useState } from 'react';
import clsx from 'clsx';
import Banks from '../banks/Banks';
import Transactions from '../transactions/Transactions';

const TABS = [
  { id: 'accounts', label: 'Contas' },
  { id: 'transactions', label: 'Transações' },
];

// Mobile's "Money" tab — the bottom nav groups accounts and transactions
// under one destination instead of two, so this reuses the same Banks and
// Transactions pages the desktop sidebar links to directly (no logic
// duplicated), just switched by a segmented control instead of a route.
export default function Money() {
  const [tab, setTab] = useState('accounts');

  return (
    <div className="space-y-6">
      <div className="flex rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 rounded-full py-2.5 text-sm font-medium transition-colors min-h-[44px]',
              tab === t.id ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-dim)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' ? <Banks /> : <Transactions />}
    </div>
  );
}
