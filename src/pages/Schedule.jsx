import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import { Pip } from '../components/Art'
import { useAuth } from '../lib/auth'
import { api, today } from '../lib/store'
import { ARTICLES, PEPTIDES, dailyPicks } from '../lib/content'

const dayLabel = (d) => {
  const t = today()
  const tm = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  if (d === t) return 'Today'
  if (d === tm) return 'Tomorrow'
  return new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Schedule() {
  const { user, profile, addXp } = useAuth()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ ref: 'p:' + PEPTIDES[0].slug, date: today() })
  const load = () => api.list(user.uid, 'schedule').then((l) => setItems(l.sort((a, b) => a.date.localeCompare(b.date))))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e) => {
    e?.preventDefault()
    const [type, refId] = f.ref.split(':')
    const title = type === 'p' ? `Read about ${PEPTIDES.find((p) => p.slug === refId)?.name}` : ARTICLES.find((a) => a.id === refId)?.title
    await api.add(user.uid, 'schedule', { type: type === 'p' ? 'peptide' : 'guide', refId, title, date: f.date, done: false, createdAt: new Date().toISOString() })
    setOpen(false); load()
  }
  const autoPlan = async () => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10)
      const { peptide, article } = dailyPicks(profile || {}, d)
      const pick = i % 2 ? { type: 'guide', refId: article.id, title: article.title } : { type: 'peptide', refId: peptide.slug, title: `Read about ${peptide.name}` }
      await api.add(user.uid, 'schedule', { ...pick, date: d, done: false, createdAt: new Date().toISOString() })
    }
    load()
  }
  const toggle = async (s) => { await api.update(user.uid, 'schedule', s.id, { done: !s.done }); if (!s.done) addXp(10); load() }
  const remove = async (s) => { await api.remove(user.uid, 'schedule', s.id); load() }

  const upcoming = items.filter((s) => s.date >= today() || !s.done)
  const groups = upcoming.reduce((m, s) => ({ ...m, [s.date]: [...(m[s.date] || []), s] }), {})

  return (
    <>
      <TopBar back="/" title="Reading plan" right={<button className="btn sm" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Add</button>} />
      <div className="page fade-up" style={{ maxWidth: 780 }}>
        <div className="card row">
          <Pip size={64} mood="happy" className="art" />
          <div className="grow"><b>Learn a little every day</b><p className="small muted">Schedule what to read, or let Pip build a 7-day plan from your interests.</p></div>
        </div>
        <button className="btn block ghost" style={{ marginTop: 12 }} onClick={autoPlan}>✨ Auto-plan my next 7 days</button>

        {Object.keys(groups).length === 0 && <div className="empty">Nothing scheduled yet.</div>}
        {Object.entries(groups).map(([d, list]) => (
          <section key={d}>
            <div className="section-title"><h2 style={{ fontSize: 16 }}>{dayLabel(d)}{d < today() ? ' · overdue' : ''}</h2></div>
            <div className="stack">
              {list.map((s) => (
                <div key={s.id} className="list-item" style={{ cursor: 'default' }}>
                  <button className="ic" onClick={() => toggle(s)} aria-label="Mark done" style={{ border: 0, cursor: 'pointer', background: s.done ? 'var(--accent)' : 'var(--surface)', color: s.done ? 'var(--accent-ink)' : 'var(--faint)' }}>
                    <Icon name="check" stroke={3} />
                  </button>
                  <Link className="grow" to={s.type === 'peptide' ? `/peptides/${s.refId}` : `/learn/${s.refId}`}>
                    <b style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? .6 : 1 }}>{s.title}</b>
                    <div className="tiny muted">{s.type === 'peptide' ? 'Peptide breakdown' : 'Lesson'}</div>
                  </Link>
                  <button className="icon-btn" style={{ width: 36, height: 36, boxShadow: 'none' }} onClick={() => remove(s)} aria-label="Remove"><Icon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal stack" onClick={(e) => e.stopPropagation()} onSubmit={add}>
            <div className="row between"><h2 style={{ fontSize: 20, fontWeight: 900 }}>Schedule a read</h2>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" /></button></div>
            <div className="field"><label>What to read</label>
              <select className="input" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })}>
                <optgroup label="Peptides">{PEPTIDES.map((p) => <option key={p.slug} value={'p:' + p.slug}>{p.name}</option>)}</optgroup>
                <optgroup label="Lessons">{ARTICLES.map((a) => <option key={a.id} value={'a:' + a.id}>{a.title}</option>)}</optgroup>
              </select></div>
            <div className="field"><label>Date</label><input className="input" type="date" value={f.date} min={today()} onChange={(e) => setF({ ...f, date: e.target.value })} required /></div>
            <button className="btn block">Add to plan</button>
          </form>
        </div>
      )}
    </>
  )
}
