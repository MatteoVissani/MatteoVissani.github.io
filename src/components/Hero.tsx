import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { profile } from '../data/content'
import SceneBoundary from './SceneBoundary'

const NeuralScene = lazy(() => import('./NeuralScene'))

const rise = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Hero() {
  return (
    <header id="top" className="hero">
      <SceneBoundary>
        <Suspense fallback={null}>
          <NeuralScene />
        </Suspense>
      </SceneBoundary>

      <div className="hero-inner wrap">
        <motion.p className="hero-tag" custom={0} variants={rise} initial="hidden" animate="show">
          Neuroengineer · MGH / Harvard
        </motion.p>

        <motion.h1 className="hero-name" custom={1} variants={rise} initial="hidden" animate="show">
          Matteo <span className="second">Vissani</span>
        </motion.h1>

        <motion.p className="hero-role" custom={2} variants={rise} initial="hidden" animate="show">
          Decoding the brain’s electrical code to build <b>adaptive neurostimulation</b>.
        </motion.p>

        <motion.p className="hero-sub" custom={3} variants={rise} initial="hidden" animate="show">
          {profile.subtitle}
        </motion.p>

        <motion.div className="hero-cta" custom={4} variants={rise} initial="hidden" animate="show">
          <a className="btn" href="#work">View featured work</a>
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
