import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react'
import { svd, matvec, dot, scale, add, sub, norm, type Mat, type Vec } from './subspaceMath'

// The four fundamental subspaces of a matrix A: ℝⁿ → ℝᵐ, live. The left pane is
// the input space (Row(A) ⊕ Null(A), right singular vectors vᵢ, the unit circle);
// the right pane is the output space (Col(A) ⊕ Null(Aᵀ), the image ellipse with
// semi-axes σᵢuᵢ). Color-matched dots show where each point of the circle lands;
// pressing ▶ orbit sends x around the circle while Ax rides the ellipse. Drag x,
// edit A, switch shapes — every redraw recomputes the SVD in closed form.

type Shape = '2×2' | '3×2' | '2×3'
const SHAPES: Shape[] = ['2×2', '3×2', '2×3']

const ROW = '#22e1ff', NUL = '#ff2d8f', COL = '#54e6a0', LNUL = '#ffb84d', MAIN = '#ffffff'
const PAIR = ['#9b8cff', '#ffe14d']               // singular pair i: vᵢ in the domain ↔ σᵢuᵢ in the codomain
const AXIS = 'rgba(255,255,255,0.30)', GRID = 'rgba(255,255,255,0.06)', CIRC = 'rgba(255,255,255,0.38)'
const SUBS = '₀₁₂₃'

const DEFAULTS: Record<Shape, Mat> = {
  '2×2': [[1.2, 0.5], [0.4, 1.1]],
  '3×2': [[1, 0.3], [0.2, 1], [0.6, 0.5]],
  '2×3': [[1, 0.3, 0.6], [0.2, 1, 0.5]],
}
const PRESETS: Record<Shape, { name: string; A: Mat }[]> = {
  '2×2': [
    { name: 'generic', A: DEFAULTS['2×2'] },
    { name: 'rank 1 ⚠', A: [[1, 0.5], [2, 1]] },
    { name: 'shear', A: [[1, 1], [0, 1]] },
    { name: 'rotation 45°', A: [[0.71, -0.71], [0.71, 0.71]] },
    { name: 'projection', A: [[1, 0], [0, 0]] },
    { name: 'symmetric', A: [[1.5, 0.5], [0.5, 1.5]] },
  ],
  '3×2': [
    { name: 'generic', A: DEFAULTS['3×2'] },
    { name: 'rank 1 ⚠', A: [[1, 2], [0.5, 1], [-0.5, -1]] },
    { name: 'embed plane', A: [[1, 0], [0, 1], [0, 0]] },
  ],
  '2×3': [
    { name: 'generic', A: DEFAULTS['2×3'] },
    { name: 'rank 1 ⚠', A: [[1, 0.5, -0.5], [2, 1, -1]] },
    { name: 'drop z', A: [[1, 0, 0], [0, 1, 0]] },
  ],
}

// ---------- canvas helpers ----------
type P2 = { x: number; y: number }
type Proj = (v: Vec) => P2
type View = { yaw: number; pitch: number }

function fit(cv: HTMLCanvasElement) {
  const ctx = cv.getContext('2d'); if (!ctx) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = cv.clientWidth, H = cv.clientHeight
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr) }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
  return { ctx, W, H }
}

// orthographic projector: 2D is the identity map, 3D applies yaw (about e3) then pitch
function makeProj(dim: number, view: View, s: number, cx: number, cy: number): Proj {
  if (dim === 2) return (v) => ({ x: cx + v[0] * s, y: cy - v[1] * s })
  const cyw = Math.cos(view.yaw), syw = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch)
  return (v) => {
    const x1 = cyw * v[0] + syw * v[1], y1 = -syw * v[0] + cyw * v[1]
    return { x: cx + x1 * s, y: cy - (cp * v[2] - sp * y1) * s }
  }
}

function seg(ctx: CanvasRenderingContext2D, a: P2, b: P2, color: string, w = 1, dash?: number[]) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash || [])
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([])
}

// label with a dark backing so it stays readable over grid lines and curves
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 11.5, align: CanvasTextAlign = 'center') {
  ctx.font = `${size}px monospace`; ctx.textAlign = align
  const w = ctx.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2
  ctx.fillStyle = 'rgba(10,11,24,0.78)'; ctx.fillRect(x0 - 3, y - size + 1, w + 6, size + 5)
  ctx.fillStyle = color; ctx.fillText(text, x, y)
}

