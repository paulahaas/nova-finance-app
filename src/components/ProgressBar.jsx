export default function ProgressBar({ value, max = 100, accent = true, height = 8 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className="w-full rounded-full bg-[var(--color-graphite)] overflow-hidden"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: accent
            ? 'linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))'
            : 'var(--color-text-dim)',
        }}
      />
    </div>
  );
}
