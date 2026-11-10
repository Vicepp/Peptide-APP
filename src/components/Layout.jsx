import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Icon from './Icon'
import { useAuth } from '../lib/auth'
import { APP_NAME, FIREBASE_ENABLED } from '../config'
import { api, ls } from '../lib/store'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><Icon name="flask" size={20} stroke={2.4} /></span>
      {APP_NAME}
    </div>
  )
}

const NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/peptides', label: 'Peptides', icon: 'flask' },
  { to: '/calculator', label: 'Calculator', icon: 'calc' },
  { to: '/learn', label: 'Learn', icon: 'book' },
  { to: '/community', label: 'Community', icon: 'chat' },
  { to: '/schedule', label: 'Reading plan', icon: 'calendar' },
  { to: '/log', label: 'My log', icon: 'log' },
  { to: '/profile', label: 'Profile & settings', icon: 'user' },
]

/** Shows the newest admin announcement once, as a pop-up. */
function AnnouncementPopup() {
  const [a, setA] = useState(null)
  useEffect(() => {
    api.announcements().then((list) => {
      const latest = list?.[0]
      if (latest && ls.get('pw_seen_ann', '') !== latest.id) setA(latest)
    }).catch(() => {})
  }, [])
  if (!a) return null
  const close = () => { ls.set('pw_seen_ann', a.id); setA(null) }
  return (
    <div className="modal-bg" onClick={close}>
      <div className="modal stack" onClick={(e) => e.stopPropagation()}>
        <span className="pill"><Icon name="megaphone" size={14} /> New update</span>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>{a.title}</h2>
        <p className="muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{a.body}</p>
        <button className="btn block" onClick={close}>Got it</button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}><Icon name={n.icon} /> {n.label}</NavLink>
        ))}
        {isAdmin && <NavLink to="/admin"><Icon name="users" /> Admin</NavLink>}
        <div style={{ marginTop: 'auto' }} className="tiny faint">
          Research reference only.<br />Not medical advice.
        </div>
      </aside>
      <div className="main">
        {!FIREBASE_ENABLED && <div className="demo-bar">Demo mode · data is saved in this browser only. Add Firebase keys to go live.</div>}
        <Outlet />
      </div>
      <nav className="bottomnav">
        <NavLink to="/" end><Icon name="home" /> Home</NavLink>
        <NavLink to="/peptides"><Icon name="flask" /> Peptides</NavLink>
        <NavLink to="/calculator" aria-label="Calculator"><span className="fab"><Icon name="calc" size={26} /></span></NavLink>
        <NavLink to="/community"><Icon name="chat" /> Community</NavLink>
        <NavLink to="/profile"><Icon name="user" /> Profile</NavLink>
      </nav>
      <AnnouncementPopup />
    </div>
  )
}

/** Sticky page header with optional back button and right-side actions. */
export function TopBar({ title, back, right, children, below }) {
  return (
    <header className="topbar">
      <div className="topbar-in">
        {back && (
          <button className="icon-btn" onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = back))} aria-label="Back">
            <Icon name="back" />
          </button>
        )}
        <div className="grow">{children || <h1>{title}</h1>}</div>
        {right}
      </div>
      {below}
    </header>
  )
}
