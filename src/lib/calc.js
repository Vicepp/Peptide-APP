// Educational arithmetic only. Not dosing instructions.

/** Reconstitution: vial mg + water mL + dose mcg → concentration, volume and U-100 units. */
export function reconstitute({ vialMg, waterMl, doseMcg, syringeUnits = 100, perWeek = 7 }) {
  const v = +vialMg, w = +waterMl, d = +doseMcg
  if (!(v > 0 && w > 0 && d > 0)) return null
  const concMcgPerMl = (v * 1000) / w
  const volumeMl = d / concMcgPerMl
  const units = volumeMl * 100 // U-100: 100 units = 1 mL
  const doses = Math.floor((v * 1000) / d)
  const days = perWeek > 0 ? Math.floor((doses / perWeek) * 7) : null
  return {
    concMcgPerMl,
    concMgPerMl: concMcgPerMl / 1000,
    volumeMl,
    units,
    doses,
    days,
    mcgPerUnit: concMcgPerMl / 100,
    overCapacity: units > syringeUnits,
    tooSmall: units < 2,
  }
}

/** Repeated-dose one-compartment model (first-order elimination, instant absorption). */
export function steadyState({ halfLifeH, intervalH }) {
  const t = +halfLifeH, tau = +intervalH
  if (!(t > 0 && tau > 0)) return null
  const ke = Math.LN2 / t
  const R = 1 / (1 - Math.pow(0.5, tau / t))
  return {
    ke,
    R,
    tssH: 4.32 * t, // ≈95% of steady state
    tss90H: 3.32 * t,
    peakToTrough: Math.pow(2, tau / t),
    loadPeak: R, // multiple of maintenance dose to hit peak target
    loadAvg: 1 / (ke * tau),
  }
}

/** Relative concentration curve; optional skipped dose index. */
export function curve({ halfLifeH, intervalH, doses = 10, skip = -1, points = 240 }) {
  const t = +halfLifeH, tau = +intervalH
  const ke = Math.LN2 / t
  const total = tau * doses
  const out = []
  for (let i = 0; i <= points; i++) {
    const time = (total * i) / points
    let c = 0
    for (let n = 0; n < doses; n++) {
      const td = n * tau
      if (n === skip || td > time) continue
      c += Math.exp(-ke * (time - td))
    }
    out.push([time, c])
  }
  return out
}

export const fmt = (n, d = 2) =>
  n == null || !isFinite(n) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 })

export function fmtHours(h) {
  if (!isFinite(h)) return '—'
  if (h < 1) return `${fmt(h * 60, 0)} min`
  if (h < 48) return `${fmt(h, 1)} h`
  return `${fmt(h / 24, 1)} days`
}
