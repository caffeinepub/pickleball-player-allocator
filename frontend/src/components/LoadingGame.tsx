import React, { useEffect, useRef } from 'react';

interface LoadingGameProps {
  message?: string;
}

export default function LoadingGame({ message = 'Loading...' }: LoadingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Ball
    let bx = W / 2;
    let by = H / 2;
    let vx = 3.5;
    let vy = 2.8;
    const br = 10;

    // Paddles
    const paddleW = 12;
    const paddleH = 60;
    let leftY = H / 2 - paddleH / 2;
    let rightY = H / 2 - paddleH / 2;

    function draw() {
      if (!ctx) return;
      // Background
      ctx.fillStyle = '#1a2e1a';
      ctx.fillRect(0, 0, W, H);

      // Court lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      // Center line
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Kitchen lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(W * 0.25, 0);
      ctx.lineTo(W * 0.25, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.75, 0);
      ctx.lineTo(W * 0.75, H);
      ctx.stroke();

      // Left paddle
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.roundRect(20, leftY, paddleW, paddleH, 4);
      ctx.fill();

      // Right paddle
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.roundRect(W - 20 - paddleW, rightY, paddleW, paddleH, 4);
      ctx.fill();

      // Ball (pickleball - yellow with holes pattern)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();

      // Holes on ball
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      const holeOffsets = [
        [-3, -3], [3, -3], [0, 3],
        [-4, 1], [4, 1],
      ];
      for (const [hx, hy] of holeOffsets) {
        ctx.beginPath();
        ctx.arc(bx + hx, by + hy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function update() {
      bx += vx;
      by += vy;

      // Top/bottom bounce
      if (by - br <= 0) { by = br; vy = Math.abs(vy); }
      if (by + br >= H) { by = H - br; vy = -Math.abs(vy); }

      // AI paddles follow ball
      const speed = 3;
      const leftCenter = leftY + paddleH / 2;
      const rightCenter = rightY + paddleH / 2;

      if (leftCenter < by - 5) leftY = Math.min(leftY + speed, H - paddleH);
      else if (leftCenter > by + 5) leftY = Math.max(leftY - speed, 0);

      if (rightCenter < by - 5) rightY = Math.min(rightY + speed, H - paddleH);
      else if (rightCenter > by + 5) rightY = Math.max(rightY - speed, 0);

      // Left paddle collision
      if (bx - br <= 20 + paddleW && by >= leftY && by <= leftY + paddleH) {
        bx = 20 + paddleW + br;
        vx = Math.abs(vx);
        // Slight angle variation
        vy += (Math.random() - 0.5) * 1.5;
        vy = Math.max(-5, Math.min(5, vy));
      }

      // Right paddle collision
      if (bx + br >= W - 20 - paddleW && by >= rightY && by <= rightY + paddleH) {
        bx = W - 20 - paddleW - br;
        vx = -Math.abs(vx);
        vy += (Math.random() - 0.5) * 1.5;
        vy = Math.max(-5, Math.min(5, vy));
      }

      // Reset if ball goes out
      if (bx < 0 || bx > W) {
        bx = W / 2;
        by = H / 2;
        vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
        vy = (Math.random() > 0.5 ? 1 : -1) * 2.8;
      }
    }

    function loop() {
      update();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 p-6">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className="rounded-xl border border-white/10 shadow-lg"
          style={{ display: 'block' }}
        />
        <div className="absolute inset-0 rounded-xl ring-1 ring-primary/30 pointer-events-none" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-foreground/80 font-medium text-sm animate-pulse">{message}</p>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
