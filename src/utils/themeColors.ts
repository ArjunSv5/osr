export interface SoundThemeColor {
  hex: string;
  glowRgba: string;
  twText: string;
  twBorder: string;
  twBg: string;
  levelLabel: string;
}

export function getSoundThemeColor(db: number): SoundThemeColor {
  if (db < 50) {
    return {
      hex: '#34d399', // Emerald
      glowRgba: 'rgba(52, 211, 153, 0.4)',
      twText: 'text-emerald-400',
      twBorder: 'border-emerald-500/40',
      twBg: 'bg-emerald-950/40',
      levelLabel: 'QUIET',
    };
  }
  if (db < 65) {
    return {
      hex: '#22d3ee', // Cyan
      glowRgba: 'rgba(34, 211, 238, 0.4)',
      twText: 'text-cyan-400',
      twBorder: 'border-cyan-500/40',
      twBg: 'bg-cyan-950/40',
      levelLabel: 'MODERATE',
    };
  }
  if (db < 80) {
    return {
      hex: '#fbbf24', // Amber
      glowRgba: 'rgba(251, 191, 36, 0.45)',
      twText: 'text-amber-400',
      twBorder: 'border-amber-500/40',
      twBg: 'bg-amber-950/40',
      levelLabel: 'ELEVATED',
    };
  }
  if (db < 95) {
    return {
      hex: '#fb923c', // Orange
      glowRgba: 'rgba(251, 146, 60, 0.5)',
      twText: 'text-orange-400',
      twBorder: 'border-orange-500/40',
      twBg: 'bg-orange-950/40',
      levelLabel: 'HIGH',
    };
  }
  if (db < 110) {
    return {
      hex: '#f43f5e', // Rose
      glowRgba: 'rgba(244, 63, 94, 0.6)',
      twText: 'text-rose-400',
      twBorder: 'border-rose-500/40',
      twBg: 'bg-rose-950/40',
      levelLabel: 'VERY LOUD',
    };
  }
  return {
    hex: '#ef4444', // Red
    glowRgba: 'rgba(239, 68, 68, 0.75)',
    twText: 'text-red-500',
    twBorder: 'border-red-600/50',
    twBg: 'bg-red-950/50',
    levelLabel: 'CRITICAL',
  };
}
