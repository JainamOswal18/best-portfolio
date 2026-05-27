import { useCallback, useEffect, useReducer, useRef } from 'react';

const initialState = {
  blocks: [],
  history: [],
  historyIdx: null,
  draftBeforeHistory: '',
  input: '',
  theme: 'dark',
  contactMode: null,
  vimMode: null,
  guestbookMode: null,
  registry: null,
  overlay: null,
  fading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };
    case 'PATCH_BLOCK': {
      const blocks = state.blocks.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b));
      return { ...state, blocks };
    }
    case 'APPEND_STREAM_TOKEN': {
      if (!action.token) return state;
      const blocks = state.blocks.map((b) =>
        b.id === action.id ? { ...b, streamText: (b.streamText || '') + action.token } : b,
      );
      return { ...state, blocks };
    }
    case 'REPLACE_BLOCK': {
      const blocks = state.blocks.map((b) => (b.id === action.id ? action.block : b));
      return { ...state, blocks };
    }
    case 'REMOVE_BLOCK': {
      const blocks = state.blocks.filter((b) => b.id !== action.id);
      return { ...state, blocks };
    }
    case 'CLEAR':
      return { ...state, blocks: [] };
    case 'SET_INPUT':
      return { ...state, input: action.value, historyIdx: action.resetHistoryIdx ? null : state.historyIdx };
    case 'PUSH_HISTORY':
      if (!action.value.trim()) return state;
      return { ...state, history: [...state.history, action.value], historyIdx: null, draftBeforeHistory: '' };
    case 'HISTORY_UP': {
      if (!state.history.length) return state;
      const next = state.historyIdx === null ? state.history.length - 1 : Math.max(0, state.historyIdx - 1);
      const draft = state.historyIdx === null ? state.input : state.draftBeforeHistory;
      return { ...state, historyIdx: next, input: state.history[next], draftBeforeHistory: draft };
    }
    case 'HISTORY_DOWN': {
      if (state.historyIdx === null) return state;
      const next = state.historyIdx + 1;
      if (next >= state.history.length) {
        return { ...state, historyIdx: null, input: state.draftBeforeHistory, draftBeforeHistory: '' };
      }
      return { ...state, historyIdx: next, input: state.history[next] };
    }
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_VIM_MODE':
      return { ...state, vimMode: action.mode };
    case 'PATCH_VIM':
      return { ...state, vimMode: { ...(state.vimMode || {}), ...action.patch } };
    case 'SET_GUESTBOOK_MODE':
      return { ...state, guestbookMode: action.mode };
    case 'SET_CONTACT_MODE':
      return { ...state, contactMode: action.mode };
    case 'PATCH_CONTACT':
      return { ...state, contactMode: { ...(state.contactMode || {}), ...action.patch } };
    case 'SET_REGISTRY':
      return { ...state, registry: action.registry };
    case 'SET_OVERLAY':
      return { ...state, overlay: action.overlay };
    case 'SET_FADING':
      return { ...state, fading: action.fading };
    default:
      return state;
  }
}

let blockCounter = 0;
export function newBlockId(prefix = 'b') {
  blockCounter += 1;
  return `${prefix}-${blockCounter}-${Date.now()}`;
}

export function useTerminal() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = localStorage.getItem('portfolio-theme');
    if (stored === 'light' || stored === 'dark') {
      dispatch({ type: 'SET_THEME', theme: stored });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const abortRef = useRef(null);

  const setAbortController = useCallback((ctrl) => {
    abortRef.current = ctrl;
  }, []);

  const abortInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { state, dispatch, abortRef, setAbortController, abortInFlight };
}
