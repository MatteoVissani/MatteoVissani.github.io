import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import SignalArt from './SignalArt'
import { LogoMark } from './Logo'
import { Pdf, Doi, GitHub, ArrowRight } from './Icons'
import { findPub, categoryLabels, publications, profile } from '../data/content'
import { abstracts, summaries } from '../data/abstracts'
import { figures } from '../data/figures'

const PdfViewer = lazy(() => import('./PdfViewer'))

function authorHTML(a: string) {
  return a.replace(/Vissani M/g, '<b>Vissani M</b>')
}

function bibtex(p: NonNullable<ReturnType<typeof findPub>>) {
  const doi = p.link.replace('https://doi.org/', '')
  const first = p.authors.split(',')[0].trim().split(' ')[0].toLowerCase()
  return `@article{${first}${p.year},
  title   = {${p.title}},
  author  = {${p.authors.replace(/…,?\s*/g, '').replace(/, et al\.?/, ' and others')}},
  journal = {${p.venue}},
  year    = {${p.year}}${doi.startsWith('10.') ? `,\n  doi     = {${doi}}` : ''}
}`
}

export default function PaperPage({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const p = findPub(slug)

  if (!p) {
    return (
      <main className="paper-wrap">
        <div className="wrap" style={{ paddingTop: 140 }}>
          <p className="eyebrow">404</p>
          <h1 className="section-title">Paper <span className="accent">not found</span></h1>
          <a className="btn ghost" href="#/">← Back home</a>
        </div>
      </main>
    )
  }

  const abstract = (abstracts[slug] || '')
    .replace(/\b(OBJECTIVE|BACKGROUND|METHODS?|RESULTS?|CONCLUSIONS?|SIGNIFICANCE|AIM|PURPOSE)S?:\s*/gi, '')
    .replace(/\s*…\s*$/, '.')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const summary = summaries[slug] || ''

  // real paper figure used as the graphical abstract
  const fig0 = figures[slug]?.[0]
  const gradImg = fig0?.src || (p.figure && !/\.(mp4|webm)$/i.test(p.figure) ? p.figure : null)
  const figCap =
    (fig0?.caption ? fig0.caption.replace(/^fig(?:ure)?\.?\s*\d+\s*[.:|·-]?\s*/i, '').trim() : '') ||
    p.figCaption || ''

  // sibling papers in the same research area
  const related = publications.filter((q) => q.category === p.category && q.slug !== p.slug).slice(0, 3)

  const copyCite = async () => {
    try {
      await navigator.clipboard.writeText(bibtex(p))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  return (
    <main className="paper-wrap">
      <div className="paper-topbar">
        <a className="paper-home" href="#/" aria-label="Home"><LogoMark size={26} /><span>MATTEO<i>//</i>VISSANI</span></a>
        <a className="paper-back" href="#/">← All papers</a>
      </div>

      <article className="wrap paper">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="paper-tags">
            <span className="paper-cat">{categoryLabels[p.category]}</span>
            {p.flagship && <span className="paper-flag">Flagship</span>}
          </div>

          <h1 className="paper-title">{p.title}</h1>
          <p className="paper-authors" dangerouslySetInnerHTML={{ __html: authorHTML(p.authors) }} />
          <p className="paper-venue">{p.venue} · {p.year} · {/^Vissani/.test(p.authors) ? 'First author' : 'Co-author'}</p>

          <div className="paper-actions">
            <a className="btn" href={p.link} target="_blank" rel="noreferrer"><Doi style={{ width: 16, height: 16, verticalAlign: '-3px', marginRight: 8 }} />View on publisher</a>
            {p.pdf && <a className="btn ghost" href={p.pdf} target="_blank" rel="noreferrer"><Pdf style={{ width: 16, height: 16, verticalAlign: '-3px', marginRight: 8 }} />PDF</a>}
            {p.code && <a className="btn ghost" href={p.code} target="_blank" rel="noreferrer"><GitHub style={{ width: 16, height: 16, verticalAlign: '-3px', marginRight: 8 }} />Code</a>}
            <button className="btn ghost" onClick={copyCite}>{copied ? '✓ Copied BibTeX' : 'Cite (BibTeX)'}</button>
          </div>
        </motion.div>

        {abstract && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}>
            <h2 className="paper-h2">Abstract</h2>
            <p className="paper-abstract">{abstract}</p>
          </motion.div>
        )}

        {(gradImg || summary) && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}>
            <h2 className="paper-h2">{gradImg ? 'Graphical abstract' : 'In brief'}</h2>
            <div className={`paper-grab ${gradImg ? '' : 'noimg'}`}>
              {gradImg && (
                <figure className="paper-grab-img">
                  <img src={gradImg} alt={`Graphical abstract — ${p.title}`} loading="lazy" />
                  {figCap && <figcaption>{figCap}</figcaption>}
                </figure>
              )}
              {summary && <p className="paper-grab-text">{summary}</p>}
            </div>
          </motion.div>
        )}

        {p.pdf && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}>
            <h2 className="paper-h2">
              Read the paper
              <a className="paper-h2-link" href={p.pdf} target="_blank" rel="noreferrer">open / download ↗</a>
            </h2>
            <p className="paper-readhint">Flip through every page and figure — arrows or ← → keys.</p>
            <Suspense fallback={<div className="pdfv-loading-block">loading viewer…</div>}>
              <PdfViewer url={p.pdf} />
            </Suspense>
          </motion.div>
        )}

        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="paper-h2">Related work · {categoryLabels[p.category]}</h2>
            <div className="paper-related">
              {related.map((r) => (
                <a key={r.slug} className="paper-rel panel" href={`#/paper/${r.slug}`}>
                  <div className="paper-rel-art"><SignalArt variant={r.variant} id={`rel-${r.slug}`} /></div>
                  <div className="paper-rel-body">
                    <div className="paper-rel-venue">{r.venue} · {r.year}</div>
                    <div className="paper-rel-title">{r.title}</div>
                    <span className="work-link">Open <ArrowRight /></span>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        <div className="paper-footer">
          <a className="btn ghost" href="#/">← Back to {profile.shortName}’s portfolio</a>
        </div>
      </article>
    </main>
  )
}
