import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Panel from '../components/Panel';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', income: '', payDay: '', aboutMe: '' });

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function startEditing() {
    setForm({ name: user?.name ?? '', income: user?.income ?? '', payDay: user?.payDay ?? '', aboutMe: user?.aboutMe ?? '' });
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    await updateUser({
      name: form.name.trim(),
      income: Number(form.income) || 0,
      payDay: Number(form.payDay) || 1,
      aboutMe: form.aboutMe.trim(),
    });
    setEditing(false);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Perfil</h1>

      <Panel className="space-y-4">
        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <input
              required
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="Renda mensal"
              value={form.income}
              onChange={(e) => setForm((f) => ({ ...f, income: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="28"
              placeholder="Dia do salário"
              value={form.payDay}
              onChange={(e) => setForm((f) => ({ ...f, payDay: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <textarea
              rows={4}
              maxLength={1000}
              placeholder="Sobre mim e meus objetivos (o Copilot lê isso para te ajudar melhor)"
              value={form.aboutMe}
              onChange={(e) => setForm((f) => ({ ...f, aboutMe: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] resize-none"
            />
            <div className="flex gap-3">
              <Button type="submit">Salvar</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <>
            <Row label="Nome" value={user?.name} />
            <Row label="E-mail" value={user?.email} />
            <Row label="Renda mensal" value={formatCurrency(user?.income)} />
            <Row label="Dia do salário" value={`Dia ${user?.payDay}`} />
            <div className="text-sm">
              <p className="text-[var(--color-text-dim)] mb-1">Sobre mim e meus objetivos</p>
              <p className="whitespace-pre-wrap">{user?.aboutMe || 'Nada escrito ainda — conte pro Copilot o que você quer alcançar.'}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={startEditing}>
              Editar perfil
            </Button>
          </>
        )}
      </Panel>

      <Button as={Link} to="/app/settings" variant="secondary" className="w-full">
        Configurações
      </Button>

      <Button variant="ghost" className="w-full" onClick={handleLogout}>
        Sair
      </Button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--color-text-dim)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
