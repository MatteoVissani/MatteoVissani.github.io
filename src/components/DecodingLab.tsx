import { useEffect, useRef, useState } from 'react'

// Population coding & neural decoding. A bank of Gaussian tuning curves over a
// stimulus s∈[0,180]° responds with Poisson spike counts; a maximum-likelihood
// decoder estimates s each trial. The lab compares the empirical decoding error
// with the Cramér–Rao bound 1/√J set by the Fisher information J(s).

function rndn() { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
function poisson(l: number) {
  if (l <= 0) return 0
  if (l > 30) return Math.max(0, Math.round(l + Math.sqrt(l) * rndn()))
  const L = Math.exp(-l); let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

export default function DecodingLab() {
  const tuneRef = useRef<HTMLCanvasElement>(null)
  const histRef = useRef<HTMLCanvasElement>(null)

  const [s, setS] = useState(90)       // true stimulus (deg)
  const [sigT, setSigT] = useState(20) // tuning width (deg)
  const [N, setN] = useState(20)       // number of neurons
  const [rmax, setRmax] = useState(25) // peak firing (spikes/trial)
  const [running, setRunning] = useState(true)
  const [stats, setStats] = useState({ J: 0, crb: 0, rmse: 0 })

  const P = useRef({ s, sigT, N, rmax, running }); P.current = { s, sigT, N, rmax, running }
  const statRef = useRef({ J: 0, crb: 0, rmse: 0 })

  useEffect(() => {
    const tc = tuneRef.current, hc = histRef.current
    if (!tc || !hc) return
    const tx = tc.getContext('2d')!, hx = hc.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const fit = (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    const fitAll = () => { fit(tc, tx); fit(hc, hx) }
    fitAll()
    const ro = new ResizeObserver(fitAll); ro.observe(tc); ro.observe(hc)

    const errors: number[] = []
    let raf = 0, frame = 0
    let lastR: number[] = [], lastShat = 90

    const loop = () => {
      const { s, sigT, N, rmax, running } = P.current
      const c = (i: number) => (i / (N - 1)) * 180
      const f = (sv: number, i: number) => 0.5 + rmax * Math.exp(-((sv - c(i)) ** 2) / (2 * sigT * sigT))
      if (running) {
        // one trial: Poisson counts
        const r = new Array(N); for (let i = 0; i < N; i++) r[i] = poisson(f(s, i))
        // maximum-likelihood decode over a 1° grid
        let best = -1e18, shat = 90
        for (let g = 0; g <= 180; g++) { let L = 0; for (let i = 0; i < N; i++) { const fi = f(g, i); L += r[i] * Math.log(fi) - fi } if (L > best) { best = L; shat = g } }
        // Fisher information (Poisson, Gaussian tuning): J = (1/σ⁴) Σ f_i (c_i-s)²
        let J = 0; for (let i = 0; i < N; i++) J += f(s, i) * (c(i) - s) ** 2; J /= sigT ** 4
        errors.push(shat - s); if (errors.length > 200) errors.shift()
        const rmse = Math.sqrt(errors.reduce((a, e) => a + e * e, 0) / errors.length)
        statRef.current = { J, crb: J > 0 ? 1 / Math.sqrt(J) : 99, rmse }
        lastR = r; lastShat = shat
      }
      // ---- tuning + population response ----
      const W = tc.clientWidth, H = tc.clientHeight
      const X = (sv: number) => (sv / 180) * W
      const top = rmax + 4, Y = (r: number) => H - (r / top) * (H - 8) - 4
      tx.clearRect(0, 0, W, H)
      tx.lineWidth = 1; tx.strokeStyle = 'rgba(155,140,255,0.35)'
      for (let i = 0; i < N; i++) { tx.beginPath(); for (let g = 0; g <= 180; g += 3) { const x = X(g), y = Y(f(g, i)); g ? tx.lineTo(x, y) : tx.moveTo(x, y) } tx.stroke() }
      // population response (noisy counts) as stems at preferred stimulus
      tx.strokeStyle = '#22e1ff'; tx.fillStyle = '#22e1ff'; tx.lineWidth = 2
      for (let i = 0; i < N; i++) { const x = X(c(i)), y = Y(lastR[i] ?? 0); tx.beginPath(); tx.moveTo(x, Y(0)); tx.lineTo(x, y); tx.stroke(); tx.beginPath(); tx.arc(x, y, 2.6, 0, 2 * Math.PI); tx.fill() }
      // true s (white) and decoded ŝ (pink)
      tx.strokeStyle = 'rgba(255,255,255,0.8)'; tx.setLineDash([4, 4]); tx.beginPath(); tx.moveTo(X(P.current.s), 0); tx.lineTo(X(P.current.s), H); tx.stroke()
      tx.strokeStyle = '#ff2d8f'; tx.beginPath(); tx.moveTo(X(lastShat), 0); tx.lineTo(X(lastShat), H); tx.stroke(); tx.setLineDash([])
      tx.fillStyle = 'rgba(255,255,255,0.8)'; tx.font = '11px monospace'; tx.fillText('s (true)', X(P.current.s) + 4, 14)
      tx.fillStyle = '#ff2d8f'; tx.fillText('ŝ (decoded)', X(lastShat) + 4, 30)
      // ---- error histogram + Cramér–Rao Gaussian ----
      const HW = hc.clientWidth, HH = hc.clientHeight, lim = 30, B = 31
      const bins = new Array(B).fill(0)
      errors.forEach((e) => { const b = Math.floor(((Math.max(-lim, Math.min(lim, e)) + lim) / (2 * lim)) * B); bins[Math.min(B - 1, b)]++ })
      const mx = Math.max(1, ...bins)
      hx.clearRect(0, 0, HW, HH)
      hx.fillStyle = 'rgba(34,225,255,0.35)'
      for (let k = 0; k < B; k++) { const x = (k / B) * HW, h = (bins[k] / mx) * (HH - 24); hx.fillRect(x + 1, HH - 18 - h, HW / B - 2, h) }
      // CRB gaussian overlay
      const crb = statRef.current.crb
      if (crb > 0 && crb < 60) {
        hx.strokeStyle = '#ff2d8f'; hx.lineWidth = 2; hx.beginPath()
        for (let xpx = 0; xpx <= HW; xpx += 2) { const e = (xpx / HW) * 2 * lim - lim; const g = Math.exp(-(e * e) / (2 * crb * crb)); const y = HH - 18 - g * (HH - 24); xpx ? hx.lineTo(xpx, y) : hx.moveTo(xpx, y) }
        hx.stroke()
      }
      hx.strokeStyle = 'rgba(255,255,255,0.5)'; hx.lineWidth = 1; hx.beginPath(); hx.moveTo(HW / 2, 0); hx.lineTo(HW / 2, HH - 18); hx.stroke()
      hx.fillStyle = 'rgba(233,235,251,0.6)'; hx.font = '10px monospace'; hx.fillText('−30°', 4, HH - 4); hx.fillText('decoding error  ŝ − s', HW / 2 - 52, HH - 4); hx.fillText('+30°', HW - 30, HH - 4)
      hx.fillStyle = '#ff2d8f'; hx.fillText('Cramér–Rao bound', 6, 14)
      frame++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const id = setInterval(() => setStats({ ...statRef.current }), 300)
    return () => { cancelAnimationFrame(raf); clearInterval(id); ro.disconnect() }
  }, [])

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — population coding &amp; neural decoding</div>
          <div className="lifsim-sub">A bank of tuning curves encodes a stimulus <i>s</i> with Poisson-noisy spike counts; a maximum-likelihood decoder reads it back each trial. The <b>Fisher information</b> <i>J(s)</i> sets the best-possible precision, the <b>Cramér–Rao bound</b> <i>1/√J</i>, compare it with the decoder’s actual error.</div>
        </div>
        <div className="lifsim-rate"><b>{stats.rmse.toFixed(1)}</b><span>° RMSE</span></div>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip"><b>{stats.J.toFixed(2)}</b> Fisher info J</span>
        <span className="ilab-chip cy"><b>{stats.crb.toFixed(1)}°</b> Cramér–Rao bound</span>
        <span className="ilab-chip mag"><b>{stats.rmse.toFixed(1)}°</b> decoding error (RMSE)</span>
      </div>

      <div className="lifsim-grid">
        <div className="lifsim-cell lifsim-cell-wide">
          <div className="lifsim-cap">Tuning curves <span className="sub">(violet)</span>, noisy population response <span className="sub">(cyan)</span>, true <span className="sub">s</span> &amp; decoded <span className="sub">ŝ</span></div>
          <canvas ref={tuneRef} className="lifsim-canvas lifsim-trace" />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Distribution of decoding error vs Cramér–Rao bound</div>
          <canvas ref={histRef} className="lifsim-canvas lifsim-square" />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Optimality</div>
          <div className="spc-gauge">
            <div className="spc-gauge-num">{stats.crb > 0 ? (stats.rmse / stats.crb).toFixed(2) : '-'}<span>× CRB</span></div>
            <div className="spc-gauge-note">The decoder’s error (<b>{stats.rmse.toFixed(1)}°</b>) sits just above the Cramér–Rao bound (<b>{stats.crb.toFixed(1)}°</b>): a ratio near <b>1</b> means the maximum-likelihood decoder is near-optimal. Narrow tuning, more neurons, or higher peak rates raise <i>J</i> and shrink both.</div>
          </div>
        </div>
      </div>

      <div className="lifsim-controls">
        <label><span>stimulus <i>s</i> = {s}°</span>
          <input type="range" min={10} max={170} step={1} value={s} onChange={(e) => setS(+e.target.value)} /></label>
        <label><span>tuning width <i>σ</i> = {sigT}°</span>
          <input type="range" min={6} max={45} step={1} value={sigT} onChange={(e) => setSigT(+e.target.value)} /></label>
        <label><span>neurons <i>N</i> = {N}</span>
          <input type="range" min={6} max={40} step={1} value={N} onChange={(e) => setN(+e.target.value)} /></label>
        <label><span>peak rate = {rmax} spikes</span>
          <input type="range" min={5} max={50} step={1} value={rmax} onChange={(e) => setRmax(+e.target.value)} /></label>
        <button className="btn ghost lifsim-btn" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> Move the <b>stimulus</b>: the cyan population response is a noisy hill centred on <i>s</i>, and the pink decoded <i>ŝ</i> jitters around the truth. Shrink the <b>tuning width</b> or add <b>neurons</b>/<b>peak rate</b>: the Fisher information <i>J</i> rises, the Cramér–Rao bound and the error histogram both narrow, and the RMSE drops toward the bound. Very narrow tuning eventually hurts (few neurons respond at all), the classic width–information trade-off.</p>
      </div>
    </div>
  )
}
