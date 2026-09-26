import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrors';

const inputClass =
  'rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3.5 text-base outline-none focus:border-[var(--color-accent)] transition-colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, resetPassword, startDemo, authMode } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await login({ email, password });
      // RequireAuth decides between /app and /onboarding once the user's
      // profile has loaded — see components/RequireAuth.jsx.
      navigate('/app');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Digite seu e-mail acima e toque em "Esqueci minha senha" de novo.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setInfo('Se esse e-mail tiver uma conta, enviamos um link pra você criar uma nova senha. Olhe também o spam.');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    setError('');
    setSubmitting(true);
    try {
      await startDemo();
      navigate('/app');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 pt-safe pb-safe max-w-sm mx-auto">
      <div className="mb-10 animate-fade-in-up">
        <h1 className="text-5xl font-semibold tracking-tight">
          NOVA<span className="text-[var(--color-accent)]">.</span>
        </h1>
        <p className="mt-3 text-[var(--color-text-dim)]">Seu dinheiro. Sob seu controle.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <input
          type="email"
          required
          autoComplete="username"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-[var(--color-negative)]">{error}</p>}
        {info && <p className="text-sm text-[var(--color-positive)]">{info}</p>}
        <Button type="submit" disabled={submitting} className="min-h-[48px]">
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
        <button
          type="button"
          onClick={handleReset}
          disabled={submitting}
          className="min-h-[44px] text-sm text-center text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
        >
          Esqueci minha senha
        </button>
      </form>

      {authMode === 'demo' && (
        <button
          type="button"
          onClick={handleDemo}
          disabled={submitting}
          className="mt-6 text-sm text-center text-[var(--color-text-faint)] hover:text-[var(--color-text-dim)] underline underline-offset-4"
        >
          Só quer dar uma olhada? Ver modo demonstração
        </button>
      )}
    </div>
  );
}
