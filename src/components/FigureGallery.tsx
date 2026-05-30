import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Fig } from '../data/figures'

// strip an unreliable leading "Figure N." (extraction can mis-number) — keep the description
const clean = (c: string) => c.replace(/^fig(?:ure)?\.?\s*\d+\s*[.:|·-]?\s*/i, '').trim()

export default function FigureGallery({ figs, venue }: { figs: Fig[]; venue: string }) {
  const n = figs.length
  const [[i, dir], setState] = useState<[number, number]>([0, 0])
  const [box, setBox] = useState(false)
  const cur = figs[i]
  const desc = clean(cur.caption)
  const legend = desc || `${venue}`

  const go = (d: number) => setState(([p]) => [(p + d + n) % n, d])
  const jump = (k: number) => setState(([p]) => [k, k > p ? 1 : -1])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Escape') setBox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  const variants = {
    enter: (d: number) => ({ x: d >= 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d >= 0 ? -80 : 80, opacity: 0, scale: 0.97 }),
  }

  return (
    <div className="figg">
      <div className="figg-stage">
        <AnimatePresence custom={dir} initial={false} mode="popLayout">
          <motion.div
            key={i}
            className="figg-slide"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            drag={n > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -70) go(1)
              else if (info.offset.x > 70) go(-1)
            }}
            onClick={() => setBox(true)}
          >
            <img src={cur.src} alt={legend} draggable={false} />
          </motion.div>
        </AnimatePresence>

        <div className="figg-legend">
          <span className="figg-legend-inner">{legend}</span>
        </div>
        <span className="figg-zoom">⤢</span>

        {n > 1 && <>
          <button className="figg-nav prev" onClick={() => go(-1)} aria-label="Previous figure">‹</button>
          <button className="figg-nav next" onClick={() => go(1)} aria-label="Next figure">›</button>
        </>}
      </div>

      <div className="figg-bar">
        <span className="figg-count">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
        {n > 1 && (
          <div className="figg-dots">
            {figs.map((_, k) => (
              <button key={k} className={`figg-dot ${k === i ? 'on' : ''}`} onClick={() => jump(k)} aria-label={`Figure ${k + 1}`} />
            ))}
          </div>
        )}
        <span className="figg-hint">hover legend · click to zoom{n > 1 ? ' · drag / ← →' : ''}</span>
      </div>

      <AnimatePresence>
        {box && (
          <motion.div className="figbox" onClick={() => setBox(false)} role="dialog" aria-modal="true"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <button className="figbox-close" aria-label="Close">✕</button>
            {n > 1 && <button className="figbox-nav prev" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="Previous">‹</button>}
            <motion.figure className="figbox-fig" onClick={(e) => e.stopPropagation()}
              key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
              <img src={cur.src} alt={legend} />
              <figcaption>{legend}</figcaption>
            </motion.figure>
            {n > 1 && <button className="figbox-nav next" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="Next">›</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
