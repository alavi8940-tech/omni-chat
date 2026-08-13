/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.omnichat.app',
  appName: 'OmniChat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000'
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false
    }
  }
};

export default config;
