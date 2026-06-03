import { useEffect, useState } from 'react'
import { notes } from './notes'
import { TB } from './notes/Tex'
import CodeBlock from './notes/CodeBlock'
import { Anim, hasAnim } from './notes/anims'

// Ordered, grouped table of contents for the Theory & methods page.
const GROUPS: { label: string; items: string[] }[] = [
  { label: 'Neuronal dynamics', items: ['lif', 'wilson-cowan'] },
  { label: 'Neural coding & information', items: ['spike-phase', 'decoding', 'information'] },
  { label: 'Signals & time–frequency', items: ['fourier', 'filter', 'wavelet', 'kalman'] },
  { label: 'Neurotechnology', items: ['dbs', 'eeg'] },
  { label: 'Toolkit', items: ['spc-toolkit'] },
]
const ALL = GROUPS.flatMap((g) => g.items)

const slugFromHash = () => {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  return notes[h] ? h : ALL[0]
}

export default function NotesPage() {
  const [slug, setSlug] = useState(slugFromHash)
  const note = notes[slug]

  useEffect(() => {
    const onHash = () => { const s = slugFromHash(); setSlug(s) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (s: string) => {
    setSlug(s)
    history.replaceState(null, '', '/notes#' + s)
    document.querySelector('.np-main')?.scrollTo({ top: 0, behavior: 'auto' })
    window.scrollTo(0, 0)
  }

  if (!note) return null

  return (
    <div className="np">
      <aside className="np-side">
        <a className="np-home" href="/">← Matteo Vissani</a>
        <div className="np-side-top">∑ Theory &amp; methods</div>
        <nav>
          {GROUPS.map((g) => (
            <div key={g.label} className="np-group">
              <div className="np-group-label">{g.label}</div>
              {g.items.map((s) => (
                <button key={s} className={`np-item${s === slug ? ' on' : ''}`} onClick={() => go(s)}>
                  {notes[s]?.title.replace(/^The /, '')}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="np-main">
        <article className="np-article">
          <div className="np-bar" />
          <div className="np-eyebrow">{note.theme}</div>
          <div className="np-titlerow">
            <h1 className="np-title">{note.title}</h1>
            <button className="np-pdf" onClick={() => window.print()} title="Save this chapter as a PDF">⤓ PDF</button>
          </div>
          <p className="np-tagline">{note.tagline}</p>

          <h2 className="np-sect">Foundations</h2>
          <div className="np-prose">{note.foundations}</div>

          <h2 className="np-sect">Derivation</h2>
          <div className="np-deriv">
            {note.derivation.map((d, i) => (
              <div key={i} className="np-step">
                <span className="np-step-num">{i + 1}</span>
                <h4 className="np-step-title">{d.title}</h4>
                {d.tex && <div className="np-eq"><TB>{d.tex}</TB></div>}
                <div className="np-prose">{d.note}</div>
              </div>
            ))}
          </div>

          {note.deep?.map((s, i) => (
            <div key={i}>
              <h2 className="np-sect">{s.heading}</h2>
              <div className="np-prose">{s.body}</div>
            </div>
          ))}

          {/* on screen: a contextual animation where one exists; in the PDF (and for
              chapters without an animation), the static schematic. */}
          {hasAnim(slug) ? <>
            <div className="screen-only">
              <h2 className="np-sect">Illustration</h2>
              <Anim slug={slug} />
            </div>
            <div className="print-only">
              <h2 className="np-sect">Schematic</h2>
              <div className="np-schema">{note.schema}</div>
            </div>
          </> : <>
            <h2 className="np-sect">Schematic</h2>
            <div className="np-schema">{note.schema}</div>
          </>}

          <h2 className="np-sect">Numerical scheme</h2>
          <div className="np-prose">{note.numerics}</div>

          {note.pseudocode && <>
            <h2 className="np-sect">Implementation (pseudocode)</h2>
            <CodeBlock code={note.pseudocode} />
          </>}

          <h2 className="np-sect">Parameters</h2>
          <table className="np-params">
            <thead><tr><th>Control</th><th>Range (step, default)</th><th>Exact role</th></tr></thead>
            <tbody>
              {note.params.map((p, i) => (
                <tr key={i}><td className="mono">{p.name}</td><td className="mono">{p.range}</td><td>{p.role}</td></tr>
              ))}
            </tbody>
          </table>

          <p className="np-refs"><b>References.</b> {note.refs}</p>

          <div className="np-foot">
            <a href={`/#software`}>← Back to the interactive demos</a>
          </div>
        </article>
      </main>
    </div>
  )
}
