export type WeightingMode = 'A' | 'C' | 'Z';
export type ResponseSpeed = 'FAST' | 'SLOW';

export interface MeterStats {
  current: number;
  min: number;
  max: number;
  avg: number;
  peak: number;
  history: number[];
}

export interface SoundLevelCategory {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
