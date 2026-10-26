import clsx from 'clsx';

const variants = {
  primary: 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-accent)] active:brightness-95',
  secondary: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text-dim)]',
  ghost: 'bg-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]',
  outline: 'bg-transparent border border-[var(--color-ink)]/30 text-[var(--color-text)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)]',
};

export default function Button({ variant = 'primary', className, children, as: As = 'button', ...props }) {
  return (
    <As
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-[6px] px-6 py-3 text-sm font-display font-bold tracking-[0.02em] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </As>
  );
}
