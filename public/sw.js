self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.delete('ucetni-os-v1'),
      self.registration.unregister()
    ]).then(() => self.clients.matchAll())
      .then(clients => {
        clients.forEach(client => client.navigate(client.url))
      })
  )
})
