import { useEffect, useReducer, useRef } from 'react';

const CYCLE_GLYPHS = '!@#$%^&*<>/\\|{}[]+=~?01';
const REVEAL_STAGGER_MS = 6;
const CHAR_CYCLE_MS = 35;
const MIN_FRAMES = 3;
const MAX_FRAMES = 8;

function isStatic(ch) {
  return ch === ' ' || ch === '\n';
}

function init(text) {
  const cells = [];
  for (const ch of text) {
    cells.push({
      target: ch,
      shown: isStatic(ch) ? ch : pickGlyph(),
      framesLeft: isStatic(ch) ? 0 : MIN_FRAMES + Math.floor(Math.random() * (MAX_FRAMES - MIN_FRAMES)),
      revealAt: 0,
      settled: isStatic(ch),
    });
  }
  // assign reveal delays based on character index of NON-WHITESPACE in left-to-right reading order
  let order = 0;
  for (const cell of cells) {
    if (!cell.settled) {
      cell.revealAt = order * REVEAL_STAGGER_MS;
      order += 1;
    }
  }
  return { cells, started: Date.now(), done: false };
}

function reducer(state, action) {
  if (action.type === 'TICK') {
    const now = Date.now() - state.started;
    let stillCycling = false;
    const next = state.cells.map((c) => {
      if (c.settled) return c;
      if (now < c.revealAt) {
        // still waiting to start cycling
        stillCycling = true;
        return c;
      }
      if (c.framesLeft <= 0) {
        return { ...c, shown: c.target, settled: true };
      }
      stillCycling = true;
      return { ...c, shown: pickGlyph(), framesLeft: c.framesLeft - 1 };
    });
    return { ...state, cells: next, done: !stillCycling };
  }
  if (action.type === 'COMPLETE') {
    return { ...state, cells: state.cells.map((c) => ({ ...c, shown: c.target, settled: true })), done: true };
  }
  return state;
}

function pickGlyph() {
  return CYCLE_GLYPHS[Math.floor(Math.random() * CYCLE_GLYPHS.length)];
}

export default function AnimatedBanner({ text }) {
  const [state, dispatch] = useReducer(reducer, text, init);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion.current) {
      dispatch({ type: 'COMPLETE' });
      return;
    }
    if (state.done) return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), CHAR_CYCLE_MS);
    return () => clearInterval(id);
  }, [state.done]);

  return (
    <pre className={`banner animated-banner${state.done ? ' banner-settled' : ''}`} aria-label="Jainam Oswal">
      {state.cells.map((c, i) => (
        <span
          key={i}
          className={`banner-cell${c.settled ? ' settled' : ' cycling'}${isStatic(c.target) ? ' static' : ''}`}
        >
          {c.shown}
        </span>
      ))}
    </pre>
  );
}
