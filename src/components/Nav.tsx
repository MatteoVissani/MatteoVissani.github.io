import { useEffect, useState } from 'react'
import { navLinks, profile } from '../data/content'
import { Logo } from './Logo'

function Caret() {
  return (
    <svg className="nav-caret" viewBox="0 0 10 6" aria-hidden="true">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setOpen(false)

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a className="nav-brand" href="#top" aria-label="Matteo Vissani, home">
        <Logo />
      </a>

      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>

      <div className={`nav-links ${open ? 'open' : ''}`}>
        {navLinks.map((l) =>
          l.children ? (
            <div className="nav-group" key={l.id}>
              <a className="nav-group-label" href={l.href ?? `#${l.id}`} onClick={close}>
                {l.label}
                <Caret />
              </a>
              <div className="nav-dropdown">
                {l.children.map((c) => (
                  <a key={c.id} href={`#${c.id}`} onClick={close}>{c.label}</a>
                ))}
              </div>
            </div>
          ) : (
            <a key={l.id} href={l.href ?? `#${l.id}`} onClick={close}>{l.label}</a>
          ),
        )}
        <a className="nav-cv" href={profile.cv} target="_blank" rel="noreferrer">
          CV
        </a>
      </div>
    </nav>
  )
}
