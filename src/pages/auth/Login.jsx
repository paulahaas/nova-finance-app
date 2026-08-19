import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loginWithGoogle, startDemo, authMode } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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

  async function handleGoogle() {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/app');
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
    <div className="min-h-screen flex flex-col justify-center px-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Entrar</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <input
          type="password"
          required
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        {error && <p className="text-sm text-[var(--color-negative)]">{error}</p>}
        <Button type="submit" disabled={submitting}>
          Entrar
        </Button>
        <Button type="button" variant="secondary" onClick={handleGoogle} disabled={submitting}>
          Continuar com Google
        </Button>
        <Link to="#" className="text-sm text-center text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
          Esqueci minha senha
        </Link>
      </form>
      <p className="text-sm text-center text-[var(--color-text-dim)] mt-8">
        Não tem conta?{' '}
        <Link to="/signup" className="text-[var(--color-accent)]">
          Criar conta
        </Link>
      </p>

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
