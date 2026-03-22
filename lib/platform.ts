let _Capacitor: { isNativePlatform(): boolean; getPlatform(): string } | null = null

function getCapacitor() {
  if (_Capacitor) return _Capacitor
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@capacitor/core')
    _Capacitor = mod.Capacitor
    return _Capacitor
  } catch {
    return null
  }
}

export function isNativePlatform(): boolean {
  return getCapacitor()?.isNativePlatform() ?? false
}

export function isAndroid(): boolean {
  return getCapacitor()?.getPlatform() === 'android'
}

export function isIOS(): boolean {
  return getCapacitor()?.getPlatform() === 'ios'
}

export function isWeb(): boolean {
  return getCapacitor()?.getPlatform() === 'web'
}
