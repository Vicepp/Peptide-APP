import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, touchProfile, today } from './store'
import { isAdminEmail, FIREBASE_ENABLED } from '../config'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const profileRef = useRef(null)
  profileRef.current = profile

  useEffect(() => {
    let off = () => {}
    api.onAuth(async (u) => {
      if (!u) { setUser(null); setProfile(null); return }
      try {
        const p = await touchProfile(u)
        setProfile(p)
      } catch (e) {
        console.error(e)
        setProfile({ id: u.uid, email: u.email, name: u.name })
      }
      setUser(u)
    }).then((fn) => { off = fn || off })
    return () => off()
  }, [])

  const updateProfile = useCallback(async (patch) => {
    if (!user) return
    const gained = 'xp' in patch ? patch.xp - (profileRef.current?.xp || 0) : 0
    setProfile((p) => ({ ...p, ...patch }))
    await api.saveProfile(user.uid, patch)
    if (gained > 0) api.addMemberXp(user.uid, gained, today()).catch(() => {}) // for period leaderboards
    // Keep the public community card (name + tier) in sync.
    const pub = {}
    for (const k of ['name', 'photo', 'xp', 'streak']) if (k in patch) pub[k] = patch[k]
    if (Object.keys(pub).length) api.saveMember(user.uid, pub).catch(() => {})
  }, [user])

  /** Mark an item read (p:slug or a:articleId) and award XP once. */
  const markRead = useCallback(async (key, xp = 15) => {
    if (!user || !profile) return
    const read = profile.readIds || []
    if (read.includes(key)) return
    await updateProfile({ readIds: [...read, key], xp: (profile.xp || 0) + xp })
  }, [user, profile, updateProfile])

  /** Saves seconds spent reading a lesson (only ever increases). */
  const saveReadTime = useCallback(async (id, secs) => {
    const cur = profileRef.current?.readSecs || {}
    if ((cur[id] || 0) >= secs) return
    await updateProfile({ readSecs: { ...cur, [id]: secs } })
  }, [updateProfile])

  const addXp = useCallback(async (n) => {
    if (!profile) return
    await updateProfile({ xp: (profile.xp || 0) + n })
  }, [profile, updateProfile])

  const value = {
    user, profile, updateProfile, markRead, addXp, saveReadTime,
    // With Firebase, admin also requires a verified email (Google sign-in is always verified).
    isAdmin: isAdminEmail(user?.email) && (!FIREBASE_ENABLED || !!user?.verified),
    loading: user === undefined,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
