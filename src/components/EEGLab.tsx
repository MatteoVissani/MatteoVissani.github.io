import { useEffect, useRef, useState, type MouseEvent } from 'react'

// EEG source localization (illustrative 2-D head). One or more cortical dipoles
// produce a voltage at a 10–20 electrode montage (volume conduction = spatial
// mixing); the measurements are interpolated into a topographic scalp map, and
// a single-dipole inverse tries to localize the activity.

const EPS = 0.0035
const ELEC: { n: string; x: number; y: number }[] = [
  { n: 'Fp1', x: -0.31, y: 0.95 }, { n: 'Fp2', x: 0.31, y: 0.95 },
  { n: 'F7', x: -0.81, y: 0.59 }, { n: 'F3', x: -0.41, y: 0.61 }, { n: 'Fz', x: 0, y: 0.63 }, { n: 'F4', x: 0.41, y: 0.61 }, { n: 'F8', x: 0.81, y: 0.59 },
  { n: 'T7', x: -1, y: 0 }, { n: 'C3', x: -0.5, y: 0 }, { n: 'Cz', x: 0, y: 0 }, { n: 'C4', x: 0.5, y: 0 }, { n: 'T8', x: 1, y: 0 },
  { n: 'P7', x: -0.81, y: -0.59 }, { n: 'P3', x: -0.41, y: -0.61 }, { n: 'Pz', x: 0, y: -0.63 }, { n: 'P4', x: 0.41, y: -0.61 }, { n: 'P8', x: 0.81, y: -0.59 },
  { n: 'O1', x: -0.31, y: -0.95 }, { n: 'O2', x: 0.31, y: -0.95 },
]
const NE = ELEC.length
type Src = { x: number; y: number; ori: number }

const dipole = (qx: number, qy: number, s: Src) => { const dx = qx - s.x, dy = qy - s.y; return (Math.cos(s.ori) * dx + Math.sin(s.ori) * dy) / (dx * dx + dy * dy + EPS) }
function jet(u: number) { const c = (x: number) => Math.max(0, Math.min(1, x)); return [c(Math.min(4 * u - 1.5, -4 * u + 4.5)) * 255, c(Math.min(4 * u - 0.5, -4 * u + 3.5)) * 255, c(Math.min(4 * u + 0.5, -4 * u + 2.5)) * 255] }

