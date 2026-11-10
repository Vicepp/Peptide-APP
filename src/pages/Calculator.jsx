import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TopBar } from '../components/Layout'
import Syringe from '../components/Syringe'
import Icon from '../components/Icon'
import { Pip } from '../components/Art'
import { PEPTIDES } from '../lib/content'
import { HALF_LIVES } from '../data/halflife'
import { curve, fmt, fmtHours, reconstitute, steadyState } from '../lib/calc'
import { useAuth } from '../lib/auth'

const Num = ({ label, unit, value, onChange, presets, hint }) => (
  <div className="field">
    <label>{label}</label>
    <div className="input-unit">
      <input className="input" type="number" inputMode="decimal" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{unit}</span>
    </div>
    {presets && (
      <div className="preset-row">
        {presets.map((p) => <button key={p} className={String(value) === String(p) ? 'on' : ''} onClick={() => onChange(String(p))}>{p} {unit}</button>)}
      </div>
    )}
    {hint && <span className="tiny faint">{hint}</span>}
  </div>
)

function Reconstitution({ initial }) {
  const { addXp } = useAuth()
  const [slug, setSlug] = useState(initial || '')
  const [vial, setVial] = useState('5')
  const [water, setWater] = useState('2')
  const [dose, setDose] = useState('250')
  const [unit, setUnit] = useState('mcg')
  const [syr, setSyr] = useState(100)
  const [perWeek, setPerWeek] = useState('7')
  const rewarded = useRef(false)

  useEffect(() => {
    const p = PEPTIDES.find((x) => x.slug === slug)
    if (!p) return
    const hl = HALF_LIVES[slug]
    if (hl?.vial) setVial(String(hl.vial))
    if (p.doseMcg && p.doseMcg < 100000) {
      if (p.doseMcg >= 1000) { setUnit('mg'); setDose(String(p.doseMcg / 1000)) } else { setUnit('mcg'); setDose(String(p.doseMcg)) }
    }
    if (hl?.interval >= 168) setPerWeek('1')
  }, [slug])

  const doseMcg = unit === 'mg' ? +dose * 1000 : +dose
  const r = reconstitute({ vialMg: vial, waterMl: water, doseMcg, syringeUnits: syr, perWeek: +perWeek })
  useEffect(() => { if (r && !rewarded.current) { rewarded.current = true; const t = setTimeout(() => addXp(5), 3000); return () => clearTimeout(t) } }, [r, addXp])
  const pep = PEPTIDES.find((x) => x.slug === slug)

  return (
    <div className="split">
      <div className="card stack gap-lg">
        <div className="field">
          <label>Compound (optional, pre-fills typical values)</label>
          <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            <option value="">Custom / not listed</option>
            {PEPTIDES.filter((p) => p.slug !== 'bacteriostatic-water').map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </div>
        <Num label="Peptide in vial" unit="mg" value={vial} onChange={setVial} presets={[2, 5, 10, 15, 20]} hint="Printed on the vial label." />
        <Num label="Bacteriostatic water added" unit="mL" value={water} onChange={setWater} presets={[0.5, 1, 2, 3]} hint="1–2 mL is common for most peptides." />
        <div className="field">
          <div className="row between"><label>Desired dose</label>
            <div className="seg" style={{ width: 120, padding: 3 }}>
              {['mcg', 'mg'].map((u) => <button key={u} style={{ height: 30 }} className={unit === u ? 'on' : ''} onClick={() => {
                if (u === unit) return
                setDose(String(u === 'mg' ? +dose / 1000 : +dose * 1000)); setUnit(u)
              }}>{u}</button>)}
            </div>
          </div>
          <div className="input-unit"><input className="input" type="number" inputMode="decimal" min="0" step="any" value={dose} onChange={(e) => setDose(e.target.value)} /><span>{unit}</span></div>
          <div className="preset-row">
            {(unit === 'mcg' ? [100, 250, 500, 1000] : [0.25, 0.5, 1, 2.5]).map((p) => <button key={p} className={String(dose) === String(p) ? 'on' : ''} onClick={() => setDose(String(p))}>{p} {unit}</button>)}
          </div>
        </div>
        <div className="field">
          <label>Syringe size (U-100)</label>
          <div className="seg">
            {[[30, '0.3 mL'], [50, '0.5 mL'], [100, '1 mL']].map(([u, ml]) => <button key={u} className={syr === u ? 'on' : ''} onClick={() => setSyr(u)}>{u}u · {ml}</button>)}
          </div>
        </div>
        <Num label="Injections per week" unit="/wk" value={perWeek} onChange={setPerWeek} presets={[1, 2, 3, 5, 7]} />
      </div>

      <div className="stack" style={{ position: 'sticky', top: 80 }}>
        <div className="card stack">
          <span className="small bold muted">DRAW TO</span>
          <div className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
            <span className="result-big">{r ? fmt(r.units, 1) : '—'}</span><b className="muted" style={{ marginBottom: 6 }}>units</b>
          </div>
          <div className="syringe-wrap"><Syringe units={r?.units} capacity={syr} /></div>
          {r && (
            <p className="small" style={{ lineHeight: 1.55 }}>
              Pull the plunger back until the stopper lines up with the <b className="accent">{fmt(r.units, 1)} unit</b> mark on a {syr}-unit syringe ({fmt(r.volumeMl, 3)} mL).
            </p>
          )}
          {r?.overCapacity && <div className="alert">This dose is more than a {syr}-unit syringe holds. Use a larger syringe, or add less water for a stronger concentration.</div>}
          {r?.tooSmall && <div className="alert info">Under 2 units is hard to measure accurately. Adding more water dilutes it into an easier-to-read volume.</div>}
          {!r && <p className="small muted">Enter values above to see the result.</p>}
        </div>
        {r && (
          <div className="kv">
            <div><span>Concentration</span><b>{fmt(r.concMcgPerMl, 0)} mcg/mL</b></div>
            <div><span>Per 1 unit</span><b>{fmt(r.mcgPerUnit, 2)} mcg</b></div>
            <div><span>Doses per vial</span><b>{r.doses}</b></div>
            <div><span>Vial lasts</span><b>{r.days != null ? `${r.days} days` : '—'}</b></div>
          </div>
        )}
        <div className="note small">
          <b>Formula</b>
          Concentration = (vial mg × 1000) ÷ water mL. Units = (dose ÷ concentration) × 100, since a U-100 syringe holds 100 units per mL.
        </div>
        {pep && <Link to={`/peptides/${pep.slug}`} className="list-item"><Icon name="book" className="accent" /><span className="grow small bold">Read the {pep.name} breakdown & reported protocols</span><Icon name="chevron" /></Link>}
      </div>
    </div>
  )
}

function Chart({ data, data2, intervalH }) {
  const W = 640, H = 220, pad = 30
  const maxT = data[data.length - 1][0]
  const maxC = Math.max(...data.map((d) => d[1])) * 1.1
  const path = (arr) => arr.map(([t, c], i) => `${i ? 'L' : 'M'}${(pad + (t / maxT) * (W - pad * 2)).toFixed(1)},${(H - pad - (c / maxC) * (H - pad * 2)).toFixed(1)}`).join(' ')
  const doses = Math.round(maxT / intervalH)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Concentration over time">
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={pad} x2={W - pad} y1={H - pad - f * (H - pad * 2)} y2={H - pad - f * (H - pad * 2)} stroke="var(--border)" />)}
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="var(--faint)" />
      {Array.from({ length: doses }).map((_, i) => <text key={i} x={pad + ((i * intervalH) / maxT) * (W - pad * 2)} y={H - 10} fontSize="11" textAnchor="middle" fill="var(--faint)">{i + 1}</text>)}
      {data2 && <path d={path(data2)} fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeDasharray="6 5" />}
      <path d={path(data) + ` L${W - pad},${H - pad} L${pad},${H - pad} Z`} fill="var(--accent)" opacity=".08" />
      <path d={path(data)} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

