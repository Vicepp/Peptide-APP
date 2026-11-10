import { findArticle, findPeptide } from './content'

/** "1h 05m", "12m", "45s" */
export function fmtDur(secs = 0) {
  const s = Math.round(secs || 0)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

let regionNames = null
/** "Lagos, Nigeria" from { city, country: 'NG' } */
export function placeLabel(loc) {
  if (!loc?.country) return '—'
  try { regionNames = regionNames || new Intl.DisplayNames(['en'], { type: 'region' }) } catch { /* old browser */ }
  const country = regionNames?.of(loc.country) || loc.country
  return loc.city ? `${loc.city}, ${country}` : country
}

/** Turns a route like /learn/what-peptides-are into a readable page name. */
export function pageLabel(path = '') {
  const [p, qs] = path.split('?')
  const parts = p.split('/').filter(Boolean)
  if (!parts.length) return { group: 'Home', name: 'Home' }
  const [a, b] = parts
  if (a === 'peptides') return b ? { group: 'Peptide', name: findPeptide(b)?.name || b } : { group: 'Library', name: 'Peptide library' }
  if (a === 'learn') return b ? { group: 'Lesson', name: findArticle(b)?.title || b } : { group: 'Learn', name: 'Learn' }
  if (a === 'calculator') return { group: 'Calculator', name: qs?.includes('tab=pk') ? 'Half-life calculator' : 'Reconstitution calculator' }
  const named = { community: 'Community', schedule: 'Reading plan', log: 'Experience log', profile: 'Profile & settings', admin: 'Admin', setup: 'Setup' }
  return { group: named[a] || a, name: named[a] || a }
}
