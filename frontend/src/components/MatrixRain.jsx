import { useEffect, useRef } from 'react';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

export default function MatrixRain({ duration = 3000, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let endAt = performance.now() + duration;
    let drops = [];
    let cols = 0;
    const fontSize = 16;

    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      cols = Math.floor(window.innerWidth / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(now) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = '#22C55E';
      ctx.shadowColor = '#22C55E';
      ctx.shadowBlur = 6;
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      for (let i = 0; i < cols; i += 1) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(ch, x, y);
        if (y > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
      if (now < endAt) {
        raf = requestAnimationFrame(draw);
      } else {
        onDone?.();
      }
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [duration, onDone]);

  return (
    <div className="matrix-overlay" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
