import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jitoindia.games',
  appName: 'JITO INDIA GAMES',
  webDir: '../web/out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    ScreenOrientation: {
      orientation: 'landscape',
    },
  },
};

export default config;
