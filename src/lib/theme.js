// Light / Dark / System theme, remembered in this browser.
const KEY = 'pw_theme'

export function getTheme() {
  try { return localStorage.getItem(KEY) || 'light' } catch { return 'light' }
}

export function applyTheme(mode = getTheme()) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#FFFFFF')
}

export function setTheme(mode) {
  try { localStorage.setItem(KEY, mode) } catch { /* ignore */ }
  applyTheme(mode)
}

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (getTheme() === 'system') applyTheme('system')
})
