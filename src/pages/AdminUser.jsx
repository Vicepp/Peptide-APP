import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import NameTag from '../components/NameTag'
import { api, today } from '../lib/store'
import { GOALS, levelFor } from '../config'
import { findArticle, findPeptide, readProgress } from '../lib/content'
import { fmtDur, placeLabel, pageLabel } from '../lib/analytics'

const dayKey = (d) => d.toISOString().slice(0, 10)
const shortDay = (k) => new Date(k + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
const timeOf = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—')

/** Daily minutes, last 14 days. */
function DailyChart({ byDay }) {
  const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(Date.now() - (13 - i) * 864e5)))
  const vals = days.map((d) => (byDay[d]?.secs || 0) / 60)
  const max = Math.max(5, ...vals)
  const W = 560, H = 170, pad = 22, bw = (W - pad) / days.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} width="100%" role="img" aria-label="Minutes in app per day, last 14 days">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={pad} x2={W} y1={H - f * (H - 10)} y2={H - f * (H - 10)} stroke="var(--border)" />
          <text x={0} y={H - f * (H - 10) + 4} fontSize="10" fill="var(--faint)">{Math.round(f * max)}</text>
        </g>
      ))}
      {vals.map((v, i) => {
        const h = (v / max) * (H - 10)
        return (
          <g key={days[i]}>
            <title>{`${shortDay(days[i])}: ${fmtDur(v * 60)}`}</title>
            <rect x={pad + i * bw + 4} y={H - h} width={bw - 8} height={Math.max(h, v > 0 ? 2 : 0)} rx="4" fill="var(--accent)" opacity={days[i] === today() ? 1 : 0.75} />
            {i % 2 === 1 && <text x={pad + i * bw + bw / 2} y={H + 16} fontSize="10" textAnchor="middle" fill="var(--muted)">{shortDay(days[i])}</text>}
          </g>
        )
      })}
      <text x={W} y={H + 28} fontSize="10" textAnchor="end" fill="var(--faint)">minutes per day</text>
    </svg>
  )
}

