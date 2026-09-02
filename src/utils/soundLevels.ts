import { SoundLevelCategory } from '../types';

export function getSoundLevelCategory(db: number): SoundLevelCategory {
  if (db < 50) {
    return {
      label: 'Quiet Environment',
      description: 'Whisper, quiet library, calm rustling leaves',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/40',
    };
  }
  if (db < 65) {
    return {
      label: 'Subdued Ambient',
      description: 'Quiet room, background hum, light rainfall',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/40',
    };
  }
  if (db < 75) {
    return {
      label: 'Moderate Sound',
      description: 'Quiet office, background conversation, gentle breeze',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40',
      borderColor: 'border-cyan-800/40',
    };
  }
  if (db < 85) {
    return {
      label: 'Conversational Noise',
      description: 'Normal speech, restaurant ambient, air conditioner',
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/40',
      borderColor: 'border-blue-800/40',
    };
  }
  if (db < 95) {
    return {
      label: 'Elevated Sound',
      description: 'Busy commercial street, bustling dining, heavy traffic',
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-800/40',
    };
  }
  if (db < 105) {
    return {
      label: 'High Acoustic Pressure',
      description: 'Loud venue, subway transit, power mower',
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/40',
      borderColor: 'border-orange-800/40',
    };
  }
  if (db < 115) {
    return {
      label: 'Very High Intensity',
      description: 'Industrial machinery, concert speakers, horn blast',
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/40',
      borderColor: 'border-rose-800/40',
    };
  }
  return {
    label: 'Critical Sound Level',
    description: 'Aviation engine, siren proximity, peak auditory load',
    color: 'text-red-500',
    bgColor: 'bg-red-950/50',
    borderColor: 'border-red-700/50',
  };
}
