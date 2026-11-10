// Original vector illustrations for the app. All inline SVG, no external assets.

/** Pip — the app mascot: a friendly peptide vial. mood: happy | wave | think | wow */
export function Pip({ size = 160, mood = 'happy', className = '' }) {
  const eyes =
    mood === 'wow' ? (
      <>
        <circle cx="82" cy="128" r="9" fill="#1F1B16" /><circle cx="118" cy="128" r="9" fill="#1F1B16" />
        <circle cx="85" cy="125" r="3" fill="#fff" /><circle cx="121" cy="125" r="3" fill="#fff" />
      </>
    ) : mood === 'think' ? (
      <>
        <circle cx="82" cy="128" r="7" fill="#1F1B16" /><path d="M110 128 q8 -8 16 0" stroke="#1F1B16" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="84" cy="126" r="2.4" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M73 130 q9 -11 18 0" stroke="#1F1B16" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M109 130 q9 -11 18 0" stroke="#1F1B16" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      </>
    )
  const mouth =
    mood === 'wow' ? <ellipse cx="100" cy="152" rx="8" ry="10" fill="#1E3A5F" /> :
    mood === 'think' ? <path d="M92 152 h16" stroke="#1E3A5F" strokeWidth="5" strokeLinecap="round" /> :
    <path d="M86 146 q14 16 28 0 z" fill="#1E3A5F" />
  return (
    <svg viewBox="0 0 200 230" width={size} height={size * 1.15} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pipGlass" x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#EEF5FF" />
        </linearGradient>
        <linearGradient id="pipLiquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FB2FF" /><stop offset="1" stopColor="#2F80ED" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="220" rx="56" ry="8" fill="#000" opacity=".08" />
      {/* arms */}
      {mood === 'wave' ? (
        <g className="pip-wave"><path d="M146 120 q26 -14 30 -44" stroke="#2F80ED" strokeWidth="11" fill="none" strokeLinecap="round" />
          <circle cx="176" cy="72" r="11" fill="#A9CBFF" /></g>
      ) : (
        <><path d="M146 140 q22 6 26 26" stroke="#2F80ED" strokeWidth="11" fill="none" strokeLinecap="round" /><circle cx="173" cy="170" r="10" fill="#A9CBFF" /></>
      )}
      <path d="M54 140 q-22 6 -26 26" stroke="#2F80ED" strokeWidth="11" fill="none" strokeLinecap="round" />
      <circle cx="27" cy="170" r="10" fill="#A9CBFF" />
      {/* feet */}
      <rect x="70" y="200" width="22" height="16" rx="8" fill="#1E4FA8" />
      <rect x="108" y="200" width="22" height="16" rx="8" fill="#1E4FA8" />
      {/* cap */}
      <rect x="64" y="28" width="72" height="30" rx="9" fill="#2B2D42" />
      <rect x="72" y="20" width="56" height="14" rx="6" fill="#4B4E6D" />
      <rect x="76" y="56" width="48" height="12" fill="#D9DCE6" />
      {/* body */}
      <path d="M58 76 q0 -10 10 -10 h64 q10 0 10 10 v112 q0 18 -18 18 h-48 q-18 0 -18 -18 z" fill="url(#pipGlass)" stroke="#C9DEFF" strokeWidth="3" />
      <path d="M60 150 q20 -10 40 0 t40 0 v38 q0 16 -16 16 h-48 q-16 0 -16 -16 z" fill="url(#pipLiquid)" />
      <rect x="66" y="84" width="10" height="44" rx="5" fill="#fff" opacity=".9" />
      {/* label */}
      <rect x="78" y="170" width="44" height="20" rx="6" fill="#fff" opacity=".9" />
      <path d="M86 180 h28" stroke="#2F80ED" strokeWidth="3" strokeLinecap="round" />
      {/* face */}
      <circle cx="70" cy="142" r="8" fill="#FF9AA2" opacity=".55" />
      <circle cx="130" cy="142" r="8" fill="#FF9AA2" opacity=".55" />
      {eyes}
      {mouth}
      {/* bubbles */}
      <circle cx="90" cy="186" r="3" fill="#fff" opacity=".7" className="bubble b1" />
      <circle cx="108" cy="178" r="2.2" fill="#fff" opacity=".7" className="bubble b2" />
    </svg>
  )
}

