import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anonymous.hiraai',
  appName: 'hira-ai',
  webDir: 'dist',
  server: {
    // optional: allow live reload to a dev server during development
    // url: 'http://localhost:8081',
    // cleartext: true,
  },
};

export default config;
