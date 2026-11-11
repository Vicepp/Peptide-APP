import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import { Badge } from '../components/Art'
import NameTag from '../components/NameTag'
import NotifySettings from '../components/NotifySettings'
import { useAuth } from '../lib/auth'
import { api } from '../lib/store'
import { disablePush } from '../lib/push'
import { getTheme, setTheme } from '../lib/theme'
import { GOALS, LEVELS, levelFor, APP_NAME, FIREBASE_ENABLED } from '../config'

export default function Profile() {
  const { profile, updateProfile, isAdmin } = useAuth()
  const nav = useNavigate()
  const [theme, setT] = useState(getTheme())
  const [name, setName] = useState(profile?.name || '')
  const lvl = levelFor(profile?.xp)
  const goals = profile?.goals || []
  const changeTheme = (m) => { setT(m); setTheme(m) }
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [delErr, setDelErr] = useState('')
  const deleteAccount = async () => {
    const typed = window.prompt('This permanently deletes your account and all your data. Type DELETE to confirm.')
    if (typed !== 'DELETE') return
    setDeleting(true); setDelErr('')
    try {
      await disablePush(user.uid).catch(() => {})
      await api.deleteAccount(user.uid)
      nav('/welcome')
    } catch (e) { setDelErr(e.message || 'Could not delete the account. Please try again.') }
    setDeleting(false)
  }
  const toggleGoal = (id) => updateProfile({ goals: goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id] })

  return (
    <>
      <TopBar title="Profile & settings" />
      <div className="page fade-up" style={{ maxWidth: 860 }}>
        <div className="card center stack" style={{ alignItems: 'center' }}>
          <Badge tier={lvl.index} size={84} />
          <h2 style={{ fontSize: 22, fontWeight: 900 }}><NameTag name={profile?.name} xp={profile?.xp} size={26} /></h2>
          <p className="small muted">{profile?.email}</p>
          <span className="pill">Level {lvl.index} · {lvl.name}</span>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <div className="progress"><i style={{ width: lvl.pct + '%' }} /></div>
            <p className="tiny muted" style={{ marginTop: 6 }}>{profile?.xp || 0} XP{lvl.next ? ` / ${lvl.next.xp} XP` : ''}</p>
          </div>
        </div>

        <div className="grid g3" style={{ marginTop: 14 }}>
          <div className="card stat"><span className="ic"><Icon name="fire" /></span><div><b>{profile?.streak || 1}</b><span className="tiny muted">Day streak</span></div></div>
          <div className="card stat"><span className="ic"><Icon name="book" /></span><div><b>{(profile?.readIds || []).length}</b><span className="tiny muted">Items read</span></div></div>
          <div className="card stat"><span className="ic"><Icon name="bookmark" /></span><div><b>{(profile?.bookmarks || []).length}</b><span className="tiny muted">Saved</span></div></div>
        </div>

        <div className="section-title"><h2>Tiers</h2></div>
        <div className="card tiers-strip">
          {LEVELS.map((l, i) => (
            <div key={l.name} className={'center' + (i + 1 === lvl.index ? ' current' : '')} style={{ opacity: i + 1 <= lvl.index ? 1 : 0.35 }}>
              <Badge tier={i + 1} size={40} /><div className="tiny bold">{l.name}</div><div className="tiny faint">{l.xp}+ XP</div>
            </div>
          ))}
        </div>

        <div className="section-title"><h2>Settings</h2></div>
        <div className="card stack gap-lg">
          <div className="field">
            <label>Appearance</label>
            <div className="seg">
              {[['light', '☀️ Light'], ['dark', '🌙 Dark'], ['system', '⚙️ System']].map(([k, l]) => (
                <button key={k} className={theme === k ? 'on' : ''} onClick={() => changeTheme(k)}>{l}</button>
              ))}
            </div>
            <span className="tiny faint">Dark mode uses a pure black & white palette.</span>
          </div>
          <NotifySettings />
          <div className="field">
            <label>Display name</label>
            <div className="row">
              <input className="input grow" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn sm" style={{ height: 52 }} disabled={!name.trim() || name === profile?.name} onClick={() => updateProfile({ name: name.trim() })}>Save</button>
            </div>
          </div>
          <div className="field">
            <label>Interests (shapes your daily reads)</label>
            <div className="chips wrap" style={{ flexWrap: 'wrap' }}>
              {GOALS.map((g) => <button key={g.id} className={'chip' + (goals.includes(g.id) ? ' on' : '')} onClick={() => toggleGoal(g.id)}>{g.emoji} {g.label}</button>)}
            </div>
          </div>
        </div>

        <div className="stack" style={{ marginTop: 14 }}>
          <Link to="/schedule" className="list-item"><Icon name="calendar" className="accent" /><span className="grow bold">Reading plan</span><Icon name="chevron" className="faint" /></Link>
          <Link to="/community" className="list-item"><Icon name="chat" className="accent" /><span className="grow bold">Community & leaderboard</span><Icon name="chevron" className="faint" /></Link>
          <Link to="/learn" className="list-item"><Icon name="book" className="accent" /><span className="grow bold">Lessons & glossary</span><Icon name="chevron" className="faint" /></Link>
          <Link to="/log" className="list-item"><Icon name="log" className="accent" /><span className="grow bold">Experience log</span><Icon name="chevron" className="faint" /></Link>
          {isAdmin && <Link to="/admin" className="list-item"><Icon name="users" className="accent" /><span className="grow bold">Admin dashboard</span><Icon name="chevron" className="faint" /></Link>}
          <button className="list-item" style={{ width: '100%', textAlign: 'left' }} onClick={async () => { await api.signOut(); nav('/login') }}>
            <Icon name="logout" style={{ color: 'var(--danger)' }} /><span className="grow bold" style={{ color: 'var(--danger)' }}>Log out</span>
          </button>
        </div>

        <div className="section-title"><h2>Help & legal</h2></div>
        <div className="stack">
          <Link to="/support" className="list-item"><Icon name="info" className="accent" /><span className="grow bold">Support & FAQ</span><Icon name="chevron" className="faint" /></Link>
          <Link to="/privacy" className="list-item"><Icon name="shield" className="accent" /><span className="grow bold">Privacy Policy</span><Icon name="chevron" className="faint" /></Link>
          <Link to="/terms" className="list-item"><Icon name="book" className="accent" /><span className="grow bold">Terms of Use</span><Icon name="chevron" className="faint" /></Link>
        </div>

        <div className="section-title"><h2>Danger zone</h2></div>
        <div className="card stack" style={{ borderColor: 'var(--danger)' }}>
          <b>Delete my account</b>
          <p className="small muted">Permanently deletes your account, progress, reading plan, experience log, analytics and community posts. This can’t be undone.</p>
          {delErr && <div className="alert">{delErr}</div>}
          <button className="btn sm" style={{ alignSelf: 'flex-start', background: 'var(--danger)', color: '#fff' }} disabled={deleting} onClick={deleteAccount}>
            <Icon name="trash" size={16} /> {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
        <p className="disclaimer">{APP_NAME} · {FIREBASE_ENABLED ? 'Synced with Firebase' : 'Demo mode (browser storage)'} · Research reference only, not medical advice.</p>
      </div>
    </>
  )
}
