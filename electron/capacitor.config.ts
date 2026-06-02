import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spservices.stock',
  appName: 'SP-Services',
  webDir: 'out',
  server: {
    // Capacitor Android utilise "https://localhost" comme origine dans la WebView.
    // On force le schéma https pour que les cookies et le CORS fonctionnent.
    androidScheme: 'https',
    // ⚠️  Pour le live reload uniquement — décommenter et mettre ton IP locale :
    // url: 'http://192.168.X.X:3000',
    cleartext: true,
    // Hostname personnalisé — évite les conflits avec d'autres apps Capacitor
    // et donne une origine stable : https://spservices.localhost
    hostname: 'spservices.localhost',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#212fa8ff"
    }
  }
};

export default config;
