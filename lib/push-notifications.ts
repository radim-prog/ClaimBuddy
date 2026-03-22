import { PushNotifications } from '@capacitor/push-notifications'
import { isNativePlatform } from './platform'

export async function initPushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) return null

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
}

export function onPushNotification(callback: (notification: { title?: string; body?: string; data: Record<string, unknown> }) => void) {
  if (!isNativePlatform()) return
  PushNotifications.addListener('pushNotificationReceived', callback)
}

export function onPushNotificationAction(callback: (notification: { actionId: string; notification: { title?: string; body?: string; data: Record<string, unknown> } }) => void) {
  if (!isNativePlatform()) return
  PushNotifications.addListener('pushNotificationActionPerformed', callback)
}
