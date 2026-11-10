import { useEffect, useMemo, useState } from 'react'
import { TopBar } from '../components/Layout'
import Icon from '../components/Icon'
import NameTag from '../components/NameTag'
import { Pip, Badge } from '../components/Art'
import { useAuth } from '../lib/auth'
import { api, today } from '../lib/store'
import { levelFor, LEVELS } from '../config'
import { checkContent } from '../lib/moderation'

export const TOPICS = [
  { id: 'general', label: 'General', emoji: '💬' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'research', label: 'Research', emoji: '🔬' },
  { id: 'calculator', label: 'Calculator help', emoji: '🧮' },
  { id: 'win', label: 'Wins', emoji: '🏆' },
]

const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(iso).toLocaleDateString()
}

function Comments({ post, me, members, isAdmin, onCount }) {
  const [list, setList] = useState(null)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { api.comments(post.id).then(setList).catch(() => setList([])) }, [post.id])

  const send = async (e) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    const bad = checkContent(body, isAdmin)
    if (bad) { setErr(bad); return }
    setErr(''); setText('')
    const c = await api.addComment(post.id, { uid: me.uid, name: me.name, xp: me.xp, admin: !!isAdmin, body, createdAt: new Date().toISOString() })
    setList((l) => [...(l || []), c]); onCount(1)
  }
  const del = async (c) => {
    await api.deleteComment(post.id, c.id)
    setList((l) => l.filter((x) => x.id !== c.id)); onCount(-1)
  }

  return (
    <div className="comments">
      {list === null && <p className="tiny muted">Loading…</p>}
      {list?.map((c) => {
        const a = members[c.uid] || c
        return (
          <div key={c.id} className="comment">
            <div className="row between" style={{ gap: 8 }}>
              <span className="row" style={{ gap: 6, minWidth: 0 }}><NameTag name={a.name} xp={a.xp} size={16} />{c.admin && <span className="admin-tag">Admin</span>}</span>
              <span className="row" style={{ gap: 4 }}>
                <span className="tiny faint">{ago(c.createdAt)}</span>
                {(c.uid === me.uid || isAdmin) && <button className="mini-x" onClick={() => del(c)} aria-label="Delete comment"><Icon name="close" size={14} /></button>}
              </span>
            </div>
            <p className="small" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{c.body}</p>
          </div>
        )
      })}
      <form className="row" style={{ gap: 8, marginTop: 8 }} onSubmit={send}>
        <input className="input grow" style={{ height: 44 }} maxLength={1000} placeholder="Write a reply…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn sm" style={{ height: 44 }} disabled={!text.trim()} aria-label="Send"><Icon name="send" size={18} /></button>
      </form>
      {err && <div className="alert" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  )
}

/** Admin posts: make http(s) links clickable. */
function Linkified({ text }) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="link">{part}</a>
      : part)
}

function PostCard({ post, me, members, isAdmin, onChange, onDelete }) {
  const [open, setOpen] = useState(false)
  const likes = post.likes || []
  const liked = likes.includes(me.uid)
  const author = members[post.uid] || post
  const lvl = levelFor(author.xp)
  const topic = TOPICS.find((t) => t.id === post.topic)

  const like = () => {
    const on = !liked
    onChange({ ...post, likes: on ? [...likes, me.uid] : likes.filter((u) => u !== me.uid) })
    api.toggleLike(post.id, me.uid, on).catch(() => {})
  }

  return (
    <article className="card post">
      <div className="row between" style={{ alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <span className="row" style={{ gap: 6, minWidth: 0 }}><NameTag name={author.name} xp={author.xp} size={22} />{post.admin && <span className="admin-tag">Admin</span>}</span>
          <div className="tiny muted" style={{ marginTop: 2, paddingLeft: 28 }}>{lvl.name} · {ago(post.createdAt)}</div>
        </div>
        {topic && <span className="pill" style={{ flex: 'none' }}>{topic.emoji} {topic.label}</span>}
      </div>
      <p className="post-body">{post.admin ? <Linkified text={post.body} /> : post.body}</p>
      <div className="post-actions">
        <button className={'act' + (liked ? ' on' : '')} onClick={like} aria-pressed={liked}><Icon name="heart" size={18} /> {likes.length || 'Like'}</button>
        <button className={'act' + (open ? ' open' : '')} onClick={() => setOpen(!open)}><Icon name="chat" size={18} /> {post.commentCount || 'Reply'}</button>
        {(post.uid === me.uid || isAdmin) && (
          <button className="act" style={{ marginLeft: 'auto' }} onClick={() => onDelete(post)} aria-label="Delete post"><Icon name="trash" size={16} /></button>
        )}
      </div>
      {open && <Comments post={post} me={me} members={members} isAdmin={isAdmin}
        onCount={(n) => onChange({ ...post, commentCount: Math.max(0, (post.commentCount || 0) + n) })} />}
    </article>
  )
}

/* ---- Leaderboard periods (dates are YYYY-MM-DD, same as today()) ---- */
const PERIODS = [
  { id: 'week', label: 'This week', short: 'this week' },
  { id: 'last', label: 'Last week', short: 'last week' },
  { id: 'month', label: 'This month', short: 'this month' },
  { id: 'year', label: 'This year', short: 'this year' },
  { id: 'all', label: 'All time', short: 'all time', admin: true },
]
const dayKey = (d) => d.toISOString().slice(0, 10)
function rangeFor(id) {
  const n = new Date()
  const t = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
  const monday = new Date(t - ((t.getUTCDay() + 6) % 7) * 864e5)
  if (id === 'week') return [dayKey(monday), dayKey(t)]
  if (id === 'last') return [dayKey(new Date(monday - 7 * 864e5)), dayKey(new Date(monday - 864e5))]
  if (id === 'month') return [dayKey(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1))), dayKey(t)]
  if (id === 'year') return [dayKey(new Date(Date.UTC(t.getUTCFullYear(), 0, 1))), dayKey(t)]
  return null // all time
}
const scoreFor = (m, range) => (range
  ? Object.entries(m.xpDays || {}).reduce((s, [d, v]) => (d >= range[0] && d <= range[1] ? s + v : s), 0)
  : m.xp || 0)

