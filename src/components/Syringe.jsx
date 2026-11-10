/** U-100 insulin syringe that fills to `units`. capacity: 30 | 50 | 100 */
export default function Syringe({ units = 0, capacity = 100 }) {
  const W = 640, x0 = 110, x1 = 560, len = x1 - x0
  const u = Math.max(0, Math.min(units || 0, capacity))
  const fillW = (u / capacity) * len
  const over = units > capacity
  const step = capacity === 100 ? 2 : 1
  const major = capacity === 100 ? 10 : 5
  const ticks = []
  for (let v = 0; v <= capacity; v += step) {
    const x = x0 + (v / capacity) * len
    const isMajor = v % major === 0
    ticks.push(<line key={v} x1={x} x2={x} y1={52} y2={isMajor ? 80 : 66} stroke="var(--muted)" strokeWidth={isMajor ? 2 : 1.2} />)
    if (isMajor) ticks.push(<text key={'t' + v} x={x} y={38} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--muted)">{v}</text>)
  }
  return (
    <svg viewBox={`0 0 ${W} 150`} className="chart" role="img" aria-label={`Syringe filled to ${u.toFixed(1)} units`}>
      {/* plunger */}
      <rect x={6} y={58} width={20} height={64} rx={6} fill="var(--faint)" />
      <rect x={24} y={84} width={x0 - 24 + fillW} height={12} rx={4} fill="var(--border)" style={{ transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
      {/* barrel */}
      <rect x={x0 - 6} y={48} width={len + 12} height={84} rx={14} fill="var(--card)" stroke="var(--faint)" strokeWidth={2.5} />
      <rect x={x0} y={56} width={fillW} height={68} rx={8} fill={over ? 'var(--danger)' : 'var(--accent)'} opacity={0.85} style={{ transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
      <rect x={x0 + fillW - 4} y={52} width={10} height={76} rx={3} fill="var(--text)" style={{ transition: 'x .5s cubic-bezier(.2,.8,.2,1)' }} />
      {ticks}
      {/* hub + needle */}
      <rect x={x1 + 6} y={72} width={26} height={36} rx={6} fill="var(--faint)" />
      <line x1={x1 + 32} y1={90} x2={W - 6} y2={90} stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
