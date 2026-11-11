/* Push notification service worker (Firebase Cloud Messaging).
 * The Firebase web config is passed in the registration URL (?config=...),
 * so no keys are hard-coded here. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

let cfg = {}
try { cfg = JSON.parse(new URL(self.location.href).searchParams.get('config') || '{}') } catch (e) { /* ignore */ }

if (cfg.apiKey) {
  firebase.initializeApp(cfg)
  const messaging = firebase.messaging()
  // Messages are data-only; we display them ourselves so every platform behaves the same.
  messaging.onBackgroundMessage((payload) => {
    const d = payload.data || {}
    return self.registration.showNotification(d.title || 'PepVella', {
      body: d.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: d.tag || undefined,
      data: { link: d.link || '/' },
    })
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = new URL((event.notification.data && event.notification.data.link) || '/', self.location.origin).href
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(self.location.origin) && 'focus' in w) {
          return w.focus().then(() => ('navigate' in w ? w.navigate(link) : null))
        }
      }
      return clients.openWindow(link)
    }),
  )
})
