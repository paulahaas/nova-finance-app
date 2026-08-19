import Panel from '../../components/Panel';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canUseAdvancedInsights } from '../../config/permissions';

const BASIC_INSIGHTS = [
  { icon: '📈', text: 'Seus gastos com alimentação aumentaram 34% este mês. Você gastou R$ 280 a mais do que sua média.' },
  { icon: '💰', text: 'Você está economizando mais do que nos últimos 3 meses.' },
];

const ADVANCED_INSIGHTS = [
  { icon: '🔍', text: 'Detectamos um padrão de gastos incomuns às sextas-feiras à noite, concentrado em Entretenimento.' },
  { icon: '🧠', text: 'Seu comportamento financeiro sugere maior disciplina após criar metas — considere adicionar outra.' },
  { icon: '📊', text: 'Comparado a usuários com renda similar, você gasta 12% menos em Transporte.' },
];

export default function Insights() {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const advanced = canUseAdvancedInsights(user);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insights</h1>

      <div className="space-y-3">
        {BASIC_INSIGHTS.map((i, idx) => (
          <Panel key={idx}>
            <p className="text-sm">
              {i.icon} {i.text}
            </p>
          </Panel>
        ))}
      </div>

      <div>
        <p className="font-medium mb-3">Insights avançados</p>
        <div className="space-y-3">
          {(advanced ? ADVANCED_INSIGHTS : ADVANCED_INSIGHTS.slice(0, 1)).map((i, idx) => (
            <Panel key={idx} className={!advanced ? 'opacity-40 blur-[2px] select-none' : ''}>
              <p className="text-sm">
                {i.icon} {i.text}
              </p>
            </Panel>
          ))}
        </div>
        {!advanced && (
          <button
            onClick={() => setShowUpgrade(true)}
            className="mt-3 text-sm text-[var(--color-accent)] hover:underline"
          >
            Desbloquear insights avançados com o NOVA Pro →
          </button>
        )}
      </div>

      {showUpgrade && (
        <UpgradeSheet
          title="Insights avançados são exclusivos do NOVA Pro"
          description="Detecção de gastos incomuns, análise de comportamento financeiro e muito mais."
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
