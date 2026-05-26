import { apiGet } from '../api/client.js';
import { hasHelpFlag, formatHelpUsage } from './helpers.js';
import AnimatedBanner from '../components/AnimatedBanner.jsx';

// Inline usage / flag hints shown alongside each command in `help`.
// Only commands with real flags or positional args appear here.
const USAGE_HINTS = {
  about:      '--summary|-s · --education|-e · --interests|-i',
  skills:     '--languages · --frontend · --backend · --databases · --devops · --system-design',
  experience: '[--current] [<slug>]',
  resume:     '[--preview]',
  contact:    '[--cancel]',
  theme:      '[--toggle]',
  ask:        '<question>',
  roast:      '[me]',
  feedback:   '<message>',
  echo:       '<text>',
};

// Render order is REVERSED on purpose: less important categories first so they
// scroll off the top after auto-scroll, essential ones last so they sit right
// above the prompt where the user's eye lands.
const HELP_ORDER = ['fun', 'system', 'ai', 'socials', 'community', 'skills', 'experience', 'identity', 'resume'];

export function helpHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('help', 'List all available commands. Essentials are pinned at the bottom.');
  }
  const reg = terminal.getRegistry();
  const groups = {};
  for (const [name, def] of Object.entries(reg)) {
    const cat = def.category || 'misc';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ name, summary: def.summary });
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const nodes = [];
  let key = 0;
  const cats = [...HELP_ORDER.filter((c) => groups[c]), ...Object.keys(groups).filter((c) => !HELP_ORDER.includes(c))];
  for (const cat of cats) {
    nodes.push(
      <div key={`c-${key++}`} className="help-category">{`# ${cat}`}</div>,
    );
    for (const item of groups[cat]) {
      const usage = USAGE_HINTS[item.name];
      nodes.push(
        <span key={`n-${key++}`} className="help-cmd">{item.name}</span>,
      );
      nodes.push(
        <span key={`s-${key++}`} className="help-summary">
          {item.summary}
          {usage && <div className="help-flags">{usage}</div>}
        </span>,
      );
    }
  }

  const runCmd = (c) => () => terminal.runCommand?.(c);

  return (
    <div>
      <div className="help-grid">{nodes}</div>
      <div className="help-footer">
        <div className="help-footer-title">→ quick start</div>
        <div className="help-footer-chips">
          <button type="button" className="chip" onClick={runCmd('tldr')}>tldr</button>
          <button type="button" className="chip" onClick={runCmd('whoami')}>whoami</button>
          <button type="button" className="chip" onClick={runCmd('experience')}>experience</button>
          <button type="button" className="chip" onClick={runCmd('resume')}>resume</button>
          <button type="button" className="chip chip-amber" onClick={runCmd('contact')}>contact</button>
        </div>
        <div className="help-footer-note muted">
          every command accepts <span className="accent">--help</span> / <span className="accent">-h</span> for inline usage.
        </div>
      </div>
    </div>
  );
}

export function clearHandler({ terminal }) {
  terminal.clear();
  return null;
}

export async function bannerHandler({ flags, abortSignal, terminal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('banner', 'Re-print the boot banner.');
  try {
    const data = await apiGet('/api/init', { signal: abortSignal });
    terminal.setRegistryFromInit(data);
    return (
      <div>
        <AnimatedBanner text={data.banner} />
        <div className="section-title">{data.name}</div>
        <div className="tagline">{data.tagline}</div>
        <div className="hint">Type <span className="accent">help</span> to get started.</div>
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return <span className="error">error: {e.message}</span>;
  }
}

export function historyHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('history', 'Show command history for this session.');
  const hist = terminal.getHistory();
  if (!hist.length) return <span className="muted">(no history yet)</span>;
  return (
    <div className="list">
      {hist.map((line, i) => (
        <div className="list-item" key={i}>
          <span className="bullet">{String(i + 1).padStart(3, ' ')}</span>
          <span>{line}</span>
        </div>
      ))}
    </div>
  );
}

export function echoHandler({ args, flags }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('echo <text>', 'Print arguments back.');
  return args.join(' ');
}

export function dateHandler({ flags }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('date', 'Print current local date/time.');
  return new Date().toString();
}

export function pwdHandler({ flags }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('pwd', 'Print working directory.');
  return '/home/jainam/portfolio';
}

export function unameHandler({ flags }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('uname', 'Print system information.');
  return 'JainamOS 9.6 (Pune-LTS) #BuildInPublic SMP 2023';
}
