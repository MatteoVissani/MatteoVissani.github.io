import { motion } from 'framer-motion'
import { scholarStats, profile } from '../data/content'
import { External } from './Icons'

const W = 560
const H = 240
const X0 = 24
const X1 = 540
const Y0 = 22
const Y1 = 198

export default function CitationTracker() {
  const data = scholarStats.perYear
  const max = Math.max(...data.map((d) => d.count))
  const n = data.length
  const step = (X1 - X0) / (n - 1)

  const pts = data.map((d, i) => ({
    x: X0 + i * step,
    y: Y1 - (d.count / max) * (Y1 - Y0),
    ...d,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${X1} ${Y1} L${X0} ${Y1} Z`
  const peak = pts.reduce((a, b) => (b.count > a.count ? b : a))

  const metrics = [
    { v: scholarStats.citations.toLocaleString(), l: 'Citations' },
    { v: scholarStats.hIndex, l: 'h-index' },
    { v: scholarStats.i10Index, l: 'i10-index' },
  ]

  return (
    <div className="cite panel">
      <div className="cite-head">
        <div>
          <div className="cite-eyebrow">Citation impact</div>
          <div className="cite-sub">Citations per year · {scholarStats.asOf}</div>
        </div>
        <a className="cite-link" href={profile.links.scholar} target="_blank" rel="noreferrer">
          Live on Scholar <External />
        </a>
      </div>

      <div className="cite-grid">
        <div className="cite-metrics">
          {metrics.map((m) => (
            <div className="cite-metric" key={m.l}>
              <div className="cv">{m.v}</div>
              <div className="cl">{m.l}</div>
            </div>
          ))}
        </div>

        <div className="cite-plot">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="cite-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#22e1ff" />
                <stop offset="1" stopColor="#ff2d8f" />
              </linearGradient>
              <linearGradient id="cite-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff2d8f" stopOpacity="0.34" />
                <stop offset="1" stopColor="#22e1ff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* gridlines */}
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <line key={g} x1={X0} x2={X1} y1={Y1 - g * (Y1 - Y0)} y2={Y1 - g * (Y1 - Y0)}
                stroke="#9d4edd" strokeOpacity="0.14" strokeDasharray="3 5" />
            ))}
            <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="#9d4edd" strokeOpacity="0.4" />

            {/* bars */}
            {pts.map((p) => (
              <motion.rect
                key={`b${p.year}`}
                x={p.x - 9}
                width={18}
                rx={3}
                fill="url(#cite-line)"
                fillOpacity={0.18}
                initial={{ height: 0, y: Y1 }}
                whileInView={{ height: Y1 - p.y, y: p.y }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}

            {/* area + line */}
            <motion.path d={area} fill="url(#cite-area)"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }} />
            <motion.path d={line} fill="none" stroke="url(#cite-line)" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34,225,255,0.6))' }}
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, ease: 'easeInOut' }} />

            {/* dots + year labels */}
            {pts.map((p, i) => (
              <g key={`d${p.year}`}>
                <motion.circle cx={p.x} cy={p.y} r={p.year === peak.year ? 5 : 3.4}
                  fill={p.year === peak.year ? '#fff' : '#22e1ff'}
                  initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                  transition={{ delay: 1.1 + i * 0.08, type: 'spring', stiffness: 300 }}
                  style={{ filter: 'drop-shadow(0 0 5px rgba(255,45,143,0.7))' }} />
                <text x={p.x} y={H - 8} textAnchor="middle" className="cite-xlabel">{p.year}</text>
              </g>
            ))}

            {/* peak annotation */}
            <text x={peak.x} y={peak.y - 12} textAnchor="middle" className="cite-peak">{peak.count}</text>
          </svg>
        </div>
      </div>
    </div>
  )
}
