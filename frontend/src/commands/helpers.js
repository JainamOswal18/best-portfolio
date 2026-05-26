export function parseArgs(rawArgs) {
  const args = [];
  const flags = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const tok = rawArgs[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else if (tok.startsWith('-') && tok.length > 1) {
      const key = tok.slice(1);
      flags[key] = true;
    } else {
      args.push(tok);
    }
  }
  return { args, flags };
}

export function hasHelpFlag(flags) {
  return Boolean(flags.help || flags.h);
}

export function tokenize(line) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ' ' || ch === '\t') {
      if (cur) {
        out.push(cur);
        cur = '';
      }
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function pad(s, n) {
  s = String(s ?? '');
  if (s.length >= n) return s;
  return s + ' '.repeat(n - s.length);
}

export function formatHelpUsage(name, summary, examples = []) {
  const lines = [
    `usage: ${name}`,
    `  ${summary}`,
  ];
  if (examples.length) {
    lines.push('');
    lines.push('examples:');
    for (const ex of examples) lines.push(`  ${ex}`);
  }
  return lines.join('\n');
}
