import { isNativePlatform } from './platform'

const PUSH_PERMISSION_KEY = 'push-permission-asked'

/**
 * Initialize native platform features (status bar, push tap handler, splash).
 * Call once on app mount in client layout.
 * Push permission is NOT requested here — use requestPushPermission() from UI.
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

  // Push notification tap handler (does NOT request permission)
  try {
    const { onPushNotificationAction } = await import('./push-notifications')
    onPushNotificationAction((action) => {
      const data = action.notification.data
      if (data?.url && typeof data.url === 'string' && data.url.startsWith('/')) {
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

/**
 * Request push notification permission explicitly (from UI).
 * Only shows the system dialog once — subsequent calls are no-ops.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false

  // Don't ask again if already asked
  if (typeof localStorage !== 'undefined' && localStorage.getItem(PUSH_PERMISSION_KEY)) {
    return false
  }

  try {
    const { initPushNotifications } = await import('./push-notifications')
    const token = await initPushNotifications()

    // Mark as asked regardless of outcome
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PUSH_PERMISSION_KEY, new Date().toISOString())
    }

    if (token) {
      fetch('/api/client/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : 'android' }),
      }).catch(() => {})
      return true
    }
    return false
  } catch {
    return false
  }
}
