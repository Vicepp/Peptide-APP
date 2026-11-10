import { useMemo, useState } from 'react'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import PeptideCard, { PeptideRow } from '../components/PeptideCard'
import { CATEGORY_FILTERS, PEPTIDES } from '../lib/content'
import { useAuth } from '../lib/auth'

export default function Library() {
  const { profile } = useAuth()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [view, setView] = useState('grid')
  const read = new Set(profile?.readIds || [])
  const bookmarks = profile?.bookmarks || []

  const list = useMemo(() => {
    const f = CATEGORY_FILTERS.find((c) => c.id === cat)
    const s = q.trim().toLowerCase()
    return PEPTIDES.filter((p) =>
      (cat === 'all' || (cat === 'saved' ? bookmarks.includes(p.slug) : f?.match?.some((m) => p.category.includes(m)))) &&
      (!s || (p.name + ' ' + p.alias + ' ' + p.category).toLowerCase().includes(s)))
  }, [q, cat, bookmarks])

  return (
    <>
      <TopBar title="Peptide library" right={
        <div className="seg" style={{ width: 96 }}>
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Grid view">▦</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List view">☰</button>
        </div>
      } />
      <div className="page fade-up">
        <div className="input-unit" style={{ position: 'relative' }}>
          <Icon name="search" className="faint" style={{ position: 'absolute', left: 16, top: 15 }} />
          <input className="input" style={{ paddingLeft: 46, fontWeight: 600, fontSize: 16 }} placeholder="Search 43 peptides, e.g. BPC-157, GLP-1…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips" style={{ margin: '14px 0 18px' }}>
          {[...CATEGORY_FILTERS, { id: 'saved', label: '★ Saved' }].map((c) => (
            <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.label}</button>
          ))}
        </div>
        <p className="small muted" style={{ marginBottom: 12 }}>{list.length} {list.length === 1 ? 'compound' : 'compounds'}</p>
        {list.length === 0 && <div className="empty">No peptides match your search.</div>}
        {view === 'grid' ? (
          <div className="grid g3">{list.map((p) => <PeptideCard key={p.slug} p={p} read={read.has('p:' + p.slug)} />)}</div>
        ) : (
          <div className="stack">{list.map((p) => <PeptideRow key={p.slug} p={p} />)}</div>
        )}
      </div>
    </>
  )
}
