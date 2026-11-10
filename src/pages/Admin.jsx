import { useEffect, useMemo, useState } from 'react'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import NameTag from '../components/NameTag'
import { api, today } from '../lib/store'
import { GOALS, levelFor } from '../config'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { fmtDur, placeLabel } from '../lib/analytics'

const ago = (iso) => {
  if (!iso) return '—'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}

function exportCsv(users) {
  const cols = ['name', 'email', 'createdAt', 'lastLogin', 'loginCount', 'streak', 'xp', 'experience', 'goals', 'device', 'place', 'totalSecs']
  const esc = (v) => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`
  const csv = [cols.join(','), ...users.map((u) => cols.map((c) => esc(c === 'place' ? placeLabel(u.location) : u[c])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `users-${today()}.csv`
  a.click()
}

export default function Admin() {
  const [users, setUsers] = useState(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [ann, setAnn] = useState([])
  const [f, setF] = useState({ title: '', body: '' })
  const { user } = useAuth()
  const nav = useNavigate()
  const load = () => {
    setErr('')
    api.allUsers()
      // On a permission error, refresh the login token once and retry
      // (a recently verified email isn't in the old token yet).
      .catch(async (e) => {
        if (!String(e?.code || e?.message).includes('permission')) throw e
        await api.refreshToken()
        return api.allUsers()
      })
      .then(setUsers)
      .catch((e) => setErr(String(e?.code || e?.message).includes('permission')
        ? `The database rules don't accept ${user?.email} as an admin yet. In Firebase → Firestore → Rules, make sure this exact email is in the isAdmin() list, then click Publish.`
        : e.message))
    api.announcements().then(setAnn).catch(() => {})
  }
  useEffect(load, [])

  const list = useMemo(() => (users || [])
    .filter((u) => (u.name + ' ' + u.email).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.lastLogin || '').localeCompare(a.lastLogin || '')), [users, q])

  const post = async (e) => {
    e.preventDefault()
    await api.postAnnouncement({ ...f, createdAt: new Date().toISOString() })
    setF({ title: '', body: '' }); load()
  }

  const t = today()
  const stats = users ? [
    ['Total users', users.length, 'users'],
    ['Active today', users.filter((u) => u.lastActiveDate === t).length, 'fire'],
    ['New this week', users.filter((u) => u.createdAt && Date.now() - new Date(u.createdAt) < 7 * 864e5).length, 'star'],
    ['Mobile users', users.filter((u) => u.device === 'Mobile').length, 'syringe'],
    ['Countries', new Set(users.map((u) => u.location?.country).filter(Boolean)).size, 'flask'],
    ['Avg. time / user', fmtDur(users.reduce((n, u) => n + (u.totalSecs || 0), 0) / (users.length || 1)), 'chart'],
  ] : []

  return (
    <>
      <TopBar title="Admin dashboard" right={users && <button className="btn sm ghost" onClick={() => exportCsv(list)}>Export CSV</button>} />
      <div className="page fade-up">
        {err && <div className="alert stack">{err}<button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={load}>Try again</button></div>}
        <div className="grid g4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {stats.map(([l, v, ic]) => (
            <div key={l} className="card stat"><span className="ic"><Icon name={ic} /></span><div><b>{v}</b><span className="tiny muted">{l}</span></div></div>
          ))}
        </div>

        <div className="section-title"><h2>Users</h2><span className="tiny muted">Tap a user to see their analytics</span></div>
        <input className="input" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>User</th><th>Location</th><th>Time in app</th><th>Joined</th><th>Last login</th><th>Logins</th><th>Streak</th><th>Level</th><th>Interests</th><th>Device</th></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="clickable" onClick={() => nav(`/admin/users/${u.id}`)} title="View analytics">
                    <td><NameTag name={u.name || '—'} xp={u.xp} size={18} /><div className="tiny muted">{u.email}</div></td>
                    <td className="small">{placeLabel(u.location)}</td>
                    <td className="small bold">{u.totalSecs ? fmtDur(u.totalSecs) : '—'}</td>
                    <td className="small">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="small">{ago(u.lastLogin)}</td>
                    <td>{u.loginCount || 0}</td>
                    <td>{u.streak || 0}🔥</td>
                    <td className="small">{levelFor(u.xp).index} · {u.xp || 0} XP</td>
                    <td className="small">{(u.goals || []).map((g) => GOALS.find((x) => x.id === g)?.emoji).join(' ') || '—'}</td>
                    <td className="small">{u.device || '—'}</td>
                  </tr>
                ))}
                {users && list.length === 0 && <tr><td colSpan={10} className="empty">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-title"><h2>Post an update</h2></div>
        <form className="card stack" onSubmit={post}>
          <p className="small muted">Optional. Users see the newest update as a pop-up the next time they open the app.</p>
          <input className="input" placeholder="Title, e.g. FDA PCAC meeting rescheduled" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea className="input" placeholder="Message" required value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <button className="btn" style={{ alignSelf: 'flex-start' }}><Icon name="megaphone" size={18} /> Publish update</button>
        </form>
        {ann.length > 0 && (
          <div className="stack" style={{ marginTop: 12 }}>
            {ann.map((a) => (
              <div key={a.id} className="list-item" style={{ cursor: 'default' }}>
                <div className="grow"><b>{a.title}</b><div className="tiny muted">{ago(a.createdAt)}</div></div>
                <button className="icon-btn" style={{ width: 36, height: 36, boxShadow: 'none' }} onClick={async () => { await api.deleteAnnouncement(a.id); load() }} aria-label="Delete"><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
