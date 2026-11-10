import { useEffect, useState } from 'react'
import { Pip } from '../components/Art'
import { Brand } from '../components/Layout'
import Icon from '../components/Icon'
import { useAuth } from '../lib/auth'
import { api } from '../lib/store'

/**
 * Shown to email/password accounts until they click the link in their verification email.
 * (Google sign-ins are verified automatically and never see this.)
 */
export default function VerifyEmail() {
  const { user, refreshUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ t: '', x: '' })
  const [cool, setCool] = useState(0)

  // Check automatically when the person comes back to this tab, and every few seconds.
  useEffect(() => {
    const check = () => refreshUser().catch(() => {})
    window.addEventListener('focus', check)
    const t = setInterval(check, 6000)
    return () => { window.removeEventListener('focus', check); clearInterval(t) }
  }, [refreshUser])

  useEffect(() => {
    if (cool <= 0) return
    const t = setTimeout(() => setCool(cool - 1), 1000)
    return () => clearTimeout(t)
  }, [cool])

  const done = async () => {
    setBusy(true); setMsg({ t: '', x: '' })
    try {
      const ok = await refreshUser()
      if (!ok) setMsg({ t: 'err', x: 'Not verified yet. Click the link in the email, then try again.' })
    } catch { setMsg({ t: 'err', x: 'Could not check right now. Please try again.' }) }
    setBusy(false)
  }

  const resend = async () => {
    setMsg({ t: '', x: '' })
    try {
      await api.sendVerification()
      setMsg({ t: 'info', x: `New verification email sent to ${user.email}.` })
      setCool(60)
    } catch (e) {
      setMsg({ t: 'err', x: String(e?.code || '').includes('too-many-requests')
        ? 'Too many emails sent. Please wait a few minutes and try again.'
        : 'Could not send the email. Please try again.' })
    }
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <Pip size={200} mood="wow" className="art" />
        <h2 style={{ fontSize: 30, fontWeight: 900 }}>One last step</h2>
        <p className="muted" style={{ maxWidth: 380 }}>Verifying your email keeps your account and our community safe.</p>
      </div>
      <div className="auth-form fade-up">
        <Brand />
        <div className="hide-desk center"><Pip size={110} mood="wow" className="art" /></div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>Verify your email</h1>
          <p className="muted" style={{ marginTop: 6, lineHeight: 1.55 }}>
            We sent a verification link to <b style={{ color: 'var(--text)' }}>{user?.email}</b>.
            Open it, click the link, then come back here.
          </p>
        </div>

        <div className="card flat stack" style={{ padding: 14 }}>
          <div className="row small"><Icon name="check" size={18} className="accent" /><span>Check your inbox <b>and spam/junk folder</b></span></div>
          <div className="row small"><Icon name="check" size={18} className="accent" /> This page continues automatically once verified</div>
        </div>

        {msg.x && <div className={'alert' + (msg.t === 'info' ? ' info' : '')}>{msg.x}</div>}

        <button className="btn block" onClick={done} disabled={busy}>{busy ? 'Checking…' : 'I’ve verified, continue'}</button>
        <button className="btn ghost block" onClick={resend} disabled={cool > 0}>
          {cool > 0 ? `Resend email in ${cool}s` : 'Resend verification email'}
        </button>
        <p className="small muted center">
          Wrong email? <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }} onClick={() => api.signOut()}>Use a different account</button>
        </p>
      </div>
    </div>
  )
}
