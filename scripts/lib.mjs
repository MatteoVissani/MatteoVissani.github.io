// Shared helpers for fetching/cleaning paper metadata and abstracts.

export function cleanAbstract(raw) {
  if (!raw) return ''
  return raw
    .replace(/<h4>[^<]*<\/h4>/gi, ' ')      // drop structured-abstract headers (Objective, Methods…)
    .replace(/<[^>]+>/g, ' ')                // strip any remaining HTML tags
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\b(OBJECTIVES?|BACKGROUND|METHODS?|APPROACH|MAIN RESULTS?|RESULTS?|CONCLUSIONS?|SIGNIFICANCE|AIM|PURPOSE)S?:\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 5).join('-')
}

export async function crossref(doi) {
  const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  if (!r.ok) return null
  const m = (await r.json()).message
  const authors = (m.author || []).map((a) => `${a.family} ${(a.given || '').split(' ').map((g) => g[0]).join('')}`).join(', ')
  return {
    title: (m.title || [''])[0],
    authors,
    venue: (m['container-title'] || [''])[0],
    year: (m.published || m['published-online'] || m['published-print'] || {})['date-parts']?.[0]?.[0],
  }
}

export async function europepmc(doi) {
  const r = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${doi}&resultType=core&format=json`)
  if (!r.ok) return ''
  const res = (await r.json()).resultList?.result || []
  return cleanAbstract(res[0]?.abstractText || '')
}
