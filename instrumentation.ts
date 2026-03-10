export async function register() {
  // Server-side only initialization
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initRaynetCron } = await import('./lib/raynet-cron')
    initRaynetCron()
  }
}
