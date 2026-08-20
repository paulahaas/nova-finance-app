import { describe, it, expect } from 'vitest';
import { parseOfx } from '../ofxParser';

// OFX 1.x/SGML style — leaf tags have no closing tag.
const SAMPLE_OFX_SGML = `
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260812120000
<TRNAMT>-39.90
<FITID>2026081200011
<NAME>NETFLIX
<MEMO>Assinatura mensal
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260813090000
<TRNAMT>4000.00
<FITID>2026081300012
<NAME>SALARIO
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

describe('parseOfx', () => {
  it('extracts transactions from SGML-style OFX', () => {
    const transactions = parseOfx(SAMPLE_OFX_SGML);
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      description: 'NETFLIX',
      amount: -39.9,
      sourceTransactionId: '2026081200011',
    });
    expect(transactions[0].date.slice(0, 10)).toBe('2026-08-12');
    expect(transactions[1]).toMatchObject({ description: 'SALARIO', amount: 4000 });
  });

  it('returns an empty array for content with no STMTTRN blocks', () => {
    expect(parseOfx('<OFX>nothing here</OFX>')).toEqual([]);
  });
});
