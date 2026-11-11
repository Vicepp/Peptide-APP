import { useState } from 'react'
import Icon from './Icon'
import { useAuth } from '../lib/auth'
import { enablePush, disablePush, pushBlocker, pushEnabledHere } from '../lib/push'
import { ls } from '../lib/store'

const ALL_ON = { daily: true, updates: true, forum: true }
const OPTIONS = [
  ['daily', '📖 Daily reading reminder', 'Once a day, if you haven’t opened the app yet'],
  ['updates', '📣 Updates & news', 'Regulatory updates and announcements from the team'],
  ['forum', '💬 Community replies', 'When someone replies to your post or a thread you’re in'],
]

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={'switch' + (on ? ' on' : '')} onClick={() => onChange(!on)}>
      <i />
    </button>
  )
}

/** Full notification settings (Profile page). */
export default function NotifySettings() {
  const { user, profile, updateProfile } = useAuth()
  const [on, setOn] = useState(pushEnabledHere())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const blocker = pushBlocker()
  const prefs = { ...ALL_ON, ...(profile?.notify || {}) }

  const turnOn = async () => {
    setBusy(true); setErr('')
    try {
      await enablePush(user.uid)
      await updateProfile({ notify: { ...prefs, enabled: true } })
      setOn(true)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  const turnOff = async () => {
    setBusy(true)
    await disablePush(user.uid)
    setOn(false); setBusy(false)
  }
  const setPref = (k, v) => updateProfile({ notify: { ...prefs, [k]: v } })

  return (
    <div className="field">
      <label>Notifications</label>
      {blocker ? (
        <div className="alert info">{blocker}</div>
      ) : !on ? (
        <div className="row between" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="small muted">Get a daily reading reminder, updates and community replies.</span>
          <button type="button" className="btn sm" onClick={turnOn} disabled={busy}><Icon name="bell" size={16} /> {busy ? 'Turning on…' : 'Turn on'}</button>
        </div>
      ) : (
        <div className="stack" style={{ gap: 4 }}>
          {OPTIONS.map(([k, t, d]) => (
            <div key={k} className="row between notify-row">
              <div><b className="small">{t}</b><div className="tiny muted">{d}</div></div>
              <Toggle on={prefs[k] !== false} onChange={(v) => setPref(k, v)} label={t} />
            </div>
          ))}
          <button type="button" className="link small" style={{ alignSelf: 'flex-start', marginTop: 6 }} onClick={turnOff} disabled={busy}>Turn off on this device</button>
        </div>
      )}
      {err && <div className="alert" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  )
}

/** Small prompt card for the Home page. Hidden once enabled, dismissed, or unsupported. */
export function NotifyPrompt() {
  const { user, profile, updateProfile } = useAuth()
  const [hide, setHide] = useState(ls.get('pw_notify_prompt_hidden', false) || pushEnabledHere())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const blocker = pushBlocker()
  // On iPhone (not installed) we still show the card, with the Home Screen tip.
  const iosTip = blocker.startsWith('On iPhone')
  if (hide || (blocker && !iosTip)) return null
  const dismiss = () => { ls.set('pw_notify_prompt_hidden', true); setHide(true) }
  const turnOn = async () => {
    setBusy(true); setErr('')
    try {
      await enablePush(user.uid)
      await updateProfile({ notify: { ...ALL_ON, ...(profile?.notify || {}), enabled: true } })
      setHide(true)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  return (
    <div className="card row" style={{ marginTop: 14, alignItems: 'flex-start' }}>
      <span className="ic" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="bell" /></span>
      <div className="grow" style={{ minWidth: 0 }}>
        <b>Get a daily reading reminder</b>
        <p className="small muted" style={{ marginTop: 2 }}>{iosTip ? blocker : 'We’ll nudge you once a day, plus important updates and replies to your posts.'}</p>
        {!iosTip && <button className="btn sm" style={{ marginTop: 10 }} onClick={turnOn} disabled={busy}>{busy ? 'Turning on…' : 'Turn on notifications'}</button>}
        {err && <div className="alert" style={{ marginTop: 8 }}>{err}</div>}
      </div>
      <button className="mini-x" onClick={dismiss} aria-label="Dismiss"><Icon name="close" size={16} /></button>
    </div>
  )
}
