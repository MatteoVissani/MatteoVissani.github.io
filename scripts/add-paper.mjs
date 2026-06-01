#!/usr/bin/env node
// Fetch paper metadata + a clean abstract from a DOI, and print ready-to-paste
// snippets for src/data/content.ts and src/data/abstracts.ts.
//
//   node scripts/add-paper.mjs 10.1038/s41586-025-10059-1
//
// Sources: Crossref (metadata) + Europe PMC (clean structured abstract).
// After pasting, optionally map the slug to a sketch motif in GraphicalAbstract.tsx
// (SPEC[slug]); otherwise it falls back to a generic motif by `variant`.

import { cleanAbstract, slugify, crossref, europepmc } from './lib.mjs'

const doi = process.argv[2]
if (!doi) {
  console.error('Usage: node scripts/add-paper.mjs <DOI>')
  process.exit(1)
}

const meta = await crossref(doi)
if (!meta) { console.error('DOI not found on Crossref'); process.exit(1) }
const abstract = await europepmc(doi)
const slug = slugify(meta.title)
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

console.log('\n=== src/data/content.ts → publications[] ===\n')
console.log(`  P('${slug}', 'network', '${meta.authors}', '${esc(meta.title)}', '${meta.venue}', ${meta.year}, 'modeling', '${doi}', {}),`)
console.log('\n  (adjust variant, category, and add { pdf, code } as needed)\n')
console.log('=== src/data/abstracts.ts → abstracts ===\n')
console.log(`  '${slug}': "${esc(abstract) || 'TODO: no abstract found — paste manually'}",`)
console.log('\n=== src/data/abstracts.ts → summaries (write your own plain-language line) ===\n')
console.log(`  '${slug}': "TODO: one-sentence plain-language takeaway.",\n`)
