import { useEffect, useState } from 'react'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import { useAuth } from '../lib/auth'
import { api, today } from '../lib/store'
import { PEPTIDES } from '../lib/content'

const MOODS = ['😣', '😕', '😐', '🙂', '😄']

export default function Log() {
  const { user, addXp } = useAuth()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const blank = { peptide: PEPTIDES[0].name, amount: '', unit: 'mcg', date: today(), mood: 3, notes: '' }
  const [f, setF] = useState(blank)
  const load = () => api.list(user.uid, 'logs').then((l) => setItems(l.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e) => {
    e.preventDefault()
    await api.add(user.uid, 'logs', { ...f, createdAt: new Date().toISOString() })
    addXp(5); setOpen(false); setF(blank); load()
  }
  const remove = async (id) => { await api.remove(user.uid, 'logs', id); load() }

  return (
    <>
      <TopBar back="/" title="My experience log" right={<button className="btn sm" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> New entry</button>} />
      <div className="page fade-up" style={{ maxWidth: 780 }}>
        <div className="alert info">Your log is private to your account. Track entries, how you felt and any notes to discuss with your provider.</div>
        {items.length === 0 && (
          <div className="empty"><p style={{ fontSize: 40 }}>📝</p><p>No entries yet.</p>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => setOpen(true)}>Add your first entry</button></div>
        )}
        <div className="stack" style={{ marginTop: 16 }}>
          {items.map((l) => (
            <div key={l.id} className="card">
              <div className="row between">
                <div className="row"><span style={{ fontSize: 28 }}>{MOODS[l.mood - 1] || '🙂'}</span>
                  <div><b>{l.peptide}</b><div className="small muted">{new Date(l.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}{l.amount ? ` · ${l.amount} ${l.unit}` : ''}</div></div></div>
                <button className="icon-btn" style={{ width: 36, height: 36, boxShadow: 'none' }} onClick={() => remove(l.id)} aria-label="Delete"><Icon name="trash" size={16} /></button>
              </div>
              {l.notes && <p className="small" style={{ marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{l.notes}</p>}
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal stack" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="row between"><h2 style={{ fontSize: 20, fontWeight: 900 }}>New log entry</h2>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" /></button></div>
            <div className="field"><label>Compound</label>
              <select className="input" value={f.peptide} onChange={(e) => setF({ ...f, peptide: e.target.value })}>
                {PEPTIDES.map((p) => <option key={p.slug}>{p.name}</option>)}</select></div>
            <div className="row">
              <div className="field grow"><label>Amount</label><input className="input" type="number" step="any" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
              <div className="field" style={{ width: 110 }}><label>Unit</label>
                <select className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{['mcg', 'mg', 'units', 'IU'].map((u) => <option key={u}>{u}</option>)}</select></div>
            </div>
            <div className="field"><label>Date</label><input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div className="field"><label>How do you feel?</label>
              <div className="row between">{MOODS.map((m, i) => (
                <button type="button" key={m} onClick={() => setF({ ...f, mood: i + 1 })} style={{ fontSize: 30, background: f.mood === i + 1 ? 'var(--accent-soft)' : 'transparent', border: f.mood === i + 1 ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: 14, padding: '4px 8px', cursor: 'pointer' }}>{m}</button>
              ))}</div></div>
            <div className="field"><label>Notes</label><textarea className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Sleep, energy, side effects, anything notable…" /></div>
            <button className="btn block">Save entry (+5 XP)</button>
          </form>
        </div>
      )}
    </>
  )
}
