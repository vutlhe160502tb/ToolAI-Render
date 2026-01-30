'use client';

import React, { useEffect, useRef } from 'react';

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
  width: number;
};

export function ShootingStars({
  className,
  minDelayMs = 900,
  maxDelayMs = 2600,
}: {
  className?: string;
  minDelayMs?: number;
  maxDelayMs?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stars: ShootingStar[] = [];
    let nextSpawnAt = performance.now() + rand(minDelayMs, maxDelayMs);

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      // spawn từ vùng trên/phải để bay chéo xuống trái/dưới
      const fromTop = Math.random() < 0.6;
      const x = fromTop ? rand(0, window.innerWidth) : rand(window.innerWidth * 0.6, window.innerWidth * 1.1);
      const y = fromTop ? rand(-80, window.innerHeight * 0.35) : rand(0, window.innerHeight * 0.5);

      const speed = rand(900, 1400); // px/s
      const angle = rand(Math.PI * 1.15, Math.PI * 1.35); // hướng chéo xuống trái
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const len = rand(180, 320);
      const maxLife = rand(0.7, 1.2);
      const width = rand(1.2, 2.2);

      stars.push({ x, y, vx, vy, len, life: 0, maxLife, width });
    };

    const draw = (now: number) => {
      const dt = 1 / 60; // ổn định

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (now >= nextSpawnAt) {
        spawn();
        nextSpawnAt = now + rand(minDelayMs, maxDelayMs);
      }

      // update & draw
      stars = stars.filter((s) => s.life < s.maxLife);
      for (const s of stars) {
        s.life += dt;
        s.x += (s.vx * dt);
        s.y += (s.vy * dt);

        const p = s.life / s.maxLife; // 0..1
        const alpha = Math.sin(Math.min(1, p) * Math.PI) * 0.9; // fade in/out

        const x2 = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.len;
        const y2 = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.len;

        const grad = ctx.createLinearGradient(s.x, s.y, x2, y2);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
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
  }, [minDelayMs, maxDelayMs]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