export default function AdminUser() {
  const { uid } = useParams()
  const [u, setU] = useState(null)
  const [act, setAct] = useState(null)
  const [err, setErr] = useState('')
  const [day, setDay] = useState(null)

  useEffect(() => {
    api.getProfile(uid).then((p) => setU(p || {})).catch((e) => setErr(e.message))
    api.getActivity(uid, 60).then((a) => { setAct(a); setDay(a[0]?.date || null) }).catch((e) => { setErr(e.message); setAct([]) })
  }, [uid])

  const byDay = useMemo(() => Object.fromEntries((act || []).map((d) => [d.date, d])), [act])
  const allVisits = useMemo(() => (act || []).flatMap((d) => d.visits || []), [act])

  const sumDays = (n) => Array.from({ length: n }, (_, i) => byDay[dayKey(new Date(Date.now() - i * 864e5))]?.secs || 0).reduce((a, b) => a + b, 0)
  const week = sumDays(7)
  const activeDays7 = Array.from({ length: 7 }, (_, i) => byDay[dayKey(new Date(Date.now() - i * 864e5))]?.secs > 0).filter(Boolean).length

  const topPages = useMemo(() => {
    const m = {}
    allVisits.forEach((v) => {
      const l = pageLabel(v.p)
      const k = l.group + '|' + l.name
      m[k] = m[k] || { ...l, views: 0, secs: 0 }
      m[k].views += 1; m[k].secs += v.s || 0
    })
    return Object.values(m).sort((a, b) => b.secs - a.secs || b.views - a.views).slice(0, 10)
  }, [allVisits])
  const topMax = Math.max(1, ...topPages.map((p) => p.secs))

  if (err) return <><TopBar back="/admin" title="User analytics" /><div className="page"><div className="alert">{err}</div></div></>
  if (!u || !act) return <><TopBar back="/admin" title="User analytics" /><div className="page empty">Loading…</div></>

  const lvl = levelFor(u.xp)
  const readIds = u.readIds || []
  const lessons = readIds.filter((k) => k.startsWith('a:')).map((k) => findArticle(k.slice(2))).filter(Boolean)
  const peptides = readIds.filter((k) => k.startsWith('p:')).map((k) => findPeptide(k.slice(2))).filter(Boolean)
  const inProgress = Object.keys(u.readSecs || {}).map(findArticle).filter((a) => a && !readIds.includes('a:' + a.id))
  const dayVisits = [...(byDay[day]?.visits || [])].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <>
      <TopBar back="/admin" title="User analytics" />
      <div className="page fade-up" style={{ maxWidth: 980 }}>
        {/* Header */}
        <div className="card stack">
          <div className="row between" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 22 }}><NameTag name={u.name} xp={u.xp} size={26} showTier /></h2>
              <p className="small muted" style={{ marginTop: 4 }}>{u.email}</p>
            </div>
            <span className="pill">Level {lvl.index} · {u.xp || 0} XP</span>
          </div>
          <div className="kv-grid">
            <div><span>📍 Last login from</span><b>{placeLabel(u.location)}</b></div>
            <div><span>🕒 Last seen</span><b>{fmtDate(u.lastSeen || u.lastLogin)}</b></div>
            <div><span>📅 Joined</span><b>{fmtDate(u.createdAt)}</b></div>
            <div><span>📱 Device</span><b>{u.device || '—'}</b></div>
            <div><span>🔁 Logins</span><b>{u.loginCount || 0}</b></div>
            <div><span>🔥 Streak</span><b>{u.streak || 0} days</b></div>
          </div>
          {(u.locations || []).length > 1 && (
            <p className="small muted"><b>All login locations:</b> {u.locations.map((l) => {
              const [city, cc] = l.includes(', ') ? l.split(', ') : ['', l]
              return placeLabel({ city, country: cc })
            }).join(' · ')}</p>
          )}
        </div>

        {/* Time stats */}
        <div className="grid g4" style={{ marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {[
            ['Today', fmtDur(byDay[today()]?.secs || 0)],
            ['Last 7 days', fmtDur(week)],
            ['Daily average', fmtDur(activeDays7 ? week / activeDays7 : 0)],
            ['Total time', fmtDur(u.totalSecs || 0)],
          ].map(([l, v]) => (
            <div key={l} className="card stat"><span className="ic"><Icon name="chart" /></span><div><b>{v}</b><span className="tiny muted">{l}</span></div></div>
          ))}
        </div>

        <div className="section-title"><h2>Time in app per day</h2><span className="tiny muted">Active time only</span></div>
        <div className="card">{act.length ? <DailyChart byDay={byDay} /> : <p className="empty">No activity recorded yet.</p>}</div>

        {/* Top pages */}
        <div className="section-title"><h2>Most used pages</h2><span className="tiny muted">Last 60 days</span></div>
        <div className="card stack">
          {topPages.length === 0 && <p className="empty">No page visits recorded yet.</p>}
          {topPages.map((p) => (
            <div key={p.group + p.name}>
              <div className="row between small" style={{ gap: 8 }}>
                <span style={{ minWidth: 0 }}><span className="tiny faint bold">{p.group.toUpperCase()}</span> <b>{p.name}</b></span>
                <span className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtDur(p.secs)} · {p.views} view{p.views === 1 ? '' : 's'}</span>
              </div>
              <div className="progress thin" style={{ marginTop: 6 }}><i style={{ width: (p.secs / topMax) * 100 + '%' }} /></div>
            </div>
          ))}
        </div>

        {/* Reading */}
        <div className="section-title"><h2>What they read</h2></div>
        <div className="grid g2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="card stack">
            <b>📖 Lessons completed ({lessons.length})</b>
            {lessons.length === 0 && <p className="small muted">None yet.</p>}
            {lessons.map((a) => <Link key={a.id} to={`/learn/${a.id}`} className="small row"><Icon name="check" size={16} className="accent" /> {a.title}</Link>)}
            {inProgress.length > 0 && <>
              <b style={{ marginTop: 8 }}>⏳ In progress</b>
              {inProgress.map((a) => (
                <div key={a.id} className="small row between"><span>{a.title}</span><span className="muted">{readProgress(u, a).pct}%</span></div>
              ))}
            </>}
          </div>
          <div className="card stack">
            <b>🧪 Peptides read ({peptides.length})</b>
            {peptides.length === 0 && <p className="small muted">None yet.</p>}
            {peptides.map((p) => <Link key={p.slug} to={`/peptides/${p.slug}`} className="small row"><Icon name="check" size={16} className="accent" /> {p.name}</Link>)}
            {(u.bookmarks || []).length > 0 && <>
              <b style={{ marginTop: 8 }}>🔖 Saved</b>
              <p className="small muted">{u.bookmarks.map((s) => findPeptide(s)?.name || s).join(', ')}</p>
            </>}
          </div>
        </div>

        {/* Timeline */}
        <div className="section-title"><h2>Pages visited</h2></div>
        {act.length > 0 && (
          <div className="chips" style={{ overflowX: 'auto', marginBottom: 12 }}>
            {act.slice(0, 30).map((d) => (
              <button key={d.date} className={'chip' + (day === d.date ? ' on' : '')} onClick={() => setDay(d.date)}>
                {d.date === today() ? 'Today' : shortDay(d.date)} · {fmtDur(d.secs)}
              </button>
            ))}
          </div>
        )}
        <div className="card" style={{ padding: 0 }}>
          {byDay[day]?.loc && <p className="small muted" style={{ padding: '12px 16px 0' }}>📍 {placeLabel(byDay[day].loc)}</p>}
          {dayVisits.length === 0 && <p className="empty">No pages recorded for this day.</p>}
          {dayVisits.map((v, i) => {
            const l = pageLabel(v.p)
            return (
              <div key={i} className="timeline-row">
                <span className="tiny muted" style={{ width: 64, flex: 'none' }}>{timeOf(v.at)}</span>
                <div className="grow" style={{ minWidth: 0 }}><span className="tiny faint bold">{l.group.toUpperCase()}</span><div className="small bold">{l.name}</div></div>
                <span className="small muted" style={{ flex: 'none' }}>{fmtDur(v.s)}</span>
              </div>
            )
          })}
        </div>

        {/* Profile info */}
        <div className="section-title"><h2>Interests</h2></div>
        <div className="card small">
          <p><b>Experience:</b> {u.experience || '—'}</p>
          <p style={{ marginTop: 6 }}><b>Interests:</b> {(u.goals || []).map((g) => { const x = GOALS.find((y) => y.id === g); return x ? `${x.emoji} ${x.label}` : g }).join(', ') || '—'}</p>
        </div>
        <p className="disclaimer">Usage analytics are collected while the user is signed in. Time counts only while the app is open and in use.</p>
      </div>
    </>
  )
}
