// Shared server helpers (files starting with "_" are not exposed as API routes on Vercel).
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { getAuth } from 'firebase-admin/auth'

export const configured = () => !!process.env.FIREBASE_SERVICE_ACCOUNT

export function fb() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n')
    initializeApp({ credential: cert(sa) })
  }
  return { db: getFirestore(), messaging: getMessaging(), auth: getAuth(), FieldValue }
}

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

export const isAdmin = (tok) => !!tok?.email_verified && ADMIN_EMAILS.includes((tok.email || '').toLowerCase())

/** Verifies the caller's Firebase login (Authorization: Bearer <idToken>). */
export async function verifyUser(req) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  try { return await fb().auth.verifyIdToken(h.slice(7)) } catch { return null }
}

export const readBody = (req) => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {})

/**
 * Sends a data-only push to every device token of the given user docs.
 * `dataFor(doc)` returns { title, body, link, tag }. Dead tokens are removed.
 */
export async function sendToUsers(docs, dataFor) {
  const { db, messaging, FieldValue } = fb()
  const msgs = []
  for (const d of docs) {
    const data = typeof dataFor === 'function' ? dataFor(d) : dataFor
    if (!data) continue
    const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')]))
    for (const token of d.get('pushTokens') || []) {
      msgs.push({ uid: d.id, msg: { token, data: clean, webpush: { headers: { Urgency: 'high', TTL: '86400' } } } })
    }
  }
  let sent = 0
  for (let i = 0; i < msgs.length; i += 500) {
    const chunk = msgs.slice(i, i + 500)
    const r = await messaging.sendEach(chunk.map((m) => m.msg))
    r.responses.forEach((res, j) => {
      if (res.success) { sent++; return }
      const code = res.error?.code || ''
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument')) {
        db.doc(`users/${chunk[j].uid}`).update({ pushTokens: FieldValue.arrayRemove(chunk[j].msg.token) }).catch(() => {})
      }
    })
  }
  return sent
}
