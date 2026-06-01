import { useEffect, useState } from 'react'
import Background from './components/Background'
import Nav from './components/Nav'
import Hero from './components/Hero'
import PaperPage from './components/PaperPage'
import { About, Research, Featured, Interactive, Publications, Awards, Teaching, Talks, Contact } from './components/Sections'

// Real-path router: paper pages live at /paper/<slug>/ so each is its own
// crawlable, Scholar-indexable URL. Internal root-relative links are handled
// client-side (no reload); old #/paper/<slug> hash links are redirected.
function usePathRoute() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    // Back-compat: rewrite legacy hash routes to clean paths.
    const h = window.location.hash
    const m = h.match(/^#\/paper\/(.+)$/)
    if (m) { const p = '/paper/' + m[1] + '/'; history.replaceState(null, '', p); setPath(p) }
    else if (h === '#/') { history.replaceState(null, '', '/'); setPath('/') }

    const onPop = () => { setPath(window.location.pathname); window.scrollTo(0, 0) }
    window.addEventListener('popstate', onPop)

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return        // internal, root-relative only
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return
      if (/\.(pdf|png|jpe?g|svg|zip|xml|txt)$/i.test(href)) return                // let real files navigate
      e.preventDefault()
      if (href !== window.location.pathname) { history.pushState(null, '', href); setPath(href); window.scrollTo(0, 0) }
    }
    document.addEventListener('click', onClick)

    return () => { window.removeEventListener('popstate', onPop); document.removeEventListener('click', onClick) }
  }, [])

  return path
}

export default function App() {
  const path = usePathRoute()
  const paper = path.match(/^\/paper\/([^/]+)\/?$/)

  if (paper) {
    return (
      <>
        <Background />
        <PaperPage slug={decodeURIComponent(paper[1])} />
      </>
    )
  }

  return (
    <>
      <Background />
      <Nav />
      <main>
        <Hero />
        <About />
        <Research />
        <Featured />
        <Interactive />
        <Publications />
        <Awards />
        <Teaching />
        <Talks />
        <Contact />
      </main>
    </>
  )
}
