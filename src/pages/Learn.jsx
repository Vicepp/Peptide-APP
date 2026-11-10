import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import { Molecule, Pip } from '../components/Art'
import { GRADE, GUIDES, ARTICLES, readProgress, fmtLeft } from '../lib/content'
import { useAuth } from '../lib/auth'
import glossary from '../data/glossary.json'

const GROUP_STYLE = {
  'getting-started': { bg: '#EAF3FF', fg: '#1E63C6', icon: 'book' },
  foundations: { bg: '#E2F6F3', fg: '#0F766E', icon: 'shield' },
  'steady-state': { bg: '#EFEBFF', fg: '#5B47C4', icon: 'chart' },
}

/** One lesson row: number/check, title, summary, minutes + progress. */
function LessonItem({ a, n, profile, snippet }) {
  const p = readProgress(profile, a)
  return (
    <Link to={`/learn/${a.id}`} className="list-item" style={{ alignItems: 'flex-start' }}>
      <span className="ic" style={{ background: p.done ? 'var(--accent)' : 'var(--surface)', color: p.done ? 'var(--accent-ink)' : 'var(--muted)', fontWeight: 900 }}>
        {p.done ? <Icon name="check" stroke={3} /> : n}
      </span>
      <div className="grow" style={{ minWidth: 0 }}>
        <b>{a.title}</b>
        <p className="small muted" style={{ marginTop: 2 }}>{snippet || (a.summary.slice(0, 90) + (a.summary.length > 90 ? '…' : ''))}</p>
        <div className="lesson-meta">
          <span>⏱ {a.mins} min read</span>
          {p.done ? <span className="accent">✓ Read</span>
            : p.started && <><div className="progress thin" style={{ flex: 1, maxWidth: 120 }}><i style={{ width: p.pct + '%' }} /></div><span>{fmtLeft(p.left)}</span></>}
        </div>
      </div>
    </Link>
  )
}

/** Short excerpt around the first match. */
function excerpt(a, q) {
  const i = a.text.indexOf(q)
  if (i < 0) return null
  const raw = [a.title, a.summary, ...(a.blocks || []).map((b) => b.x)].join(' ')
  const s = Math.max(0, i - 40)
  return (s > 0 ? '…' : '') + raw.slice(s, i + q.length + 70).trim() + '…'
}

