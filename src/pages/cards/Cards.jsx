import { useEffect, useRef, useState } from 'react';
import Card3D from '../../components/card/Card3D';
import CardSheet from '../../components/card/CardSheet';
import FlatCard from '../../components/card/FlatCard';
import { CARD_COPY, CARD_TYPES } from '../../config/cardTypes';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useShowcaseTheme } from '../../hooks/useShowcaseTheme';
import { formatCurrency } from '../../utils/format';

const GRID_ICON = (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);
const PLUS_ICON = (
  <svg className="plus" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M13 3v20M3 13h20" />
  </svg>
);
const TILE_TONE = { credit: 'a', debit: 'b', both: 'c' };

function cardCaption(card) {
  if (card.type === 'debit') return 'Débito · sem fatura';
  if (card.limit > 0) return `Fatura ${formatCurrency(card.currentInvoice || 0)} de ${formatCurrency(card.limit)}`;
  return 'Toque para informar limite e fatura (opcional)';
}

export default function Cards() {
  const { user } = useAuth();
  const { cards } = useData();
  const [type, setType] = useState('credit');
  const [open, setOpen] = useState(true);
  const [kick, setKick] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const detailRef = useRef(null);
  useShowcaseTheme(type);

  const copy = CARD_COPY[type];
  const holder = user?.name ?? '';

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function pick(t) {
    if (t === type) return;
    setType(t);
    setKick((k) => k + 1);
  }
  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4200);
  }
  function openTile(t) {
    if (open && type === t) {
      setOpen(false);
      return;
    }
    setType(t);
    setOpen(true);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 140);
  }

  return (
    <div>
      <section className="sc-hero">
        <div className="sc-rail" role="tablist" aria-label="Tipo de cartão">
          {CARD_TYPES.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => pick(t)}>
              {CARD_COPY[t].label}
            </button>
          ))}
          <button
            type="button"
            className="rg"
            aria-label="Ver os três tipos"
            onClick={() => document.getElementById('apresentacao')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {GRID_ICON}
          </button>
        </div>

        <div className="sc-hero-art">
          <h1 key={type} className="sc-giant sc-swap" style={{ '--gd': copy.giantSize, '--gmax': copy.giantMax }}>
            {copy.giant}
            <sup>{copy.index}</sup>
          </h1>
          <Card3D type={type} kick={kick} last4="4521" expiry="09/30" holder={holder} />
        </div>

        <div key={`${type}-info`} className="sc-info sc-swap">
          <h2>{copy.name}</h2>
          <p className="desc">{copy.desc}</p>
          <p className="line">{copy.line}</p>
        </div>
        <button type="button" className="sc-cta" onClick={() => setSheet({ mode: 'add' })}>
          Adicionar cartão
        </button>
      </section>

      <section className="sc-mine" id="meus-cartoes">
        <div className="sc-wrap">
          <h2 className="sc-title">Seus cartões</h2>
          {cards.length === 0 ? (
            <p className="sc-empty">Nenhum cartão ainda. Toque em “Adicionar cartão” e dê um nome a ele, como “Cartão Nubank”. É só isso.</p>
          ) : (
            <div className="sc-mine-row">
              {cards.map((card) => (
                <button key={card.id} type="button" className="sc-mine-item" onClick={() => setSheet({ mode: 'edit', card })}>
                  <FlatCard type={card.type || 'credit'} nickname={card.name} last4={card.last4 || ''} expiry={card.expiry || ''} holder={holder} />
                  <p className="sc-mine-cap">
                    <b>{card.name}</b>
                    <br />
                    {cardCaption(card)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="sc-block" id="beneficios">
        <div className="sc-block-grid">
          <div className="sc-art">
            <h2 className="sc-take">
              TENHA
              <br />
              CONTROLE
            </h2>
            <FlatCard type={type} last4="4521" expiry="09/30" holder={holder} />
            <div key={`${type}-chips`} className="sc-swap">
              {copy.chips.map(([label, value], i) => (
                <span key={label} className={`sc-chip c${i + 1}`}>
                  <small>{label}</small>
                  <b>{value}</b>
                </span>
              ))}
            </div>
            <p className="sc-note">Exemplos ilustrativos</p>
          </div>
          <div key={`${type}-copy`} className="sc-copy sc-swap">
            <p>{copy.p1}</p>
            <p>{copy.p2}</p>
          </div>
        </div>
        <button type="button" className="sc-tag" onClick={() => setSheet({ mode: 'add' })}>
          <span>{copy.tag}</span>
          <b>+</b>
        </button>
      </section>

      <section className="sc-present" id="apresentacao">
        <p className="sc-eyebrow">O que cada cartão traz</p>
        <div className="sc-tiles">
          {CARD_TYPES.map((t) => (
            <button key={t} type="button" className="sc-tile" data-tone={TILE_TONE[t]} aria-expanded={open && type === t} aria-controls="detalhe-cartao" onClick={() => openTile(t)}>
              <FlatCard className="thumb" type={t} last4="4521" expiry="09/30" holder={holder} />
              <div className="tx">
                <h3>{CARD_COPY[t].label}</h3>
                <p className="sub">{CARD_COPY[t].tileSub}</p>
              </div>
              {PLUS_ICON}
            </button>
          ))}
        </div>
        <div ref={detailRef} id="detalhe-cartao" className="sc-detail" data-open={open}>
          <div className="sc-detail-in">
            <div className="sc-detail-wrap">
              <div key={`${type}-detail`} className="sc-swap">
                <p className="kicker">Como funciona</p>
                <h3>{copy.label}</h3>
                <p className="lead">{copy.lead}</p>
                <button type="button" className="sc-dark-btn" onClick={() => setSheet({ mode: 'add' })}>
                  {copy.cta}
                </button>
              </div>
              <ul key={`${type}-rows`} className="sc-rows sc-swap">
                {copy.items.map(([label, text]) => (
                  <li key={label}>
                    <b>{label}</b>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {sheet && <CardSheet mode={sheet.mode} card={sheet.card} initialType={type} onTypeChange={pick} onClose={() => setSheet(null)} onSaved={showToast} />}
      <div className={toast ? 'sc-toast on' : 'sc-toast'} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
