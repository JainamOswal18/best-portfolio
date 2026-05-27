import { memo } from 'react';

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g;
const BOLD_RE = /\*\*([^*\n]+)\*\*|__([^_\n]+)__/g;
const ITAL_RE = /(^|[\s(])(\*|_)([^*_\n]+)\2(?=[\s).,!?:;]|$)/g;
const CODE_RE = /`([^`\n]+)`/g;
const HEADING_RE = /^\s{0,3}#{1,6}\s+/gm;
const LIST_BULLET_RE = /^\s*[*+-]\s+/gm;

export function renderMarkdownish(text) {
  if (!text) return null;
  let cleaned = text
    .replace(HEADING_RE, '')
    .replace(BOLD_RE, (_, a, b) => a || b)
    .replace(ITAL_RE, (_, lead, _m, inner) => `${lead}${inner}`)
    .replace(CODE_RE, (_, inner) => inner)
    .replace(LIST_BULLET_RE, '• ');

  const out = [];
  let last = 0;
  let m;
  let i = 0;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(cleaned)) !== null) {
    if (m.index > last) out.push(cleaned.slice(last, m.index));
    out.push(
      <a key={`l-${i++}`} href={m[2]} target="_blank" rel="noreferrer noopener">{m[1]}</a>
    );
    last = m.index + m[0].length;
  }
  if (last < cleaned.length) out.push(cleaned.slice(last));
  return out;
}

function OutputBlock({ block }) {
  const { command, contactPrefix, vimPrefix, guestbookPrefix, output, isStream, streamText, streamDone, streamError, streamCancelled } = block;
  let symbol = '❯';
  let symbolClass = '';
  if (contactPrefix) {
    symbol = `${contactPrefix} ❯`;
    symbolClass = ' contact';
  } else if (vimPrefix) {
    symbol = vimPrefix;
    symbolClass = ' vim';
  } else if (guestbookPrefix) {
    symbol = `${guestbookPrefix} ❯`;
    symbolClass = ' contact';
  }
  return (
    <div className="block">
      {command !== undefined && (
        <div className="prompt-line">
          <span className={`prompt-symbol${symbolClass}`}>{symbol}</span>
          <span className="prompt-cmd">{command}</span>
        </div>
      )}
      {output !== null && output !== undefined && (
        <div className="output">
          {output}
        </div>
      )}
      {isStream && (
        <div className="output">
          <span>{renderMarkdownish(streamText)}</span>
          {!streamDone && !streamError && <span className="stream-caret blink" aria-hidden="true" />}
          {streamError && <span className="error">{`\nerror: ${streamError}`}</span>}
          {streamCancelled && <span className="muted"> (cancelled)</span>}
        </div>
      )}
    </div>
  );
}

export default memo(OutputBlock);
