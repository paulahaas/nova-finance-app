// OFX comes in two shapes in practice: OFX 1.x (SGML — leaf tags like
// <DTPOSTED> have no closing tag) and OFX 2.x (XML — everything closes).
// Extracting each <STMTTRN>...</STMTTRN> block by regex and then pulling
// leaf fields out of it (stopping at the next tag or a line break) handles
// both without needing a real SGML/XML parser.

function extractField(block, tag) {
  const re = new RegExp(`<${tag}>\\s*([^<\r\n]*)`, 'i');
  const match = block.match(re);
  return match ? match[1].trim() : '';
}

function parseOfxDate(raw) {
  // YYYYMMDD or YYYYMMDDHHMMSS[.xxx][TZ]
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d)).toISOString();
}

/**
 * @param {string} content - raw OFX file text
 * @returns {{ date, description, amount, sourceTransactionId }[]}
 */
export function parseOfx(content) {
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];

  return blocks
    .map((block) => {
      const date = parseOfxDate(extractField(block, 'DTPOSTED'));
      const amountRaw = extractField(block, 'TRNAMT');
      const amount = Number(amountRaw.replace(',', '.'));
      const name = extractField(block, 'NAME');
      const memo = extractField(block, 'MEMO');
      const fitId = extractField(block, 'FITID');
      const description = name || memo || 'Transação';

      if (!date || Number.isNaN(amount) || amount === 0) return null;

      return { date, description, amount, sourceTransactionId: fitId || null };
    })
    .filter(Boolean);
}
