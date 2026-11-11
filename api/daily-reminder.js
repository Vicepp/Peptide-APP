// Daily reading reminder. Run by Vercel Cron once a day (see vercel.json).
// Skips people who already opened the app today.
import { configured, fb, sendToUsers } from './_firebase.js'

const LINES = [
  'Your daily read is ready. A few minutes keeps you sharp.',
  'Today’s peptide pick is waiting for you.',
  'One short lesson today = +15 XP.',
  'Keep learning: open today’s suggested read.',
]

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' })
  if (!configured()) return res.status(501).json({ error: 'Push is not configured' })

  const { db } = fb()
  const today = new Date().toISOString().slice(0, 10)
  const snap = await db.collection('users').where('notify.daily', '==', true).get()
  const due = snap.docs.filter((d) => d.get('lastActiveDate') !== today && (d.get('pushTokens') || []).length)
  const line = LINES[new Date().getUTCDate() % LINES.length]
  const sent = await sendToUsers(due, (d) => {
    const streak = d.get('streak') || 0
    return {
      title: streak > 1 ? `\u{1F525} Keep your ${streak}-day streak going` : '\u{1F4D6} Time for today’s read',
      body: line,
      link: '/',
      tag: 'daily',
    }
  })
  return res.json({ users: due.length, sent })
}
