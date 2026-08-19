import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/welcome'), 1800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)]">
      <h1 className="text-5xl font-semibold tracking-tight animate-fade-in-up">
        NOVA<span className="text-[var(--color-accent)]">.</span>
      </h1>
      <p className="mt-3 text-[var(--color-text-dim)] animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        Seu dinheiro. Sob seu controle.
      </p>
      <div className="mt-10 h-1 w-24 rounded-full bg-[var(--color-graphite)] overflow-hidden">
        <div className="h-full w-1/2 bg-[var(--color-accent)] animate-pulse-soft" />
      </div>
    </div>
  );
}