export default function Learn() {
  const { profile } = useAuth()
  const read = new Set(profile?.readIds || [])
  const [tab, setTab] = useState('lessons')
  const [q, setQ] = useState('')
  const total = ARTICLES.length
  const done = ARTICLES.filter((a) => read.has('a:' + a.id)).length
  const minsLeft = ARTICLES.filter((a) => !read.has('a:' + a.id)).reduce((n, a) => n + Math.ceil(readProgress(profile, a).left / 60), 0)
  const inProgress = ARTICLES.find((a) => { const p = readProgress(profile, a); return p.started && !p.done })

  const query = q.trim().toLowerCase()
  const lessonHits = query ? ARTICLES.filter((a) => a.text.includes(query)) : []
  const termHits = query ? glossary.filter((g) => (g.term + ' ' + g.def).toLowerCase().includes(query)) : []

  return (
    <>
      <TopBar title="Learn" />
      <div className="page fade-up">
        <div className="card row" style={{ background: 'var(--accent-soft)', borderColor: 'transparent' }}>
          <Molecule size={70} className="art" />
          <div className="grow">
            <b>Your learning progress</b>
            <div className="progress" style={{ margin: '8px 0 4px' }}><i style={{ width: (done / total) * 100 + '%' }} /></div>
            <span className="small muted">{done} of {total} lessons read · about {minsLeft} min of reading left · +15 XP each</span>
          </div>
        </div>

        {inProgress && !query && (
          <Link to={`/learn/${inProgress.id}`} className="card row" style={{ marginTop: 12 }}>
            <Icon name="book" className="accent" />
            <div className="grow" style={{ minWidth: 0 }}>
              <span className="tiny muted bold">CONTINUE READING</span>
              <div className="bold">{inProgress.title}</div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <div className="progress thin grow"><i style={{ width: readProgress(profile, inProgress).pct + '%' }} /></div>
                <span className="tiny muted bold">{fmtLeft(readProgress(profile, inProgress).left)}</span>
              </div>
            </div>
            <Icon name="chevron" className="faint" />
          </Link>
        )}

        <div className="search-box" style={{ marginTop: 16 }}>
          <Icon name="search" size={20} className="faint" />
          <input className="input" type="search" placeholder="Search lessons, topics and glossary…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="mini-x" onClick={() => setQ('')} aria-label="Clear search"><Icon name="close" size={16} /></button>}
        </div>

        {query ? (
          <div style={{ marginTop: 16 }}>
            <p className="small muted bold" style={{ marginBottom: 10 }}>{lessonHits.length} lesson{lessonHits.length === 1 ? '' : 's'} · {termHits.length} glossary term{termHits.length === 1 ? '' : 's'}</p>
            {lessonHits.length > 0 && (
              <div className="grid g2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginBottom: 18 }}>
                {lessonHits.map((a) => <LessonItem key={a.id} a={a} n={<Icon name="book" size={18} />} profile={profile} snippet={excerpt(a, query)} />)}
              </div>
            )}
            {termHits.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 0 }}><h2>Glossary</h2></div>
                <div className="stack">
                  {termHits.slice(0, 30).map((g) => (
                    <div key={g.term} className="card flat" style={{ padding: 14 }}>
                      <div className="row between"><b>{g.term}</b><span className="tiny faint">{g.cat}</span></div>
                      <p className="small muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{g.def}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {lessonHits.length + termHits.length === 0 && (
              <div className="card empty stack" style={{ alignItems: 'center' }}>
                <Pip size={80} mood="think" className="art" />
                <b>No results for “{q}”</b>
                <p className="small">Try a peptide name, “half-life”, “FDA” or “reconstitution”.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="seg" style={{ margin: '18px 0', maxWidth: 520 }}>
              {[['lessons', 'Lessons'], ['evidence', 'Evidence grades'], ['glossary', 'Glossary']].map(([k, l]) => (
                <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {tab === 'lessons' && GUIDES.groups.map((g) => {
              const st = GROUP_STYLE[g.id]
              const mins = g.articles.reduce((n, a) => n + a.mins, 0)
              return (
                <section key={g.id} style={{ marginBottom: 26 }}>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <span className="tint" style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: st.bg, color: st.fg, flex: 'none' }}><Icon name={st.icon} /></span>
                    <div><h2 style={{ fontSize: 19, fontWeight: 900 }}>{g.title}</h2><p className="small muted">{g.blurb} · {g.articles.length} lessons · {mins} min</p></div>
                  </div>
                  <div className="grid g2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                    {g.articles.map((a, i) => <LessonItem key={a.id} a={a} n={i + 1} profile={profile} />)}
                  </div>
                </section>
              )
            })}

            {tab === 'evidence' && (
              <div className="card stack">
                <p className="muted small">Every peptide’s Evidence tab grades each source. Regulatory and anti-doping status (G–H) is kept separate from scientific evidence.</p>
                {GUIDES.legend.map((l) => (
                  <div key={l.grade} className="row"><span className="grade" style={{ background: GRADE[l.grade]?.color }}>{l.grade}</span><span>{l.label}</span></div>
                ))}
              </div>
            )}

            {tab === 'glossary' && (
              <div className="stack">
                {glossary.map((g) => (
                  <div key={g.term} className="card flat" style={{ padding: 14 }}>
                    <div className="row between"><b>{g.term}</b><span className="tiny faint">{g.cat}</span></div>
                    <p className="small muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{g.def}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <p className="disclaimer">{GUIDES.disclaimer.slice(0, 260)}</p>
      </div>
    </>
  )
}
