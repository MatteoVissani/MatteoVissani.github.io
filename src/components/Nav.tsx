import { useEffect, useState } from 'react'
import { navLinks, profile } from '../data/content'
import { Logo } from './Logo'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a className="nav-brand" href="#top" aria-label="Matteo Vissani, home">
        <Logo />
      </a>

      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>

      <div className={`nav-links ${open ? 'open' : ''}`}>
        {navLinks.map((l) => (
          <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a className="nav-cv" href={profile.cv} target="_blank" rel="noreferrer">
          CV
        </a>
      </div>
    </nav>
  )
}
