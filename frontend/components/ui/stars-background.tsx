'use client';

import React, { useEffect, useMemo, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
};

export function StarsBackground({
  className,
  starDensity = 1,
}: {
  className?: string;
  /** 1 = mặc định, tăng để dày hơn */
  starDensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // seed ổn định theo lần mount (không cần crypto)
  const seed = useMemo(() => Math.random() * 10_000, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stars: Star[] = [];

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // mật độ sao theo diện tích
      const area = window.innerWidth * window.innerHeight;
      const count = Math.max(80, Math.floor((area / 9000) * starDensity));

      stars = Array.from({ length: count }).map((_, i) => {
        // pseudo-random nhưng đủ đẹp
        const t = Math.sin(seed + i * 999) * 10000;
        const u = Math.sin(seed + i * 313) * 10000;
        const v = Math.sin(seed + i * 127) * 10000;

        const x = ((t - Math.floor(t)) + 1) % 1 * window.innerWidth;
        const y = ((u - Math.floor(u)) + 1) % 1 * window.innerHeight;
        const r = 0.6 + (((v - Math.floor(v)) + 1) % 1) * 1.4;
        const baseAlpha = 0.15 + (((Math.sin(seed + i * 73) * 10000) % 1 + 1) % 1) * 0.6;
        const twinkleSpeed = 0.6 + (((Math.sin(seed + i * 19) * 10000) % 1 + 1) % 1) * 1.6;
        const twinklePhase = (((Math.sin(seed + i * 7) * 10000) % 1 + 1) % 1) * Math.PI * 2;

        return { x, y, r, baseAlpha, twinkleSpeed, twinklePhase };
      });
    };

    const draw = (timeMs: number) => {
      const t = timeMs / 1000;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // nền tối nhẹ (để sao nổi hơn)
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = Math.min(1, s.baseAlpha * (0.6 + twinkle));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [seed, starDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

