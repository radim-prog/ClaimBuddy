import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'cz.zajcon.app',
  appName: 'Účetní OS',
  webDir: 'out',
  server: {
    url: 'https://app.zajcon.cz',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#7c3aed',
      showSpinner: false,
    },
  },
}

export default config
