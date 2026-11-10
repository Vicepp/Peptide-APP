// Vercel serverless function: returns the visitor's approximate city & country.
// Vercel adds these headers to every request for free (based on IP); no third-party service.
export default function handler(req, res) {
  const h = (k) => {
    const v = req.headers[k]
    try { return v ? decodeURIComponent(String(v)) : '' } catch { return String(v || '') }
  }
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    city: h('x-vercel-ip-city'),
    region: h('x-vercel-ip-country-region'),
    country: h('x-vercel-ip-country'), // 2-letter code, e.g. "US", "NG"
  })
}
