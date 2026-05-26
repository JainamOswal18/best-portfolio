import { useEffect, useState } from 'react';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export default function Loader({ label = 'working' }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = setInterval(() => setI((x) => (x + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="loader">
      <span className="spin">{FRAMES[i]}</span>
      <span>{label}</span>
    </span>
  );
}
