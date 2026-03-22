import { isNativePlatform } from './platform'

/**
 * Initialize native platform features (push notifications, status bar).
 * Call once on app mount in client layout.
 */
export async function initNativeFeatures() {
  if (!isNativePlatform()) return

  // Status bar — set theme color
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setBackgroundColor({ color: '#7c3aed' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    // Status bar not available
  }

  // Push notifications — register and store token
  try {
    const { initPushNotifications, onPushNotificationAction } = await import('./push-notifications')
    const token = await initPushNotifications()
    if (token) {
      // Send token to backend for storage
      fetch('/api/client/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: 'android' }),
      }).catch(() => {})
    }

    // Handle notification taps — navigate to relevant page
    onPushNotificationAction((action) => {
      const data = action.notification.data
      if (data?.url && typeof data.url === 'string') {
        window.location.href = data.url
      }
    })
  } catch {
    // Push notifications not available
  }

  // Splash screen — hide after app is ready
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration: 300 })
  } catch {
    // Splash screen not available
  }
}
