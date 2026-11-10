/*
 * Usage analytics for the Admin dashboard:
 *  - active time in the app (only while the tab is visible and the person interacted in the last minute)
 *  - every page visited, with how long it was open
 *  - city & country of the login (once per session, from Vercel's /api/geo)
 * Data is batched and saved once a minute, and when the app is hidden/closed.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { api, today } from './store'

const IDLE_MS = 60000
const FLUSH_MS = 60000

async function fetchLocation() {
  try {
    if (sessionStorage.getItem('pw_geo_done')) return null
    sessionStorage.setItem('pw_geo_done', '1')
  } catch { /* storage blocked */ }
  try {
    const r = await fetch('/api/geo', { cache: 'no-store' })
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null // e.g. local dev
    const g = await r.json()
    return g.country ? { city: g.city || '', region: g.region || '', country: g.country, at: new Date().toISOString() } : null
  } catch { return null }
}

export function useActivityTracker(uid) {
  const loc = useLocation()
  const s = useRef({ path: null, at: null, active: 0, pending: 0, visits: [], loc: null, last: Date.now() })

  const closePage = () => {
    const c = s.current
    if (c.path) c.visits.push({ p: c.path, at: c.at, s: c.active })
    c.path = null
  }
  const flush = () => {
    const c = s.current
    if (!uid || (!c.pending && !c.visits.length && !c.loc)) return
    const payload = { secs: c.pending, visits: c.visits, loc: c.loc }
    c.pending = 0; c.visits = []; c.loc = null
    api.trackActivity(uid, today(), payload).catch(() => {})
  }

  // Count active seconds, flush every minute and when the app is hidden.
  useEffect(() => {
    if (!uid) return
    const c = s.current
    fetchLocation().then((g) => { if (g) { c.loc = g; flush() } })
    const poke = () => { c.last = Date.now() }
    const evs = ['scroll', 'touchstart', 'mousemove', 'keydown', 'click', 'wheel']
    evs.forEach((e) => window.addEventListener(e, poke, { passive: true }))
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - c.last < IDLE_MS) { c.active += 1; c.pending += 1 }
    }, 1000)
    const beat = setInterval(flush, FLUSH_MS)
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        const p = c.path; const q = c.at
        closePage(); flush()
        c.path = p; c.at = q; c.active = 0 // resume the same page when they come back
      } else { c.last = Date.now(); c.at = new Date().toISOString() }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      evs.forEach((e) => window.removeEventListener(e, poke))
      clearInterval(tick); clearInterval(beat)
      document.removeEventListener('visibilitychange', onVis)
      closePage(); flush()
    }
  }, [uid]) // eslint-disable-line react-hooks/exhaustive-deps

  // New page view on every route change.
  useEffect(() => {
    closePage()
    const c = s.current
    c.path = loc.pathname + loc.search
    c.at = new Date().toISOString()
    c.active = 0
  }, [loc.pathname, loc.search])
}
