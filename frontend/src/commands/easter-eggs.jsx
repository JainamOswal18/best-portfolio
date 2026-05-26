import { hasHelpFlag, formatHelpUsage } from './helpers.js';
import MatrixRain from '../components/MatrixRain.jsx';
import VimOverlay from '../components/VimOverlay.jsx';

export function sudoHandler({ args, flags }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('sudo <cmd>', 'You do not have superuser privileges. Trust me.');
  const joined = args.join(' ').trim();
  if (joined === 'rm -rf /' || joined === 'rm -rf /*') {
    return <span className="amber">Nice try. This portfolio is not running on your machine.</span>;
  }
  return <span className="error">Permission denied. Nice try.</span>;
}

export function vimHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('vim', 'Open vim. (Real modes. Real keybinds. Real regret.)');

  const handleDone = ({ message, achievements }) => {
    terminal.hideOverlay();
    terminal.print(
      <div className="vim-exit-result">
        <div className="accent">{message}</div>
        {achievements?.length ? (
          <div className="vim-achievements">
            {achievements.map((a, i) => (
              <div className="vim-achievement" key={i}>
                <span className="vim-achievement-icon">★</span>
                <span className="vim-achievement-title">{a.title}</span>
                <span className="vim-achievement-sub muted">— {a.sub}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  terminal.showOverlay(<VimOverlay onDone={handleDone} />);
  return null;
}

export function hackHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('hack', 'Enter the matrix.');
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return <span className="accent">Hacking… (motion reduced for accessibility)</span>;
  terminal.showOverlay(<MatrixRain duration={3000} onDone={() => terminal.hideOverlay()} />);
  return <span className="accent">Initiating hack sequence…</span>;
}

export function coffeeHandler({ flags }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('coffee', 'Brew a virtual cup.');
  const art = `         (  )   (   )  )
          ) (   )  (  (
          ( )  (    ) )
        _____________
       <_____________> ___
       |             |/ _ \\
       |               | | |
       |               |_| |
    ___|             |\\___/
   /    \\___________/    \\
   \\_____________________/`;
  return <pre className="coffee">{art}</pre>;
}

export function exitHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('exit', 'Goodbye.');
  terminal.fadeOut();
  return <span className="muted">Goodbye. Stay curious.</span>;
}

export function themeHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('theme', 'Toggle dark/light theme.', ['theme --toggle', 'theme']);
  }
  const next = terminal.toggleTheme();
  return <span>Theme switched to <span className="accent">{next}</span>.</span>;
}
