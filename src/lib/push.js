/*
 * Web push via Firebase Cloud Messaging.
 * Works on Android/desktop browsers, and on iPhone/iPad (iOS 16.4+) once the app
 * is added to the Home Screen. Needs VITE_FIREBASE_VAPID_KEY (see README).
 */
import { FIREBASE_ENABLED, firebaseConfig } from '../config'
import { api, getFb, ls } from './store'

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY
const TOKEN_KEY = 'pw_push_token'

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

/** Why push can't be used here, or '' if it can. */
export function pushBlocker() {
  if (!FIREBASE_ENABLED) return 'Notifications need Firebase (not available in demo mode).'
  if (!VAPID) return 'Notifications aren’t set up yet (missing VITE_FIREBASE_VAPID_KEY).'
  if (isIOS() && !isStandalone()) return 'On iPhone/iPad: tap Share → “Add to Home Screen”, open PepVella from your Home Screen, then turn on notifications here.'
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) return 'This browser doesn’t support notifications.'
  return ''
}
export const pushEnabledHere = () => !!ls.get(TOKEN_KEY, null) && typeof Notification !== 'undefined' && Notification.permission === 'granted'

let swReg = null
async function registerSW() {
  if (swReg) return swReg
  const cfg = encodeURIComponent(JSON.stringify(firebaseConfig))
  swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${cfg}`)
  await navigator.serviceWorker.ready
  return swReg
}

/** Asks permission, gets a device token and saves it to the user's profile. */
export async function enablePush(uid) {
  const why = pushBlocker()
  if (why) throw new Error(why)
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    throw new Error(perm === 'denied'
      ? 'Notifications are blocked for this site. Allow them in your browser/phone settings, then try again.'
      : 'Notifications were not allowed.')
  }
  const reg = await registerSW()
  const { app } = await getFb()
  const { getMessaging, getToken } = await import('firebase/messaging')
  const token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: reg })
  if (!token) throw new Error('Could not get a notification token. Please try again.')
  await api.savePushToken(uid, token, true)
  ls.set(TOKEN_KEY, token)
  listenForeground()
  return token
}

export async function disablePush(uid) {
  const token = ls.get(TOKEN_KEY, null)
  ls.set(TOKEN_KEY, null)
  if (!token) return
  try {
    const { app } = await getFb()
    const { getMessaging, deleteToken } = await import('firebase/messaging')
    await deleteToken(getMessaging(app))
  } catch { /* ignore */ }
  await api.savePushToken(uid, token, false).catch(() => {})
}

let listening = false
/** While the app is open, show incoming notifications too. */
export async function listenForeground() {
  if (listening || !pushEnabledHere() || pushBlocker()) return
  listening = true
  try {
    const reg = await registerSW()
    const { app } = await getFb()
    const { getMessaging, onMessage } = await import('firebase/messaging')
    onMessage(getMessaging(app), (p) => {
      const d = p.data || {}
      reg.showNotification(d.title || 'PepVella', { body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag, data: { link: d.link || '/' } })
    })
  } catch { listening = false }
}
