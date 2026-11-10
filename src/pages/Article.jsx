import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import { Blocks } from './PeptideDetail'
import Icon from '../components/Icon'
import { ARTICLES, findArticle, readProgress, fmtLeft } from '../lib/content'
import { useAuth } from '../lib/auth'
import { api } from '../lib/store'

const IDLE_AFTER = 90 // seconds without scrolling/touching before the timer pauses

/**
 * Tracks real reading time: counts only while the tab is visible and the reader
 * has interacted recently. Saved to the profile every 15 s and on leaving.
 */
function useReadingTimer(id, startSecs, enabled) {
  const [secs, setSecs] = useState(startSecs)
  const ref = useRef(startSecs)
  const lastActive = useRef(Date.now())

  useEffect(() => { ref.current = startSecs; setSecs(startSecs) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) return
    const poke = () => { lastActive.current = Date.now() }
    const evs = ['scroll', 'touchstart', 'mousemove', 'keydown', 'wheel']
    evs.forEach((e) => window.addEventListener(e, poke, { passive: true }))
    const tick = setInterval(() => {
      const active = document.visibilityState === 'visible' && Date.now() - lastActive.current < IDLE_AFTER * 1000
      if (active) { ref.current += 1; setSecs(ref.current) }
    }, 1000)
    return () => { evs.forEach((e) => window.removeEventListener(e, poke)); clearInterval(tick) }
  }, [id, enabled])

  return [secs, ref]
}

export default function Article() {
  const { id } = useParams()
  const { user, profile, markRead, saveReadTime } = useAuth()
  const [toast, setToast] = useState('')
  const a = findArticle(id)
  const prog = a ? readProgress(profile, a) : null
  const [secs, secsRef] = useReadingTimer(id, profile?.readSecs?.[id] || 0, !!a && !prog?.done)

  // Save progress periodically and when leaving the lesson.
  useEffect(() => {
    if (!a) return
    const save = () => saveReadTime(id, Math.round(secsRef.current))
    const t = setInterval(save, 15000)
    return () => { clearInterval(t); save() }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = a ? a.mins * 60 : 1
  const finished = prog?.done || secs >= total
  useEffect(() => {
    if (a && finished && !prog.done) { saveReadTime(id, total); markRead('a:' + id); setToast('Lesson complete · +15 XP') }
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2400); return () => clearTimeout(t) } }, [toast])

  if (!a) return <div className="page empty">Lesson not found. <Link className="link" to="/learn">Back</Link></div>
  const pct = finished ? 100 : Math.min(100, (secs / total) * 100)
  const i = ARTICLES.findIndex((x) => x.id === id)
  const next = ARTICLES[i + 1]
  const later = async () => {
    const d = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
    await api.add(user.uid, 'schedule', { type: 'guide', refId: id, title: a.title, date: d, done: false, createdAt: new Date().toISOString() })
    setToast('Added to tomorrow’s reading plan')
  }

  const bar = (
    <div className="read-bar">
      <div className="read-bar-in">
        <div className="progress thin grow"><i style={{ width: pct + '%' }} /></div>
        <span className="tiny bold" style={{ color: finished ? 'var(--accent-text)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
          {finished ? '✓ Read' : fmtLeft(total - secs)}
        </span>
      </div>
    </div>
  )

  return (
    <>
      <TopBar back="/learn" title={a.groupTitle} below={bar}
        right={<button className="icon-btn" onClick={later} aria-label="Read later"><Icon name="calendar" /></button>} />
      <div className="page fade-up" style={{ maxWidth: 780 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="pill">{a.groupTitle}</span>
          <span className="tiny muted bold">⏱ {a.mins} min read</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '10px 0 18px' }}>{a.title}</h1>
        <div className="card"><Blocks blocks={a.blocks} /></div>
        {next && (
          <Link to={`/learn/${next.id}`} className="list-item" style={{ marginTop: 18 }}>
            <div className="grow"><span className="tiny muted bold">NEXT LESSON · {next.mins} MIN READ</span><br /><b>{next.title}</b></div>
            <Icon name="chevron" className="accent" />
          </Link>
        )}
        <p className="disclaimer">Research reference only · Not medical advice.</p>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
