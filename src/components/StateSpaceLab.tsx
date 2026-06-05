import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { eig2, ctrb, obsv, rank, observerGain, ackermann, subM, mul, fmt, type Mat, type Cx } from './stateSpaceMath'

// Concept-first state-space lab: see the system, then the two questions —
// "can I steer it?" (controllability) and "can I see it?" (observability) — each
// with a live demo, then which control architectures (controller + observer) you
// can actually apply in that setting, shown working or failing.

type Sys = { A: Mat; B: Mat; C: Mat; name: string; tag: string }
const P: Sys[] = [
  { A: [[0, 1], [-2, -0.6]], B: [[0], [1]], C: [[1, 0]], name: 'healthy', tag: 'steerable AND visible' },
  { A: [[0, 1], [1, 0.2]], B: [[0], [1]], C: [[1, 0]], name: 'unstable plant', tag: 'open-loop unstable, but fixable' },
  { A: [[-1, 0], [0, -3]], B: [[1], [0]], C: [[1, 1]], name: 'can’t steer x₂', tag: 'NOT controllable' },
  { A: [[-1, 0], [0, 0]], B: [[1], [1]], C: [[1, 0]], name: 'can’t see x₂', tag: 'NOT observable' },
  { A: [[-1, 0], [0, -3]], B: [[1], [0]], C: [[1, 0]], name: 'neither', tag: 'NOT controllable, NOT observable' },
]
type Strat = { name: string; ctrl: 'none' | 'place'; obs: 'none' | 'lue'; tex: string; desc: string }
const STRAT: Strat[] = [
  { name: 'open loop', ctrl: 'none', obs: 'none', tex: 'u = 0', desc: 'No control — just the natural response. The baseline you’re trying to beat (on the unstable plant it runs away).' },
  { name: 'full-state feedback', ctrl: 'place', obs: 'none', tex: 'u = −K x', desc: 'Feed a gain back from every state directly. Simplest and fastest — but it assumes you can measure the whole state. Needs only controllability.' },
  { name: 'observer + feedback', ctrl: 'place', obs: 'lue', tex: 'u = −K x̂', desc: 'A Luenberger observer rebuilds the state from the output y; the controller acts on that estimate x̂. The realistic choice when you only measure y. Needs controllability + observability. Under noise, the optimal version of this same observer is the Kalman filter — it picks L automatically to balance trust in the model against trust in the measurement.' },
]

const MEdit = ({ M, set, cols }: { M: Mat; set: (m: Mat) => void; cols: number }) => (
  <span className="ss-edit" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {M.flatMap((row, i) => row.map((v, j) => <input key={`${i}-${j}`} type="number" step={0.1} value={v} onChange={(e) => { const m = M.map((r) => r.slice()); m[i][j] = +e.target.value; set(m) }} />))}
  </span>
)

// lazily-loaded KaTeX so the heavy library only loads when the demo is opened
function Tex({ tex }: { tex: string }) {
  const [html, setHtml] = useState('')
  useEffect(() => { let on = true; Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([k]) => { if (on) setHtml(k.default.renderToString(tex, { displayMode: true, throwOnError: false })) }); return () => { on = false } }, [tex])
  return <span className="ss-tex" dangerouslySetInnerHTML={{ __html: html }} />
}

// the controller (and observer) design equations for each architecture
const FORMULA: string[][] = [
  [String.raw`u = 0`],
  [String.raw`u = -K\,x`, String.raw`\text{pick } K:\ \operatorname{eig}(A-BK)=\text{desired poles}`, String.raw`K=\begin{bmatrix}0&\cdots&1\end{bmatrix}\mathcal{C}^{-1}\phi(A)\ \text{(Ackermann)}`],
  [String.raw`u=-K\,\hat{x}`, String.raw`\dot{\hat{x}}=A\hat{x}+Bu+L(y-C\hat{x})`, String.raw`\text{pick } L:\ \operatorname{eig}(A-LC)=\text{desired (faster)}`, String.raw`\text{(noise-optimal } L:\ \text{Kalman filter)}`],
]

