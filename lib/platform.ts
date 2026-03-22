/**
 * Platform detection for Capacitor native apps.
 * MUST NEVER crash on web — all functions return safe defaults.
 * Uses window.Capacitor (injected by Capacitor runtime) instead of
 * importing @capacitor/core to avoid webpack bundling issues.
 */

function getCapacitor(): { isNativePlatform(): boolean; getPlatform(): string } | null {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor
    }
  } catch {
    // ignore
  }
  return null
}

export function isNativePlatform(): boolean {
  try {
    return getCapacitor()?.isNativePlatform() ?? false
  } catch {
    return false
  }
}

export function isAndroid(): boolean {
  try {
    return getCapacitor()?.getPlatform() === 'android'
  } catch {
    return false
  }
}

export function isIOS(): boolean {
  try {
    return getCapacitor()?.getPlatform() === 'ios'
  } catch {
    return false
  }
}

export function isWeb(): boolean {
  try {
    return getCapacitor()?.getPlatform() === 'web'
  } catch {
    return true
  }
}
