import React from 'react';

interface PrecisionBarGaugeProps {
  currentDb: number;
  peakDb: number;
  minRange?: number;
  maxRange?: number;
}

export const PrecisionBarGauge: React.FC<PrecisionBarGaugeProps> = ({
  currentDb,
  peakDb,
  minRange = 30,
  maxRange = 130,
}) => {
  const clampedDb = Math.max(minRange, Math.min(maxRange, currentDb));
  const percentage = ((clampedDb - minRange) / (maxRange - minRange)) * 100;
  const peakClamped = Math.max(minRange, Math.min(maxRange, peakDb));
  const peakPercentage = ((peakClamped - minRange) / (maxRange - minRange)) * 100;

  // 50 discrete segments for a genuine high-resolution industrial sound meter LED bar
  const totalSegments = 40;
  const activeSegments = Math.round((percentage / 100) * totalSegments);
  const peakSegment = Math.min(totalSegments - 1, Math.round((peakPercentage / 100) * totalSegments));

  const ticks = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];

  return (
    <div id="precision-bar-gauge-container" className="w-full flex flex-col gap-2 select-none">
      {/* Scale Labels & Tick Marks */}
      <div className="flex justify-between items-end px-1 text-[11px] font-mono font-medium text-zinc-500 tabular-numbers">
        {ticks.map((tick) => {
          const isHigh = tick >= 90;
          const isExtreme = tick >= 110;
          return (
            <div key={tick} className="flex flex-col items-center">
              <span className={isExtreme ? 'text-rose-500 font-semibold' : isHigh ? 'text-amber-500/80' : 'text-zinc-500'}>
                {tick}
              </span>
              <div className={`w-[1px] h-1.5 mt-1 ${isExtreme ? 'bg-rose-600' : isHigh ? 'bg-amber-600/60' : 'bg-zinc-700'}`} />
            </div>
          );
        })}
      </div>

      {/* High-Resolution Segmented Meter Bar */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
        <div className="flex gap-[3px] h-6 items-center">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const segRatio = (i + 1) / totalSegments;
            const segDb = minRange + segRatio * (maxRange - minRange);
            const isActive = i < activeSegments;
            const isPeak = i === peakSegment && peakSegment > activeSegments;

            // Color coding according to sound pressure intensity
            let activeColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
            let inactiveColor = 'bg-zinc-900/80 border-zinc-900';

            if (segDb > 105) {
              activeColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
            } else if (segDb > 90) {
              activeColor = 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
            } else if (segDb > 75) {
              activeColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
            } else if (segDb > 60) {
              activeColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
            }

            return (
              <div
                key={i}
                className={`flex-1 h-full rounded-[2px] transition-all duration-75 ${
                  isActive
                    ? activeColor
                    : isPeak
                    ? 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]'
                    : inactiveColor
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
