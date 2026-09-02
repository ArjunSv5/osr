import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crowdvibe.decibelmeter',
  appName: 'Decibel Meter',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
