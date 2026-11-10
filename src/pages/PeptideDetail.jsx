import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import { CardArt } from '../components/Art'
import Icon from '../components/Icon'
import { GRADE, loadPeptide, themeFor, findPeptide } from '../lib/content'
import { useAuth } from '../lib/auth'
import { api } from '../lib/store'
import { Splash } from '../App'

const TABS = [
  ['overview', 'Overview'], ['origin', 'Origin'], ['mechanism', 'Mechanism'], ['research', 'Research'],
  ['dosing', 'Dosing reports'], ['pk', 'Pharmacokinetics'], ['synergy', 'Stacking'], ['safety', 'Safety'],
  ['monitoring', 'Monitoring'], ['regulatory', 'Regulatory'], ['cited', 'Evidence'],
]

export function Blocks({ blocks = [] }) {
  const out = []
  let ul = []
  const flush = () => { if (ul.length) { out.push(<ul key={'u' + out.length}>{ul}</ul>); ul = [] } }
  blocks.forEach((b, i) => {
    if (b.t === 'li') { ul.push(<li key={i}>{b.x}</li>); return }
    flush()
    if (b.t === 'h') out.push(<h3 key={i}>{b.x}</h3>)
    else if (b.t === 'note') out.push(<div key={i} className="note" style={{ margin: '10px 0' }}>{b.k && <b>{b.k}</b>}{b.x}</div>)
    else if (b.t === 'brief') out.push(<div key={i} className="brief" style={{ margin: '14px 0' }}><b className="small accent">In plain English · </b>{b.x}</div>)
    else if (b.t === 'year') out.push(<h3 key={i} className="accent">{b.x}</h3>)
    else out.push(<p key={i}>{b.x}</p>)
  })
  flush()
  return <div className="prose">{out}</div>
}

function Protocols({ list }) {
  if (!list?.length) return null
  return (
    <div className="stack" style={{ marginBottom: 16 }}>
      {list.map((p) => (
        <div key={p.n} className="card flat">
          <div className="row between wrap" style={{ marginBottom: 12 }}>
            <b>{p.name || `Protocol ${p.n}`}</b>
            {p.tag && <span className="pill">{p.tag}</span>}
          </div>
          <div className="proto">
            {[['Dose', p.dose], ['Frequency', p.frequency], ['Route', p.route], ['Duration', p.duration], ['Timing', p.timing]]
              .filter(([, v]) => v).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
          </div>
          {p.status && <p className="tiny muted" style={{ marginTop: 10 }}>FDA status: {p.status}</p>}
        </div>
      ))}
    </div>
  )
}

export default function PeptideDetail() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { user, profile, markRead, updateProfile } = useAuth()
  const [p, setP] = useState(null)
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState('')
  const meta = findPeptide(slug)

  useEffect(() => { setTab('overview'); loadPeptide(slug).then(setP) }, [slug])
  useEffect(() => { if (p) { const t = setTimeout(() => markRead('p:' + slug), 4000); return () => clearTimeout(t) } }, [p, slug, markRead])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2200); return () => clearTimeout(t) } }, [toast])

  if (!meta) return <div className="page empty">Peptide not found. <Link className="link" to="/peptides">Back to library</Link></div>
  if (!p) return <Splash />
  const t = themeFor(p.category)
  const saved = (profile?.bookmarks || []).includes(slug)
  const toggleSave = async () => {
    const b = profile?.bookmarks || []
    await updateProfile({ bookmarks: saved ? b.filter((x) => x !== slug) : [...b, slug] })
    setToast(saved ? 'Removed from saved' : 'Saved to your library')
  }
  const schedule = async () => {
    const d = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
    await api.add(user.uid, 'schedule', { type: 'peptide', refId: slug, title: `Read about ${p.name}`, date: d, done: false, createdAt: new Date().toISOString() })
    setToast('Added to tomorrow’s reading plan')
  }
  const grades = p.cited.reduce((m, c) => ({ ...m, [c.g]: (m[c.g] || 0) + 1 }), {})

  return (
    <>
      <TopBar back="/peptides" title={p.name} right={
        <button className="icon-btn" onClick={toggleSave} aria-label="Save"><Icon name={saved ? 'star' : 'bookmark'} style={saved ? { fill: 'currentColor' } : undefined} /></button>
      } />
      <div className="page fade-up">
        <div className="phead tint" style={{ background: t.bg, color: t.fg }}>
          <span className="pc-art"><CardArt kind={t.icon} color={t.fg} size={84} /></span>
          <span className="small bold">{p.category}</span>
          <h1 style={{ maxWidth: '75%', marginTop: 4 }}>{p.name}</h1>
          {p.alias && <p className="small" style={{ opacity: .85, marginTop: 4, maxWidth: '75%' }}>{p.alias}</p>}
          <p className="small bold" style={{ marginTop: 12, opacity: .9 }}>{p.status}</p>
          <div className="row wrap" style={{ marginTop: 16, gap: 8 }}>
            <button className="btn sm" onClick={() => nav(`/calculator?peptide=${slug}`)}><Icon name="syringe" size={16} /> Calculate dose</button>
            <button className="btn sm outline" style={{ background: 'rgba(255,255,255,.7)' }} onClick={schedule}><Icon name="calendar" size={16} /> Read later</button>
          </div>
        </div>

        <div className="tabs">
          {TABS.filter(([k]) => k === 'cited' ? p.cited.length : p.sections[k]).map(([k, label]) => (
            <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
              {label}{k === 'cited' ? ` (${p.cited.length})` : ''}
            </button>
          ))}
        </div>

        <div className="card fade-up" key={tab}>
          {tab === 'dosing' && (
            <div className="alert info" style={{ marginBottom: 14 }}>Reported research and community contexts, shown for education only. Not dosing instructions.</div>
          )}
          {tab === 'dosing' && <Protocols list={p.protocols} />}
          {tab === 'pk' && p.halfLifeText && <div className="note" style={{ marginBottom: 12 }}><b>Half-life basis</b>{p.halfLifeText}</div>}
          {tab === 'cited' ? (
            <>
              <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>
                {Object.keys(GRADE).filter((g) => grades[g]).map((g) => (
                  <span key={g} className="pill" title={GRADE[g].label}><span className="grade" style={{ background: GRADE[g].color, width: 18, height: 18, fontSize: 11 }}>{g}</span>{grades[g]} · {GRADE[g].label}</span>
                ))}
              </div>
              {p.cited.map((c, i) => (
                <div key={i} className="cite">
                  <span className="grade" style={{ background: GRADE[c.g]?.color }} title={GRADE[c.g]?.label}>{c.g}</span>
                  <div className="grow">{c.x}{c.u && <> · <a className="link" href={c.u} target="_blank" rel="noreferrer">Source ↗</a></>}</div>
                </div>
              ))}
            </>
          ) : (
            <Blocks blocks={(p.sections[tab] || []).filter((b) => !(tab === 'pk' && b.x.startsWith('Half-life basis')))} />
          )}
        </div>
        <p className="disclaimer">Research reference only · Not medical advice. Consult a qualified medical provider about side effects, interactions and contraindications.</p>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
