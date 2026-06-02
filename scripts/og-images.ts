// Build-time generator: one 1200x630 social/OG card per publication, in the
// site's synthwave style (title + journal·year + authors + URL). Output to
// public/og/<slug>.png; referenced per paper by the prerender step.
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publications, profile } from '../src/data/content'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public', 'og')
mkdirSync(outDir, { recursive: true })

const W = 1200, H = 630
const CYAN = '#22e1ff', PINK = '#ff2d8f', VIOLET = '#b15bff'

function wrap(ctx: any, text: string, max: number, maxLines: number): string[] {
  const words = text.split(' '); const lines: string[] = []; let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w } else cur = t
    if (lines.length === maxLines) break
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  if (lines.length === maxLines) { let last = lines[maxLines - 1]; while (ctx.measureText(last + '…').width > max && last.length) last = last.slice(0, -1); lines[maxLines - 1] = last.trimEnd() + '…' }
  return lines
}

let n = 0
for (const p of publications) {
  const cv = createCanvas(W, H); const ctx = cv.getContext('2d')
  // background gradient
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#0a0618'); g.addColorStop(0.55, '#150b2b'); g.addColorStop(1, '#04030e')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // neon sun
  const sun = ctx.createRadialGradient(W / 2, 250, 20, W / 2, 250, 360)
  sun.addColorStop(0, 'rgba(255,45,143,0.30)'); sun.addColorStop(1, 'rgba(255,45,143,0)')
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(W / 2, 250, 360, 0, 2 * Math.PI); ctx.fill()
  // perspective grid (bottom)
  ctx.strokeStyle = 'rgba(177,91,255,0.25)'; ctx.lineWidth = 1.5
  for (let i = 0; i <= 16; i++) { const x = (i / 16) * W; ctx.beginPath(); ctx.moveTo(W / 2, 470); ctx.lineTo(x, H); ctx.stroke() }
  for (let i = 1; i <= 6; i++) { const y = 470 + (i * i) * 4.4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  // top accent bar
  ctx.fillStyle = CYAN; ctx.fillRect(70, 70, 60, 6)
  // eyebrow: journal · year · role
  const role = /^Vissani/i.test(p.authors) ? 'First author' : 'Co-author'
  ctx.font = '600 26px sans-serif'; ctx.fillStyle = VIOLET
  ctx.fillText(`${p.venue.toUpperCase()}  ·  ${p.year}  ·  ${role.toUpperCase()}`, 70, 130)
  // title
  ctx.fillStyle = '#eef0ff'; ctx.font = '800 58px sans-serif'
  const lines = wrap(ctx, p.title, W - 140, 4)
  let y = 210
  lines.forEach((l) => { ctx.fillText(l, 70, y); y += 70 })
  // authors (highlight Vissani)
  ctx.font = '400 24px sans-serif'; ctx.fillStyle = 'rgba(233,235,251,0.7)'
  const auth = wrap(ctx, p.authors.replace(/\s*et al\.?/i, ' et al.'), W - 140, 1)[0]
  ctx.fillText(auth, 70, Math.min(y + 24, 520))
  // footer: name + url
  ctx.fillStyle = CYAN; ctx.font = '700 28px sans-serif'
  ctx.fillText(profile.name, 70, 575)
  ctx.fillStyle = PINK; ctx.font = '500 24px sans-serif'
  const url = 'matteovissani.github.io'
  ctx.fillText(url, W - 70 - ctx.measureText(url).width, 575)
  // bottom neon line
  ctx.fillStyle = 'rgba(34,225,255,0.5)'; ctx.fillRect(70, 600, W - 140, 2)

  writeFileSync(resolve(outDir, `${p.slug}.png`), cv.toBuffer('image/png'))
  n++
}
console.log(`generated ${n} OG images -> public/og/`)
