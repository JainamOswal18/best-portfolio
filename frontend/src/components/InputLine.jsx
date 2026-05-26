import { useCallback, useEffect, useRef, useState } from 'react';

export default function InputLine({
  value,
  onChange,
  onSubmit,
  onArrowUp,
  onArrowDown,
  onTab,
  onCancel,
  onClearScreen,
  prefix,
  promptClass,
  inputRef,
}) {
  const localRef = useRef(null);
  const ref = inputRef || localRef;
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  const [caretPos, setCaretPos] = useState(0);

  const syncCaret = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = el.selectionStart ?? el.value.length;
    setCaretPos(pos);
  }, [ref]);

  useEffect(() => {
    ref.current?.focus();
    syncCaret();
  }, [ref, syncCaret]);

  useEffect(() => {
    syncCaret();
  }, [value, syncCaret]);

  useEffect(() => {
    const onSelChange = () => {
      if (document.activeElement === ref.current) syncCaret();
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, [ref, syncCaret]);

  useEffect(() => {
    const onWinKey = (e) => {
      const isClear = (e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L' || e.key === 'k' || e.key === 'K');
      if (isClear) {
        e.preventDefault();
        onClearScreen?.();
      }
    };
    window.addEventListener('keydown', onWinKey);
    return () => window.removeEventListener('keydown', onWinKey);
  }, [onClearScreen]);

  function handleKeyDown(e) {
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 400);

    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onArrowUp?.();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onArrowDown?.();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onTab?.(value);
    } else if (e.key === 'c' && e.ctrlKey) {
      const sel = window.getSelection();
      if (!sel || sel.toString().length === 0) {
        e.preventDefault();
        onCancel?.();
      }
    }
    requestAnimationFrame(syncCaret);
  }

  const charUnderCaret = value[caretPos];

  return (
    <div className="input-row" onClick={() => ref.current?.focus()}>
      <span className={`input-prompt${promptClass ? ` ${promptClass}` : ''}`}>{prefix}</span>
      <div className="input-wrap">
        <span
          className={`caret${typing ? '' : ' blink'}${charUnderCaret ? ' over-char' : ''}`}
          style={{ left: `${caretPos}ch` }}
          aria-hidden="true"
        >
          {charUnderCaret || ''}
        </span>
        <input
          ref={ref}
          className="input-real"
          type="text"
          value={value}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          inputMode="text"
          onChange={(e) => { onChange(e.target.value); }}
          onKeyDown={handleKeyDown}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onSelect={syncCaret}
          aria-label="terminal input"
        />
      </div>
    </div>
  );
}
