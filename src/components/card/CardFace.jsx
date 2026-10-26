const KIND = { credit: 'CRÉDITO', debit: 'DÉBITO' };

// What is printed on the front of a card. Only what the user chose to give:
// a nickname always, the last four digits and the expiry only if she typed them.
export default function CardFace({ type, nickname = '', last4 = '', expiry = '', holder = '' }) {
  return (
    <>
      <div className="nc-top">
        <span className="nc-logo">
          NOVA<i>.</i>
        </span>
        <svg className="nc-nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M8 7c2.2 3 2.2 7 0 10" />
          <path d="M12 5c3.2 4.2 3.2 9.8 0 14" />
          <path d="M16 3c4 5.4 4 12.6 0 18" />
        </svg>
      </div>
      <div className="nc-chip" />
      <div className="nc-bottom">
        <span className="nc-nick">{nickname}</span>
        <span className="nc-kind">
          {type === 'both' ? (
            <>
              CRÉDITO
              <br />
              DÉBITO
            </>
          ) : (
            KIND[type]
          )}
        </span>
        <span className="nc-last">•••• {last4 || '••••'}</span>
        {holder && <span className="nc-holder">{holder}</span>}
        {expiry && <span className="nc-exp">{expiry}</span>}
      </div>
    </>
  );
}
