import index from '../data/peptide-index.json'
import guides from '../data/guides.json'
import { GOALS } from '../config'

export const PEPTIDES = index

/* Reading time: ~220 words per minute, at least 1 minute. */
const WPM = 220
guides.groups.forEach((g) => g.articles.forEach((a) => {
  const text = [a.title, a.summary, ...(a.blocks || []).map((b) => b.x)].join(' ')
  a.words = text.split(/\s+/).filter(Boolean).length
  a.mins = Math.max(1, Math.round(a.words / WPM))
  a.text = text.toLowerCase() // for search
}))
export const GUIDES = guides

/** Reading progress for a lesson, from seconds spent reading. */
export function readProgress(profile, a) {
  const total = a.mins * 60
  const done = (profile?.readIds || []).includes('a:' + a.id)
  const secs = Math.min(total, profile?.readSecs?.[a.id] || 0)
  const pct = done ? 100 : Math.round((secs / total) * 100)
  const left = done ? 0 : total - secs
  return { pct, left, total, done, started: secs > 0 }
}
export const fmtLeft = (s) => (s <= 0 ? 'Done' : s < 60 ? '<1 min left' : `${Math.ceil(s / 60)} min left`)

let full = null
/** Full peptide breakdowns are large, so they load lazily. */
export async function loadPeptide(slug) {
  if (!full) full = (await import('../data/peptides.json')).default
  return full.find((p) => p.slug === slug)
}

export const ARTICLES = guides.groups.flatMap((g) => g.articles.map((a) => ({ ...a, group: g.id, groupTitle: g.title })))
export const findArticle = (id) => ARTICLES.find((a) => a.id === id)
export const findPeptide = (slug) => PEPTIDES.find((p) => p.slug === slug)

export const GRADE = {
  A: { label: 'Large clinical trial / meta-analysis', color: '#16A34A' },
  B: { label: 'Phase 1/2 or smaller controlled study', color: '#22C55E' },
  C: { label: 'Human observational / pilot / PK', color: '#84CC16' },
  D: { label: 'Animal / preclinical', color: '#F59E0B' },
  E: { label: 'In vitro / cell / mechanistic', color: '#F97316' },
  F: { label: 'Review article / synthesis', color: '#3B82F6' },
  G: { label: 'Official / regulatory / label', color: '#8B5CF6' },
  H: { label: 'Company topline / journalism', color: '#64748B' },
}

/** Colour theme + icon for a peptide category (used on cards). */
const THEMES = [
  { k: ['GLP', 'Metabolic', 'Fat', 'Amylin', 'Agonist', 'Visceral'], bg: '#FFE7D6', fg: '#C2410C', icon: 'flame' },
  { k: ['Repair', 'Inflamm'], bg: '#D7F5EF', fg: '#0F766E', icon: 'bandage' },
  { k: ['GH', 'GHRH', 'Growth'], bg: '#E0E7FF', fg: '#4338CA', icon: 'bolt' },
  { k: ['Nootropic', 'Neuro', 'Anxiolytic', 'Sleep'], bg: '#EDE4FF', fg: '#6D28D9', icon: 'brain' },
  { k: ['Longevity', 'Mitochondrial', 'Senolytic', 'Coenzyme', 'Antioxidant', 'Bioregulator'], bg: '#FEF3C7', fg: '#B45309', icon: 'hourglass' },
  { k: ['Skin', 'Hair', 'Cosmetic', 'Melanocortin'], bg: '#FCE7F3', fg: '#BE185D', icon: 'sparkle' },
  { k: ['Hormonal', 'Fertility'], bg: '#FFE4E6', fg: '#BE123C', icon: 'dna' },
  { k: ['Immune'], bg: '#DBEAFE', fg: '#1D4ED8', icon: 'shield' },
  { k: ['Opioid', 'High-Risk'], bg: '#FEE2E2', fg: '#B91C1C', icon: 'alert' },
]
export function themeFor(category = '') {
  return THEMES.find((t) => t.k.some((k) => category.includes(k))) || { bg: '#F1F5F9', fg: '#475569', icon: 'flask' }
}

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  ...GOALS.map((g) => ({ id: g.id, label: g.label, match: g.match })),
]

/* ---------------- Daily reading suggestions ---------------- */
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) }

/** Picks today's suggested peptide + article, favouring the user's goals and unread items. */
export function dailyPicks(profile = {}, date = new Date().toISOString().slice(0, 10)) {
  const read = new Set(profile.readIds || [])
  const goals = GOALS.filter((g) => (profile.goals || []).includes(g.id))
  let pool = PEPTIDES.filter((p) => !goals.length || goals.some((g) => g.match.some((m) => p.category.includes(m))))
  if (!pool.length) pool = PEPTIDES
  const unread = pool.filter((p) => !read.has('p:' + p.slug))
  const pPool = unread.length ? unread : pool
  const seed = hash(date + (profile.id || ''))
  const peptide = pPool[seed % pPool.length]
  const aUnread = ARTICLES.filter((a) => !read.has('a:' + a.id))
  const aPool = aUnread.length ? aUnread : ARTICLES
  const article = aPool[(seed >> 3) % aPool.length]
  return { peptide, article }
}
