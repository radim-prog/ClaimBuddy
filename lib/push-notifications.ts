import { isNativePlatform } from './platform'

export async function initPushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) return null

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return null

    await PushNotifications.register()

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value)
      })
      PushNotifications.addListener('registrationError', () => {
        resolve(null)
      })
    })
  } catch {
    return null
  }
}

export function onPushNotification(callback: (notification: { title?: string; body?: string; data: Record<string, unknown> }) => void) {
  if (!isNativePlatform()) return
  try {
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      PushNotifications.addListener('pushNotificationReceived', callback)
    }).catch(() => {})
  } catch {
    // Capacitor not available
  }
}

export function onPushNotificationAction(callback: (notification: { actionId: string; notification: { title?: string; body?: string; data: Record<string, unknown> } }) => void) {
  if (!isNativePlatform()) return
  try {
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      PushNotifications.addListener('pushNotificationActionPerformed', callback)
    }).catch(() => {})
  } catch {
    // Capacitor not available
  }
}
