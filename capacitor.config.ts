import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bmp.ifilas.app',
  appName: 'iFilas',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: 'http'
  },  
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, 
      launchAutoHide: true,    
      backgroundColor: "#ffffff", 
      androidSplashResourceName: "splash", 
      androidScaleType: "CENTER_CROP",
      showSpinner: false,     
      androidSpinnerStyle: "large", 
      iosSpinnerStyle: "small",     
      spinnerColor: "#000000", 
      splashFullScreen: false,  
      splashImmersive: false,   
      layoutName: "launch_screen", 
      useDialog: false       
    }
  }
};

export default config;