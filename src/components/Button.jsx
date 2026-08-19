import clsx from 'clsx';

const variants = {
  primary: 'bg-[var(--color-accent)] text-white hover:brightness-110 active:brightness-95',
  secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-graphite)]',
  ghost: 'bg-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]',
  outline: 'bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text-dim)]',
};

export default function Button({ variant = 'primary', className, children, as: As = 'button', ...props }) {
  return (
    <As
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </As>
  );
}