export default function EEGLab() {
  const topoRef = useRef<HTMLCanvasElement>(null)
  const brainRef = useRef<HTMLCanvasElement>(null)
  const [sources, setSources] = useState<Src[]>([{ x: 0.45, y: 0.3, ori: Math.PI / 2 }])
  const [sel, setSel] = useState(0)
  const [nFit, setNFit] = useState(1)
  const [noise, setNoise] = useState(0.08)
  const [seed, setSeed] = useState(1)
  const [tick, setTick] = useState(0)
  const [err, setErr] = useState(0)
  const noiseVec = useRef<number[]>([])
  const drag = useRef(-1)
  const selSafe = Math.min(sel, sources.length - 1)

  useEffect(() => { noiseVec.current = Array.from({ length: NE }, () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }) }, [seed])

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1
    const head = (c: HTMLCanvasElement) => { const ctx = c.getContext('2d')!; c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const W = c.clientWidth, H = c.clientHeight, R = Math.min(W, H) * 0.40, cx = W / 2, cy = H / 2 + 6; return { ctx, W, H, R, cx, cy } }
    const outline = (ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 11, cy - R + 2); ctx.lineTo(cx, cy - R - 13); ctx.lineTo(cx + 11, cy - R + 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - R, cy, 9, Math.PI * 0.5, Math.PI * 1.5, true); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + R, cy, 9, Math.PI * 1.5, Math.PI * 0.5, true); ctx.stroke()
    }

    const y = ELEC.map((e, i) => sources.reduce((a, s) => a + dipole(e.x, e.y, s), 0) + noise * (noiseVec.current[i] || 0))
    const ymx = Math.max(...y.map(Math.abs)) || 1

    // greedy K-dipole inverse (sequential / matching-pursuit dipole fitting)
    const fits: [number, number][] = []
    const resid = y.slice()
    for (let k = 0; k < nFit; k++) {
      let best = Infinity, bx = 0, by = 0, bp0 = 0, bp1 = 0
      for (let gx = -0.85; gx <= 0.85; gx += 0.05) for (let gy = -0.85; gy <= 0.85; gy += 0.05) {
        if (gx * gx + gy * gy > 0.73) continue
        let a00 = 0, a01 = 0, a11 = 0, c0 = 0, c1 = 0
        for (let i = 0; i < NE; i++) { const dx = ELEC[i].x - gx, dy = ELEC[i].y - gy, r2 = dx * dx + dy * dy + EPS, a0 = dx / r2, a1 = dy / r2; a00 += a0 * a0; a01 += a0 * a1; a11 += a1 * a1; c0 += a0 * resid[i]; c1 += a1 * resid[i] }
        const det = a00 * a11 - a01 * a01; if (Math.abs(det) < 1e-9) continue
        const p0 = (a11 * c0 - a01 * c1) / det, p1 = (a00 * c1 - a01 * c0) / det
        let res = 0; for (let i = 0; i < NE; i++) { const dx = ELEC[i].x - gx, dy = ELEC[i].y - gy, r2 = dx * dx + dy * dy + EPS; res += (resid[i] - (dx * p0 + dy * p1) / r2) ** 2 }
        if (res < best) { best = res; bx = gx; by = gy; bp0 = p0; bp1 = p1 }
      }
      fits.push([bx, by])
      for (let i = 0; i < NE; i++) { const dx = ELEC[i].x - bx, dy = ELEC[i].y - by, r2 = dx * dx + dy * dy + EPS; resid[i] -= (dx * bp0 + dy * bp1) / r2 } // peel off this dipole
    }
    // recovery error: each true source to its nearest fitted dipole
    setErr((sources.reduce((a, s) => a + Math.min(...fits.map((f) => Math.hypot(f[0] - s.x, f[1] - s.y))), 0) / sources.length) * 85)

    // LEFT topoplot
    const tp = topoRef.current
    if (tp) {
      const { ctx, W, H, R, cx, cy } = head(tp); ctx.clearRect(0, 0, W, H)
      const G = 120, off = document.createElement('canvas'); off.width = G; off.height = G
      const octx = off.getContext('2d')!, img = octx.createImageData(G, G), BANDS = 12
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const nx = (i / G) * 2.2 - 1.1, ny = 1.1 - (j / G) * 2.2, o = (j * G + i) * 4
        if (nx * nx + ny * ny <= 1) { let num = 0, den = 0; for (let k = 0; k < NE; k++) { const w = 1 / ((ELEC[k].x - nx) ** 2 + (ELEC[k].y - ny) ** 2 + 0.02); num += w * y[k]; den += w } let u = Math.round(((num / den / ymx + 1) / 2) * BANDS) / BANDS; const [r, g, b] = jet(u); img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255 }
      }
      octx.putImageData(img, 0, 0)
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, cx - R, cy - R, 2 * R, 2 * R); ctx.restore()
      outline(ctx, cx, cy, R); ctx.font = '8px monospace'
      ELEC.forEach((e) => { const x = cx + e.x * R, yy = cy - e.y * R; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(x, yy, 3.2, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(e.n, x + 4, yy - 4) })
      ctx.fillStyle = 'rgba(233,235,251,0.75)'; ctx.font = '11px monospace'; ctx.fillText('scalp topography (measured EEG)', 8, 16)
    }
    // RIGHT brain
    const bc = brainRef.current
    if (bc) {
      const { ctx, W, H, R, cx, cy } = head(bc); ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(155,140,255,0.06)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill(); outline(ctx, cx, cy, R)
      ELEC.forEach((e) => { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(cx + e.x * R, cy - e.y * R, 2.2, 0, 2 * Math.PI); ctx.fill() })
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2.5; fits.forEach((f) => { ctx.beginPath(); ctx.arc(cx + f[0] * R, cy - f[1] * R, 9, 0, 2 * Math.PI); ctx.stroke() })
      sources.forEach((s, i) => {
        const x = cx + s.x * R, yy = cy - s.y * R
        ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.arc(x, yy, 9, 0, 2 * Math.PI); ctx.fill()
        if (i === selSafe) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + Math.cos(s.ori) * 18, yy - Math.sin(s.ori) * 18); ctx.stroke() }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText(`${i + 1}`, x, yy + 3.5); ctx.textAlign = 'left'
      })
      ctx.fillStyle = '#ff4d6d'; ctx.font = '11px monospace'; ctx.fillText('● dipole sources (drag)', 8, 16)
      ctx.fillStyle = '#22e1ff'; ctx.fillText(`○ ${nFit}-dipole fit`, 8, 32)
    }
  }, [sources, sel, nFit, noise, seed, tick, selSafe])

  useEffect(() => { const ro = new ResizeObserver(() => setTick((t) => t + 1));[topoRef, brainRef].forEach((r) => r.current && ro.observe(r.current)); return () => ro.disconnect() }, [])

  const toNorm = (e: MouseEvent<HTMLCanvasElement>) => { const c = brainRef.current!, r = c.getBoundingClientRect(), R = Math.min(c.clientWidth, c.clientHeight) * 0.40; return [(e.clientX - r.left - c.clientWidth / 2) / R, -(e.clientY - r.top - (c.clientHeight / 2 + 6)) / R] as [number, number] }
  const onDown = (e: MouseEvent<HTMLCanvasElement>) => { const [nx, ny] = toNorm(e); let bi = -1, bd = 0.2; sources.forEach((s, i) => { const d = Math.hypot(s.x - nx, s.y - ny); if (d < bd) { bd = d; bi = i } }); drag.current = bi; if (bi >= 0) setSel(bi) }
  const onMove = (e: MouseEvent<HTMLCanvasElement>) => { if (!(e.buttons & 1) || drag.current < 0) return; let [nx, ny] = toNorm(e); const d = Math.hypot(nx, ny); if (d > 0.85) { nx *= 0.85 / d; ny *= 0.85 / d }; const di = drag.current; setSources((arr) => arr.map((s, i) => (i === di ? { ...s, x: nx, y: ny } : s))) }
  const addSrc = () => setSources((arr) => { const ns = [...arr, { x: Math.random() * 1.0 - 0.5, y: Math.random() * 1.0 - 0.5, ori: Math.PI / 2 }]; setSel(ns.length - 1); return ns })
  const removeSrc = () => setSources((arr) => (arr.length > 1 ? arr.filter((_, i) => i !== selSafe) : arr))

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — EEG source localization</div>
          <div className="lifsim-sub">Cortical dipoles create a voltage at <b>every</b> scalp electrode (volume conduction = <b>spatial mixing</b>), interpolated into the topomap on the left. <b>Add several dipoles</b> and drag them on the right; the topomap sums them and a multi-dipole inverse (cyan rings) tries to localize the activity.</div>
        </div>
        <div className="lifsim-rate"><b>{err.toFixed(0)}</b><span>mm error</span></div>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip mag"><b>{sources.length}</b> dipole source{sources.length > 1 ? 's' : ''}</span>
        <span className="ilab-chip cy"><b>{err.toFixed(0)} mm</b> localization error</span>
        <span className="ilab-chip"><b>{((1 - Math.hypot(sources[selSafe]?.x || 0, sources[selSafe]?.y || 0)) * 85).toFixed(0)} mm</b> depth of #{selSafe + 1} below scalp</span>
        <span className="ilab-chip"><b>{NE}</b> electrodes (10–20)</span>
      </div>

      <div className="wav-modes">
        <span className="wav-modelabel">sources</span>
        <button className="wav-modebtn" onClick={addSrc}>＋ add dipole</button>
        <button className="wav-modebtn" onClick={removeSrc}>− remove #{selSafe + 1}</button>
        {sources.map((_, i) => <button key={i} className={`wav-modebtn${i === selSafe ? ' on' : ''}`} onClick={() => setSel(i)}>#{i + 1}</button>)}
      </div>

      <div className="wav-modes">
        <span className="wav-modelabel">fit with</span>
        {[1, 2, 3, 4].map((k) => <button key={k} className={`wav-modebtn${nFit === k ? ' on' : ''}`} onClick={() => setNFit(k)}>{k} dipole{k > 1 ? 's' : ''}</button>)}
      </div>

      <div className="lifsim-grid">
        <div className="lifsim-cell">
          <div className="lifsim-cap">Scalp topography (topoplot)</div>
          <canvas ref={topoRef} className="lifsim-canvas" style={{ height: 320 }} />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Brain, drag the red dipoles</div>
          <canvas ref={brainRef} className="lifsim-canvas" style={{ height: 320, cursor: 'crosshair' }}
            onMouseDown={onDown} onMouseMove={onMove} />
        </div>
      </div>

      <div className="lifsim-controls">
        <label><span>orientation of dipole #{selSafe + 1} = {Math.round((sources[selSafe]?.ori || 0) * 180 / Math.PI)}°</span>
          <input type="range" min={0} max={360} step={5} value={Math.round((sources[selSafe]?.ori || 0) * 180 / Math.PI)} onChange={(e) => { const o = (+e.target.value * Math.PI) / 180; setSources((arr) => arr.map((s, i) => (i === selSafe ? { ...s, ori: o } : s))) }} /></label>
        <label><span>sensor noise = {noise.toFixed(2)}</span>
          <input type="range" min={0} max={0.5} step={0.01} value={noise} onChange={(e) => setNoise(+e.target.value)} /></label>
        <button className="btn ghost lifsim-btn" onClick={() => setSeed((s) => s + 1)}>↻ new noise</button>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> With one dipole near the surface the topomap is focal and the cyan fit nails it. Click <b>＋ add dipole</b> to drop a second (and third) source and drag them apart: the topomap is now their <i>sum</i>. With <b>fit = 1 dipole</b> the inverse can't represent multiple generators, so the single cyan ring lands between them and the error jumps; raise <b>fit dipoles</b> to match the number of sources and the cyan rings <b>snap onto</b> the red sources (when they're well separated). Too many fit dipoles, deep sources, or high noise make the fit unstable. Drag a source <b>deep toward the centre</b> and the pattern smears out (deep sources are hard to localize); add <b>sensor noise</b> and the estimate jitters. This is exactly why the EEG inverse problem is <i>ill-posed</i> and real pipelines use many sensors, head models and regularization. Use the numbered buttons to select a source, then the slider sets its dipole orientation.</p>
      </div>
    </div>
  )
}
