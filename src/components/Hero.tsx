import { Suspense, lazy, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { profile } from '../data/content'
import SceneBoundary from './SceneBoundary'

const NeuralScene = lazy(() => import('./NeuralScene'))

// Only mount the heavy WebGL hero on capable, wide, non-reduced-motion devices.
// On phones/data-saver/low-core it never loads (the lazy chunk stays unfetched),
// so the CSS synthwave backdrop carries the hero and mobile load stays fast.
function useHeavyScene() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 860px)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
    const cores = navigator.hardwareConcurrency || 8
    setOk(wide && !reduce && !conn?.saveData && cores >= 4)
  }, [])
  return ok
}

const rise = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Hero() {
  const heavy = useHeavyScene()
  return (
    <header id="top" className="hero">
      {heavy && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <NeuralScene />
          </Suspense>
        </SceneBoundary>
      )}

      <div className="hero-inner wrap">
        <motion.p className="hero-tag" custom={0} variants={rise} initial="hidden" animate="show">
          Neuroengineer · MGH / Harvard
        </motion.p>

        <motion.h1 className="hero-name" custom={1} variants={rise} initial="hidden" animate="show">
          Matteo <span className="second">Vissani</span>
        </motion.h1>

        <motion.p className="hero-role" custom={2} variants={rise} initial="hidden" animate="show">
          I record from the human brain during neurosurgery to develop <b>adaptive deep brain stimulation</b>.
        </motion.p>

        <motion.p className="hero-sub" custom={3} variants={rise} initial="hidden" animate="show">
          {profile.subtitle}
        </motion.p>

        <motion.div className="hero-cta" custom={4} variants={rise} initial="hidden" animate="show">
          <a className="btn" href="#work">View selected work</a>
          <a className="btn ghost" href="#contact">Get in touch</a>
        </motion.div>
      </div>

      <a className="scroll-hint" href="#about" aria-label="Scroll down">
        <span>Scroll</span>
        <span className="dot" />
      </a>
    </header>
  )
}