export default function StateSpaceLab() {
  const [A, setA] = useState<Mat>(P[0].A)
  const [B, setB] = useState<Mat>(P[0].B)
  const [C, setC] = useState<Mat>(P[0].C)
  const [tag, setTag] = useState(P[0].tag)
  const [si, setSi] = useState(2)
  const [noise, setNoise] = useState(0)
  const [cp, setCp] = useState({ re: -1.75, im: 1.785 })   // desired controller pole (upper of the pair)
  const [op, setOp] = useState({ re: -5, im: 4 })           // desired observer pole
  const cc = useRef<HTMLCanvasElement>(null)
  const co = useRef<HTMLCanvasElement>(null)
  const cr = useRef<HTMLCanvasElement>(null)
  const sp = useRef<HTMLCanvasElement>(null)
  const drag = useRef<null | 'c' | 'o'>(null)

  const load = (s: Sys) => { setA(s.A.map((r) => r.slice())); setB(s.B.map((r) => r.slice())); setC(s.C.map((r) => r.slice())); setTag(s.tag) }

  const Wc = ctrb(A, B), Wo = obsv(A, C)
  const ctrlable = rank(Wc) === A.length, obsable = rank(Wo) === A.length
  const stratOk = (s: Strat) => (s.ctrl === 'none' || ctrlable) && (s.obs === 'none' || obsable)

  // chosen control architecture → gains K, L and whether it's valid here
  const des = useMemo(() => {
    const s = STRAT[si]
    const cPoles: Cx[] = [{ re: cp.re, im: cp.im }, { re: cp.re, im: -cp.im }]   // dragged controller pair
    const oPoles: Cx[] = [{ re: op.re, im: op.im }, { re: op.re, im: -op.im }]   // dragged observer pair
    let K = [0, 0]
    if (s.ctrl === 'place' && ctrlable) K = ackermann(A, [B[0][0], B[1][0]], cPoles)
    let L = [0, 0]
    if (s.obs === 'lue' && obsable) L = observerGain(A, C, oPoles)
    const usesObs = s.obs !== 'none'
    const clEig = (s.ctrl !== 'none' && ctrlable) ? eig2(subM(A, mul(B, [K]))) : eig2(A)
    const valid = stratOk(s)
    const reason = valid ? '' : ((s.ctrl !== 'none' && !ctrlable) ? 'needs controllability — the stuck mode can’t be steered, so K can’t place it' : 'needs observability — the hidden state can’t be rebuilt from y, so the observer fails')
    return { s, K, L, usesObs, clEig, valid, reason }
  }, [A, B, C, si, cp, op, ctrlable, obsable])

  // ---- draggable s-plane: desired controller / observer poles ----
  const placing = STRAT[si].ctrl === 'place'
  const SMIN = -7, SMAX = 1, WMAX = 4.6
  const pmap = () => { const cv = sp.current!, W = cv.clientWidth, H = cv.clientHeight, cy = H / 2; return { W, H, cy, X: (s: number) => (s - SMIN) / (SMAX - SMIN) * W, Y: (w: number) => cy - w / WMAX * (cy - 12), iX: (px: number) => SMIN + px / W * (SMAX - SMIN), iY: (py: number) => (cy - py) / (cy - 12) * WMAX } }
  const onDown = (e: PointerEvent) => {
    const cv = sp.current!; const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, m = pmap()
    const dC = Math.min(Math.hypot(px - m.X(cp.re), py - m.Y(cp.im)), Math.hypot(px - m.X(cp.re), py - m.Y(-cp.im)))
    const showObs = STRAT[si].obs === 'lue'
    const dO = showObs ? Math.min(Math.hypot(px - m.X(op.re), py - m.Y(op.im)), Math.hypot(px - m.X(op.re), py - m.Y(-op.im))) : Infinity
    if (Math.min(dC, dO) < 22) { drag.current = dO < dC ? 'o' : 'c'; cv.setPointerCapture(e.pointerId); onMove(e) }
  }
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return; const cv = sp.current!; const r = cv.getBoundingClientRect(), m = pmap()
    const re = Math.max(-6.5, Math.min(0.6, m.iX(e.clientX - r.left))), im = Math.max(0, Math.min(WMAX - 0.2, Math.abs(m.iY(e.clientY - r.top))))
    if (drag.current === 'c') setCp({ re, im }); else setOp({ re, im })
  }
  const onUp = () => { drag.current = null }

  useEffect(() => {
    const cv = sp.current; if (!cv || !placing) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const robs = new ResizeObserver(() => { fit(); draw() }); robs.observe(cv)
    const showObs = STRAT[si].obs === 'lue'
    const draw = () => {
      const { W, H, cy, X, Y } = pmap(); ctx.clearRect(0, 0, W, H)
      const x0 = X(0)
      ctx.fillStyle = 'rgba(84,230,160,0.06)'; ctx.fillRect(0, 0, x0, H); ctx.fillStyle = 'rgba(255,107,107,0.07)'; ctx.fillRect(x0, 0, W - x0, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
      for (let s = SMIN; s <= SMAX; s++) { const x = X(s); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let w = -4; w <= 4; w += 2) { const y = Y(w); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke()
      ctx.fillStyle = 'rgba(215,218,230,0.55)'; ctx.font = '9px monospace'; ctx.textAlign = 'left'; ctx.fillText('σ (decay) →', W - 70, cy - 4); ctx.fillText('jω', x0 + 4, 11)
      // open-loop poles ×
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.4
      for (const e of eig2(A)) { const x = X(Math.max(SMIN, Math.min(SMAX, e.re))), y = Y(Math.max(-WMAX, Math.min(WMAX, e.im))); ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke() }
      const dot = (re: number, im: number, col: string) => { for (const s of (im < 0.04 ? [0] : [1, -1])) { const y = Y(s * im); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(re), y, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#0c0d1e'; ctx.lineWidth = 1.4; ctx.stroke() } }
      if (showObs) dot(op.re, op.im, '#9b8cff')
      dot(cp.re, cp.im, '#22e1ff')
      ctx.fillStyle = '#22e1ff'; ctx.font = '10px monospace'; ctx.fillText('● drag: closed-loop poles', 8, H - 20)
      if (showObs) { ctx.fillStyle = '#9b8cff'; ctx.fillText('● drag: observer poles', 8, H - 7) }
      else { ctx.fillStyle = 'rgba(215,218,230,0.5)'; ctx.fillText('× open-loop poles', 8, H - 7) }
    }
    draw(); return () => robs.disconnect()
  }, [cp, op, si, A, placing])

  // ---- controllability demo ----
  useEffect(() => {
    const cv = cc.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const robs = new ResizeObserver(fit); robs.observe(cv)
    let raf = 0, u = 0, x = [0, 0] as number[]; const path: number[][] = []
    const b = [B[0][0], B[1][0]], Ab = [A[0][0] * b[0] + A[0][1] * b[1], A[1][0] * b[0] + A[1][1] * b[1]], full = ctrlable
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, S = Math.min(W, H) / 7, cx = W / 2, cy = H / 2
      const X = (v: number) => cx + v * S, Y = (v: number) => cy - v * S
      ctx.clearRect(0, 0, W, H)
      if (full) { ctx.fillStyle = 'rgba(84,230,160,0.07)'; ctx.fillRect(0, 0, W, H) }
      else { const n = Math.hypot(b[0], b[1]) || 1, d = [b[0] / n, b[1] / n]; ctx.strokeStyle = 'rgba(84,230,160,0.5)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(-d[0] * 6), Y(-d[1] * 6)); ctx.lineTo(X(d[0] * 6), Y(d[1] * 6)); ctx.stroke(); ctx.lineCap = 'butt' }
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
      ctx.fillStyle = 'rgba(215,218,230,0.6)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.fillText('x₁ →', W - 34, cy - 5); ctx.fillText('x₂ ↑', cx + 5, 12)
      u += (Math.random() - 0.5) * 0.6 - u * 0.05; const dt = 0.03
      const dx = [A[0][0] * x[0] + A[0][1] * x[1] + b[0] * u, A[1][0] * x[0] + A[1][1] * x[1] + b[1] * u]
      x = [x[0] + dx[0] * dt, x[1] + dx[1] * dt]; if (Math.hypot(x[0], x[1]) > 6) x = [0, 0]
      path.push(x.slice()); if (path.length > 220) path.shift()
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 1.6; ctx.beginPath(); path.forEach((p, i) => { i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])) }); ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(x[0]), Y(x[1]), 4, 0, 7); ctx.fill()
      const arr = (vx: number, vy: number, col: string, lab: string) => { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X(vx), Y(vy)); ctx.stroke(); ctx.beginPath(); ctx.arc(X(vx), Y(vy), 3, 0, 7); ctx.fill(); ctx.font = '10px monospace'; ctx.fillText(lab, X(vx) + 4, Y(vy) - 2) }
      arr(b[0], b[1], '#ff2d8f', 'B'); arr(Ab[0], Ab[1], '#9b8cff', 'AB')
      ctx.fillStyle = full ? '#54e6a0' : '#ff6b6b'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left'
      ctx.fillText(full ? 'reaches the WHOLE plane' : 'trapped on this one line', 8, H - 8)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw); return () => { cancelAnimationFrame(raf); robs.disconnect() }
  }, [A, B, ctrlable])

  // ---- observability demo ----
  useEffect(() => {
    const cv = co.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const robs = new ResizeObserver(fit); robs.observe(cv)
    let raf = 0, x = [1, 1] as number[], xh = [0, 0] as number[], t = 0; const hist: { t: number; x2: number; xh2: number; y: number }[] = []
    const L = obsable ? observerGain(A, C, [{ re: -3, im: 0 }, { re: -4, im: 0 }]) : [1.5, 0]; const WIN = 10
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, dt = 0.02
      for (let k = 0; k < 2; k++) {
        const y = C[0][0] * x[0] + C[0][1] * x[1], yh = C[0][0] * xh[0] + C[0][1] * xh[1]
        const dx = [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]]
        const dxh = [A[0][0] * xh[0] + A[0][1] * xh[1] + L[0] * (y - yh), A[1][0] * xh[0] + A[1][1] * xh[1] + L[1] * (y - yh)]
        x = [x[0] + dx[0] * dt, x[1] + dx[1] * dt]; xh = [xh[0] + dxh[0] * dt, xh[1] + dxh[1] * dt]; t += dt
        hist.push({ t, x2: x[1], xh2: xh[1], y }); while (hist.length && hist[0].t < t - WIN) hist.shift()
        if (Math.abs(x[0]) + Math.abs(x[1]) < 0.04 && Math.abs(x[1] - xh[1]) < 0.04 && t > 1) { x = [1, 1]; xh = [0, 0] }
        if (Math.max(Math.abs(x[1]), Math.abs(xh[1])) > 60) { x = [1, 1]; xh = [0, 0] }
      }
      ctx.clearRect(0, 0, W, H); const mid = H / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; for (let g = 0; g <= 4; g++) { const yy = (g / 4) * H; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke() }
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()
      let m = 1.2; for (const h of hist) m = Math.max(m, Math.abs(h.x2), Math.abs(h.xh2), Math.abs(h.y)); m *= 1.1
      const X = (tt: number) => ((tt - (t - WIN)) / WIN) * W, Y = (v: number) => mid - (v / m) * (mid - 10)
      const ln = (sel: (h: typeof hist[0]) => number, col: string, dash: number[]) => { ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.setLineDash(dash); ctx.beginPath(); hist.forEach((h, i) => { i ? ctx.lineTo(X(h.t), Y(sel(h))) : ctx.moveTo(X(h.t), Y(sel(h))) }); ctx.stroke(); ctx.setLineDash([]) }
      ln((h) => h.y, 'rgba(34,225,255,0.5)', []); ln((h) => h.x2, '#54e6a0', []); ln((h) => h.xh2, '#ffb84d', [5, 3])
      ctx.fillStyle = 'rgba(215,218,230,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.fillText('— y measured   — true hidden x₂   ╌ observer guess', 8, 13)
      ctx.fillStyle = obsable ? '#54e6a0' : '#ff6b6b'; ctx.font = 'bold 11px monospace'; ctx.fillText(obsable ? 'guess locks onto the hidden state' : 'guess never finds the hidden state', 8, H - 8)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw); return () => { cancelAnimationFrame(raf); robs.disconnect() }
  }, [A, C, obsable])

  // ---- apply-it bench: the selected architecture, working or failing ----
  useEffect(() => {
    const cv = cr.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const robs = new ResizeObserver(fit); robs.observe(cv)
    let raf = 0, x = [1, 0.4] as number[], xh = [0, 0] as number[], t = 0
    const hist: { t: number; x1: number; xh1: number; u: number }[] = []
    const { K, L, s, usesObs } = des; const WIN = 8
    const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.5
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, dt = 0.02
      for (let k = 0; k < 2; k++) {
        const u = s.ctrl === 'none' ? 0 : -(usesObs ? K[0] * xh[0] + K[1] * xh[1] : K[0] * x[0] + K[1] * x[1])
        const w = usesObs ? noise * gauss() : 0, v = usesObs ? noise * gauss() : 0
        const y = C[0][0] * x[0] + C[0][1] * x[1] + v, yh = C[0][0] * xh[0] + C[0][1] * xh[1]
        const dx = [A[0][0] * x[0] + A[0][1] * x[1] + B[0][0] * u, A[1][0] * x[0] + A[1][1] * x[1] + B[1][0] * u + w]
        const dxh = [A[0][0] * xh[0] + A[0][1] * xh[1] + B[0][0] * u + L[0] * (y - yh), A[1][0] * xh[0] + A[1][1] * xh[1] + B[1][0] * u + L[1] * (y - yh)]
        x = [x[0] + dx[0] * dt, x[1] + dx[1] * dt]; xh = [xh[0] + dxh[0] * dt, xh[1] + dxh[1] * dt]; t += dt
        hist.push({ t, x1: x[0], xh1: xh[0], u }); while (hist.length && hist[0].t < t - WIN) hist.shift()
        if (Math.hypot(x[0], x[1]) < 0.02 && Math.abs(x[0] - xh[0]) < 0.03 && t > 1.6) { x = [1, 0.4]; xh = [0, 0] }
        if (Math.hypot(x[0], x[1]) > 80) { x = [1, 0.4]; xh = [0, 0]; t = Math.max(t, WIN) }
      }
      ctx.clearRect(0, 0, W, H); const mid = H / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; for (let g = 0; g <= 4; g++) { const yy = (g / 4) * H; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke() }
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()
      let m = 1.2; for (const h of hist) m = Math.max(m, Math.abs(h.x1), Math.abs(h.u)); m = Math.min(m * 1.1, 8)
      const X = (tt: number) => ((tt - (t - WIN)) / WIN) * W, Y = (v: number) => mid - (Math.max(-m, Math.min(m, v)) / m) * (mid - 10)
      const ln = (sel: (h: typeof hist[0]) => number, col: string, w: number, dash: number[] = []) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath(); hist.forEach((h, i) => { i ? ctx.lineTo(X(h.t), Y(sel(h))) : ctx.moveTo(X(h.t), Y(sel(h))) }); ctx.stroke(); ctx.setLineDash([]) }
      ln((h) => h.u, 'rgba(255,184,77,0.6)', 1.4)
      if (usesObs) ln((h) => h.xh1, '#9b8cff', 1.6, [5, 3])
      ln((h) => h.x1, '#22e1ff', 2)
      ctx.fillStyle = 'rgba(215,218,230,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'
      ctx.fillText('— state x₁' + (usesObs ? '   ╌ estimate x̂₁' : '   (using the true state)') + '   — control u', 8, 13)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw); return () => { cancelAnimationFrame(raf); robs.disconnect() }
  }, [des, noise, A, B, C])

  const eigStr = eig2(A).map((e) => (Math.abs(e.im) < 1e-6 ? e.re.toFixed(1) : `${e.re.toFixed(1)}${e.im < 0 ? '−' : '+'}${Math.abs(e.im).toFixed(1)}j`)).join(',  ')

  return (
    <div className="lifsim panel ss">
      <div className="lifsim-head"><div>
        <div className="lifsim-title">Controllability, observability &amp; state feedback</div>
        <div className="lifsim-sub">Hidden internal states x₁, x₂. Two yes/no questions decide what control is possible — can the input <b>steer</b> every state, and can you <b>see</b> every state from the measurement — and those answers tell you which controller + observer you can actually build. Pick an example and watch.</div>
      </div></div>

      <div className="ss-sysbar">
        <span className="wav-modelabel">example</span>
        {P.map((s) => <button key={s.name} className={`wav-modebtn${s.tag === tag ? ' on' : ''}`} onClick={() => load(s)}>{s.name}</button>)}
        <div className="ss-sys">
          <label>ẋ&nbsp;=&nbsp;<b>A</b><MEdit M={A} set={setA} cols={2} />x&nbsp;+&nbsp;<b>B</b><MEdit M={B} set={setB} cols={1} />u</label>
          <label>y&nbsp;=&nbsp;<b>C</b><MEdit M={C} set={setC} cols={2} />x</label>
          <span className="ss-tag">poles {eigStr}</span>
        </div>
      </div>

      <div className="ss-concepts">
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">Can I steer it?</span> <b>Controllability</b></div>
          <p className="ss-def">The input only pushes the state along <b style={{ color: '#ff2d8f' }}>B</b> and (after the dynamics) <b style={{ color: '#9b8cff' }}>AB</b>, so the state only wanders the <b style={{ color: '#54e6a0' }}>green region they span</b>. Whole plane → drive it anywhere; a line → one direction is out of reach.</p>
          <canvas ref={cc} className="ss-canvas" />
          <div className={`ss-implic ${ctrlable ? 'ok' : 'bad'}`}><b>{ctrlable ? '✓ Controllable.' : '⚠ Not controllable.'}</b>{ctrlable ? ' A controller K can place the poles anywhere.' : ' No K can move the trapped mode.'}</div>
        </div>
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">Can I see it?</span> <b>Observability</b></div>
          <p className="ss-def">You only measure <b style={{ color: '#22e1ff' }}>y</b>. An <b>observer</b> watches y and reconstructs the hidden state <b style={{ color: '#54e6a0' }}>x₂</b> (its <b style={{ color: '#ffb84d' }}>dashed</b> guess). Every state visible in y → the guess catches up; a hidden state → it’s blind.</p>
          <canvas ref={co} className="ss-canvas" />
          <div className={`ss-implic ${obsable ? 'ok' : 'bad'}`}><b>{obsable ? '✓ Observable.' : '⚠ Not observable.'}</b>{obsable ? ' An observer can rebuild the full state from y.' : ' No observer can recover the hidden mode.'}</div>
        </div>
      </div>

      {/* which architectures */}
      <div className="ss-payoff">
        <div className="ss-conh"><span className="ss-q">Which feedback can you build?</span></div>
        <div className="ss-fb">
          <div className="ss-fbrow"><span className="ss-fbk" style={{ color: '#22e1ff' }}>u = −K x</span><span className="ss-fbn">full-state feedback — wire a gain to every state</span><span className="ss-fbr">needs <b>controllable</b> + you measure every state</span></div>
          <div className="ss-fbrow"><span className="ss-fbk" style={{ color: '#9b8cff' }}>u = −K x̂</span><span className="ss-fbn">output feedback — an observer rebuilds the state from y</span><span className="ss-fbr">needs <b>controllable + observable</b>, only y measured</span></div>
        </div>
        <div className="ss-quad">
          {[
            { c: true, o: true, t: 'steerable & visible', d: 'Both work. Place any poles, and run it from y alone.' },
            { c: false, o: true, t: 'can’t steer one mode', d: 'You can see everything, but feedback can’t move the stuck mode.' },
            { c: true, o: false, t: 'can’t see one mode', d: 'Full-state works if you measure every state; you can’t build the observer.' },
            { c: false, o: false, t: 'neither', d: 'Only the steerable-and-visible part responds to feedback.' },
          ].map((q, i) => {
            const here = q.c === ctrlable && q.o === obsable
            return <div key={i} className={`ss-quadcell${here ? ' here' : ''}`}>
              <div className="ss-quadt"><span className={`ss-dot ${q.c ? 'ok' : 'bad'}`} title="steer" /><span className={`ss-dot ${q.o ? 'ok' : 'bad'}`} title="see" /><b>{q.t}</b>{here && <span className="ss-here">you</span>}</div>
              <div className="ss-quadd">{q.d}</div>
            </div>
          })}
        </div>
      </div>

      {/* apply it */}
      <div className="ss-payoff">
        <div className="ss-conh"><span className="ss-q">Apply it</span> <b>which controller + observer actually works here?</b></div>
        <p className="ss-def">Each architecture is a controller paired with (or without) an observer. The dot on each tab says whether it’s valid for the current system; the plot shows it run — succeeding, or failing.</p>
        <div className="ss-bench">
          <div className="ss-benchctl">
            <div className="ss-scn">{STRAT.map((s, i) => <button key={s.name} className={`wav-modebtn${si === i ? ' on' : ''}`} onClick={() => setSi(i)}><span className={`ss-dot ${stratOk(s) ? 'ok' : 'bad'}`} />{s.name}</button>)}</div>
            <div className={`ss-scnwhat ${des.valid ? '' : 'bad'}`}>
              <div className="ss-scnwhat-h">{des.s.name}</div>
              {des.s.desc} {!des.valid && <b className="ss-x"> ✗ not valid here — {des.reason}.</b>}
              {des.valid && des.s.ctrl === 'none' && <b> {eig2(A).some((e) => e.re > 1e-6) ? '→ this plant runs away on its own.' : '→ the natural response, no control.'}</b>}
            </div>
            {placing && <div className="ss-plane-wrap">
              <canvas ref={sp} className="ss-plane" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
              <div className="ss-planehint">drag the poles → K {STRAT[si].obs === 'lue' ? '& L ' : ''}and the trajectories update. Left = faster · near the jω axis = slow/ringy · right = unstable.</div>
            </div>}
            <div className="ss-formula">{FORMULA[si].map((f, k) => <Tex key={k} tex={f} />)}</div>
            {des.usesObs && des.valid && <label className="ss-rng">measurement noise <input type="range" min={0} max={0.6} step={0.02} value={noise} onChange={(e) => setNoise(+e.target.value)} /><b>{noise.toFixed(2)}</b></label>}
            <div className="ss-metrics">
              {des.s.ctrl !== 'none' && ctrlable && <span>controller K = [{fmt(des.K[0])}, {fmt(des.K[1])}]</span>}
              {des.usesObs && obsable && <span>observer L = [{fmt(des.L[0])}, {fmt(des.L[1])}]ᵀ</span>}
              {des.s.ctrl !== 'none' && ctrlable && <span>closed-loop poles: {des.clEig.map((e, i) => <b key={i} className={e.re > 1e-6 ? 'bad' : 'ok'}>{Math.abs(e.im) < 1e-6 ? fmt(e.re) : `${fmt(e.re)}${e.im < 0 ? '−' : '+'}${fmt(Math.abs(e.im))}j`}{i ? '' : ', '}</b>)}</span>}
            </div>
          </div>
          <canvas ref={cr} className="ss-canvas ss-benchcv" />
        </div>
      </div>
    </div>
  )
}
