import { useCallback, useEffect, useReducer, useRef } from 'react';

const INITIAL_LINES = ['', '', ''];

const EXIT_CMDS = new Set([':q', ':q!', ':wq', ':wq!', ':x', ':quit', ':quit!', ':exit', ':qa', ':qa!']);

const ACHIEVEMENTS = {
  3:  { title: 'still trying', sub: 'above-average resolve' },
  7:  { title: 'persistent',   sub: 'most users have closed the tab by now' },
  12: { title: 'stubborn',     sub: 'legendary how-to-exit-vim status' },
  20: { title: 'unhinged',     sub: 'this is a portfolio. please leave.' },
};

const NORMAL_HINTS = [
  'press  i  to enter INSERT mode',
  'press  :  to enter COMMAND mode',
  'try  :help  if you are desperate',
  'try  :q  to escape  (works ~80% of the time)',
];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, commandLine: action.mode === 'COMMAND' ? ':' : '' };
    case 'INSERT_CHAR': {
      const lines = state.lines.slice();
      const row = Math.min(state.cursorRow, lines.length - 1);
      const cur = lines[row] ?? '';
      lines[row] = cur.slice(0, state.cursorCol) + action.ch + cur.slice(state.cursorCol);
      return { ...state, lines, cursorCol: state.cursorCol + 1 };
    }
    case 'INSERT_NEWLINE': {
      const lines = state.lines.slice();
      const row = state.cursorRow;
      const cur = lines[row] ?? '';
      lines.splice(row, 1, cur.slice(0, state.cursorCol), cur.slice(state.cursorCol));
      return { ...state, lines, cursorRow: row + 1, cursorCol: 0 };
    }
    case 'BACKSPACE': {
      const lines = state.lines.slice();
      const row = state.cursorRow;
      if (state.cursorCol > 0) {
        const cur = lines[row];
        lines[row] = cur.slice(0, state.cursorCol - 1) + cur.slice(state.cursorCol);
        return { ...state, lines, cursorCol: state.cursorCol - 1 };
      }
      if (row > 0) {
        const prev = lines[row - 1];
        const merged = prev + lines[row];
        lines.splice(row - 1, 2, merged);
        return { ...state, lines, cursorRow: row - 1, cursorCol: prev.length };
      }
      return state;
    }
    case 'COMMAND_APPEND':
      return { ...state, commandLine: state.commandLine + action.ch };
    case 'COMMAND_BACKSPACE': {
      if (state.commandLine.length <= 1) return { ...state, mode: 'NORMAL', commandLine: '' };
      return { ...state, commandLine: state.commandLine.slice(0, -1) };
    }
    case 'PUSH_FLASH':
      return { ...state, flash: action.flash, attempts: action.bumpAttempt ? state.attempts + 1 : state.attempts };
    case 'CLEAR_FLASH':
      return { ...state, flash: null };
    case 'BUMP_ATTEMPT':
      return { ...state, attempts: state.attempts + 1 };
    case 'CYCLE_HINT':
      return { ...state, hintIdx: (state.hintIdx + 1) % NORMAL_HINTS.length };
    case 'DELETE_LINE': {
      const lines = state.lines.length > 1 ? state.lines.filter((_, i) => i !== state.cursorRow) : [''];
      return { ...state, lines, cursorRow: Math.max(0, Math.min(state.cursorRow, lines.length - 1)), cursorCol: 0 };
    }
    case 'MOVE': {
      const { dr, dc } = action;
      const lines = state.lines;
      const row = Math.max(0, Math.min(lines.length - 1, state.cursorRow + dr));
      const col = Math.max(0, Math.min((lines[row] || '').length, state.cursorCol + dc));
      return { ...state, cursorRow: row, cursorCol: col };
    }
    default:
      return state;
  }
}

const initial = {
  mode: 'NORMAL',
  lines: INITIAL_LINES,
  cursorRow: 0,
  cursorCol: 0,
  commandLine: '',
  flash: null,
  attempts: 0,
  hintIdx: 0,
};

