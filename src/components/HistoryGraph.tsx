import React, { useRef, useEffect } from 'react';

interface HistoryGraphProps {
  history: number[];
  minRange?: number;
  maxRange?: number;
}

export const HistoryGraph: React.FC<HistoryGraphProps> = ({
  history,
  minRange = 30,
  maxRange = 130,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support Retina/High-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Grid lines for standard dB references: 50, 70, 90, 110 dB
    const gridLevels = [50, 70, 90, 110];
    ctx.lineWidth = 1;

    gridLevels.forEach((level) => {
      const y = height - ((level - minRange) / (maxRange - minRange)) * height;
      ctx.strokeStyle = level >= 90 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = level >= 90 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(113, 113, 122, 0.6)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${level} dB`, 6, y - 3);
    });

    if (history.length < 2) return;

    // Draw area gradient and line
    const stepX = width / (history.length - 1);

    // Area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
    gradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.08)');
    gradient.addColorStop(1, 'rgba(52, 211, 153, 0.0)');

    ctx.beginPath();
    history.forEach((val, i) => {
      const clamped = Math.max(minRange, Math.min(maxRange, val));
      const x = i * stepX;
      const y = height - ((clamped - minRange) / (maxRange - minRange)) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    history.forEach((val, i) => {
      const clamped = Math.max(minRange, Math.min(maxRange, val));
      const x = i * stepX;
      const y = height - ((clamped - minRange) / (maxRange - minRange)) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Highlight current head point
    const lastVal = history[history.length - 1];
    const clampedLast = Math.max(minRange, Math.min(maxRange, lastVal));
    const lastX = width;
    const lastY = height - ((clampedLast - minRange) / (maxRange - minRange)) * height;

    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#6ee7b7';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;
    ctx.fill();
  }, [history, minRange, maxRange]);

  return (
    <div id="history-graph-card" className="w-full bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 relative overflow-hidden">
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-500 font-semibold">
          Real-Time Log (30s)
        </span>
        <span className="text-[10px] font-mono text-zinc-600">
          Continuous IEC Trend
        </span>
      </div>
      <div className="w-full h-24 relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
