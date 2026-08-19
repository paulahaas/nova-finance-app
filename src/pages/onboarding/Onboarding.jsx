import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';

const GOALS = [
  { id: 'economizar', label: 'Economizar' },
  { id: 'viajar', label: 'Viajar' },
  { id: 'comprar', label: 'Comprar algo' },
  { id: 'investir', label: 'Investir' },
  { id: 'quitar_dividas', label: 'Quitar dívidas' },
  { id: 'reserva', label: 'Criar reserva' },
  { id: 'outro', label: 'Outro' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [payDay, setPayDay] = useState(5);
  const [hasCard, setHasCard] = useState(null);
  const [hasDebt, setHasDebt] = useState(null);
  const [goalIntent, setGoalIntent] = useState(null);
  const { completeOnboarding, user } = useAuth();
  const navigate = useNavigate();

  const steps = ['income', 'payDay', 'hasCard', 'hasDebt', 'goal', 'done'];
  const total = steps.length - 1;

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function finish() {
    await completeOnboarding({
      income: Number(income) || 0,
      payDay: Number(payDay),
      hasCard: !!hasCard,
      hasDebt: !!hasDebt,
      goalIntent,
    });
    navigate('/app');
  }

  const current = steps[step];

  return (
    <div className="min-h-screen flex flex-col px-8 py-10 max-w-md mx-auto">
      {current !== 'done' && (
        <div className="mb-10">
          <ProgressBar value={step} max={total} />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        {current === 'income' && (
          <Step title="Qual é sua renda mensal?">
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              placeholder="R$ 0,00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full text-3xl bg-transparent border-b border-[var(--color-border)] pb-3 outline-none focus:border-[var(--color-accent)] tabular"
            />
            <Button className="mt-10" onClick={next} disabled={!income}>
              Continuar
            </Button>
          </Step>
        )}

        {current === 'payDay' && (
          <Step title="Quando você recebe?">
            <select
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
              className="w-full text-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 outline-none"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
            <Button className="mt-10" onClick={next}>
              Continuar
            </Button>
          </Step>
        )}

        {current === 'hasCard' && (
          <Step title="Você possui cartão?">
            <YesNo value={hasCard} onChange={setHasCard} />
            <Button className="mt-10" onClick={next} disabled={hasCard === null}>
              Continuar
            </Button>
          </Step>
        )}

        {current === 'hasDebt' && (
          <Step title="Você possui dívidas?">
            <YesNo value={hasDebt} onChange={setHasDebt} />
            <Button className="mt-10" onClick={next} disabled={hasDebt === null}>
              Continuar
            </Button>
          </Step>
        )}

        {current === 'goal' && (
          <Step title="Qual seu principal objetivo?">
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoalIntent(g.id)}
                  className={`rounded-xl border px-4 py-3 text-sm text-left transition-colors ${
                    goalIntent === g.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <Button className="mt-10" onClick={next} disabled={!goalIntent}>
              Continuar
            </Button>
          </Step>
        )}

        {current === 'done' && (
          <div className="text-center animate-fade-in-up">
            <h1 className="text-2xl font-semibold mb-3">Seu NOVA está pronto.</h1>
            <p className="text-[var(--color-text-dim)] mb-10">
              Tudo configurado, {user?.name?.split(' ')[0] ?? ''}. Vamos organizar sua vida financeira.
            </p>
            <Button onClick={finish}>Entrar no NOVA</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ title, children }) {
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold mb-8">{title}</h1>
      {children}
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {[
        { v: true, label: 'Sim' },
        { v: false, label: 'Não' },
      ].map((opt) => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.v)}
          className={`flex-1 rounded-xl border px-4 py-4 text-sm transition-colors ${
            value === opt.v
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
