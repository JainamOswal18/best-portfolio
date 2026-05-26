import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTerminal } from '../hooks/useTerminal.js';
import { useCommandHandler } from '../hooks/useCommandHandler.jsx';
import { apiGet } from '../api/client.js';
import OutputBlock from './OutputBlock.jsx';
import InputLine from './InputLine.jsx';
import Loader from './Loader.jsx';
import AnimatedBanner from './AnimatedBanner.jsx';

export default function Terminal() {
  const { state, dispatch, setAbortController, abortInFlight } = useTerminal();
  const handler = useCommandHandler({ state, dispatch, setAbortController, abortInFlight });

  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const inputRef = useRef(null);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const controller = new AbortController();
    const loaderId = handler.addBlock({ output: <Loader label="booting…" /> });

    apiGet('/api/init', { signal: controller.signal })
      .then((data) => {
        if (data?.commands?.length) {
          handler.terminalApi.setRegistryFromInit?.(data);
        }
        dispatch({
          type: 'REPLACE_BLOCK',
          id: loaderId,
          block: {
            id: loaderId,
            output: (
              <div>
                <AnimatedBanner text={data.banner} />
                <div className="section-title">{data.name}</div>
                <div className="tagline">{data.tagline}</div>
                <div className="boot-chips" role="group" aria-label="quick actions">
                  <button type="button" className="chip" onClick={() => handler.runCommand('tldr')}>
                    <span className="chip-arrow">→</span> tldr
                    <span className="chip-hint">5-sec pitch</span>
                  </button>
                  <button type="button" className="chip" onClick={() => handler.runCommand('whoami')}>
                    <span className="chip-arrow">→</span> whoami
                    <span className="chip-hint">identity card</span>
                  </button>
                  <button type="button" className="chip" onClick={() => handler.runCommand('experience')}>
                    <span className="chip-arrow">→</span> experience
                    <span className="chip-hint">work history</span>
                  </button>
                  <button type="button" className="chip" onClick={() => handler.runCommand('resume')}>
                    <span className="chip-arrow">→</span> resume
                    <span className="chip-hint">download PDF</span>
                  </button>
                  <button type="button" className="chip chip-amber" onClick={() => handler.runCommand('contact')}>
                    <span className="chip-arrow">→</span> contact
                    <span className="chip-hint">say hi</span>
                  </button>
                </div>
                <div className="hint">
                  or type <span className="accent">help</span> for everything ·{' '}
                  <span className="kbd">Tab</span> autocompletes ·
                  <span className="kbd">↑</span><span className="kbd">↓</span> history ·
                  <span className="kbd">Ctrl</span>+<span className="kbd">L</span> clear
                </div>
              </div>
            ),
          },
        });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        dispatch({
          type: 'REPLACE_BLOCK',
          id: loaderId,
          block: {
            id: loaderId,
            output: (
              <div>
                <pre className="banner">{`     ___  ___ _ _   __ ___  __  __\n    |_  || _ \\ |/| / /| __ \\/  \\|  \\\n     _||_|  _/ ' | ' \\ |_) | () | |) |\n    |____|_| |_|_|_|\\_\\___/\\__/|___/`}</pre>
                <div className="section-title">Jainam Oswal</div>
                <div className="tagline">Full Stack AI Engineer · Hackathon Junkie · Community Builder</div>
                <div className="hint">
                  <span className="error">backend offline</span> — using fallback banner. Most commands will fail until the API is reachable.
                </div>
                <div className="hint">
                  Type <span className="accent">help</span> to see the local command list.
                </div>
              </div>
            ),
          },
        });
      });
  }, [dispatch, handler]);

  useLayoutEffect(() => {
    sentinelRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, [state.blocks, state.contactMode, state.input]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      sentinelRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
    });
    ro.observe(scrollEl.firstElementChild || scrollEl);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [state.contactMode]);

  const inputValueRef = useRef(state.input);
  useEffect(() => {
    inputValueRef.current = state.input;
  }, [state.input]);

  useEffect(() => {
    const onWindowKey = (e) => {
      if (state.overlay) return;
      const active = document.activeElement;
      if (active === inputRef.current) return;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return;
      if (active?.closest?.('.vim-overlay, [role="dialog"]')) return;

      if (e.metaKey || e.altKey) return;
      if (e.ctrlKey && !['c', 'C', 'l', 'L', 'k', 'K'].includes(e.key)) return;

      const k = e.key;
      if (k.length === 1 && !e.ctrlKey) {
        e.preventDefault();
        handler.handleInputChange(inputValueRef.current + k);
        inputRef.current?.focus();
      } else if (k === 'Backspace') {
        e.preventDefault();
        handler.handleInputChange(inputValueRef.current.slice(0, -1));
        inputRef.current?.focus();
      } else if (k === 'Enter') {
        e.preventDefault();
        handler.handleSubmit(inputValueRef.current);
        inputRef.current?.focus();
      } else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'Tab') {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onWindowKey);
    return () => window.removeEventListener('keydown', onWindowKey);
  }, [handler, state.overlay]);

  let prefix = '❯';
  let promptClass = '';
  if (state.contactMode) {
    prefix = `${state.contactMode.step} ❯`;
    promptClass = 'contact';
  } else if (state.vimMode) {
    prefix = ':';
    promptClass = 'vim';
  }

  return (
    <div className={`app${state.fading ? ' fading' : ''}`} style={{ opacity: state.fading ? 0.3 : 1 }}>
      {state.overlay}
      <div className="terminal">
        <div className="terminal-scroll" ref={scrollRef}>
          {state.blocks.map((b) => (
            <OutputBlock key={b.id} block={b} />
          ))}
          <div ref={sentinelRef} />
        </div>
        <InputLine
          value={state.input}
          onChange={handler.handleInputChange}
          onSubmit={handler.handleSubmit}
          onArrowUp={handler.handleArrowUp}
          onArrowDown={handler.handleArrowDown}
          onTab={handler.handleTab}
          onCancel={handler.handleCancel}
          onClearScreen={handler.handleClearScreen}
          prefix={prefix}
          promptClass={promptClass}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}
