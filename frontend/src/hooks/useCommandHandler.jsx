import { useCallback, useEffect, useMemo, useRef } from 'react';
import { commands } from '../commands/index.js';
import { parseArgs, tokenize } from '../commands/helpers.js';
import { newBlockId } from './useTerminal.js';
import Loader from '../components/Loader.jsx';
import { ContactReview } from '../components/ContactForm.jsx';
import { apiPost } from '../api/client.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useCommandHandler({ state, dispatch, setAbortController, abortInFlight }) {
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const addBlock = useCallback((block) => {
    const full = { id: newBlockId(), ...block };
    dispatch({ type: 'ADD_BLOCK', block: full });
    return full.id;
  }, [dispatch]);

  const patchBlock = useCallback((id, patch) => {
    dispatch({ type: 'PATCH_BLOCK', id, patch });
  }, [dispatch]);

  const removeBlock = useCallback((id) => {
    dispatch({ type: 'REMOVE_BLOCK', id });
  }, [dispatch]);

  const replaceBlock = useCallback((id, block) => {
    dispatch({ type: 'REPLACE_BLOCK', id, block: { id, ...block } });
  }, [dispatch]);

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR' }), [dispatch]);

  const setTheme = useCallback((theme) => {
    dispatch({ type: 'SET_THEME', theme });
    localStorage.setItem('portfolio-theme', theme);
  }, [dispatch]);

  const toggleTheme = useCallback(() => {
    const next = stateRef.current.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }, [setTheme]);

  const fadeOut = useCallback(() => {
    dispatch({ type: 'SET_FADING', fading: true });
    setTimeout(() => dispatch({ type: 'SET_FADING', fading: false }), 2000);
  }, [dispatch]);

  const setRegistryFromInit = useCallback((init) => {
    if (init?.commands?.length) {
      dispatch({ type: 'SET_REGISTRY', registry: init.commands });
    }
  }, [dispatch]);

  const showOverlay = useCallback((node) => dispatch({ type: 'SET_OVERLAY', overlay: node }), [dispatch]);
  const hideOverlay = useCallback(() => dispatch({ type: 'SET_OVERLAY', overlay: null }), [dispatch]);

  const enterContactMode = useCallback(() => {
    dispatch({ type: 'SET_CONTACT_MODE', mode: { step: 'name', name: '', email: '', message: '' } });
  }, [dispatch]);

  const exitContactMode = useCallback(() => {
    dispatch({ type: 'SET_CONTACT_MODE', mode: null });
  }, [dispatch]);

  const enterVimMode = useCallback(() => {
    dispatch({ type: 'SET_VIM_MODE', mode: { attempts: 0, lines: [] } });
  }, [dispatch]);

  const exitVimMode = useCallback(() => {
    dispatch({ type: 'SET_VIM_MODE', mode: null });
  }, [dispatch]);

  const enterGuestbookMode = useCallback((message) => {
    dispatch({ type: 'SET_GUESTBOOK_MODE', mode: { message } });
  }, [dispatch]);

  const exitGuestbookMode = useCallback(() => {
    dispatch({ type: 'SET_GUESTBOOK_MODE', mode: null });
  }, [dispatch]);

  // forward-ref for runCommand so terminalApi can expose it before it's defined
  const runCommandRef = useRef(null);

  const terminalApi = useMemo(() => ({
    getRegistry: () => commands,
    getHistory: () => stateRef.current.history,
    clear: clearAll,
    print: (node) => addBlock({ command: undefined, output: node }),
    setTheme,
    toggleTheme,
    fadeOut,
    setRegistryFromInit,
    showOverlay,
    hideOverlay,
    enterContactMode,
    exitContactMode,
    isContactMode: () => Boolean(stateRef.current.contactMode),
    enterVimMode,
    exitVimMode,
    isVimMode: () => Boolean(stateRef.current.vimMode),
    enterGuestbookMode,
    exitGuestbookMode,
    openStreamBlock: () => {
      const id = newBlockId('s');
      dispatch({ type: 'ADD_BLOCK', block: { id, isStream: true, streamText: '', streamDone: false, streamError: null } });
      return id;
    },
    appendToStreamBlock: (id, tok) => {
      if (!tok) return;
      dispatch({ type: 'APPEND_STREAM_TOKEN', id, token: tok });
    },
    closeStreamBlock: (id) => patchBlock(id, { streamDone: true }),
    failStreamBlock: (id, err) => patchBlock(id, { streamDone: true, streamError: err }),
    // Used by clickable chips and shortcuts to trigger a command programmatically.
    runCommand: (cmd) => runCommandRef.current?.(cmd),
  }), [clearAll, addBlock, setTheme, toggleTheme, fadeOut, setRegistryFromInit, showOverlay, hideOverlay, enterContactMode, exitContactMode, enterVimMode, exitVimMode, enterGuestbookMode, exitGuestbookMode, patchBlock, dispatch]);

  const handleContactInput = useCallback(async (line) => {
    const mode = stateRef.current.contactMode;
    if (!mode) return;
    const prefix = mode.step;
    addBlock({ command: line, contactPrefix: prefix });

    if (line === '--cancel' || line.toLowerCase() === 'cancel') {
      exitContactMode();
      addBlock({ output: <span className="amber">contact cancelled.</span> });
      return;
    }

    if (mode.step === 'name') {
      if (!line) {
        addBlock({ output: <span className="error">error: name cannot be empty.</span> });
        return;
      }
      dispatch({ type: 'PATCH_CONTACT', patch: { name: line, step: 'email' } });
      addBlock({ output: <span className="muted">Step 2 of 4 — what is your email?</span> });
      return;
    }
    if (mode.step === 'email') {
      if (!EMAIL_RE.test(line)) {
        addBlock({ output: <span className="error">error: that doesn{"'"}t look like a valid email. Try again.</span> });
        return;
      }
      dispatch({ type: 'PATCH_CONTACT', patch: { email: line, step: 'message' } });
      addBlock({ output: <span className="muted">Step 3 of 4 — what is your message?</span> });
      return;
    }
    if (mode.step === 'message') {
      if (!line) {
        addBlock({ output: <span className="error">error: message cannot be empty.</span> });
        return;
      }
      const next = { ...mode, message: line, step: 'review' };
      dispatch({ type: 'PATCH_CONTACT', patch: { message: line, step: 'review' } });
      addBlock({ output: <ContactReview name={next.name} email={next.email} message={next.message} /> });
      return;
    }
    if (mode.step === 'review') {
      const ans = line.trim().toLowerCase();
      const yesAnswers = new Set(['y', 'yes', 'send', 'ok', 'confirm']);
      const noAnswers = new Set(['n', 'no', 'cancel', '--cancel', 'abort', 'q']);
      if (noAnswers.has(ans)) {
        exitContactMode();
        addBlock({ output: <span className="amber">contact cancelled.</span> });
        return;
      }
      if (!yesAnswers.has(ans)) {
        addBlock({ output: <span className="muted">please type <span className="accent">y</span> to send or <span className="accent">n</span> to cancel.</span> });
        return;
      }
      const controller = new AbortController();
      setAbortController(controller);
      const loaderId = addBlock({ output: <Loader label="sending message…" /> });
      try {
        const res = await apiPost('/api/contact', { name: mode.name, email: mode.email, message: mode.message }, { signal: controller.signal });
        replaceBlock(loaderId, { output: <span className="accent">{res?.message || 'Message delivered.'}</span> });
      } catch (err) {
        if (err.name !== 'AbortError') {
          replaceBlock(loaderId, { output: <span className="error">error: {err.message || String(err)}</span> });
        }
      } finally {
        setAbortController(null);
        exitContactMode();
      }
    }
  }, [addBlock, dispatch, exitContactMode, replaceBlock, setAbortController]);

  const handleVimInput = useCallback((rawLine) => {
    const mode = stateRef.current.vimMode;
    if (!mode) return;
    const line = rawLine; // preserve as-is so users can "type" content
    const trimmed = line.trim();
    const attempts = mode.attempts + 1;
    addBlock({ command: line, vimPrefix: ':' });

    const exitCmds = new Set([':q', ':q!', ':wq', ':wq!', ':x', ':quit', ':quit!', ':exit', 'ZZ', ':qa', ':qa!']);
    if (exitCmds.has(trimmed)) {
      exitVimMode();
      const witty = attempts === 1
        ? "First try? Nobody believes you. Anyway, you're free."
        : `Escaped vim in ${attempts} tries. The internet is proud.`;
      addBlock({ output: <span className="accent">{witty}</span> });
      return;
    }

    if (trimmed.startsWith(':')) {
      addBlock({
        output: (
          <span className="error">
            E492: Not an editor command: <span className="amber">{trimmed.slice(1)}</span>
            <span className="muted"> · try </span><span className="accent">:q</span>
            <span className="muted"> · attempt #{attempts}</span>
          </span>
        ),
      });
      dispatch({ type: 'PATCH_VIM', patch: { attempts } });
      return;
    }

    dispatch({
      type: 'PATCH_VIM',
      patch: { attempts, lines: [...(mode.lines || []), line] },
    });
    if (attempts === 3 || attempts === 7 || attempts === 12) {
      const hints = {
        3: 'hint: in vim, commands start with a colon. like :q',
        7: 'hint: still here? google "how to exit vim" — millions of devs have',
        12: 'hint: you can just close the tab. but where is the fun in that?',
      };
      addBlock({ output: <span className="muted">~ {hints[attempts]}</span> });
    }
  }, [addBlock, dispatch, exitVimMode]);

  const handleGuestbookInput = useCallback(async (line) => {
    const mode = stateRef.current.guestbookMode;
    if (!mode) return;
    const trimmed = line.trim();
    addBlock({ command: line, guestbookPrefix: 'name' });

    if (trimmed.toLowerCase() === 'cancel' || trimmed === '--cancel') {
      exitGuestbookMode();
      addBlock({ output: <span className="amber">guestbook cancelled.</span> });
      return;
    }
    // Empty / "skip" / "anon" → anonymous
    let name = trimmed;
    if (name === '' || /^(skip|anon|anonymous|-)$/i.test(name)) name = '';
    if (name.length > 60) {
      addBlock({ output: <span className="error">error: name too long (max 60 chars). try again or type "skip".</span> });
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    const loaderId = addBlock({ output: <Loader label="signing…" /> });
    try {
      const res = await apiPost('/api/guestbook', { name, message: mode.message }, { signal: controller.signal });
      replaceBlock(loaderId, { output: <span className="accent">{res?.message || 'signed ✦'}</span> });
    } catch (err) {
      if (err.name !== 'AbortError') {
        replaceBlock(loaderId, { output: <span className="error">error: {err.message || String(err)}</span> });
      }
    } finally {
      setAbortController(null);
      exitGuestbookMode();
    }
  }, [addBlock, exitGuestbookMode, replaceBlock, setAbortController]);

  const runCommand = useCallback(async (rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      addBlock({ command: '' });
      return;
    }

    if (stateRef.current.vimMode) {
      handleVimInput(rawLine);
      dispatch({ type: 'PUSH_HISTORY', value: line });
      return;
    }

    if (stateRef.current.contactMode) {
      await handleContactInput(line);
      dispatch({ type: 'PUSH_HISTORY', value: line });
      return;
    }

    if (stateRef.current.guestbookMode) {
      await handleGuestbookInput(line);
      dispatch({ type: 'PUSH_HISTORY', value: line });
      return;
    }

    addBlock({ command: line });
    dispatch({ type: 'PUSH_HISTORY', value: line });

    const tokens = tokenize(line);
    const head = tokens[0];
    if (!head) return;
    const rest = tokens.slice(1);
    const { args, flags } = parseArgs(rest);

    let cmdName = head;
    let cmdArgs = args;
    let cmdFlags = flags;

    if (head === 'roast' && args[0] === 'me') {
      cmdName = 'roast';
      cmdArgs = args.slice(1);
    }
    if (head === 'sudo') {
      cmdName = 'sudo';
      cmdArgs = rest;
      cmdFlags = {};
    }

    const def = commands[cmdName];
    if (!def) {
      addBlock({
        output: <span className="error">bash: {head}: command not found. Type {"'"}help{"'"} for available commands.</span>,
      });
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    const loaderId = addBlock({ output: <Loader label={`running ${cmdName}…`} /> });

    try {
      const result = def.handler({
        args: cmdArgs,
        flags: cmdFlags,
        abortSignal: controller.signal,
        terminal: terminalApi,
      });
      const resolved = result instanceof Promise ? await result : result;
      if (resolved === null || resolved === undefined) {
        removeBlock(loaderId);
      } else {
        replaceBlock(loaderId, { output: resolved });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        replaceBlock(loaderId, { output: <span className="muted">^C aborted</span> });
      } else {
        replaceBlock(loaderId, { output: <span className="error">error: {err.message || String(err)}</span> });
      }
    } finally {
      setAbortController(null);
    }
  }, [addBlock, dispatch, handleContactInput, handleVimInput, handleGuestbookInput, removeBlock, replaceBlock, setAbortController, terminalApi]);

  // Keep the forward ref in sync with the current runCommand closure so chips
  // / programmatic callers can invoke commands without a circular dep.
  useEffect(() => {
    runCommandRef.current = runCommand;
  }, [runCommand]);

  const handleSubmit = useCallback((value) => {
    dispatch({ type: 'SET_INPUT', value: '', resetHistoryIdx: true });
    runCommand(value);
  }, [dispatch, runCommand]);

  const handleArrowUp = useCallback(() => dispatch({ type: 'HISTORY_UP' }), [dispatch]);
  const handleArrowDown = useCallback(() => dispatch({ type: 'HISTORY_DOWN' }), [dispatch]);

  const handleTab = useCallback((value) => {
    const trimmed = value.trimStart();
    if (!trimmed || trimmed.includes(' ')) return;
    const names = Object.keys(commands);
    const matches = names.filter((n) => n.startsWith(trimmed));
    if (matches.length === 1) {
      dispatch({ type: 'SET_INPUT', value: matches[0] + ' ', resetHistoryIdx: true });
    } else if (matches.length > 1) {
      addBlock({ output: <span className="muted">{matches.join('  ')}</span> });
    }
  }, [dispatch, addBlock]);

  const handleCancel = useCallback(() => {
    abortInFlight();
    // Preserve any in-flight stream block by marking it done + cancelled
    const openStreams = stateRef.current.blocks.filter((b) => b.isStream && !b.streamDone);
    openStreams.forEach((b) => {
      patchBlock(b.id, { streamDone: true, streamCancelled: true });
    });
    if (stateRef.current.contactMode) {
      exitContactMode();
      addBlock({ output: <span className="muted">^C contact cancelled.</span> });
    } else if (stateRef.current.vimMode) {
      exitVimMode();
      addBlock({ output: <span className="muted">^C — you bailed on vim. coward.</span> });
    } else if (stateRef.current.guestbookMode) {
      exitGuestbookMode();
      addBlock({ output: <span className="muted">^C guestbook cancelled.</span> });
    } else if (openStreams.length > 0) {
      // Stream block already shows the partial text; just print a muted marker
      addBlock({ output: <span className="muted">^C cancelled — partial response above is what we got.</span> });
    } else {
      addBlock({ output: <span className="muted">^C</span> });
    }
    dispatch({ type: 'SET_INPUT', value: '', resetHistoryIdx: true });
  }, [abortInFlight, addBlock, dispatch, exitContactMode, exitVimMode, exitGuestbookMode, patchBlock]);

  const handleClearScreen = useCallback(() => clearAll(), [clearAll]);

  const handleInputChange = useCallback((value) => {
    dispatch({ type: 'SET_INPUT', value, resetHistoryIdx: true });
  }, [dispatch]);

  return {
    terminalApi,
    handleSubmit,
    handleArrowUp,
    handleArrowDown,
    handleTab,
    handleCancel,
    handleClearScreen,
    handleInputChange,
    runCommand,
    addBlock,
  };
}
