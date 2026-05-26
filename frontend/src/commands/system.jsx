import { apiGet } from '../api/client.js';
import { hasHelpFlag, formatHelpUsage } from './helpers.js';
import AnimatedBanner from '../components/AnimatedBanner.jsx';

export function helpHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('help', 'List all available commands grouped by category.');
  }
  const reg = terminal.getRegistry();
  const order = ['system', 'identity', 'skills', 'projects', 'experience', 'community', 'resume', 'socials', 'ai', 'fun'];
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
  const cats = [...order.filter((c) => groups[c]), ...Object.keys(groups).filter((c) => !order.includes(c))];
  for (const cat of cats) {
    nodes.push(
      <div key={`c-${key++}`} className="help-category">{`# ${cat}`}</div>
    );
    for (const item of groups[cat]) {
      nodes.push(
        <span key={`n-${key++}`} className="help-cmd">{item.name}</span>
      );
      nodes.push(
        <span key={`s-${key++}`} className="help-summary">{item.summary}</span>
      );
    }
  }
  return <div className="help-grid">{nodes}</div>;
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
