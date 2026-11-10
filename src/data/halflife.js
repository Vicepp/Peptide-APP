// Approximate half-lives (hours) taken from the "Half-life basis" lines in the reference guide.
// Only compounds with a published human number are listed. Educational use only.
export const HALF_LIVES = {
  semaglutide: { h: 168, note: '≈1 week (label-supported)', interval: 168, vial: 5 },
  tirzepatide: { h: 120, note: '≈5 days (label-supported)', interval: 168, vial: 10 },
  retatrutide: { h: 144, note: '≈6 days (phase 2 literature)', interval: 168, vial: 10 },
  cagrilintide: { h: 177, note: '159–195 h', interval: 168, vial: 5 },
  'cjc-1295': { h: 166, note: 'DAC form 5.8–8.1 days (no-DAC ≈30 min)', interval: 168, vial: 2 },
  ipamorelin: { h: 2, note: '≈2 h terminal', interval: 24, vial: 5 },
  'ghrp-6-ghrp-2': { h: 2.5, note: 'GHRP-6 ≈2.5 h elimination', interval: 8, vial: 5 },
  hexarelin: { h: 1.27, note: '≈76 min IV', interval: 12, vial: 2 },
  sermorelin: { h: 0.19, note: '≈11–12 min', interval: 24, vial: 2 },
  tesamorelin: { h: 0.18, note: '≈8–11 min', interval: 24, vial: 2 },
  'thymosin-alpha-1': { h: 2, note: '≈2 h SC', interval: 24, vial: 5 },
  'human-chorionic-gonadotropin': { h: 33, note: '29–37 h terminal', interval: 84, vial: 5 },
  hmg: { h: 12, note: 'FSH ≈11–13 h', interval: 24, vial: 1 },
  'igf-1-lr3': { h: 25, note: '20–30 h (not label-derived)', interval: 24, vial: 1 },
  'melanotan-i': { h: 15, note: '≈15 h (implant label)', interval: 24, vial: 10 },
}