/** Floating amino-acid chain molecule */
export function Molecule({ size = 120, color = '#2F80ED', className = '' }) {
  const nodes = [[20, 60], [50, 30], [85, 50], [115, 25], [140, 60], [110, 90], [75, 95]]
  const cols = [color, '#7C5CFF', '#14B8A6', '#F59E0B', color, '#EC4899', '#3B82F6']
  return (
    <svg viewBox="0 0 160 120" width={size} height={size * 0.75} className={className} aria-hidden="true">
      <polyline points={nodes.map((n) => n.join(',')).join(' ')} fill="none" stroke="#CFDDF0" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {nodes.map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="12" fill={cols[i]} /><circle cx={x - 4} cy={y - 4} r="3.5" fill="#fff" opacity=".6" /></g>
      ))}
    </svg>
  )
}

/** Onboarding scene 1: Pip waving with orbiting molecules */
export function SceneWelcome() {
  return (
    <div className="scene">
      <div className="scene-blob" style={{ background: 'radial-gradient(circle at 50% 45%, #D6E7FF 0, #EDF4FF 45%, transparent 70%)' }} />
      <Molecule size={110} className="float f1 scene-a" />
      <Molecule size={80} color="#7C5CFF" className="float f2 scene-b" />
      <Sparkles />
      <Pip size={190} mood="wave" className="scene-hero" />
    </div>
  )
}

/** Onboarding scene 2: calculator + syringe */
export function SceneCalc() {
  return (
    <div className="scene">
      <div className="scene-blob" style={{ background: 'radial-gradient(circle at 50% 45%, #D9F3F0 0, #EEFAF8 45%, transparent 70%)' }} />
      <svg viewBox="0 0 320 300" className="scene-svg" aria-hidden="true">
        {/* phone calculator */}
        <g className="float f2">
          <rect x="70" y="40" width="140" height="220" rx="26" fill="#1F2937" />
          <rect x="80" y="52" width="120" height="196" rx="18" fill="#fff" />
          <rect x="92" y="66" width="96" height="50" rx="12" fill="#EEF5FF" />
          <text x="180" y="98" textAnchor="end" fontFamily="Nunito" fontWeight="900" fontSize="22" fill="#2F80ED">10 IU</text>
          <text x="100" y="82" fontFamily="Nunito" fontWeight="700" fontSize="9" fill="#7A8AA0">DRAW</text>
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
            <rect key={r + '-' + c} x={94 + c * 32} y={128 + r * 32} width="26" height="26" rx="8" fill={r === 2 && c === 2 ? '#2F80ED' : '#EEF3FA'} />
          )))}
          <rect x="94" y="224" width="90" height="14" rx="7" fill="#14B8A6" />
        </g>
        {/* syringe */}
        <g className="float f1" transform="rotate(-28 230 170)">
          <rect x="190" y="150" width="120" height="28" rx="8" fill="#fff" stroke="#94A3B8" strokeWidth="3" />
          <rect x="192" y="152" width="58" height="24" rx="6" fill="#5B9BF2" opacity=".85" />
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={i} x1={200 + i * 10} y1="150" x2={200 + i * 10} y2={i % 5 === 0 ? 162 : 157} stroke="#64748B" strokeWidth="2" />
          ))}
          <rect x="310" y="158" width="18" height="12" rx="3" fill="#94A3B8" />
          <line x1="328" y1="164" x2="360" y2="164" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
          <rect x="150" y="160" width="42" height="8" rx="3" fill="#CBD5E1" />
          <rect x="138" y="148" width="12" height="32" rx="4" fill="#94A3B8" />
        </g>
        {/* drops */}
        <path d="M40 90 q10 -18 20 0 a10 10 0 1 1 -20 0z" fill="#38BDF8" className="float f3" />
        <path d="M262 52 q7 -13 14 0 a7 7 0 1 1 -14 0z" fill="#5B9BF2" className="float f2" />
      </svg>
      <Pip size={92} mood="think" className="scene-peek" />
    </div>
  )
}

