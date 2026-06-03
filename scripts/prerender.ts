// Post-build prerender. Vite emits a single dist/index.html (an empty SPA
// shell). This script copies that shell into dist/paper/<slug>/index.html for
// every publication, rewriting the <head> with per-paper SEO + Google Scholar
// (Highwire citation_*) metadata and injecting real, crawlable article text
// into #root (which React harmlessly replaces on boot). It also regenerates
// sitemap.xml with every URL. Run as: tsx scripts/prerender.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publications } from '../src/data/content'
import { abstracts, summaries } from '../src/data/abstracts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const ORIGIN = 'https://matteovissani.github.io'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const clean = (s: string) =>
  s.replace(/\b(OBJECTIVES?|BACKGROUND|METHODS?|APPROACH|MAIN RESULTS?|RESULTS?|CONCLUSIONS?|SIGNIFICANCE|AIM|PURPOSE)S?:\s*/gi, '')
    .replace(/\s+/g, ' ').trim()

// Authors -> array, dropping ellipsis/"et al." placeholders.
const authorList = (authors: string) =>
  authors.split(',').map((a) => a.trim()).filter((a) => a && a !== '…' && !/^et al\.?$/i.test(a) && a !== 'et al')

const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

let made = 0
for (const p of publications) {
  const url = `${ORIGIN}/paper/${p.slug}/`
  const authors = authorList(p.authors)
  const abs = clean(abstracts[p.slug] || '')
  const summary = summaries[p.slug] || ''
  const desc = (summary || abs || `${p.title}. ${p.venue}, ${p.year}.`).slice(0, 300)
  const doi = p.link.startsWith('https://doi.org/') ? p.link.replace('https://doi.org/', '') : ''
  const pdfUrl = p.pdf ? (p.pdf.startsWith('http') ? p.pdf : ORIGIN + p.pdf) : ''

  // Google Scholar / Highwire tags
  const cite = [
    `<meta name="citation_title" content="${esc(p.title)}" />`,
    ...authors.map((a) => `<meta name="citation_author" content="${esc(a)}" />`),
    `<meta name="citation_journal_title" content="${esc(p.venue)}" />`,
    `<meta name="citation_publication_date" content="${p.year}" />`,
    doi ? `<meta name="citation_doi" content="${esc(doi)}" />` : '',
    pdfUrl ? `<meta name="citation_pdf_url" content="${esc(pdfUrl)}" />` : '',
  ].filter(Boolean).join('\n    ')

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: p.title,
    name: p.title,
    author: authors.map((a) => ({ '@type': 'Person', name: a })),
    datePublished: String(p.year),
    isPartOf: { '@type': 'Periodical', name: p.venue },
    url,
    ...(doi ? { sameAs: p.link, identifier: { '@type': 'PropertyValue', propertyID: 'doi', value: doi } } : {}),
    ...(pdfUrl ? { mainEntityOfPage: pdfUrl } : {}),
  })

  // Crawlable body (replaced by React for JS users)
  const body = `<article style="max-width:760px;margin:0 auto;padding:120px 24px 80px;color:#e9ebfb;font-family:system-ui,sans-serif;line-height:1.6">
      <p style="opacity:.6"><a href="/" style="color:#22e1ff">← Matteo Vissani · portfolio</a></p>
      <h1>${esc(p.title)}</h1>
      <p style="opacity:.85">${esc(authors.join(', '))}</p>
      <p style="opacity:.7"><i>${esc(p.venue)}</i> · ${p.year}${doi ? ` · <a href="${esc(p.link)}" style="color:#22e1ff">doi:${esc(doi)}</a>` : ''}</p>
      ${abs ? `<p>${esc(abs)}</p>` : ''}
      ${pdfUrl ? `<p><a href="${esc(pdfUrl)}" style="color:#22e1ff">Read the PDF →</a></p>` : ''}
    </article>`

  const head = [
    `<meta name="robots" content="index, follow" />`,
    `<meta name="citation_fulltext_world_readable" content="" />`,
    cite,
    `<script type="application/ld+json">${ld}</script>`,
  ].join('\n    ')

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)} · Matteo Vissani</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(p.title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`)
    .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${ORIGIN}/og/${p.slug}.png" />`)
    .replace(/<meta property="og:image:alt"[^>]*>/, `<meta property="og:image:alt" content="${esc(p.title)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(p.title)}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`)
    .replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${ORIGIN}/og/${p.slug}.png" />`)
    .replace(/<\/head>/, `    ${head}\n  </head>`)
    .replace(/<div id="root">\s*<\/div>/, `<div id="root">${body}</div>`)

  const dir = resolve(dist, 'paper', p.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), html)
  made++
}

// Theory & methods page: a client-rendered route, so emit the SPA shell at
// /notes/ so a direct hit / refresh on GitHub Pages doesn't 404.
mkdirSync(resolve(dist, 'notes'), { recursive: true })
writeFileSync(resolve(dist, 'notes', 'index.html'),
  template.replace(/<title>[^<]*<\/title>/, '<title>Theory & methods — Matteo Vissani</title>'))

// Full sitemap: home + every paper page.
const today = new Date().toISOString().slice(0, 10)
const urls = [`${ORIGIN}/`, `${ORIGIN}/notes`, ...publications.map((p) => `${ORIGIN}/paper/${p.slug}/`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u === ORIGIN + '/' ? '1.0' : '0.8'}</priority>\n  </url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap)

console.log(`prerendered ${made} paper pages + sitemap (${urls.length} urls)`)
