import React from 'react';

interface SpectrumBarProps {
  frequencyData: Uint8Array;
}

export const SpectrumBar: React.FC<SpectrumBarProps> = ({ frequencyData }) => {
  // Select 24 balanced frequency bands from low bass to high treble
  const bands = 24;
  const sampled = Array.from({ length: bands }).map((_, i) => {
    const idx = Math.floor((i / bands) * Math.min(frequencyData.length, 32));
    const raw = frequencyData[idx] || 0;
    return Math.min(100, Math.round((raw / 255) * 100));
  });

  return (
    <div id="spectrum-visualizer" className="w-full bg-zinc-950/60 border border-zinc-900/80 rounded-lg p-2.5">
      <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-zinc-500">
        <span>31.5 Hz</span>
        <span className="tracking-widest uppercase text-zinc-600 font-medium">Frequency Bands</span>
        <span>16 kHz</span>
      </div>
      <div className="flex items-end justify-between gap-[2px] h-8 pt-1">
        {sampled.map((val, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-900 rounded-xs overflow-hidden flex flex-col justify-end h-full"
          >
            <div
              className={`w-full transition-all duration-75 rounded-xs ${
                val > 70
                  ? 'bg-amber-400'
                  : val > 40
                  ? 'bg-emerald-400'
                  : 'bg-emerald-600/70'
              }`}
              style={{ height: `${Math.max(4, val)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
