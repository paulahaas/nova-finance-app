import { useEffect, useRef, useState } from 'react';

export default function ProgressBar({ value, max = 100, accent = true, height = 8, animateOnMount = false, glowNearComplete = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const [displayPct, setDisplayPct] = useState(animateOnMount ? 0 : pct);
  const barRef = useRef(null);

  useEffect(() => {
    if (!animateOnMount) {
      setDisplayPct(pct);
      return;
    }
    // Fill from 0 once the bar has actually entered the viewport, instead
    // of firing off-screen (e.g. a goal card further down the Home feed).
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDisplayPct(pct);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayPct(pct);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, animateOnMount]);

  const isGlowing = glowNearComplete && pct >= 90;

  return (
    <div
      ref={barRef}
      className="w-full rounded-full bg-[var(--color-graphite)] overflow-hidden"
      style={{ height }}
    >
      <div
        className={isGlowing ? 'h-full rounded-full transition-all duration-700 ease-out animate-pulse-soft' : 'h-full rounded-full transition-all duration-700 ease-out'}
        style={{
          width: `${displayPct}%`,
          background: accent
            ? 'linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))'
            : 'var(--color-text-dim)',
          boxShadow: isGlowing ? '0 0 12px var(--color-accent)' : 'none',
        }}
      />
    </div>
  );
}
