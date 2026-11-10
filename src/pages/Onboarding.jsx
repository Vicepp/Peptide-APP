import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SceneCalc, SceneLearn, SceneWelcome } from '../components/Art'
import { Brand } from '../components/Layout'
import Icon from '../components/Icon'
import { ls } from '../lib/store'
import { APP_NAME } from '../config'

const SLIDES = [
  {
    Scene: SceneWelcome,
    title: <>Meet Pip, your<br /><span className="accent">peptide guide</span></>,
    text: `${APP_NAME} turns dense peptide research into clear, friendly breakdowns: 43 compounds, graded evidence, and the latest regulatory updates.`,
    feats: ['43 peptide breakdowns', 'Evidence grades A–H', '2026 regulatory updates'],
  },
  {
    Scene: SceneCalc,
    title: <>Reconstitute with<br /><span className="accent">confidence</span></>,
    text: 'Enter your vial size, bacteriostatic water and target dose. See exactly where to draw on a U-100 syringe, plus half-life and steady-state estimates.',
    feats: ['Live syringe preview', 'Steady-state curves', 'Missed-dose simulator'],
  },
  {
    Scene: SceneLearn,
    title: <>Learn a little<br /><span className="accent">every day</span></>,
    text: 'Get a daily reading suggestion picked for your goals, schedule what to read next, and keep a private experience log, all synced to your account.',
    feats: ['Daily read suggestions', 'Reading plan', 'Streaks & XP'],
  },
]

export default function Onboarding() {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const s = SLIDES[i]
  const finish = (to) => { ls.set('pw_onboarded', true); nav(to) }
  const last = i === SLIDES.length - 1

  return (
    <div className="onb">
      <div className="onb-in">
        <div className="row between onb-top">
          <Brand />
          {!last && <button className="link" onClick={() => finish('/login')}>Skip</button>}
        </div>
        <div key={'s' + i} className="slide-in"><s.Scene /></div>
        <div key={'t' + i} className="onb-text slide-in">
          <h1>{s.title}</h1>
          <p>{s.text}</p>
          <div className="onb-feats">
            {s.feats.map((f) => <span key={f} className="pill"><Icon name="check" size={13} stroke={3} /> {f}</span>)}
          </div>
          <div className="dots">{SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
          {last ? (
            <div className="stack">
              <button className="btn block" onClick={() => finish('/signup')}>Create free account <Icon name="chevron" /></button>
              <button className="btn block outline" onClick={() => finish('/login')}>I already have an account</button>
            </div>
          ) : (
            <div className="row">
              {i > 0 && <button className="icon-btn" style={{ width: 52, height: 52 }} onClick={() => setI(i - 1)} aria-label="Previous"><Icon name="back" /></button>}
              <button className="btn grow" onClick={() => setI(i + 1)}>Next <Icon name="chevron" /></button>
            </div>
          )}
          <p className="tiny faint center" style={{ marginTop: 18 }}>Research reference only · Not medical advice</p>
        </div>
      </div>
    </div>
  )
}
