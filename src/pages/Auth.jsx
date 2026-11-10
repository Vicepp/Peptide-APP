import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pip } from '../components/Art'
import { Brand } from '../components/Layout'
import Icon from '../components/Icon'
import { api } from '../lib/store'
import { APP_NAME, APP_TAGLINE, FIREBASE_ENABLED } from '../config'

const niceError = (e) => {
  const c = e?.code || ''
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Wrong email or password.'
  if (c.includes('email-already-in-use')) return 'An account with this email already exists.'
  if (c.includes('weak-password')) return 'Password should be at least 6 characters.'
  if (c.includes('invalid-email')) return 'Please enter a valid email address.'
  if (c.includes('popup-closed')) return 'Sign-in window was closed.'
  return e?.message || 'Something went wrong. Please try again.'
}

export default function AuthPage({ mode }) {
  const signup = mode === 'signup'
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (signup) await api.signUp(f.name.trim(), f.email.trim(), f.password)
      else await api.signIn(f.email.trim(), f.password)
      nav('/')
    } catch (e2) { setErr(niceError(e2)) } finally { setBusy(false) }
  }
  const google = async () => {
    setErr('')
    try { await api.google(); nav('/') } catch (e2) { setErr(niceError(e2)) }
  }
  const reset = async () => {
    setErr(''); setInfo('')
    if (!f.email) return setErr('Enter your email above first.')
    try { await api.resetPassword(f.email.trim()); setInfo('Password reset email sent.') } catch (e2) { setErr(niceError(e2)) }
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <Pip size={200} mood={signup ? 'wave' : 'happy'} className="art" />
        <h2 style={{ fontSize: 30, fontWeight: 900 }}>{APP_TAGLINE}</h2>
        <p className="muted" style={{ maxWidth: 380 }}>Peptide calculator, research breakdowns, evidence grades and regulatory updates in one place.</p>
      </div>
      <form className="auth-form fade-up" onSubmit={submit}>
        <Brand />
        <div className="hide-desk center"><Pip size={110} mood={signup ? 'wave' : 'happy'} className="art" /></div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{signup ? `Join ${APP_NAME} free. It takes 30 seconds.` : 'Log in to continue your learning streak.'}</p>
        </div>
        {!FIREBASE_ENABLED && (
          <div className="alert info">Demo mode: accounts are stored in this browser. Sign up with <b>admin@demo.com</b> to see the Admin dashboard.</div>
        )}
        {err && <div className="alert">{err}</div>}
        {info && <div className="alert info">{info}</div>}
        {signup && (
          <div className="field"><label htmlFor="name">Full name</label>
            <input id="name" className="input" required value={f.name} onChange={set('name')} placeholder="e.g. Emily Johnson" autoComplete="name" /></div>
        )}
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></div>
        <div className="field"><label htmlFor="pw">Password</label>
          <input id="pw" type="password" className="input" required minLength={6} value={f.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete={signup ? 'new-password' : 'current-password'} /></div>
        {!signup && <button type="button" className="link small" style={{ alignSelf: 'flex-end' }} onClick={reset}>Forgot password?</button>}
        <button className="btn block" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
        <div className="divider">or</div>
        <button type="button" className="btn block outline" onClick={google}><Icon name="google" /> Continue with Google</button>
        <p className="center muted small">
          {signup ? <>Already have an account? <Link className="link" to="/login">Log in</Link></> : <>New here? <Link className="link" to="/signup">Create an account</Link></>}
        </p>
        <p className="tiny faint center">By continuing you agree this app is a research reference only and not medical advice.</p>
      </form>
    </div>
  )
}