function SteadyState({ initial }) {
  const first = initial && HALF_LIVES[initial] ? initial : 'semaglutide'
  const [slug, setSlug] = useState(first)
  const [hl, setHl] = useState(String(HALF_LIVES[first].h))
  const [hlUnit, setHlUnit] = useState('h')
  const [tau, setTau] = useState(String(HALF_LIVES[first].interval))
  const [skip, setSkip] = useState(false)

  useEffect(() => {
    const d = HALF_LIVES[slug]
    if (!d) return
    setHlUnit('h'); setHl(String(d.h)); setTau(String(d.interval))
  }, [slug])

  const hlH = hlUnit === 'd' ? +hl * 24 : +hl
  const s = steadyState({ halfLifeH: hlH, intervalH: +tau })
  const doses = s ? Math.min(30, Math.max(8, Math.ceil((s.tssH * 1.3) / +tau))) : 10
  const skipIdx = Math.max(2, doses - 4)
  const data = useMemo(() => (s ? curve({ halfLifeH: hlH, intervalH: +tau, doses }) : null), [hlH, tau, doses, s])
  const data2 = useMemo(() => (s && skip ? curve({ halfLifeH: hlH, intervalH: +tau, doses, skip: skipIdx }) : null), [hlH, tau, doses, skip, skipIdx, s])
  const name = PEPTIDES.find((p) => p.slug === slug)?.name

  return (
    <div className="split">
      <div className="card stack gap-lg">
        <div className="field">
          <label>Peptide (auto-loads published human half-life)</label>
          <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {Object.keys(HALF_LIVES).map((k) => <option key={k} value={k}>{PEPTIDES.find((p) => p.slug === k)?.name || k}</option>)}
            <option value="custom">Custom half-life</option>
          </select>
          {HALF_LIVES[slug] && <span className="tiny faint">Source note: {HALF_LIVES[slug].note}</span>}
        </div>
        <div className="field">
          <div className="row between"><label>Half-life</label>
            <div className="seg" style={{ width: 120, padding: 3 }}>
              {[['h', 'hours'], ['d', 'days']].map(([u, l]) => <button key={u} style={{ height: 30 }} className={hlUnit === u ? 'on' : ''} onClick={() => {
                if (u === hlUnit) return
                setHl(String(+(u === 'd' ? +hl / 24 : +hl * 24).toFixed(3))); setHlUnit(u)
              }}>{l}</button>)}
            </div>
          </div>
          <div className="input-unit"><input className="input" type="number" min="0" step="any" value={hl} onChange={(e) => { setHl(e.target.value); setSlug('custom') }} /><span>{hlUnit}</span></div>
        </div>
        <Num label="Dosing interval" unit="h" value={tau} onChange={setTau} presets={[12, 24, 48, 84, 168]} hint="24 = daily · 84 = twice weekly · 168 = weekly" />
        <div className="row between">
          <div><b>Missed-dose simulator</b><p className="small muted">Skip dose #{skipIdx + 1} and compare.</p></div>
          <button className={'switch' + (skip ? ' on' : '')} onClick={() => setSkip(!skip)} aria-label="Toggle missed dose" />
        </div>
      </div>
      <div className="stack">
        <div className="card stack">
          <div className="row between"><b>Relative level over time</b><span className="tiny muted">x-axis = dose number</span></div>
          {data && <Chart data={data} data2={data2} intervalH={+tau} />}
          {skip && <p className="tiny"><span className="bold accent">━ usual</span>   <span className="bold" style={{ color: 'var(--danger)' }}>┅ with missed dose</span></p>}
        </div>
        {s && (
          <div className="kv">
            <div><span>~95% steady state in</span><b>{fmtHours(s.tssH)}</b></div>
            <div><span>Accumulation ratio (R)</span><b>{fmt(s.R, 2)}×</b></div>
            <div><span>Peak ÷ trough swing</span><b>{fmt(s.peakToTrough, 2)}×</b></div>
            <div><span>Loading dose (peak target)</span><b>{fmt(s.loadPeak, 2)}× dose</b></div>
          </div>
        )}
        <div className="note small">
          <b>How to read this</b>
          Levels build until the amount cleared each interval equals the amount dosed, which takes about 4–5 half-lives. R = 1 ÷ (1 − ½^(τ/t½)). {name ? `Based on ${name}. ` : ''}Educational model only, not a dosing instruction.
        </div>
      </div>
    </div>
  )
}

export default function Calculator() {
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') === 'pk' ? 'pk' : 'recon'
  const peptide = sp.get('peptide') || ''
  return (
    <>
      <TopBar title="Peptide calculator" right={<Pip size={40} mood="think" className="art hide-mob" />} />
      <div className="page fade-up">
        <div className="seg" style={{ maxWidth: 520, marginBottom: 18 }}>
          <button className={tab === 'recon' ? 'on' : ''} onClick={() => setSp(peptide ? { peptide } : {})}>Reconstitution</button>
          <button className={tab === 'pk' ? 'on' : ''} onClick={() => setSp({ tab: 'pk', ...(peptide ? { peptide } : {}) })}>Half-life & steady state</button>
        </div>
        {tab === 'recon' ? <Reconstitution initial={peptide} /> : <SteadyState initial={peptide} />}
        <p className="disclaimer">Educational arithmetic only. Always confirm against your vial label and syringe, and consult a qualified medical provider.</p>
      </div>
    </>
  )
}
