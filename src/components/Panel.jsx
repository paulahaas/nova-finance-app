import clsx from 'clsx';

export default function Panel({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6',
        'animate-fade-in-up',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