function arrow(ctx: CanvasRenderingContext2D, a: P2, b: P2, color: string, w = 2, txt = '') {
  seg(ctx, a, b, color, w)
  const ang = Math.atan2(b.y - a.y, b.x - a.x), s = 8 + w
  ctx.fillStyle = color
  ctx.beginPath(); ctx.moveTo(b.x, b.y)
  ctx.lineTo(b.x - s * Math.cos(ang - 0.4), b.y - s * Math.sin(ang - 0.4))
  ctx.lineTo(b.x - s * Math.cos(ang + 0.4), b.y - s * Math.sin(ang + 0.4))
  ctx.closePath(); ctx.fill()
  if (txt) label(ctx, txt, b.x + 17 * Math.cos(ang), b.y + 17 * Math.sin(ang) + 4, color)
}

function polyline(ctx: CanvasRenderingContext2D, pts: P2[], color: string, w = 1, dash?: number[], close = false) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash || [])
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  if (close) ctx.closePath()
  ctx.stroke(); ctx.setLineDash([])
}

function hexA(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// one pane: a pair of orthogonal subspaces (basis[0..rank) spans the "in" set),
// basis arrows, a marked curve, the main vector and its decomposition
type PaneSpec = {
  dim: number; view: View
  basis: Vec[]; rank: number
  inColor: string; outColor: string; inName: string; outName: string
  arrows: { v: Vec; color: string; label: string }[]
  curve: Vec[] | null; curveLabel: string
  dots: { v: Vec; color: string }[]                   // color-matched correspondence dots
  main: { v: Vec; label: string } | null
  parts: { v: Vec; color: string; label: string; head: boolean }[]   // decomposition (head=false: foot dot + dashed edge only)
}

function drawPane(cv: HTMLCanvasElement, spec: PaneSpec): { s: number; cx: number; cy: number } | null {
  const f = fit(cv); if (!f) return null
  const { ctx, W, H } = f
  const { dim, view, basis, rank } = spec
  let worldMax = 1.65
  if (spec.main) worldMax = Math.max(worldMax, norm(spec.main.v) * 1.18)
  if (spec.curve) for (const p of spec.curve) worldMax = Math.max(worldMax, norm(p) * 1.18)
  for (const a of spec.arrows) worldMax = Math.max(worldMax, norm(a.v) * 1.18)
  const s = (Math.min(W, H) / 2 - 24) / worldMax, cx = W / 2, cy = H / 2
  const P = makeProj(dim, view, s, cx, cy)

  if (dim === 2) {
    // grid + axes across the whole canvas
    for (let g = -Math.ceil(cx / s); g <= Math.ceil(cx / s); g++) if (g) seg(ctx, { x: cx + g * s, y: 0 }, { x: cx + g * s, y: H }, GRID)
    for (let g = -Math.ceil(cy / s); g <= Math.ceil(cy / s); g++) if (g) seg(ctx, { x: 0, y: cy + g * s }, { x: W, y: cy + g * s }, GRID)
    seg(ctx, { x: 0, y: cy }, { x: W, y: cy }, AXIS); seg(ctx, { x: cx, y: 0 }, { x: cx, y: H }, AXIS)
    label(ctx, 'e₁', W - 14, cy - 7, AXIS, 10); label(ctx, 'e₂', cx + 13, 13, AXIS, 10)
  } else {
    const L = worldMax * 0.96
    const es: { v: Vec; n: string }[] = [{ v: [L, 0, 0], n: 'e₁' }, { v: [0, L, 0], n: 'e₂' }, { v: [0, 0, L], n: 'e₃' }]
    for (const e of es) {
      seg(ctx, P(scale(e.v, -1)), P(e.v), AXIS)
      const p = P(e.v); label(ctx, e.n, p.x + 9, p.y - 4, AXIS, 10)
    }
  }

  // subspaces: lines / plane patches through the origin (or corner tags for ℝᵈ and {0})
  const groups: { idx: number[]; color: string; name: string }[] = [
    { idx: Array.from({ length: rank }, (_, i) => i), color: spec.inColor, name: spec.inName },
    { idx: Array.from({ length: dim - rank }, (_, i) => rank + i), color: spec.outColor, name: spec.outName },
  ]
  let tagY = 19
  const tag = (text: string, color: string) => { label(ctx, text, 10, tagY, color, 11.5, 'left'); tagY += 17 }
  for (const g of groups) {
    if (g.idx.length === 0) tag(`${g.name} = {0} · just the origin`, g.color)
    else if (g.idx.length === dim) tag(`${g.name} = ℝ${dim === 2 ? '²' : '³'} · the whole plane`, g.color)
    else if (g.idx.length === 2) {
      const [b1, b2] = [basis[g.idx[0]], basis[g.idx[1]]], L = worldMax * 0.8
      const cs = [P(add(scale(b1, L), scale(b2, L))), P(add(scale(b1, L), scale(b2, -L))), P(add(scale(b1, -L), scale(b2, -L))), P(add(scale(b1, -L), scale(b2, L)))]
      ctx.fillStyle = hexA(g.color, 0.1)
      ctx.beginPath(); cs.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill()
      polyline(ctx, cs, hexA(g.color, 0.55), 1.3, undefined, true)
      for (const t of [-0.5, 0, 0.5]) {
        seg(ctx, P(add(scale(b1, -L), scale(b2, t * L))), P(add(scale(b1, L), scale(b2, t * L))), hexA(g.color, 0.18))
        seg(ctx, P(add(scale(b1, t * L), scale(b2, -L))), P(add(scale(b1, t * L), scale(b2, L))), hexA(g.color, 0.18))
      }
      const lp = P(add(scale(b1, L), scale(b2, L)))
      label(ctx, g.name + ' (plane)', lp.x, lp.y - 8, g.color)
    } else {
      const d = basis[g.idx[0]], L = dim === 2 ? Math.hypot(W, H) / s : worldMax * 0.96   // 2D: across the full canvas
      seg(ctx, P(scale(d, -L)), P(scale(d, L)), hexA(g.color, 0.85), 2)
      const lp = P(scale(d, worldMax * 0.8))
      label(ctx, g.name + ' (line)', lp.x, lp.y - 9, g.color)
    }
  }

  // marked curve (unit circle / image ellipse) with color-matched dots
  if (spec.curve) {
    polyline(ctx, spec.curve.map(P), CIRC, 1.2, [5, 4], true)
    const lp = P(spec.curve[Math.floor(spec.curve.length * 0.62)])
    label(ctx, spec.curveLabel, lp.x, lp.y + 16, CIRC, 10.5)
  }
  for (const d of spec.dots) { const p = P(d.v); ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill() }

  const O = P(new Array(dim).fill(0) as Vec)
  for (const a of spec.arrows) arrow(ctx, O, P(a.v), a.color, 2, a.label)

  if (spec.main) {
    const mp = P(spec.main.v)
    for (const part of spec.parts) {
      const pp = P(part.v)
      seg(ctx, pp, mp, hexA(part.color, 0.55), 1.2, [4, 3])
      if (part.head && norm(part.v) > 0.05) arrow(ctx, O, pp, part.color, 2.2, part.label)
      else { ctx.fillStyle = part.color; ctx.beginPath(); ctx.arc(pp.x, pp.y, 3.5, 0, Math.PI * 2); ctx.fill() }
    }
    arrow(ctx, O, mp, MAIN, 2.6, spec.main.label)
    ctx.beginPath(); ctx.arc(mp.x, mp.y, 5.5, 0, Math.PI * 2); ctx.fillStyle = MAIN; ctx.fill()
    ctx.beginPath(); ctx.arc(mp.x, mp.y, 8.5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke()
  }
  return { s, cx, cy }
}

// number formatting for the U Σ Vᵀ read-out
const fm = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).padStart(6)
const matText = (rows: number[][]) => rows.map((r) => '[' + r.map(fm).join(' ') + ' ]').join('\n')
const pairColor = (i: number, rank: number) => (i < rank ? PAIR[i] : NUL)

export default function SubspacesLab() {
  const [shape, setShape] = useState<Shape>('2×2')
  const [A, setA] = useState<Mat>(DEFAULTS['2×2'])
  const [c, setC] = useState<number[]>([1.05, 0.55, 0.6])
  const [anim, setAnim] = useState(false)
  const domRef = useRef<HTMLCanvasElement>(null)
  const codRef = useRef<HTMLCanvasElement>(null)
  const domGeom = useRef<{ s: number; cx: number; cy: number } | null>(null)
  const drag = useRef<{ kind: 'x' | 'rot'; px: number; py: number } | null>(null)
  // live values read by the draw loop (so 3D rotation & the orbit never re-render React)
  const cRef = useRef(c)
  const viewRef = useRef<View>({ yaw: -0.6, pitch: 0.42 })
  const spinRef = useRef(true)            // 3D panes slowly auto-rotate until grabbed
  const animRef = useRef(false)
  const thetaRef = useRef(Math.atan2(0.55, 1.05))

  const m = A.length, n = A[0].length
  const sv = useMemo(() => svd(A), [A])
  const { S, V, rank } = sv

  const model = useRef({ A, sv, m, n }); model.current = { A, sv, m, n }
  const setCoeffs = (cc: number[]) => { cRef.current = cc; setC(cc) }

  // ---------- draw loop ----------
  useEffect(() => {
    let raf = 0, frame = 0
    const TH = Array.from({ length: 72 }, (_, i) => (i / 72) * Math.PI * 2)
    const DOTS = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2)
    const hue = (t: number) => `hsl(${(t / (Math.PI * 2)) * 360} 85% 64%)`
    const loop = () => {
      const { A, sv, m, n } = model.current
      const { U, S, V, rank } = sv
      // orbit: x rides the unit circle of the v₁–v₂ plane (null offset c₃ untouched)
      if (animRef.current) {
        thetaRef.current += 0.012
        cRef.current = [Math.cos(thetaRef.current), Math.sin(thetaRef.current), ...cRef.current.slice(2)]
        if (frame % 6 === 0) setC(cRef.current)
      }
      if ((m === 3 || n === 3) && spinRef.current && !drag.current) viewRef.current = { ...viewRef.current, yaw: viewRef.current.yaw + 0.0035 }
      const view = viewRef.current, cc = cRef.current
      const x = V.reduce((acc, v, i) => add(acc, scale(v, cc[i] ?? 0)), new Array(n).fill(0) as Vec)
      const xRow = V.slice(0, rank).reduce((acc, v, i) => add(acc, scale(v, cc[i] ?? 0)), new Array(n).fill(0) as Vec)
      const xNull = sub(x, xRow)
      const Ax = matvec(A, x)

      if (domRef.current) {
        domGeom.current = drawPane(domRef.current, {
          dim: n, view, basis: V, rank,
          inColor: ROW, outColor: NUL, inName: 'Row(A)', outName: 'Null(A)',
          arrows: V.map((v, i) => ({ v, color: pairColor(i, rank), label: `v${SUBS[i + 1]}` })),
          curve: TH.map((t) => add(scale(V[0], Math.cos(t)), scale(V[1], Math.sin(t)))),
          curveLabel: 'unit circle',
          dots: DOTS.map((t) => ({ v: add(scale(V[0], Math.cos(t)), scale(V[1], Math.sin(t))), color: hue(t) })),
          main: { v: x, label: 'x' },
          parts: rank < n
            ? [{ v: xRow, color: ROW, label: 'x_row', head: true }, { v: xNull, color: NUL, label: 'x_null', head: true }]
            : [0, 1].map((i) => ({ v: scale(V[i], cc[i] ?? 0), color: PAIR[i], label: '', head: false })),
        })
      }
      if (codRef.current) {
        drawPane(codRef.current, {
          dim: m, view, basis: U, rank,
          inColor: COL, outColor: LNUL, inName: 'Col(A)', outName: 'Null(Aᵀ)',
          arrows: U.slice(0, rank).map((u, i) => ({ v: scale(u, S[i]), color: PAIR[i], label: `σ${SUBS[i + 1]}u${SUBS[i + 1]}` })),
          curve: rank > 0 ? TH.map((t) => add(scale(U[0], S[0] * Math.cos(t)), scale(U[1] ?? U[0], (S[1] ?? 0) * Math.sin(t)))) : null,
          curveLabel: rank >= 2 ? 'image of the circle' : 'circle → segment',
          dots: rank > 0 ? DOTS.map((t) => ({ v: add(scale(U[0], S[0] * Math.cos(t)), scale(U[1] ?? U[0], (S[1] ?? 0) * Math.sin(t))), color: hue(t) })) : [],
          main: { v: Ax, label: 'Ax' },
          parts: rank === 2 ? [0, 1].map((i) => ({ v: scale(U[i], S[i] * (cc[i] ?? 0)), color: PAIR[i], label: '', head: false })) : [],
        })
      }
      frame++; raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ---------- interaction ----------
  const setXfromPointer = (e: RPE<HTMLCanvasElement>) => {
    const g = domGeom.current, cv = domRef.current; if (!g || !cv) return
    const r = cv.getBoundingClientRect()
    const wx = (e.clientX - r.left - g.cx) / g.s, wy = (g.cy - (e.clientY - r.top)) / g.s
    const xv: Vec = [Math.max(-3, Math.min(3, wx)), Math.max(-3, Math.min(3, wy))]
    setCoeffs(V.map((v) => +dot(xv, v).toFixed(3)).concat(cRef.current.slice(n)))
  }
  const onDown = (pane: 'dom' | 'cod') => (e: RPE<HTMLCanvasElement>) => {
    const dim = pane === 'dom' ? n : m
    if (pane === 'dom' && dim === 2) { drag.current = { kind: 'x', px: e.clientX, py: e.clientY }; setAnim(false); animRef.current = false; setXfromPointer(e) }
    else if (dim === 3) { drag.current = { kind: 'rot', px: e.clientX, py: e.clientY }; spinRef.current = false }
    else return
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPE<HTMLCanvasElement>) => {
    const d = drag.current; if (!d) return
    if (d.kind === 'x') setXfromPointer(e)
    else {
      const dx = e.clientX - d.px, dy = e.clientY - d.py; d.px = e.clientX; d.py = e.clientY
      viewRef.current = { yaw: viewRef.current.yaw + dx * 0.01, pitch: Math.max(-1.35, Math.min(1.45, viewRef.current.pitch + dy * 0.008)) }
    }
  }
  const onUp = () => { drag.current = null }

  const loadShape = (sh: Shape) => { setShape(sh); setA(DEFAULTS[sh]) }
  const randomA = () => setA(A.map((row) => row.map(() => +(Math.random() * 3 - 1.5).toFixed(1))))
  const setEntry = (i: number, j: number, v: number) => setA((a) => a.map((row, ri) => (ri === i ? row.map((x0, ci) => (ci === j ? v : x0)) : row)))
  const toggleAnim = () => { animRef.current = !animRef.current; setAnim(animRef.current); if (animRef.current) thetaRef.current = Math.atan2(cRef.current[1] ?? 0, cRef.current[0] ?? 1) }

  const nearlySingular = rank === Math.min(m, n) && S[rank - 1] < 0.12 * S[0] && S[0] > 0
  const det = m === 2 && n === 2 ? A[0][0] * A[1][1] - A[0][1] * A[1][0] : null

  // Σ as an m×n diagonal block for the read-out; blocks may have different row
  // counts (e.g. 2×3: Vᵀ is 3×3 but U is 2×2), so pad the shorter ones with spaces
  const Umat = Array.from({ length: m }, (_, i) => sv.U.map((u) => u[i]))
  const Smat = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? S[i] ?? 0 : 0)))
  const blocks = [matText(Umat).split('\n'), matText(Smat).split('\n'), matText(V.map((v) => [...v])).split('\n')]
  const svdRows = Math.max(...blocks.map((b) => b.length))
  const svdText = Array.from({ length: svdRows }, (_, i) => blocks.map((b) => b[i] ?? ' '.repeat(b[0].length)).join('  ')).join('\n')

  const chip = (color: string, text: string) => <span key={text} className="ssl-chip"><i style={{ background: color }} />{text}</span>

  // plain words for what a k-dimensional subspace looks like in a d-dimensional pane
  const geom = (k: number, d: number) => (k === 0 ? 'just the origin' : k === d ? (d === 2 ? 'the whole plane' : 'all of ℝ³') : k === 1 ? 'a line' : 'a plane')
  const CARDS: { color: string; name: string; sym: string; side: string; gloss: string; body: ReactNode; k: number; d: number; pane: string }[] = [
    {
      color: ROW, name: 'Row space', sym: 'Row(A) ⊆ ℝⁿ', side: 'input side', gloss: '“what A listens to”', k: rank, d: n, pane: 'left',
      body: <>The span of A's rows. This is the only part of the input that reaches the output: Ax = A·x_row, so two
        inputs with the same row-space part produce <i>exactly</i> the same Ax. Spanned by <b style={{ color: PAIR[0] }}>v₁</b>{rank > 1 && <>…<b style={{ color: PAIR[1] }}>v{SUBS[rank]}</b></>}.</>,
    },
    {
      color: NUL, name: 'Null space', sym: 'Null(A) ⊆ ℝⁿ', side: 'input side', gloss: '“what A ignores”', k: n - rank, d: n, pane: 'left',
      body: <>Every input that A flattens to zero: Ax = 0. Adding any null vector to x moves x without moving Ax —
        the map is blind to these directions. Spanned by the vᵢ whose σᵢ = 0{rank < n ? <> (here v{SUBS[rank + 1]}{n - rank > 1 ? `, v${SUBS[n]}` : ''})</> : ' — none here: A keeps everything'}.</>,
    },
    {
      color: COL, name: 'Column space', sym: 'Col(A) ⊆ ℝᵐ', side: 'output side', gloss: '“what A can produce”', k: rank, d: m, pane: 'right',
      body: <>The span of A's columns. Every output Ax lands in here, no matter what x you feed in. If a target b lies
        outside it, Ax = b has <i>no</i> solution — the best you can do is project b onto this set (least squares).
        Spanned by <b style={{ color: PAIR[0] }}>u₁</b>{rank > 1 && <>…<b style={{ color: PAIR[1] }}>u{SUBS[rank]}</b></>}.</>,
    },
    {
      color: LNUL, name: 'Left null space', sym: 'Null(Aᵀ) ⊆ ℝᵐ', side: 'output side', gloss: '“what A can never produce”', k: m - rank, d: m, pane: 'right',
      body: <>The output directions perpendicular to every column. No input maps even partly into here — the component
        of a target b along this space is the unavoidable residual error of least squares. Spanned by the leftover
        uᵢ{m - rank > 0 ? <> (here u{SUBS[rank + 1]}{m - rank > 1 ? `, u${SUBS[m]}` : ''})</> : ' — none here: A reaches everything'}.</>,
    },
  ]

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Four fundamental subspaces &amp; the SVD</div>
          <div className="lifsim-sub">
            A maps the input space ℝⁿ (left) to the output space ℝᵐ (right). The SVD A = UΣVᵀ splits both:{' '}
            <b style={{ color: ROW }}>Row(A)</b> ⊥ <b style={{ color: NUL }}>Null(A)</b> on the input side,{' '}
            <b style={{ color: COL }}>Col(A)</b> ⊥ <b style={{ color: LNUL }}>Null(Aᵀ)</b> on the output side, and{' '}
            <b style={{ color: PAIR[0] }}>v₁ ↦ σ₁u₁</b>, <b style={{ color: PAIR[1] }}>v₂ ↦ σ₂u₂</b> connect them. The rainbow
            dots show where each point of the unit circle lands. <b>Drag x</b>, press <b>▶ orbit</b>, edit A — and try a{' '}
            <b>rank 1 ⚠</b> preset to watch a null space appear.
          </div>
        </div>
        <div className="lifsim-headright">
          <button className="lifsim-expand" onClick={toggleAnim}>{anim ? '⏸ stop' : '▶ orbit x'}</button>
          <button className="lifsim-expand" onClick={randomA}>↻ random A</button>
        </div>
      </div>

      <div className="cl-addbar">
        <span className="wav-modelabel">shape m×n</span>
        {SHAPES.map((sh) => (
          <button key={sh} className={`wav-modebtn${shape === sh ? ' on' : ''}`} onClick={() => loadShape(sh)}>
            {sh}{sh === '3×2' ? ' · ℝ²→ℝ³' : sh === '2×3' ? ' · ℝ³→ℝ²' : ''}
          </button>
        ))}
        <span className="wav-modelabel" style={{ marginLeft: 12 }}>presets</span>
        {PRESETS[shape].map((p) => (
          <button key={p.name} className="cl-addbtn" onClick={() => setA(p.A.map((r) => [...r]))}>{p.name}</button>
        ))}
      </div>

      <div className="ssl-row">
        <div className="ssl-mat">
          <span className="ssl-matlabel">A =</span>
          <div className="ssl-matrix" style={{ gridTemplateColumns: `repeat(${n}, auto)` }}>
            {A.map((row, i) => row.map((v, j) => (
              <input key={`${i}-${j}`} type="number" step={0.1} value={v} onChange={(e) => setEntry(i, j, +e.target.value || 0)} />
            )))}
          </div>
        </div>
        <pre className="ssl-pre">
          {`U (${m}×${m})`.padEnd(blocks[0][0].length + 2) + `Σ (${m}×${n})`.padEnd(blocks[1][0].length + 2) + `Vᵀ (${n}×${n})\n`}
          {svdText}
        </pre>
        <div className="ssl-svd">
          <div>σ₁ = <b>{S[0].toFixed(2)}</b> · σ₂ = <b>{(S[1] ?? 0).toFixed(2)}</b> · rank r = <b>{rank}</b>{det !== null && <> · det A = <b>{det.toFixed(2)}</b> (area ×{Math.abs(det).toFixed(2)} = σ₁σ₂)</>}</div>
          <div>ℝⁿ: dim <span style={{ color: ROW }}>Row(A)</span> = {rank}, dim <span style={{ color: NUL }}>Null(A)</span> = {n - rank} → {rank} + {n - rank} = {n} ✓</div>
          <div>ℝᵐ: dim <span style={{ color: COL }}>Col(A)</span> = {rank}, dim <span style={{ color: LNUL }}>Null(Aᵀ)</span> = {m - rank} → {rank} + {m - rank} = {m} ✓</div>
          {nearlySingular && <div style={{ color: LNUL }}>⚠ σ{SUBS[rank]} ≪ σ₁: nearly rank-deficient — the ellipse is almost flat</div>}
        </div>
      </div>

      <div className="lifsim-grid">
        <div className="lifsim-cell">
          <div className="lifsim-cap">Input space ℝ{n === 2 ? '²' : '³'} — x lives here · {n === 2 ? 'drag anywhere to move x' : 'drag to rotate, sliders move x'}</div>
          <canvas ref={domRef} className="lifsim-canvas" style={{ height: 340, touchAction: 'none', cursor: n === 2 ? 'crosshair' : 'grab' }}
            onPointerDown={onDown('dom')} onPointerMove={onMove} onPointerUp={onUp} />
          <div className="ssl-legend">
            {chip(ROW, 'row space')}{chip(NUL, 'null space')}{chip(PAIR[0], 'v₁')}{n > 2 || rank > 1 ? chip(pairColor(1, rank), 'v₂') : null}{chip(CIRC, 'unit circle')}{chip(MAIN, 'x (input)')}
          </div>
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Output space ℝ{m === 2 ? '²' : '³'} — Ax lands here{m === 3 ? ' · drag to rotate' : ''}</div>
          <canvas ref={codRef} className="lifsim-canvas" style={{ height: 340, touchAction: 'none', cursor: m === 3 ? 'grab' : 'default' }}
            onPointerDown={onDown('cod')} onPointerMove={onMove} onPointerUp={onUp} />
          <div className="ssl-legend">
            {chip(COL, 'column space')}{chip(LNUL, 'left null space')}{chip(PAIR[0], 'σ₁u₁')}{rank > 1 ? chip(PAIR[1], 'σ₂u₂') : null}{chip(CIRC, 'image ellipse')}{chip(MAIN, 'Ax (output)')}
          </div>
        </div>
      </div>

      <div className="ssl-cards">
        {CARDS.map((cd) => (
          <div key={cd.name} className="ssl-card" style={{ borderLeftColor: cd.color }}>
            <div className="ssl-card-h">
              <span style={{ color: cd.color }}>{cd.name}</span> <span className="ssl-card-sym">{cd.sym} · {cd.side}</span>
            </div>
            <div className="ssl-card-gloss" style={{ color: cd.color }}>{cd.gloss}</div>
            <p className="ssl-card-body">{cd.body}</p>
            <div className="ssl-card-live">in the {cd.pane} pane now: <b style={{ color: cd.color }}>{geom(cd.k, cd.d)}</b> · dim = {cd.k} of {cd.d}</div>
          </div>
        ))}
      </div>

      <div className="lifsim-controls">
        {Array.from({ length: n }, (_, i) => (
          <label key={i}>
            <span>
              c{SUBS[i + 1]} · along <i style={{ color: pairColor(i, rank) }}>v{SUBS[i + 1]}</i>{' '}
              <i style={{ color: i < rank ? ROW : NUL }}>({i < rank ? `survives ×σ${SUBS[i + 1]} = ${S[i].toFixed(2)}` : 'null space — annihilated'})</i>
              {' '}= {(c[i] ?? 0).toFixed(2)}
            </span>
            <input type="range" min={-2} max={2} step={0.05} value={c[i] ?? 0} style={{ accentColor: pairColor(i, rank) }}
              onChange={(e) => { animRef.current = false; setAnim(false); setCoeffs(c.map((v, k) => (k === i ? +e.target.value : v))) }} />
          </label>
        ))}
        <div className="ssl-eq">
          x = {Array.from({ length: n }, (_, i) => (
            <span key={i} style={{ color: pairColor(i, rank) }}>{i > 0 ? ' + ' : ''}{(c[i] ?? 0).toFixed(2)}·v{SUBS[i + 1]}</span>
          ))}{' '}&nbsp;⟼&nbsp; Ax = {rank === 0 ? '0' : Array.from({ length: rank }, (_, i) => (
            <span key={i} style={{ color: PAIR[i] }}>{i > 0 ? ' + ' : ''}{((c[i] ?? 0) * S[i]).toFixed(2)}·u{SUBS[i + 1]}</span>
          ))}
          {rank < n && <span style={{ color: NUL }}> &nbsp;— the v{SUBS[rank + 1]} part is annihilated (σ = 0)</span>}
        </div>
      </div>

      <div className="lifsim-explain">
        <p><b>What you're looking at.</b> The dashed circle on the left is the unit circle; A maps it to the dashed{' '}
          <b>ellipse</b> on the right, and the rainbow dots mark matching points — follow one color to see exactly where each
          input goes. The ellipse's semi-axes are the singular pairs: <span style={{ color: PAIR[0] }}>v₁ stretches by σ₁ onto u₁</span>,{' '}
          <span style={{ color: PAIR[1] }}>v₂ by σ₂ onto u₂</span>. The dashed parallelogram around x shows its coordinates in the
          v-basis; the matching parallelogram around Ax shows those same coordinates after each is scaled by its σᵢ —
          that <i>is</i> the SVD, vector by vector: Avᵢ = σᵢuᵢ.</p>
        <p><b>How the four spaces fit together.</b> The two input-side spaces are orthogonal and together fill ℝⁿ, so every
          input splits uniquely: x = <span style={{ color: ROW }}>x_row</span> + <span style={{ color: NUL }}>x_null</span>, of
          which only x_row matters. The two output-side spaces do the same for ℝᵐ. The SVD hands you orthonormal bases for all
          four at once — V = [v₁…v_r | rest] spans row space then null space, U = [u₁…u_r | rest] spans column space then left
          null space — and the dimension count r + (n−r) = n, r + (m−r) = m is the fundamental theorem of linear algebra.
          Restricted to Row(A) → Col(A), A is invertible: that's the part the pseudoinverse undoes.</p>
        <p><b>Try this.</b> (1) Press <b>▶ orbit x</b> and watch the rainbow correspondence directly. (2) Load <b>rank 1 ⚠</b>:
          the ellipse collapses to a segment, a pink <span style={{ color: NUL }}>null line</span> appears on the left and an amber{' '}
          <span style={{ color: LNUL }}>Null(Aᵀ)</span> line on the right — drag x along the pink line and Ax does not move at all.
          (3) Switch to <b>3×2</b>: Col(A) becomes a tilted <i>plane</i> in ℝ³ that Ax can never leave (that's why least squares
          projects onto it). (4) Switch to <b>2×3</b>: with n = 3 &gt; m a null line is unavoidable — slide c₃ and watch x move
          while Ax stays frozen. Derivations, the pseudoinverse and PCA are in the <b>∑ notes</b>.</p>
      </div>
    </div>
  )
}
