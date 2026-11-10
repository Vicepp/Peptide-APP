/*
 * Data layer. Uses Firebase (Auth + Firestore) when VITE_FIREBASE_* keys are set,
 * otherwise falls back to DEMO MODE where everything is stored in this browser.
 * Every page talks to this file only, so both modes behave the same.
 */
import { FIREBASE_ENABLED, firebaseConfig } from '../config'

const today = () => new Date().toISOString().slice(0, 10)
const uid8 = () => Math.random().toString(36).slice(2, 10)

const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } },
}

/* ------------------------------------------------------------------ */
/* Firebase backend                                                    */
/* ------------------------------------------------------------------ */
let fb = null
async function getFb() {
  if (fb) return fb
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
  ])
  const app = initializeApp(firebaseConfig)
  fb = { auth: auth.getAuth(app), db: fs.getFirestore(app), A: auth, F: fs }
  return fb
}

const firebaseBackend = {
  async onAuth(cb) {
    const { auth, A } = await getFb()
    return A.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email, name: u.displayName, photo: u.photoURL } : null))
  },
  async signUp(name, email, password) {
    const { auth, A } = await getFb()
    const cred = await A.createUserWithEmailAndPassword(auth, email, password)
    await A.updateProfile(cred.user, { displayName: name })
    return { uid: cred.user.uid, email, name }
  },
  async signIn(email, password) {
    const { auth, A } = await getFb()
    const c = await A.signInWithEmailAndPassword(auth, email, password)
    return { uid: c.user.uid, email: c.user.email, name: c.user.displayName }
  },
  async google() {
    const { auth, A } = await getFb()
    const c = await A.signInWithPopup(auth, new A.GoogleAuthProvider())
    return { uid: c.user.uid, email: c.user.email, name: c.user.displayName, photo: c.user.photoURL }
  },
  async resetPassword(email) {
    const { auth, A } = await getFb()
    await A.sendPasswordResetEmail(auth, email)
  },
  async signOut() { const { auth, A } = await getFb(); await A.signOut(auth) },

  async getProfile(uid) {
    const { db, F } = await getFb()
    const s = await F.getDoc(F.doc(db, 'users', uid))
    return s.exists() ? { id: uid, ...s.data() } : null
  },
  async saveProfile(uid, data) {
    const { db, F } = await getFb()
    await F.setDoc(F.doc(db, 'users', uid), data, { merge: true })
  },
  async list(uid, col) {
    const { db, F } = await getFb()
    const s = await F.getDocs(F.collection(db, 'users', uid, col))
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async add(uid, col, data) {
    const { db, F } = await getFb()
    const r = await F.addDoc(F.collection(db, 'users', uid, col), data)
    return { id: r.id, ...data }
  },
  async update(uid, col, id, data) {
    const { db, F } = await getFb()
    await F.updateDoc(F.doc(db, 'users', uid, col, id), data)
  },
  async remove(uid, col, id) {
    const { db, F } = await getFb()
    await F.deleteDoc(F.doc(db, 'users', uid, col, id))
  },
  async allUsers() {
    const { db, F } = await getFb()
    const s = await F.getDocs(F.collection(db, 'users'))
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async announcements() {
    const { db, F } = await getFb()
    const s = await F.getDocs(F.query(F.collection(db, 'announcements'), F.orderBy('createdAt', 'desc'), F.limit(20)))
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async postAnnouncement(data) {
    const { db, F } = await getFb()
    await F.addDoc(F.collection(db, 'announcements'), data)
  },
  async deleteAnnouncement(id) {
    const { db, F } = await getFb()
    await F.deleteDoc(F.doc(db, 'announcements', id))
  },

  /* ---- Community ---- */
  async saveMember(uid, data) {
    const { db, F } = await getFb()
    await F.setDoc(F.doc(db, 'members', uid), data, { merge: true })
  },
  /** Adds XP earned on a given day (YYYY-MM-DD) - powers weekly/monthly/yearly leaderboards. */
  async addMemberXp(uid, n, day) {
    const { db, F } = await getFb()
    await F.setDoc(F.doc(db, 'members', uid), { xpDays: { [day]: F.increment(n) } }, { merge: true })
  },
  async members() {
    const { db, F } = await getFb()
    const s = await F.getDocs(F.query(F.collection(db, 'members'), F.orderBy('xp', 'desc'), F.limit(500)))
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async posts() {
    const { db, F } = await getFb()
    const s = await F.getDocs(F.query(F.collection(db, 'posts'), F.orderBy('createdAt', 'desc'), F.limit(60)))
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addPost(data) {
    const { db, F } = await getFb()
    const r = await F.addDoc(F.collection(db, 'posts'), data)
    return { id: r.id, ...data }
  },
  async deletePost(id) {
    const { db, F } = await getFb()
    await F.deleteDoc(F.doc(db, 'posts', id))
  },
  async toggleLike(postId, uid, on) {
    const { db, F } = await getFb()
    await F.updateDoc(F.doc(db, 'posts', postId), { likes: on ? F.arrayUnion(uid) : F.arrayRemove(uid) })
  },
  async comments(postId) {
    const { db, F } = await getFb()
    const s = await F.getDocs(F.query(F.collection(db, 'posts', postId, 'comments'), F.orderBy('createdAt', 'asc')))
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addComment(postId, data) {
    const { db, F } = await getFb()
    const r = await F.addDoc(F.collection(db, 'posts', postId, 'comments'), data)
    await F.updateDoc(F.doc(db, 'posts', postId), { commentCount: F.increment(1) })
    return { id: r.id, ...data }
  },
  async deleteComment(postId, id) {
    const { db, F } = await getFb()
    await F.deleteDoc(F.doc(db, 'posts', postId, 'comments', id))
    await F.updateDoc(F.doc(db, 'posts', postId), { commentCount: F.increment(-1) })
  },
}

/* ------------------------------------------------------------------ */
/* Demo backend (localStorage)                                          */
/* ------------------------------------------------------------------ */
const listeners = new Set()
const emit = () => { const s = ls.get('pw_session', null); listeners.forEach((cb) => cb(s)) }

const demoBackend = {
  async onAuth(cb) {
    listeners.add(cb)
    cb(ls.get('pw_session', null))
    return () => listeners.delete(cb)
  },
  async signUp(name, email, password) {
    const accounts = ls.get('pw_accounts', {})
    const key = email.toLowerCase()
    if (accounts[key]) throw new Error('An account with this email already exists.')
    if (password.length < 6) throw new Error('Password should be at least 6 characters.')
    const user = { uid: 'demo_' + uid8(), email: key, name }
    accounts[key] = { ...user, password }
    ls.set('pw_accounts', accounts)
    ls.set('pw_session', user)
    emit()
    return user
  },
  async signIn(email, password) {
    const a = ls.get('pw_accounts', {})[email.toLowerCase()]
    if (!a || a.password !== password) throw new Error('Wrong email or password.')
    const user = { uid: a.uid, email: a.email, name: a.name }
    ls.set('pw_session', user)
    emit()
    return user
  },
  async google() {
    throw new Error('Google sign-in needs Firebase. Add your Firebase keys to enable it.')
  },
  async resetPassword() {
    throw new Error('Password reset emails need Firebase. In demo mode, just create a new account.')
  },
  async signOut() { ls.set('pw_session', null); emit() },

  async getProfile(uid) { return ls.get('pw_users', {})[uid] || null },
  async saveProfile(uid, data) {
    const all = ls.get('pw_users', {})
    all[uid] = { ...(all[uid] || {}), ...data, id: uid }
    ls.set('pw_users', all)
  },
  async list(uid, col) { return ls.get(`pw_${col}_${uid}`, []) },
  async add(uid, col, data) {
    const items = ls.get(`pw_${col}_${uid}`, [])
    const item = { id: uid8(), ...data }
    ls.set(`pw_${col}_${uid}`, [item, ...items])
    return item
  },
  async update(uid, col, id, data) {
    ls.set(`pw_${col}_${uid}`, ls.get(`pw_${col}_${uid}`, []).map((x) => (x.id === id ? { ...x, ...data } : x)))
  },
  async remove(uid, col, id) {
    ls.set(`pw_${col}_${uid}`, ls.get(`pw_${col}_${uid}`, []).filter((x) => x.id !== id))
  },
  async allUsers() { return Object.values(ls.get('pw_users', {})) },
  async announcements() { return ls.get('pw_announcements', []) },
  async postAnnouncement(data) { ls.set('pw_announcements', [{ id: uid8(), ...data }, ...ls.get('pw_announcements', [])]) },
  async deleteAnnouncement(id) { ls.set('pw_announcements', ls.get('pw_announcements', []).filter((a) => a.id !== id)) },

  /* ---- Community ---- */
  async saveMember(uid, data) {
    const all = ls.get('pw_members', {})
    all[uid] = { ...(all[uid] || {}), ...data, id: uid }
    ls.set('pw_members', all)
  },
  async addMemberXp(uid, n, day) {
    const all = ls.get('pw_members', {})
    const m = all[uid] || { id: uid }
    m.xpDays = { ...(m.xpDays || {}), [day]: ((m.xpDays || {})[day] || 0) + n }
    all[uid] = m
    ls.set('pw_members', all)
  },
  async members() { seedDemo(); return Object.values(ls.get('pw_members', {})).sort((a, b) => (b.xp || 0) - (a.xp || 0)) },
  async posts() { seedDemo(); return ls.get('pw_posts', []) },
  async addPost(data) {
    const item = { id: uid8(), ...data }
    ls.set('pw_posts', [item, ...ls.get('pw_posts', [])])
    return item
  },
  async deletePost(id) { ls.set('pw_posts', ls.get('pw_posts', []).filter((p) => p.id !== id)) },
  async toggleLike(postId, uid, on) {
    ls.set('pw_posts', ls.get('pw_posts', []).map((p) => p.id !== postId ? p
      : { ...p, likes: on ? [...new Set([...(p.likes || []), uid])] : (p.likes || []).filter((u) => u !== uid) }))
  },
  async comments(postId) { return ls.get('pw_comments_' + postId, []) },
  async addComment(postId, data) {
    const item = { id: uid8(), ...data }
    ls.set('pw_comments_' + postId, [...ls.get('pw_comments_' + postId, []), item])
    bumpComments(postId, 1)
    return item
  },
  async deleteComment(postId, id) {
    ls.set('pw_comments_' + postId, ls.get('pw_comments_' + postId, []).filter((c) => c.id !== id))
    bumpComments(postId, -1)
  },
}

function bumpComments(postId, n) {
  ls.set('pw_posts', ls.get('pw_posts', []).map((p) => (p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) + n) } : p)))
}

/** Demo mode only: a few sample members & posts so the community doesn't start empty. */
function seedDemo() {
  if (ls.get('pw_community_seeded_v2', false)) return
  const firstTime = !ls.get('pw_community_seeded', false)
  const ago = (h) => new Date(Date.now() - h * 36e5).toISOString()
  // XP history per day, so the weekly / monthly / yearly boards differ.
  const days = (base, span, gap = 1) => {
    const o = {}
    for (let i = 0; i < span; i += gap) o[new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)] = base + ((i * 7) % 11)
    return o
  }
  const sample = [
    { id: 'sample_1', name: 'Dana R.', xp: 1640, streak: 42, xpDays: days(15, 300, 3) },
    { id: 'sample_2', name: 'Marcus T.', xp: 820, streak: 15, xpDays: days(25, 30) },
    { id: 'sample_3', name: 'Lena K.', xp: 340, streak: 6, xpDays: days(20, 14) },
    { id: 'sample_4', name: 'Sam O.', xp: 120, streak: 3, xpDays: days(20, 5) },
    { id: 'sample_5', name: 'Priya N.', xp: 40, streak: 1, xpDays: days(20, 1) },
  ]
  const members = ls.get('pw_members', {})
  sample.forEach((m) => { members[m.id] = { ...m, sample: true } })
  ls.set('pw_members', members)
  ls.set('pw_community_seeded_v2', true)
  if (!firstTime) return
  const posts = [
    { id: 'sp1', uid: 'sample_1', name: 'Dana R.', xp: 1640, topic: 'research', createdAt: ago(3), likes: ['sample_2', 'sample_3', 'sample_4'], commentCount: 1,
      body: 'Tip for newcomers: check the evidence grade before anything else. A lot of what gets repeated online is grade F/G (anecdotal or preclinical only). The [A] and [B] citations are where the real human data is.' },
    { id: 'sp2', uid: 'sample_3', name: 'Lena K.', xp: 340, topic: 'calculator', createdAt: ago(9), likes: ['sample_1'], commentCount: 0,
      body: 'The half-life tab finally made steady state click for me. Seeing the missed-dose dip on the chart explains more than any article I read.' },
    { id: 'sp3', uid: 'sample_4', name: 'Sam O.', xp: 120, topic: 'question', createdAt: ago(20), likes: [], commentCount: 0,
      body: 'What does "under review" by the FDA PCAC actually mean in practice? Is that the same as banned?' },
    { id: 'sp4', uid: 'sample_2', name: 'Marcus T.', xp: 820, topic: 'win', createdAt: ago(30), likes: ['sample_1', 'sample_5'], commentCount: 0,
      body: '15-day reading streak \u{1F525} Just hit Dose Detective. The daily read suggestions keep me coming back.' },
  ]
  ls.set('pw_posts', [...posts, ...ls.get('pw_posts', [])])
  ls.set('pw_comments_sp1', [{ id: 'sc1', uid: 'sample_2', name: 'Marcus T.', xp: 820, body: 'This. The grade legend in Learn \u2192 Evidence grades is worth reading first.', createdAt: ago(2) }])
  ls.set('pw_community_seeded', true)
}

export const api = FIREBASE_ENABLED ? firebaseBackend : demoBackend
export { today, ls }

/** Records a login / daily visit: updates streak, lastLogin, loginCount, device. */
export async function touchProfile(user) {
  const p = (await api.getProfile(user.uid)) || {}
  const t = today()
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  let streak = p.streak || 0
  let xp = p.xp || 0
  if (p.lastActiveDate !== t) {
    streak = p.lastActiveDate === y ? streak + 1 : 1
    xp += 20 // daily check-in
  }
  const patch = {
    email: user.email || p.email || '',
    name: p.name || user.name || (user.email || '').split('@')[0],
    photo: user.photo || p.photo || '',
    createdAt: p.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    lastActiveDate: t,
    loginCount: (p.loginCount || 0) + (p.lastActiveDate !== t ? 1 : 0),
    streak,
    xp,
    device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
  }
  await api.saveProfile(user.uid, patch)
  // Public card used by Community & leaderboard (no email, nothing private).
  api.saveMember(user.uid, { name: patch.name, photo: patch.photo, xp, streak })
    .then(() => (p.lastActiveDate !== t ? api.addMemberXp(user.uid, 20, t) : null)) // daily check-in XP
    .catch(() => {})
  return { ...p, ...patch, id: user.uid }
}
