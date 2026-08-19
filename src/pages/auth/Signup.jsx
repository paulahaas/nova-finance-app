import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrors';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signup({ name, email, password });
      navigate('/onboarding');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Criar conta</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
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
        <input
          type="password"
          required
          placeholder="Confirmar senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        {error && <p className="text-sm text-[var(--color-negative)]">{error}</p>}
        <Button type="submit" disabled={submitting}>
          Criar conta
        </Button>
      </form>
      <p className="text-sm text-center text-[var(--color-text-dim)] mt-8">
        Já tem conta?{' '}
        <Link to="/login" className="text-[var(--color-accent)]">
          Entrar
        </Link>
      </p>
    </div>
  );
}
