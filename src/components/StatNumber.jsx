import clsx from 'clsx';

export default function StatNumber({ label, value, sub, size = 'lg', tone = 'default' }) {
  const sizes = {
    xl: 'text-5xl md:text-6xl',
    lg: 'text-3xl md:text-4xl',
    md: 'text-2xl',
  };
  const tones = {
    default: 'text-[var(--color-text)]',
    positive: 'text-[var(--color-positive)]',
    negative: 'text-[var(--color-negative)]',
  };
  return (
    <div>
      {label && <p className="text-sm text-[var(--color-text-dim)] mb-1">{label}</p>}
      <p className={clsx('font-semibold tabular tracking-tight', sizes[size], tones[tone])}>{value}</p>
      {sub && <p className="text-sm text-[var(--color-text-dim)] mt-1">{sub}</p>}
    </div>
  );
}
