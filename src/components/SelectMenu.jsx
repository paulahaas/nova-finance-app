import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// A dropdown built entirely from our own markup — no native <select>.
// Windows Chrome ignores `color-scheme: dark` for the highlighted/hovered
// row inside a native select popup (it's drawn by the OS combobox, not the
// page), so that row always shows a light system highlight no matter what
// CSS says. This sidesteps the problem entirely instead of fighting it.
export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  triggerClassName,
  pill = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          triggerClassName ??
          clsx(
            'flex items-center gap-2 min-h-[44px] text-sm outline-none transition-colors',
            pill
              ? 'rounded-full px-4 border border-[var(--color-border)] bg-transparent text-[var(--color-text-dim)]'
              : 'w-full justify-between rounded-xl px-4 py-3.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]'
          )
        }
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className={clsx('shrink-0 transition-transform text-[var(--color-text-faint)]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 min-w-full max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                'w-full text-left px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
                opt.value === value
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
