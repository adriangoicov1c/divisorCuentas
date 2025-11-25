import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adriangoicovic.divisorcuentas',
  appName: 'Divisor cuentas',
  webDir: 'www',
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      KeyboardResize: 'native',
      AndroidWindowSoftInputMode: 'adjustResize',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000'
    },

  }, plugins: {
    StatusBar: {
      overlaysWebView: false
    }
  }

};

export default config;
