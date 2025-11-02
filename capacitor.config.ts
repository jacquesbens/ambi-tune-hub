import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d09c7eebe3774f76b23987e869857653',
  appName: 'MusicTV',
  webDir: 'dist',
  // Commenté pour l'APK de production - décommenter pour le développement avec hot-reload
  // server: {
  //   url: 'https://d09c7eeb-e377-4f76-b239-87e869857653.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
