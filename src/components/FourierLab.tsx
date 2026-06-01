import { useEffect, useRef, useState, type MouseEvent } from 'react'

// Fourier epicycles. Any closed path is decomposed by the DFT into rotating
// vectors (epicycles); summing them reconstructs the path. Draw your own shape
// or pick a preset, and slide the number of terms to watch the approximation
// sharpen, the visual proof of the Fourier series.

type Cx = { re: number; im: number }
type Epi = { freq: number; amp: number; phase: number }

const NRES = 220 // points the path is resampled to

function resample(pts: [number, number][], n: number): [number, number][] {
  if (pts.length < 2) return pts
  const seg: number[] = [0]; let L = 0
  for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(L) }
  const out: [number, number][] = []
  for (let k = 0; k < n; k++) {
    const d = (k / n) * L; let j = 1; while (j < seg.length && seg[j] < d) j++
    const a = pts[j - 1], b = pts[Math.min(j, pts.length - 1)], t = seg[j] === seg[j - 1] ? 0 : (d - seg[j - 1]) / (seg[j] - seg[j - 1])
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

function dft(path: Cx[]): Epi[] {
  const N = path.length, out: Epi[] = []
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0
    for (let n = 0; n < N; n++) { const ph = (-2 * Math.PI * k * n) / N, c = Math.cos(ph), s = Math.sin(ph); re += path[n].re * c - path[n].im * s; im += path[n].re * s + path[n].im * c }
    re /= N; im /= N
    out.push({ freq: k <= N / 2 ? k : k - N, amp: Math.hypot(re, im), phase: Math.atan2(im, re) })
  }
  return out.sort((a, b) => b.amp - a.amp)
}

function preset(name: string, W: number, H: number): [number, number][] {
  const cx = W / 2, cy = H / 2, S = Math.min(W, H) * 0.34
  if (name === 'heart') {
    const p: [number, number][] = []
    for (let i = 0; i < NRES; i++) { const t = (i / NRES) * 2 * Math.PI; const x = 16 * Math.sin(t) ** 3; const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); p.push([cx + (x / 17) * S, cy - (y / 17) * S]) }
    return p
  }
  if (name === 'star') {
    const v: [number, number][] = []
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * 2 * Math.PI, r = i % 2 ? S * 0.42 : S; v.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
    v.push(v[0]); return resample(v, NRES)
  }
  // square
  const v: [number, number][] = [[cx - S, cy - S], [cx + S, cy - S], [cx + S, cy + S], [cx - S, cy + S], [cx - S, cy - S]]
  return resample(v, NRES)
}

