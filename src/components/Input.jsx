import clsx from 'clsx';

// Shared text/number input. Font-size is fixed at 16px globally (see
// index.css) to stop iOS Safari auto-zooming on focus, and `inputMode`
// lets money/day fields open the numeric keypad on mobile without
// changing the underlying value type.
export default function Input({ label, error, className, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-[var(--color-text-dim)]">{label}</span>}
      <input
        className={clsx(
          'rounded-xl bg-[var(--color-surface-2)] border px-4 py-3.5 outline-none transition-colors',
          error ? 'border-[var(--color-negative)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
          className
        )}
        {...props}
      />
      {error && <span className="text-sm text-[var(--color-negative)]">{error}</span>}
    </label>
  );
}
