import React from 'react';
import { getSoundThemeColor } from '../utils/themeColors';

interface SpeedometerGaugeProps {
  currentDb: number;
  minRange?: number;
  maxRange?: number;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  currentDb,
  minRange = 30,
  maxRange = 130,
}) => {
  const theme = getSoundThemeColor(currentDb);

  // Geometry configuration:
  // Center of the dial
  const cx = 200;
  const cy = 200;
  const radius = 145;
  const innerRadius = 120;
  const tickLengthMajor = 15;
  const tickLengthMinor = 8;

  // Traditional upright automotive speedometer dial:
  // Zero/Min starts at bottom-left (-135° from top, i.e. 225°),
  // goes up through top (0°) and ends at bottom-right (+135° from top, i.e. 135° / 495°).
  // Total sweep: 270 degrees clockwise.
  // In standard mathematical polar angles (where 0 rad = 3 o'clock / East):
  // Min (30 dB): 135° (bottom-left)
  // Mid (80 dB): 270° (top)
  // Max (130 dB): 405° (bottom-right / 45°)
  const startAngle = 225; // 225° relative to top (i.e. -135° or bottom-left)
  const sweepAngle = 270; // Clockwise sweep

  const clampedDb = Math.max(minRange, Math.min(maxRange, currentDb));
  const progressRatio = (clampedDb - minRange) / (maxRange - minRange);

  // Helper to convert gauge angle (degrees where 0° = top / 12 o'clock, clockwise) to SVG coordinates (x, y)
  // Angle: 0° = top (0, -r), 90° = right (r, 0), 180° = bottom (0, r), 270° = left (-r, 0)
  // Standard start: 225° (bottom-left), 270° (left), 315° (top-left), 0°/360° (top), 45° (top-right), 90° (right), 135° (bottom-right)
  const gaugeAngleToCoords = (centerX: number, centerY: number, r: number, angleDegrees: number) => {
    const radians = (angleDegrees * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.sin(radians),
      y: centerY - r * Math.cos(radians),
    };
  };

  // Convert value in [minRange, maxRange] to gauge angle in degrees
  // 30 dB -> 225° (bottom-left)
  // 80 dB -> 360° (0° top)
  // 130 dB -> 495° (135° bottom-right)
  const dbToGaugeAngle = (val: number) => {
    const ratio = (val - minRange) / (maxRange - minRange);
    return 225 + ratio * sweepAngle;
  };

  const currentGaugeAngle = dbToGaugeAngle(clampedDb);

  // SVG Arc generator for gauge coordinates
  const describeGaugeArc = (centerX: number, centerY: number, r: number, startDeg: number, endDeg: number) => {
    const startPt = gaugeAngleToCoords(centerX, centerY, r, startDeg);
    const endPt = gaugeAngleToCoords(centerX, centerY, r, endDeg);
    const angleDiff = endDeg - startDeg;
    const largeArc = angleDiff > 180 ? 1 : 0;
    // Sweep flag = 1 for clockwise in SVG
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;
  };

  // Background track & active glowing track
  const backgroundTrackPath = describeGaugeArc(cx, cy, radius, 225, 495);
  const activeTrackPath = progressRatio > 0.005 ? describeGaugeArc(cx, cy, radius, 225, currentGaugeAngle) : '';

  // Generate tick marks: Major every 10 dB, Minor every 2.5 dB
  const majorTicks = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
  const minorTicks: number[] = [];
  for (let db = minRange; db <= maxRange; db += 2.5) {
    if (!majorTicks.includes(db)) {
      minorTicks.push(db);
    }
  }

  // Needle tip and base coordinates
  const needleTip = gaugeAngleToCoords(cx, cy, radius - 10, currentGaugeAngle);
  const needleBase1 = gaugeAngleToCoords(cx, cy, 14, currentGaugeAngle - 90);
  const needleBase2 = gaugeAngleToCoords(cx, cy, 14, currentGaugeAngle + 90);
  const needleTail = gaugeAngleToCoords(cx, cy, 22, currentGaugeAngle + 180);

  // Split whole and decimal for high readability
  const formattedVal = currentDb.toFixed(1);
  const [whole, decimal] = formattedVal.split('.');

  return (
    <div id="speedometer-gauge-wrapper" className="w-full flex flex-col items-center justify-center relative select-none">
      
      {/* 
        BIG BOLD DIGITAL READOUT - POSITIONED SEPARATELY AND PROMINENTLY ABOVE GAUGE
      */}
      <div
        id="speedometer-top-readout"
        className="flex flex-col items-center justify-center mb-3 sm:mb-4 transition-colors duration-150"
      >
        {/* Large Bold Numbers */}
        <div className="flex items-baseline justify-center">
          <span
            className="text-7xl sm:text-8xl md:text-9xl font-mono font-black tracking-tighter tabular-numbers transition-colors duration-150 leading-none drop-shadow-lg"
            style={{
              color: theme.hex,
              textShadow: `0 0 35px ${theme.glowRgba}`,
            }}
          >
            {whole}
          </span>
          <span
            className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold tabular-numbers opacity-80 transition-colors duration-150 leading-none"
            style={{
              color: theme.hex,
            }}
          >
            .{decimal}
          </span>
          <span
            className="ml-2 text-2xl sm:text-3xl md:text-4xl font-mono font-medium tracking-wider transition-colors duration-150"
            style={{
              color: theme.hex,
            }}
          >
            dB
          </span>
        </div>

        {/* Dynamic Acoustic Status Badge */}
        <div
          className="mt-2 px-3.5 py-1 rounded-full border text-xs font-mono font-bold tracking-widest uppercase transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          style={{
            color: theme.hex,
            borderColor: theme.hex,
            backgroundColor: `${theme.hex}18`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.hex }} />
          <span>{theme.levelLabel}</span>
        </div>
      </div>

      {/* 
        UPRIGHT SPEEDOMETER GAUGE
      */}
      <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-square flex items-center justify-center">
        
        {/* Dynamic Glow backdrop behind speedometer */}
        <div
          className="absolute inset-4 rounded-full filter blur-3xl opacity-20 pointer-events-none transition-colors duration-300"
          style={{ backgroundColor: theme.hex }}
        />

        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Radial gradient for bezel outer rim */}
            <radialGradient id="bezelGradient" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor="#18181b" />
              <stop offset="96%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>

            {/* Dial inner plate gradient */}
            <radialGradient id="dialPlate" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#0f0f12" />
              <stop offset="70%" stopColor="#070709" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* Hub cap brushed metallic gradient */}
            <radialGradient id="hubGradient" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="60%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>

          {/* Outer Bezel Rim */}
          <circle
            cx={cx}
            cy={cy}
            r="192"
            fill="url(#bezelGradient)"
            stroke="#27272a"
            strokeWidth="2"
          />

          {/* Inner Dial Face */}
          <circle
            cx={cx}
            cy={cy}
            r="180"
            fill="url(#dialPlate)"
            stroke="#18181b"
            strokeWidth="1.5"
          />

          {/* Background Track Arc (270° from bottom-left up to bottom-right) */}
          <path
            d={backgroundTrackPath}
            fill="none"
            stroke="#1c1c21"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Active Lit Arc with dynamic color */}
          {activeTrackPath && (
            <path
              d={activeTrackPath}
              fill="none"
              stroke={theme.hex}
              strokeWidth="8"
              strokeLinecap="round"
              className="transition-[stroke] duration-150"
              style={{
                filter: `drop-shadow(0px 0px 8px ${theme.glowRgba})`,
              }}
            />
          )}

          {/* Minor Tick Marks */}
          {minorTicks.map((dbVal) => {
            const angle = dbToGaugeAngle(dbVal);
            const p1 = gaugeAngleToCoords(cx, cy, innerRadius + 14, angle);
            const p2 = gaugeAngleToCoords(cx, cy, innerRadius + 14 + tickLengthMinor, angle);
            const isLit = dbVal <= currentDb;

            return (
              <line
                key={`minor-${dbVal}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isLit ? '#71717a' : '#27272a'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Major Tick Marks and Labels */}
          {majorTicks.map((dbVal) => {
            const angle = dbToGaugeAngle(dbVal);
            const p1 = gaugeAngleToCoords(cx, cy, innerRadius + 8, angle);
            const p2 = gaugeAngleToCoords(cx, cy, innerRadius + 8 + tickLengthMajor, angle);
            const textPos = gaugeAngleToCoords(cx, cy, innerRadius - 14, angle);

            // Tick color code based on intensity
            let tickColor = '#52525b';
            if (dbVal >= 110) tickColor = '#f43f5e';
            else if (dbVal >= 90) tickColor = '#fb923c';
            else if (dbVal >= 70) tickColor = '#fbbf24';

            const isLit = dbVal <= currentDb;

            return (
              <g key={`major-${dbVal}`}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isLit ? tickColor : '#3f3f46'}
                  strokeWidth={dbVal >= 110 ? '3' : '2.5'}
                  strokeLinecap="round"
                />
                <text
                  x={textPos.x}
                  y={textPos.y + 4}
                  textAnchor="middle"
                  fill={isLit ? (dbVal >= 110 ? '#fb7185' : '#e4e4e7') : '#52525b'}
                  fontSize={dbVal >= 100 ? '12' : '13'}
                  fontWeight={dbVal >= 110 ? '700' : '600'}
                  fontFamily="'JetBrains Mono', monospace"
                  className="select-none"
                >
                  {dbVal}
                </text>
              </g>
            );
          })}

          {/* Needle Shadow */}
          <polygon
            points={`${needleBase1.x + 3},${needleBase1.y + 3} ${needleTip.x + 3},${needleTip.y + 3} ${needleBase2.x + 3},${needleBase2.y + 3} ${needleTail.x + 3},${needleTail.y + 3}`}
            fill="rgba(0, 0, 0, 0.6)"
          />

          {/* Sweeping Speedometer Needle */}
          <polygon
            points={`${needleBase1.x},${needleBase1.y} ${needleTip.x},${needleTip.y} ${needleBase2.x},${needleBase2.y} ${needleTail.x},${needleTail.y}`}
            fill={theme.hex}
            stroke="#ffffff"
            strokeWidth="0.8"
            style={{
              filter: `drop-shadow(0px 0px 6px ${theme.glowRgba})`,
            }}
          />

          {/* Needle Tip Accent Line */}
          <line
            x1={needleTip.x}
            y1={needleTip.y}
            x2={cx}
            y2={cy}
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity="0.8"
          />

          {/* Center Hub Outer Ring */}
          <circle
            cx={cx}
            cy={cy}
            r="28"
            fill="url(#hubGradient)"
            stroke="#3f3f46"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.8))' }}
          />

          {/* Center Hub Cap Center Pip */}
          <circle
            cx={cx}
            cy={cy}
            r="10"
            fill="#09090b"
            stroke={theme.hex}
            strokeWidth="2.5"
            style={{
              filter: `drop-shadow(0px 0px 4px ${theme.glowRgba})`,
            }}
          />
        </svg>
      </div>
    </div>
  );
};
