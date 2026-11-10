import { Badge } from './Art'
import { levelFor } from '../config'

/** A user's name with their tier badge in front. Used everywhere a member's name is shown. */
export default function NameTag({ name, xp = 0, size = 20, showTier = false, className = '' }) {
  const lvl = levelFor(xp)
  return (
    <span className={'nametag ' + className} title={`Level ${lvl.index} · ${lvl.name}`}>
      <Badge tier={lvl.index} size={size} />
      <span className="nt-name">{name || 'Member'}</span>
      {showTier && <span className="tier-tag">{lvl.name}</span>}
    </span>
  )
}
