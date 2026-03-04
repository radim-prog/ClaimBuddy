export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[analytics]', name, payload || {});
  }
}

export function identifyUser(userId: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[analytics] identify', userId);
  }
}
