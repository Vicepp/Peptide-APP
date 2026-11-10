import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pip } from '../components/Art'
import { useAuth } from '../lib/auth'
import { GOALS } from '../config'

const LEVELS = [
  { id: 'new', label: 'Brand new', sub: 'I’m just learning what peptides are' },
  { id: 'some', label: 'Some experience', sub: 'I know the basics and a few compounds' },
  { id: 'adv', label: 'Experienced', sub: 'I read research and track protocols' },
]

export default function Setup() {
  const { profile, updateProfile } = useAuth()
  const nav = useNavigate()
  const [goals, setGoals] = useState(profile?.goals || [])
  const [exp, setExp] = useState(profile?.experience || 'new')
  const [busy, setBusy] = useState(false)
  const toggle = (id) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
  const save = async () => {
    setBusy(true)
    await updateProfile({ goals, experience: exp, setupDone: true, xp: (profile?.xp || 0) + 30 })
    nav('/')
  }
  return (
    <div className="onb">
      <div className="auth-form fade-up" style={{ maxWidth: 560 }}>
        <div className="row"><Pip size={70} mood="happy" className="art" />
          <div><h1 style={{ fontSize: 24, fontWeight: 900 }}>Hi {profile?.name?.split(' ')[0] || 'there'}! 👋</h1>
            <p className="muted">Tell me what you’re interested in, and I’ll tailor your daily reads.</p></div></div>
        <h3 className="bold" style={{ marginTop: 8 }}>Your interests</h3>
        <div className="grid g2">
          {GOALS.map((g) => (
            <button key={g.id} className={'goal' + (goals.includes(g.id) ? ' on' : '')} onClick={() => toggle(g.id)}>
              <span className="e">{g.emoji}</span>{g.label}
            </button>
          ))}
        </div>
        <h3 className="bold" style={{ marginTop: 8 }}>Your experience</h3>
        <div className="stack">
          {LEVELS.map((l) => (
            <button key={l.id} className={'goal' + (exp === l.id ? ' on' : '')} onClick={() => setExp(l.id)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              {l.label}<span className="small muted" style={{ fontWeight: 600 }}>{l.sub}</span>
            </button>
          ))}
        </div>
        <button className="btn block" disabled={busy} onClick={save}>Start exploring (+30 XP)</button>
        <button className="link small" onClick={save}>Skip for now</button>
      </div>
    </div>
  )
}
