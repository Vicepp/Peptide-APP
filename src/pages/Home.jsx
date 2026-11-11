import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pip, Molecule } from '../components/Art'
import Icon from '../components/Icon'
import PeptideCard from '../components/PeptideCard'
import NameTag from '../components/NameTag'
import { NotifyPrompt } from '../components/NotifySettings'
import { useAuth } from '../lib/auth'
import { api, today } from '../lib/store'
import { dailyPicks, PEPTIDES, findArticle, readProgress, fmtLeft } from '../lib/content'
import { levelFor } from '../config'

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

export default function Home() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const { peptide, article } = dailyPicks(profile || {})
  const lvl = levelFor(profile?.xp)
  const [todayPlan, setTodayPlan] = useState([])
  const read = new Set(profile?.readIds || [])

  useEffect(() => {
    api.list(user.uid, 'schedule').then((s) => setTodayPlan(s.filter((x) => x.date === today() && !x.done))).catch(() => {})
  }, [user.uid])

  const featured = ['semaglutide', 'tirzepatide', 'retatrutide', 'bpc-157', 'tb-500', 'ghk-cu']
    .map((s) => PEPTIDES.find((p) => p.slug === s)).filter(Boolean)
  const first = (profile?.name || '').split(' ')[0] || 'there'
  const aProg = readProgress(profile, article)
  const intro = findArticle('what-peptides-are')

  return (
    <div className="page fade-up">
      <div className="row between" style={{ marginTop: 4 }}>
        <div className="hello">
          <div className="avatar">{profile?.photo ? <img src={profile.photo} alt="" /> : first[0]?.toUpperCase()}</div>
          <div><h2 className="row" style={{ fontSize: 20, fontWeight: 900, gap: 6 }}>Hi, <NameTag name={first} xp={profile?.xp} size={22} /></h2><p className="muted small">{greet()} 👋</p></div>
        </div>
        <Link to="/schedule" className="icon-btn" aria-label="Reading plan"><Icon name="bell" /></Link>
      </div>

      {/* Stats */}
      <div className="grid" style={{ marginTop: 18, gridTemplateColumns: 'minmax(0,1fr) auto' }}>
        <div className="card stat">
          <div className="grow">
            <div className="row between small"><b className="bold" style={{ fontSize: 14 }}>Level {lvl.index} · {lvl.name}</b><span className="muted">{profile?.xp || 0} XP</span></div>
            <div className="progress" style={{ marginTop: 10 }}><i style={{ width: lvl.pct + '%' }} /></div>
            <p className="tiny muted" style={{ marginTop: 6 }}>{lvl.next ? `${lvl.next.xp - (profile?.xp || 0)} XP to ${lvl.next.name}` : 'Top level reached!'}</p>
          </div>
        </div>
        <div className="card stat"><span className="ic"><Icon name="fire" /></span><div><b>{profile?.streak || 1}</b><span className="tiny muted">Day streak</span></div></div>
      </div>

      {/* Today's read hero */}
      <div className="hero" style={{ marginTop: 16 }}>
        <span className="hero-deco" style={{ width: 180, height: 180, right: -40, top: -60 }} />
        <span className="hero-deco" style={{ width: 90, height: 90, right: 120, bottom: -40 }} />
        <div className="kicker">📖 Today’s read · {new Date().toLocaleDateString(undefined, { weekday: 'long' })}</div>
        <h3>Read about {peptide.name} today</h3>
        <p>{peptide.short.slice(0, 110)}…</p>
        <button className="btn" onClick={() => nav(`/peptides/${peptide.slug}`)}><Icon name="book" size={18} /> Start reading</button>
        <span className="hero-art"><Pip size={120} mood="happy" className="art" /></span>
      </div>

      <NotifyPrompt />

      {/* Plan for today */}
      {todayPlan.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row between"><b>📅 On your reading plan today</b><Link to="/schedule" className="link small">View plan</Link></div>
          <div className="stack" style={{ marginTop: 10 }}>
            {todayPlan.map((s) => (
              <Link key={s.id} to={s.type === 'peptide' ? `/peptides/${s.refId}` : `/learn/${s.refId}`} className="row small bold">
                <Icon name="chevron" size={16} className="accent" /> {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick tools */}
      <div className="section-title"><h2>Quick tools</h2></div>
      <div className="grid g4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {[
          { to: '/calculator', icon: 'syringe', t: 'Peptide calculator', s: 'Reconstitution & units', c: '#2F80ED', bg: '#EAF3FF' },
          { to: '/learn', icon: 'book', t: 'Learn', s: 'Lessons, evidence grades & glossary', c: '#2563EB', bg: '#E8F0FE' },
          { to: '/calculator?tab=pk', icon: 'chart', t: 'Half-life & steady state', s: 'Accumulation curves', c: '#0D9488', bg: '#E2F6F3' },
          { to: '/schedule', icon: 'calendar', t: 'Reading plan', s: 'Schedule what to read', c: '#6D5BD0', bg: '#EFEBFF' },
          { to: '/log', icon: 'log', t: 'Experience log', s: 'Private notes & tracking', c: '#C2410C', bg: '#FFF0E6' },
          { to: '/community', icon: 'chat', t: 'Community', s: 'Ask, share & leaderboard', c: '#DB2777', bg: '#FDECF4' },
        ].map((x) => (
          <Link key={x.t} to={x.to} className="card tool">
            <span className="ic tint" style={{ background: x.bg, color: x.c }}><Icon name={x.icon} /></span>
            <b>{x.t}</b><span className="small muted">{x.s}</span>
          </Link>
        ))}
      </div>

      {/* Suggested article */}
      <div className="section-title"><h2>Suggested lesson</h2><Link to="/learn" className="link small">All lessons</Link></div>
      <Link to={`/learn/${article.id}`} className="card row" style={{ alignItems: 'flex-start' }}>
        <span className="ic tint" style={{ width: 56, height: 56, borderRadius: 16, background: '#EAF3FF', display: 'grid', placeItems: 'center', flex: 'none' }}><Molecule size={44} className="art" /></span>
        <div className="grow">
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}><span className="pill">{article.groupTitle}</span><span className="tiny muted bold">⏱ {article.mins} min read</span></div>
          <h3 style={{ fontSize: 17, fontWeight: 900, marginTop: 6 }}>{article.title}</h3>
          <p className="small muted" style={{ marginTop: 4 }}>{article.summary.slice(0, 140)}…</p>
          {aProg.started && !aProg.done && (
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <div className="progress thin grow"><i style={{ width: aProg.pct + '%' }} /></div>
              <span className="tiny muted bold">{fmtLeft(aProg.left)}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Regulatory */}
      <Link to="/learn/2026-regulatory-update" className="card row" style={{ marginTop: 12, borderColor: 'var(--accent-2)' }}>
        <span className="ic" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="shield" /></span>
        <div className="grow"><b>2026 Regulatory Update</b><p className="small muted">FDA PCAC review dates and what “under review” really means.</p></div>
        <Icon name="chevron" className="faint" />
      </Link>

      {/* Popular */}
      <div className="section-title"><h2>Popular peptides</h2><Link to="/peptides" className="link small">View all 43</Link></div>
      <div className="grid g3">
        {featured.map((p) => <PeptideCard key={p.slug} p={p} read={read.has('p:' + p.slug)} />)}
      </div>

      {intro && (
        <Link to="/learn/what-peptides-are" className="card row" style={{ marginTop: 18 }}>
          <Pip size={54} mood="think" className="art" />
          <div className="grow"><b>New to peptides?</b><p className="small muted">Start with “{intro.title}”, a {intro.mins}-minute read.</p></div>
          <Icon name="chevron" className="faint" />
        </Link>
      )}
      <p className="disclaimer">Research reference only · Not medical advice. Always consult a qualified medical provider.</p>
    </div>
  )
}