export default function VimOverlay({ onDone }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const exit = useCallback((variant) => {
    const a = stateRef.current.attempts;
    const witty = (() => {
      if (variant === 'forced') return `^C — you bailed on vim. coward. (${a} tries)`;
      if (a === 0)  return 'Wait — you knew :q? Suspicious. (escaped in 0 tries)';
      if (a === 1)  return 'First try. Nobody believes you. Anyway — you are free.';
      if (a <= 5)   return `Escaped vim in ${a} tries. Above average.`;
      if (a <= 12)  return `Escaped vim in ${a} tries. The internet is proud.`;
      return `Escaped vim in ${a} tries. Touch grass.`;
    })();
    const achievements = Object.entries(ACHIEVEMENTS)
      .filter(([k]) => Number(k) <= a)
      .map(([, v]) => v);
    onDone({ message: witty, achievements });
  }, [onDone]);

  const flash = useCallback((node, bumpAttempt = true) => {
    dispatch({ type: 'PUSH_FLASH', flash: node, bumpAttempt });
    setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 1800);
  }, []);

  const runColonCommand = useCallback((raw) => {
    const cmd = raw.trim();
    if (EXIT_CMDS.has(cmd)) { exit('clean'); return; }
    if (cmd === ':help') {
      flash(
        <>
          <span className="vim-flash-title">help.txt</span>{' '}
          there is no help here. only suffering. type{' '}
          <span className="accent">:q</span> when ready.
        </>,
      );
      return;
    }
    if (cmd === ':w') { flash(<>nothing to write. this file does not exist outside your imagination.</>); return; }
    if (cmd === ':set number' || cmd === ':set nu') { flash(<>line numbers were already on. you{"'"}re welcome.</>); return; }
    if (cmd === ':!q' || cmd === ':!q!' || cmd === ':!wq' || cmd === ':!quit' || cmd === ':!exit') {
      flash(<>that{"'"}s backwards. the bang goes <span className="accent">after</span>. but fine — go.</>);
      setTimeout(() => exit('clean'), 600);
      return;
    }
    if (cmd.startsWith(':!')) { flash(<>shell escape denied. nice try, hacker.</>); return; }
    if (cmd === ':emacs') { flash(<span className="error">heresy detected. recording IP.</span>); return; }
    if (cmd === ':q1' || cmd === ':wq1') { flash(<>that{"'"}s a one, not an L. close.</>); return; }
    flash(
      <>
        <span className="error">E492:</span> Not an editor command: <span className="amber">{cmd.slice(1)}</span>
        {'  '}<span className="muted">· attempt #{stateRef.current.attempts + 1}</span>
      </>,
    );
  }, [exit, flash]);

  useEffect(() => {
    const onKey = (e) => {
      const s = stateRef.current;
      // Always allow Ctrl+C to bail
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        exit('forced');
        return;
      }
      if (e.metaKey || e.altKey) return;

      if (s.mode === 'COMMAND') {
        if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'SET_MODE', mode: 'NORMAL' }); return; }
        if (e.key === 'Enter')  { e.preventDefault(); runColonCommand(s.commandLine); dispatch({ type: 'SET_MODE', mode: 'NORMAL' }); return; }
        if (e.key === 'Backspace') { e.preventDefault(); dispatch({ type: 'COMMAND_BACKSPACE' }); return; }
        if (e.key.length === 1)  { e.preventDefault(); dispatch({ type: 'COMMAND_APPEND', ch: e.key }); return; }
        return;
      }

      if (s.mode === 'INSERT') {
        if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'SET_MODE', mode: 'NORMAL' }); return; }
        if (e.key === 'Enter')  { e.preventDefault(); dispatch({ type: 'INSERT_NEWLINE' }); return; }
        if (e.key === 'Backspace') { e.preventDefault(); dispatch({ type: 'BACKSPACE' }); return; }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); dispatch({ type: 'MOVE', dr: 0, dc: -1 }); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'MOVE', dr: 0, dc:  1 }); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); dispatch({ type: 'MOVE', dr: -1, dc: 0 }); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); dispatch({ type: 'MOVE', dr:  1, dc: 0 }); return; }
        if (e.key.length === 1)  { e.preventDefault(); dispatch({ type: 'INSERT_CHAR', ch: e.key }); return; }
        return;
      }

      // NORMAL mode
      e.preventDefault();
      if (e.key === ':') { dispatch({ type: 'SET_MODE', mode: 'COMMAND' }); return; }
      if (e.key === 'i' || e.key === 'I' || e.key === 'a' || e.key === 'A' || e.key === 'o' || e.key === 'O') {
        dispatch({ type: 'SET_MODE', mode: 'INSERT' });
        return;
      }
      if (e.key === 'd') {
        // simulate dd by listening for next d
        if (window.__vimPendingD) {
          clearTimeout(window.__vimPendingD);
          window.__vimPendingD = null;
          dispatch({ type: 'DELETE_LINE' });
          flash(<>deleted line. but there was no line. you have created a paradox.</>);
          return;
        }
        window.__vimPendingD = setTimeout(() => { window.__vimPendingD = null; }, 600);
        return;
      }
      if (e.key === 'Z' && e.shiftKey) {
        if (window.__vimPendingZ) {
          clearTimeout(window.__vimPendingZ);
          window.__vimPendingZ = null;
          exit('clean');
          return;
        }
        window.__vimPendingZ = setTimeout(() => { window.__vimPendingZ = null; }, 600);
        return;
      }
      if (e.key === 'h') { dispatch({ type: 'MOVE', dr: 0, dc: -1 }); return; }
      if (e.key === 'l') { dispatch({ type: 'MOVE', dr: 0, dc:  1 }); return; }
      if (e.key === 'j') { dispatch({ type: 'MOVE', dr:  1, dc: 0 }); return; }
      if (e.key === 'k') { dispatch({ type: 'MOVE', dr: -1, dc: 0 }); return; }
      if (e.key === '0') { dispatch({ type: 'MOVE', dr: 0, dc: -9999 }); return; }
      if (e.key === '$') { dispatch({ type: 'MOVE', dr: 0, dc:  9999 }); return; }

      if (e.key.length === 1) {
        dispatch({ type: 'CYCLE_HINT' });
        flash(<>press <span className="accent">i</span> for INSERT or <span className="accent">:</span> for COMMAND</>);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exit, runColonCommand, flash]);

  const totalChars = state.lines.reduce((a, l) => a + l.length, 0);
  const nonEmpty = state.lines.filter((l) => l.length > 0).length;
  const modeClass = `vim-mode vim-mode-${state.mode.toLowerCase()}`;
  const cursorPos = state.cursorCol;

  return (
    <div className="vim-overlay" role="dialog" aria-label="vim editor">
      <div className="vim-window">
        <div className="vim-titlebar">
          <button
            type="button"
            className="vim-dot red"
            onClick={() => exit('clean')}
            aria-label="close vim"
            title="close vim"
          />
          <span className="vim-dot amber" aria-hidden="true" />
          <span className="vim-dot green" aria-hidden="true" />
          <span className="vim-title">jainam.txt — VIM</span>
          <span className="vim-attempts">esc attempt #{state.attempts}</span>
          <button
            type="button"
            className="vim-mobile-exit"
            onClick={() => exit('clean')}
            aria-label="exit vim"
          >
            tap to exit
          </button>
        </div>

        <div className="vim-content">
          {state.lines.map((line, i) => {
            const isCursor = i === state.cursorRow && state.mode !== 'COMMAND';
            return (
              <div className={`vim-line${isCursor ? ' is-cursor' : ''}`} key={i}>
                <span className="vim-lineno">{String(i + 1).padStart(3, ' ')}</span>
                <span className="vim-linesep">│</span>
                <span className="vim-linetext">
                  {isCursor ? (
                    <>
                      <span>{line.slice(0, cursorPos)}</span>
                      <span className={`vim-cursor ${state.mode.toLowerCase()}`}>
                        {line[cursorPos] || ' '}
                      </span>
                      <span>{line.slice(cursorPos + 1)}</span>
                    </>
                  ) : (
                    <span>{line || (i === 0 ? '' : '')}</span>
                  )}
                </span>
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 14 - state.lines.length) }).map((_, i) => (
            <div className="vim-line vim-tilde" key={`t-${i}`}>
              <span className="vim-lineno">{' '.repeat(3)}</span>
              <span className="vim-linesep">│</span>
              <span className="vim-tilde-mark">~</span>
            </div>
          ))}
        </div>

        <div className="vim-statusbar">
          <span className={modeClass}>{state.mode === 'INSERT' ? '-- INSERT --' : state.mode === 'COMMAND' ? '-- COMMAND --' : 'NORMAL'}</span>
          <span className="vim-status-file">jainam.txt</span>
          <span className="vim-status-stats">{nonEmpty}L, {totalChars}C</span>
          <span className="vim-status-pos">{state.cursorRow + 1}:{state.cursorCol + 1}</span>
        </div>

        <div className="vim-commandline">
          {state.mode === 'COMMAND' ? (
            <>
              <span className="vim-cmd-prompt">{state.commandLine}</span>
              <span className="vim-cursor command">&nbsp;</span>
            </>
          ) : state.flash ? (
            <span className="vim-flash">{state.flash}</span>
          ) : (
            <span className="vim-hint">{NORMAL_HINTS[state.hintIdx]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
