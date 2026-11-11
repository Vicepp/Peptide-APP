// POST /api/push  (called by the app, with the user's Firebase login token)
//  { type: 'update', title, body }  -> admins only: notify everyone who allows updates
//  { type: 'reply', postId }        -> notify the post author + others in that thread
import { configured, fb, verifyUser, isAdmin, readBody, sendToUsers } from './_firebase.js'

const cut = (s, n) => {
  s = String(s || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!configured()) return res.status(501).json({ error: 'Push is not configured (FIREBASE_SERVICE_ACCOUNT missing).' })
  const me = await verifyUser(req)
  if (!me) return res.status(401).json({ error: 'Not signed in' })
  const body = readBody(req)
  const { db } = fb()

  try {
    if (body.type === 'update') {
      if (!isAdmin(me)) return res.status(403).json({ error: 'Admins only' })
      const snap = await db.collection('users').where('notify.updates', '==', true).get()
      const sent = await sendToUsers(snap.docs, { title: '📣 ' + cut(body.title, 70), body: cut(body.body, 160), link: '/', tag: 'update' })
      return res.json({ sent })
    }

    if (body.type === 'reply') {
      const post = await db.doc(`posts/${String(body.postId || '')}`).get()
      if (!post.exists) return res.status(404).json({ error: 'Post not found' })
      // Only someone who has actually replied in this thread can trigger it.
      const comments = await post.ref.collection('comments').select('uid').get()
      const uids = comments.docs.map((d) => d.get('uid'))
      if (!uids.includes(me.uid)) return res.status(403).json({ error: 'No reply found' })
      const author = post.get('uid')
      const targets = [...new Set([author, ...uids])].filter((u) => u && u !== me.uid).slice(0, 100)
      if (!targets.length) return res.json({ sent: 0 })
      const [meDoc, ...docs] = await Promise.all([db.doc(`users/${me.uid}`).get(), ...targets.map((u) => db.doc(`users/${u}`).get())])
      const name = cut(meDoc.get('name') || 'Someone', 30)
      const excerpt = cut(post.get('body'), 70)
      const sent = await sendToUsers(docs.filter((d) => d.exists && d.get('notify.forum') === true), (d) => ({
        title: d.id === author ? `💬 ${name} replied to your post` : `💬 ${name} also replied`,
        body: `"${excerpt}"`,
        link: '/community',
        tag: 'reply-' + post.id,
      }))
      return res.json({ sent })
    }

    return res.status(400).json({ error: 'Unknown type' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not send' })
  }
}