/** Onboarding scene 3: library + calendar + shield (evidence & schedule) */
export function SceneLearn() {
  return (
    <div className="scene">
      <div className="scene-blob" style={{ background: 'radial-gradient(circle at 50% 45%, #E3E9FF 0, #F2F5FF 45%, transparent 70%)' }} />
      <svg viewBox="0 0 320 300" className="scene-svg" aria-hidden="true">
        {/* books */}
        <g className="float f1">
          <rect x="40" y="150" width="34" height="110" rx="6" fill="#7C5CFF" />
          <rect x="78" y="130" width="30" height="130" rx="6" fill="#2F80ED" />
          <rect x="112" y="160" width="28" height="100" rx="6" fill="#14B8A6" />
          <rect x="46" y="170" width="22" height="6" rx="3" fill="#fff" opacity=".6" />
          <rect x="83" y="150" width="20" height="6" rx="3" fill="#fff" opacity=".6" />
          <rect x="117" y="180" width="18" height="6" rx="3" fill="#fff" opacity=".6" />
        </g>
        {/* calendar */}
        <g className="float f2">
          <rect x="168" y="70" width="120" height="112" rx="18" fill="#fff" stroke="#E9DFF9" strokeWidth="3" />
          <rect x="168" y="70" width="120" height="30" rx="16" fill="#7C5CFF" />
          <rect x="190" y="60" width="8" height="20" rx="4" fill="#4C1D95" />
          <rect x="258" y="60" width="8" height="20" rx="4" fill="#4C1D95" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={182 + (i % 4) * 24} y={112 + Math.floor(i / 4) * 22} width="16" height="14" rx="4" fill={i === 6 ? '#2F80ED' : '#F2F5FF'} />
          ))}
        </g>
        {/* shield check */}
        <g className="float f3">
          <path d="M228 196 l40 14 v26 q0 30 -40 44 q-40 -14 -40 -44 v-26 z" fill="#22C55E" />
          <path d="M210 236 l12 12 l24 -26" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <text x="40" y="118" fontFamily="Nunito" fontWeight="900" fontSize="26" fill="#7C5CFF" className="float f2">A</text>
        <text x="132" y="110" fontFamily="Nunito" fontWeight="900" fontSize="20" fill="#14B8A6" className="float f1">B</text>
      </svg>
      <Pip size={96} mood="happy" className="scene-peek left" />
    </div>
  )
}