export default function FourierLab() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [terms, setTerms] = useState(40)
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(true)
  const P = useRef({ terms, speed, running }); P.current = { terms, speed, running }

  const epis = useRef<Epi[]>([])
  const trail = useRef<[number, number][]>([])
  const tt = useRef(0)
  const drawing = useRef(false)
  const rawPts = useRef<[number, number][]>([])
  const loadRef = useRef<(n: string) => void>(() => {})

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv)

    const setPath = (pts: [number, number][]) => {
      const rs = resample(pts, NRES)
      let mx = 0, my = 0; rs.forEach((p) => { mx += p[0]; my += p[1] }); mx /= NRES; my /= NRES
      epis.current = dft(rs.map((p) => ({ re: p[0] - mx, im: p[1] - my })))
      ;(epis.current as any).center = [mx, my]; trail.current = []; tt.current = 0
    }
    loadRef.current = (n: string) => setPath(preset(n, cv.clientWidth, cv.clientHeight))
    loadRef.current('heart')

    let raf = 0
    const loop = () => {
      const W = cv.clientWidth, H = cv.clientHeight
      ctx.clearRect(0, 0, W, H)
      if (drawing.current) {
        ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2.5; ctx.beginPath()
        rawPts.current.forEach((p, i) => { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]) }); ctx.stroke()
        ctx.fillStyle = 'rgba(233,235,251,0.7)'; ctx.font = '13px monospace'; ctx.fillText('drawing… release to run the Fourier series', 14, 24)
        raf = requestAnimationFrame(loop); return
      }
      const E = epis.current, ctr = (E as any).center || [W / 2, H / 2]
      const K = Math.min(P.current.terms, E.length)
      let x = ctr[0], y = ctr[1]
      // epicycle chain
      for (let i = 0; i < K; i++) {
        const e = E[i], ang = 2 * Math.PI * e.freq * tt.current + e.phase
        const nx = x + e.amp * Math.cos(ang), ny = y + e.amp * Math.sin(ang)
        if (e.amp > 0.6) { ctx.strokeStyle = 'rgba(155,140,255,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, e.amp, 0, 2 * Math.PI); ctx.stroke() }
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke()
        x = nx; y = ny
      }
      // trail
      trail.current.push([x, y]); if (trail.current.length > NRES) trail.current.shift()
      ctx.strokeStyle = '#ff2d8f'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(255,45,143,0.6)'; ctx.shadowBlur = 6; ctx.beginPath()
      trail.current.forEach((p, i) => { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]) }); ctx.stroke(); ctx.shadowBlur = 0
      ctx.fillStyle = '#22e1ff'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 2 * Math.PI); ctx.fill()
      if (P.current.running) { tt.current += (P.current.speed) / NRES; if (tt.current >= 1) { tt.current -= 1; trail.current = [] } }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const pos = (e: MouseEvent<HTMLCanvasElement>) => { const r = cvRef.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as [number, number] }
  const onDown = (e: MouseEvent<HTMLCanvasElement>) => { drawing.current = true; rawPts.current = [pos(e)] }
  const onMove = (e: MouseEvent<HTMLCanvasElement>) => { if (drawing.current) rawPts.current.push(pos(e)) }
  const onUp = () => {
    if (!drawing.current) return
    drawing.current = false
    const pts = rawPts.current
    if (pts.length > 8) {
      const rs = resample(pts, NRES)
      let mx = 0, my = 0; rs.forEach((p) => { mx += p[0]; my += p[1] }); mx /= NRES; my /= NRES
      epis.current = dft(rs.map((p) => ({ re: p[0] - mx, im: p[1] - my })))
      ;(epis.current as any).center = [mx, my]; trail.current = []; tt.current = 0
    }
  }

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — Fourier epicycles</div>
          <div className="lifsim-sub">Any closed curve is a sum of rotating vectors (the <b>Fourier series</b>). The DFT finds each vector's frequency, size and phase; chained tip-to-tail, they retrace the shape. <b>Draw your own</b> on the canvas, or pick a preset, and slide the number of terms.</div>
        </div>
        <button className="lifsim-expand" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
      </div>

      <div className="wav-modes">
        <span className="wav-modelabel">shape</span>
        <button className="wav-modebtn" onClick={() => loadRef.current('heart')}>♥ heart</button>
        <button className="wav-modebtn" onClick={() => loadRef.current('star')}>★ star</button>
        <button className="wav-modebtn" onClick={() => loadRef.current('square')}>■ square</button>
        <span className="wav-modelabel" style={{ marginLeft: 8 }}>or draw on the canvas ✏️</span>
      </div>

      <div className="lifsim-cell lifsim-cell-wide">
        <canvas ref={cvRef} className="lifsim-canvas" style={{ height: 420, cursor: 'crosshair' }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} />
      </div>

      <div className="lifsim-controls">
        <label><span>number of terms = {terms} {terms <= 3 ? '· crude' : terms >= 120 ? '· near-perfect' : ''}</span>
          <input type="range" min={1} max={NRES} step={1} value={terms} onChange={(e) => setTerms(+e.target.value)} /></label>
        <label><span>speed = {speed.toFixed(1)}×</span>
          <input type="range" min={0.2} max={4} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> Drop the <b>number of terms</b> to 2–3: only the biggest, slowest circles remain, so the pink trace is a smooth blob that misses every corner. Raise it and finer, faster epicycles are added, sharpening the corners until the reconstruction is essentially exact, each term is one Fourier coefficient. Then <b>draw your own</b> squiggle and watch dozens of rotating vectors conspire to reproduce it. (Sharp corners need many high-frequency terms, the same reason a square wave needs an infinite series.)</p>
      </div>
    </div>
  )
}
