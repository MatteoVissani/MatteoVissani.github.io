import { useEffect, useState } from 'react'
import { scholarStats, profile } from '../data/content'
import { External } from './Icons'

type Stats = {
  citations: number
  hIndex: number
  i10Index: number
  asOf: string
  perYear: { year: number; count: number }[]
}

// Live citation impact, fetched from OpenAlex (CORS-open, no key) by ORCID,
// with the baked scholarStats snapshot as a fallback.
export default function CiteStrip() {
  const [s, setS] = useState<Stats>(scholarStats)

  useEffect(() => {
    let alive = true
    fetch(`https://api.openalex.org/authors/${profile.links.orcid}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('openalex'))))
      .then((a) => {
        if (!alive) return
        const now = new Date().getFullYear()
        const py = (a.counts_by_year || [])
          .map((c: { year: number; cited_by_count: number }) => ({ year: c.year, count: c.cited_by_count }))
          .filter((c: { year: number; count: number }) => c.year < now && c.count > 0)
          .sort((x: { year: number }, y: { year: number }) => x.year - y.year)
        // OpenAlex lags on recent years, drop incompletely-indexed trailing years
        const peak = Math.max(...py.map((p: { count: number }) => p.count), 1)
        while (py.length > 3 && py[py.length - 1].count < peak * 0.3) py.pop()
        setS({
          citations: a.cited_by_count ?? scholarStats.citations,
          hIndex: a.summary_stats?.h_index ?? scholarStats.hIndex,
          i10Index: a.summary_stats?.i10_index ?? scholarStats.i10Index,
          asOf: 'live · OpenAlex',
          perYear: py.length >= 2 ? py : scholarStats.perYear,
        })
      })
      .catch(() => { /* keep snapshot fallback */ })
    return () => { alive = false }
  }, [])

  const data = s.perYear
  const max = Math.max(...data.map((d) => d.count))
  const W = 104, H = 30, n = data.length
  const step = W / (n - 1)
  const pts = data.map((d, i) => ({ x: i * step, y: H - (d.count / max) * (H - 5) - 2.5 }))
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${W} ${H} L0 ${H} Z`
  const last = pts[pts.length - 1]

  return (
    <a className="cite-strip" href={profile.links.scholar} target="_blank" rel="noreferrer"
       title={`Citations per year · ${s.asOf}`}>
      <span className="cs-stat"><b>{s.citations.toLocaleString()}</b> citations</span>
      <span className="cs-dot" />
      <span className="cs-stat"><b>{s.hIndex}</b> h-index</span>
      <span className="cs-dot" />
      <span className="cs-stat"><b>{s.i10Index}</b> i10</span>
      <svg className="cs-spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
        <defs>
          <linearGradient id="cs-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#22e1ff" /><stop offset="1" stopColor="#ff2d8f" /></linearGradient>
          <linearGradient id="cs-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff2d8f" stopOpacity="0.28" /><stop offset="1" stopColor="#22e1ff" stopOpacity="0" /></linearGradient>
        </defs>
        <path d={area} fill="url(#cs-a)" />
        <path d={line} fill="none" stroke="url(#cs-l)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="2.6" fill="#fff" />
      </svg>
      <span className="cs-link">Scholar <External /></span>
    </a>
  )
}