export function Sparkles() {
  return (
    <svg className="sparkles" viewBox="0 0 300 300" aria-hidden="true">
      {[[40, 60, 10], [250, 50, 8], [270, 200, 12], [30, 220, 7], [150, 20, 6]].map(([x, y, r], i) => (
        <path key={i} className={`twinkle t${i}`} d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z`} fill={i % 2 ? '#7C5CFF' : '#FFB020'} />
      ))}
    </svg>
  )
}

/** Small decorative art for cards */
export function CardArt({ kind = 'flask', color = '#2F80ED', size = 64 }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true }
  switch (kind) {
    case 'flame':
      return <svg {...common}><path d="M32 6 C38 18 50 24 48 40 A16 16 0 0 1 16 40 C15 30 22 26 24 18 C28 24 30 26 32 28 C34 20 32 14 32 6Z" fill={color} /><path d="M32 34 c4 4 8 6 7 12 a7 7 0 0 1 -14 0 c0 -5 4 -6 7 -12z" fill="#FFD166" /></svg>
    case 'bandage':
      return <svg {...common}><rect x="8" y="22" width="48" height="20" rx="10" transform="rotate(-35 32 32)" fill={color} /><rect x="22" y="24" width="20" height="16" rx="3" transform="rotate(-35 32 32)" fill="#fff" opacity=".8" /><circle cx="29" cy="31" r="1.6" fill={color} /><circle cx="35" cy="33" r="1.6" fill={color} /></svg>
    case 'bolt':
      return <svg {...common}><path d="M36 4 L14 36 h14 l-4 24 l26 -34 h-15z" fill={color} /></svg>
    case 'brain':
      return <svg {...common}><path d="M24 10 a10 10 0 0 0 -12 12 a10 10 0 0 0 0 18 a10 10 0 0 0 14 12 h2 V10z" fill={color} /><path d="M40 10 a10 10 0 0 1 12 12 a10 10 0 0 1 0 18 a10 10 0 0 1 -14 12 h-2 V10z" fill={color} opacity=".75" /><path d="M20 24 q6 2 6 8 M44 24 q-6 2 -6 8 M20 40 q6 0 8 4" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
    case 'hourglass':
      return <svg {...common}><rect x="14" y="6" width="36" height="6" rx="3" fill={color} /><rect x="14" y="52" width="36" height="6" rx="3" fill={color} /><path d="M18 12 h28 q0 14 -14 20 q14 6 14 20 h-28 q0 -14 14 -20 q-14 -6 -14 -20z" fill="#fff" stroke={color} strokeWidth="3" /><path d="M24 46 q8 -6 16 0 v6 h-16z" fill={color} /></svg>
    case 'sparkle':
      return <svg {...common}><path d="M30 6 L35 25 L54 30 L35 35 L30 54 L25 35 L6 30 L25 25Z" fill={color} /><circle cx="50" cy="12" r="4" fill={color} opacity=".6" /></svg>
    case 'dna':
      return <svg {...common}><path d="M20 6 q24 13 0 26 q-24 13 0 26" stroke={color} strokeWidth="5" fill="none" /><path d="M44 6 q-24 13 0 26 q24 13 0 26" stroke={color} strokeWidth="5" fill="none" opacity=".6" /><path d="M24 14h16M24 50h16M26 24h12M26 40h12" stroke={color} strokeWidth="3" /></svg>
    case 'shield':
      return <svg {...common}><path d="M32 6 l20 8 v14 q0 18 -20 28 q-20 -10 -20 -28 v-14z" fill={color} /><path d="M24 31 l6 6 l11 -12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
    case 'alert':
      return <svg {...common}><path d="M32 6 L60 56 H4z" fill={color} /><rect x="29" y="24" width="6" height="18" rx="3" fill="#fff" /><circle cx="32" cy="48" r="3.5" fill="#fff" /></svg>
    default:
      return <svg {...common}><path d="M24 6 h16 v4 h-3 v14 l15 26 a6 6 0 0 1 -5 9 h-30 a6 6 0 0 1 -5 -9 l15 -26 v-14 h-3z" fill="#fff" stroke={color} strokeWidth="3" /><path d="M16 44 h32 l4 7 a4 4 0 0 1 -4 6 h-32 a4 4 0 0 1 -4 -6z" fill={color} /></svg>
  }
}

/** Gift/trophy badge art used in profile + leagues */
/**
 * Tier badge, 1–10. Each tier has its own colour; tiers 6+ get a gold rim,
 * and tier 10 (Peptide Legend) gets a crown.
 */
const TIER_COLORS = ['#94A3B8', '#5B9BF2', '#0D9488', '#16A34A', '#F59E0B', '#EA580C', '#E11D48', '#DB2777', '#7C3AED', '#1E3A8A']
export function Badge({ tier = 1, size = 56 }) {
  const t = Math.min(Math.max(tier, 1), 10)
  const c = TIER_COLORS[t - 1]
  const gold = t >= 6
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {gold && <path d="M32 0 l28 15.5 v33 l-28 15.5 l-28 -15.5 v-33z" fill="#FBBF24" />}
      <path d="M32 3 l25 14 v30 l-25 14 l-25 -14 v-30z" fill={c} />
      <path d="M32 11 l18 10 v22 l-18 10 l-18 -10 v-22z" fill="#fff" opacity=".25" />
      {t === 10
        ? <path d="M19 40 l-2 -16 l8 6 l7 -10 l7 10 l8 -6 l-2 16z" fill="#FBBF24" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        : <path d="M32 20 l3.6 7.6 l8.2 1 l-6 5.7 l1.6 8.2 l-7.4 -4 l-7.4 4 l1.6 -8.2 l-6 -5.7 l8.2 -1z" fill="#fff" />}
    </svg>
  )
}
