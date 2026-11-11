// App-wide settings. Change the name here to rebrand the whole app.
export const APP_NAME = 'PepVella'
export const APP_TAGLINE = 'Know your peptides. Dose with clarity.'

// Contact shown on the Support / Privacy / Terms pages. Use an inbox you actually check.
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@pepvella.com'
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'PepVella'
export const LEGAL_UPDATED = '10 November 2026'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const FIREBASE_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@demo.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase())

export const GOALS = [
  { id: 'metabolic', label: 'Weight & metabolic', emoji: '⚖️', match: ['Metabolic', 'Fat Loss', 'GLP', 'Amylin', 'Triple Agonist', 'Visceral'] },
  { id: 'repair', label: 'Healing & recovery', emoji: '🩹', match: ['Tissue Repair', 'Anti-Inflammatory'] },
  { id: 'gh', label: 'Growth hormone', emoji: '💪', match: ['GH Secretagogue', 'GHRH', 'Growth Factor'] },
  { id: 'brain', label: 'Focus & mood', emoji: '🧠', match: ['Nootropic', 'Anxiolytic', 'Sleep'] },
  { id: 'longevity', label: 'Longevity', emoji: '⏳', match: ['Longevity', 'Mitochondrial', 'Senolytic', 'Coenzyme', 'Antioxidant', 'Bioregulator'] },
  { id: 'skin', label: 'Skin & hair', emoji: '✨', match: ['Skin', 'Hair', 'Cosmetic', 'Melanocortin'] },
  { id: 'hormonal', label: 'Hormonal & fertility', emoji: '🧬', match: ['Hormonal', 'Fertility'] },
  { id: 'immune', label: 'Immune support', emoji: '🛡️', match: ['Immune'] },
]

export const LEVELS = [
  { name: 'Curious Beginner', xp: 0 },
  { name: 'Peptide Explorer', xp: 100 },
  { name: 'Research Reader', xp: 250 },
  { name: 'Lab Learner', xp: 450 },
  { name: 'Dose Detective', xp: 700 },
  { name: 'Protocol Pro', xp: 1000 },
  { name: 'Evidence Expert', xp: 1400 },
  { name: 'Peptide Scholar', xp: 1900 },
  { name: 'Research Master', xp: 2600 },
  { name: 'Peptide Legend', xp: 3500 },
]

export function levelFor(xp = 0) {
  let i = 0
  LEVELS.forEach((l, k) => { if (xp >= l.xp) i = k })
  const cur = LEVELS[i]
  const next = LEVELS[i + 1]
  const pct = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100
  return { index: i + 1, ...cur, next, pct }
}