function Leaderboard({ members, me, isAdmin }) {
  const [period, setPeriod] = useState('week')
  const P = PERIODS.find((p) => p.id === period)
  const range = rangeFor(period)
  // Always show 20 people: ranked by XP in the period, ties (incl. 0 XP) broken by total XP.
  const ranked = Object.values(members)
    .map((m) => ({ ...m, score: scoreFor(m, range) }))
    .sort((a, b) => b.score - a.score || (b.xp || 0) - (a.xp || 0))
  const list = ranked.slice(0, 20)
  const myRank = ranked.findIndex((m) => m.id === me.uid) + 1
  const mine = ranked[myRank - 1]
  const myScore = mine?.score || 0
  const lvl = levelFor(me.xp)
  const fmtRange = range && [range[0], range[1]].map((d) => new Date(d + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })).join(' – ')
  return (
    <>
      <div className="chips" style={{ marginBottom: 12, overflowX: 'auto' }}>
        {PERIODS.filter((p) => !p.admin || isAdmin).map((p) => (
          <button key={p.id} className={'chip' + (period === p.id ? ' on' : '')} onClick={() => setPeriod(p.id)}>
            {p.label}{p.admin && ' 🔒'}
          </button>
        ))}
      </div>

      <div className="hero" style={{ marginBottom: 14 }}>
        <span className="hero-deco" style={{ width: 160, height: 160, right: -40, top: -60 }} />
        <div className="kicker">🏆 {P.label}{fmtRange ? ` · ${fmtRange}` : ' · admin view'}</div>
        <h3>{myRank ? `You're #${myRank} ${P.short}` : `Earn XP to rank ${P.short}`}</h3>
        <p>{myScore} XP earned {P.short}. Level {lvl.index} · {lvl.name}.</p>
        <span className="hero-art"><Pip size={110} mood="wow" className="art" /></span>
      </div>

      <div className="card tiers-strip">
        {LEVELS.map((l, i) => (
          <div key={l.name} className={'center' + (i + 1 === lvl.index ? ' current' : '')} style={{ opacity: i + 1 <= lvl.index ? 1 : 0.4 }}>
            <Badge tier={i + 1} size={34} />
            <div className="tiny bold">{l.name}</div>
            <div className="tiny faint">{l.xp}+ XP</div>
          </div>
        ))}
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {[...list, ...(myRank > 20 ? [mine] : [])].map((m, i) => (
          <div key={m.id} className={'list-item lb-row' + (m.id === me.uid ? ' me' : '')} style={{ cursor: 'default', marginTop: i === 20 ? 10 : 0 }}>
            <span className="rank">{i === 20 ? myRank : ['🥇', '🥈', '🥉'][i] || i + 1}</span>
            <div className="grow" style={{ minWidth: 0 }}>
              <NameTag name={m.id === me.uid ? `${m.name} (you)` : m.name} xp={m.xp} size={22} />
              <div className="tiny muted" style={{ paddingLeft: 28 }}>{levelFor(m.xp).name}</div>
            </div>
            <div className="right">
              <b>{m.score}</b><div className="tiny muted">XP · {m.streak || 0}🔥</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function Community() {
  const { user, profile, isAdmin, updateProfile } = useAuth()
  const [tab, setTab] = useState('feed')
  const [posts, setPosts] = useState(null)
  const [members, setMembers] = useState({})
  const [filter, setFilter] = useState('all')
  const [draft, setDraft] = useState('')
  const [dTopic, setDTopic] = useState('general')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const me = { uid: user.uid, name: profile?.name || 'Member', xp: profile?.xp || 0 }

  useEffect(() => {
    api.posts().then(setPosts).catch((e) => { setErr(e.message); setPosts([]) })
    api.members().then((l) => setMembers(Object.fromEntries(l.map((m) => [m.id, m])))).catch(() => {})
  }, [])

  // Always show my own current tier, even before the members list refreshes.
  const mem = useMemo(() => ({
    ...members,
    [me.uid]: { ...(members[me.uid] || {}), id: me.uid, name: me.name, xp: me.xp, streak: profile?.streak || 0 },
  }), [members, me.uid, me.name, me.xp, profile?.streak])

  const shown = (posts || []).filter((p) => filter === 'all' || p.topic === filter)
  const replace = (np) => setPosts((ps) => ps.map((p) => (p.id === np.id ? np : p)))
  const remove = async (p) => {
    if (!window.confirm('Delete this post?')) return
    await api.deletePost(p.id)
    setPosts((ps) => ps.filter((x) => x.id !== p.id))
  }

  const submit = async (e) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    const bad = checkContent(body, isAdmin)
    if (bad) { setErr(bad); return }
    setBusy(true); setErr('')
    try {
      const p = await api.addPost({ uid: me.uid, name: me.name, xp: me.xp, admin: !!isAdmin, topic: dTopic, body, likes: [], commentCount: 0, createdAt: new Date().toISOString() })
      setPosts((ps) => [p, ...(ps || [])])
      setDraft('')
      if (profile?.lastPostXp !== today()) updateProfile({ xp: me.xp + 5, lastPostXp: today() }) // +5 XP, once a day
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  return (
    <>
      <TopBar title="Community" />
      <div className="page fade-up" style={{ maxWidth: 820 }}>
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={tab === 'feed' ? 'on' : ''} onClick={() => setTab('feed')}>💬 Feed</button>
          <button className={tab === 'board' ? 'on' : ''} onClick={() => setTab('board')}>🏆 Leaderboard</button>
        </div>

        {tab === 'board' ? <Leaderboard members={mem} me={me} isAdmin={isAdmin} /> : (
          <>
            <form className="card stack composer" onSubmit={submit}>
              <div className="row" style={{ gap: 8 }}>
                <NameTag name={me.name} xp={me.xp} size={22} showTier />
              </div>
              <textarea className="input" maxLength={2000} placeholder="Share a question, a tip or a win…" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <div className="chips" style={{ flexWrap: 'wrap' }}>
                {TOPICS.map((t) => (
                  <button type="button" key={t.id} className={'chip' + (dTopic === t.id ? ' on' : '')} onClick={() => setDTopic(t.id)}>{t.emoji} {t.label}</button>
                ))}
              </div>
              <div className="row between">
                <span className="tiny faint">{isAdmin ? 'Admin: you can share links & contacts' : 'Be kind · No links or phone numbers · Not medical advice'}</span>
                <button className="btn sm" disabled={busy || !draft.trim()}><Icon name="send" size={16} /> Post</button>
              </div>
              {err && <div className="alert">{err}</div>}
            </form>

            <div className="chips" style={{ margin: '16px 0 12px', overflowX: 'auto' }}>
              <button className={'chip' + (filter === 'all' ? ' on' : '')} onClick={() => setFilter('all')}>All</button>
              {TOPICS.map((t) => (
                <button key={t.id} className={'chip' + (filter === t.id ? ' on' : '')} onClick={() => setFilter(t.id)}>{t.emoji} {t.label}</button>
              ))}
            </div>

            {posts === null && <div className="empty">Loading…</div>}
            {posts && shown.length === 0 && (
              <div className="card empty stack" style={{ alignItems: 'center' }}>
                <Pip size={90} mood="wave" className="art" />
                <b>No posts here yet</b>
                <p className="small">Be the first to start the conversation.</p>
              </div>
            )}
            <div className="stack">
              {shown.map((p) => (
                <PostCard key={p.id} post={p} me={me} members={mem} isAdmin={isAdmin} onChange={replace} onDelete={remove} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
