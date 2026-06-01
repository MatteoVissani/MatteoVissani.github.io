import { useEffect, useState } from 'react'
import Background from './components/Background'
import Nav from './components/Nav'
import Hero from './components/Hero'
import PaperPage from './components/PaperPage'
import { About, Research, Featured, Interactive, Publications, Awards, Teaching, Talks, Contact } from './components/Sections'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHashRoute()
  const paper = hash.match(/^#\/paper\/(.+)$/)

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
