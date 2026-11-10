import { Link } from 'react-router-dom'
import { CardArt } from './Art'
import Icon from './Icon'
import { themeFor } from '../lib/content'

export default function PeptideCard({ p, read }) {
  const t = themeFor(p.category)
  return (
    <Link to={`/peptides/${p.slug}`} className="pcard tint" style={{ background: t.bg, color: t.fg }}>
      <span className="pc-art"><CardArt kind={t.icon} color={t.fg} size={70} /></span>
      <span className="cat">{p.category || 'Reference'}</span>
      <h3 style={{ maxWidth: '78%' }}>{p.name}</h3>
      {read && <span className="tiny bold"><Icon name="check" size={12} stroke={3} /> Read</span>}
      <span className="go"><Icon name="chevron" size={16} /></span>
    </Link>
  )
}

export function PeptideRow({ p, right }) {
  const t = themeFor(p.category)
  return (
    <Link to={`/peptides/${p.slug}`} className="list-item">
      <span className="ic tint" style={{ background: t.bg }}><CardArt kind={t.icon} color={t.fg} size={30} /></span>
      <div className="grow">
        <b>{p.name}</b>
        <div className="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.category} · {p.status}</div>
      </div>
      {right || <Icon name="chevron" className="faint" />}
    </Link>
  )
}
