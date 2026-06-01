import { Suspense, lazy, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SignalArt from './SignalArt'
import GraphicalAbstract from './GraphicalAbstract'
import { LogoMark } from './Logo'
import { Pdf, Doi, GitHub, ArrowRight } from './Icons'
import { findPub, categoryLabels, publications, profile } from '../data/content'
import { abstracts, summaries } from '../data/abstracts'

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
          <a className="btn ghost" href="/">← Back home</a>
        </div>
      </main>
    )
  }

  const abstract = (abstracts[slug] || '')
    .replace(/\b(OBJECTIVES?|BACKGROUND|METHODS?|APPROACH|MAIN RESULTS?|RESULTS?|CONCLUSIONS?|SIGNIFICANCE|AIM|PURPOSE)S?:\s*/gi, '')
    .replace(/\s*…\s*$/, '.')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const summary = summaries[slug] || ''
  const doi = p.link.startsWith('https://doi.org/') ? p.link.replace('https://doi.org/', '') : ''

  // Load the Altmetric (attention) and Dimensions (citations) badge embeds;
  // re-run per paper so the badges update on client-side navigation.
  useEffect(() => {
    if (!doi) return
    const srcs = [
      'https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js',
      'https://badge.dimensions.ai/badge.js',
    ]
    const els = srcs.map((src) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      document.body.appendChild(s)
      return s
    })
    return () => { els.forEach((s) => s.remove()) }
  }, [doi])

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
        <a className="paper-home" href="/" aria-label="Home"><LogoMark size={26} /><span>MATTEO<i>//</i>VISSANI</span></a>
        <a className="paper-back" href="/">← All papers</a>
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

          {doi && (
            <div className="paper-metrics" style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', background: 'rgba(244,246,251,0.96)', padding: '12px 20px', borderRadius: 14 }}>
              <div
                key={`alt-${doi}`}
                className="altmetric-embed"
                data-badge-type="donut"
                data-badge-popover="right"
                data-doi={doi}
                data-hide-no-mentions="true"
              />
              <span
                key={`dim-${doi}`}
                className="__dimensions_badge_embed__"
                data-doi={doi}
                data-style="small_circle"
              />
            </div>
          )}
        </motion.div>

        {abstract && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}>
            <h2 className="paper-h2">Abstract</h2>
            <p className="paper-abstract">{abstract}</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}>
          <h2 className="paper-h2">In brief</h2>
          <div className="ga-frame"><GraphicalAbstract slug={slug} variant={p.variant} /></div>
          {summary && <p className="ga-caption">{summary}</p>}
        </motion.div>

        {p.pdf && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}>
            <h2 className="paper-h2">
              Read the paper
              <a className="paper-h2-link" href={p.pdf} target="_blank" rel="noreferrer">open / download ↗</a>
            </h2>
            <p className="paper-readhint">Flip through every page and figure, arrows or ← → keys.</p>
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
                <a key={r.slug} className="paper-rel panel" href={`/paper/${r.slug}/`}>
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
          <a className="btn ghost" href="/">← Back to {profile.shortName}’s portfolio</a>
        </div>
      </article>
    </main>
  )
}
