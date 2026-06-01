import { useEffect, useRef, useState } from 'react'

// Digital filter designer. Builds a windowed-sinc FIR band-pass filter (Hamming
// window), shows its frequency response, applies it to a neural-like signal, and
// compares the input/output power spectra. All parameters live: band edges and
// the number of taps (steepness).

const FS = 250, T = 3, N = FS * T

export default function FilterLab() {
  const respRef = useRef<HTMLCanvasElement>(null)
  const sigRef = useRef<HTMLCanvasElement>(null)
  const irRef = useRef<HTMLCanvasElement>(null)
  const specRef = useRef<HTMLCanvasElement>(null)

  const [fL, setFL] = useState(30)
  const [fH, setFH] = useState(50)
  const [taps, setTaps] = useState(101)
  const [seed, setSeed] = useState(1)

  const raw = useRef<Float32Array>(new Float32Array(N))
  const data = useRef<any>(null)

  useEffect(() => { const r = new Float32Array(N); for (let i = 0; i < N; i++) r[i] = Math.random() * 2 - 1; raw.current = r }, [seed])

  useEffect(() => {
    const id = setTimeout(() => {
      const lo = Math.min(fL, fH - 2), hi = Math.max(fH, fL + 2)
      // ---- signal: 8 Hz + 40 Hz + 60 Hz line + 1/f ----
      const sig = new Float32Array(N); let pink = 0
      for (let i = 0; i < N; i++) {
        const t = i / FS; pink = 0.92 * pink + 0.5 * raw.current[i]
        sig[i] = Math.sin(2 * Math.PI * 8 * t) + Math.sin(2 * Math.PI * 40 * t) + 0.6 * Math.sin(2 * Math.PI * 60 * t) + 0.5 * pink
      }
      // ---- windowed-sinc band-pass FIR ----
      const M = taps % 2 ? taps : taps + 1, mid = (M - 1) / 2
      const wL = 2 * Math.PI * lo / FS, wH = 2 * Math.PI * hi / FS
      const h = new Float32Array(M)
      for (let k = 0; k < M; k++) {
        const n = k - mid
        const ideal = n === 0 ? (wH - wL) / Math.PI : (Math.sin(wH * n) - Math.sin(wL * n)) / (Math.PI * n)
        const win = 0.54 - 0.46 * Math.cos((2 * Math.PI * k) / (M - 1))
        h[k] = ideal * win
      }
      // ---- frequency response |H(f)| ----
      const nfr = 240, fr: number[] = [], mag = new Float32Array(nfr)
      for (let j = 0; j < nfr; j++) {
        const f = (j / (nfr - 1)) * (FS / 2); fr.push(f)
        let re = 0, im = 0; for (let k = 0; k < M; k++) { const ph = 2 * Math.PI * f * k / FS; re += h[k] * Math.cos(ph); im -= h[k] * Math.sin(ph) }
        mag[j] = Math.sqrt(re * re + im * im)
      }
      const mmax = Math.max(...mag); for (let j = 0; j < nfr; j++) mag[j] /= (mmax || 1)
      // ---- apply (centered convolution) ----
      const out = new Float32Array(N)
      for (let i = 0; i < N; i++) { let s = 0; for (let k = 0; k < M; k++) { const idx = i - k + mid; if (idx >= 0 && idx < N) s += h[k] * sig[idx] } out[i] = s }
      // normalize output to filter peak so amplitudes are comparable
      for (let i = 0; i < N; i++) out[i] /= (mmax || 1)
      // ---- spectra in / out ----
      const ns = 160, sf: number[] = [], pin = new Float32Array(ns), pout = new Float32Array(ns)
      for (let j = 0; j < ns; j++) {
        const f = (j / (ns - 1)) * (FS / 2); sf.push(f)
        let ri = 0, ii = 0, ro = 0, io = 0
        for (let n = 0; n < N; n++) { const ph = 2 * Math.PI * f * n / FS, c = Math.cos(ph), s = Math.sin(ph); ri += sig[n] * c; ii += sig[n] * s; ro += out[n] * c; io += out[n] * s }
        pin[j] = Math.sqrt(ri * ri + ii * ii) / N; pout[j] = Math.sqrt(ro * ro + io * io) / N
      }
      data.current = { sig, out, h, M, fr, mag, lo, hi, sf, pin, pout, smax: Math.max(...pin) }
      draw()
    }, 110)
    return () => clearTimeout(id)
  }, [fL, fH, taps, seed])

  function draw() {
    const d = data.current; if (!d) return
    const dpr = window.devicePixelRatio || 1
    const setup = (c: HTMLCanvasElement) => { const ctx = c.getContext('2d')!; c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx }
    // response
    if (respRef.current) {
      const ctx = setup(respRef.current), W = respRef.current.clientWidth, H = respRef.current.clientHeight
      ctx.clearRect(0, 0, W, H)
      const X = (f: number) => (f / (FS / 2)) * W
      ctx.fillStyle = 'rgba(34,225,255,0.10)'; ctx.fillRect(X(d.lo), 0, X(d.hi) - X(d.lo), H)
      ctx.strokeStyle = 'rgba(34,225,255,0.5)'; ctx.setLineDash([4, 4])
      ;[d.lo, d.hi].forEach((f: number) => { ctx.beginPath(); ctx.moveTo(X(f), 0); ctx.lineTo(X(f), H); ctx.stroke() }); ctx.setLineDash([])
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2; ctx.beginPath()
      d.mag.forEach((m: number, j: number) => { const x = X(d.fr[j]), y = H - 6 - m * (H - 14); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke()
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '11px monospace'; ctx.fillText('|H(f)|  filter gain', 6, 14)
      ;[20, 40, 60, 80, 100].forEach((f) => ctx.fillText(f + '', X(f) - 6, H - 3))
    }
    // signal raw + filtered (first 1 s)
    if (sigRef.current) {
      const ctx = setup(sigRef.current), W = sigRef.current.clientWidth, H = sigRef.current.clientHeight, n1 = FS
      ctx.clearRect(0, 0, W, H); let mx = 0; for (let i = 0; i < n1; i++) mx = Math.max(mx, Math.abs(d.sig[i]))
      ctx.strokeStyle = 'rgba(155,140,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath()
      for (let i = 0; i < n1; i++) { const x = (i / n1) * W, y = H / 2 - (d.sig[i] / mx) * H * 0.42; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke()
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < n1; i++) { const x = (i / n1) * W, y = H / 2 - (d.out[i] / mx) * H * 0.42; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke()
      ctx.fillStyle = 'rgba(155,140,255,0.8)'; ctx.font = '11px monospace'; ctx.fillText('raw', 6, 14); ctx.fillStyle = '#22e1ff'; ctx.fillText('filtered', 34, 14)
    }
    // impulse response
    if (irRef.current) {
      const ctx = setup(irRef.current), W = irRef.current.clientWidth, H = irRef.current.clientHeight
      ctx.clearRect(0, 0, W, H); let mx = 0; for (const v of d.h) mx = Math.max(mx, Math.abs(v))
      ctx.strokeStyle = '#ff2d8f'; ctx.lineWidth = 1.4; ctx.beginPath()
      for (let k = 0; k < d.M; k++) { const x = (k / (d.M - 1)) * W, y = H / 2 - (d.h[k] / mx) * H * 0.4; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke()
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '10px monospace'; ctx.fillText(`impulse response · ${d.M} taps`, 6, 14)
    }
    // spectra
    if (specRef.current) {
      const ctx = setup(specRef.current), W = specRef.current.clientWidth, H = specRef.current.clientHeight
      ctx.clearRect(0, 0, W, H); const X = (f: number) => (f / (FS / 2)) * W, Yt = (v: number) => H - 16 - (v / (d.smax || 1)) * (H - 24)
      ctx.strokeStyle = 'rgba(155,140,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); d.pin.forEach((v: number, j: number) => { const x = X(d.sf[j]); j ? ctx.lineTo(x, Yt(v)) : ctx.moveTo(x, Yt(v)) }); ctx.stroke()
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2; ctx.beginPath(); d.pout.forEach((v: number, j: number) => { const x = X(d.sf[j]); j ? ctx.lineTo(x, Yt(v)) : ctx.moveTo(x, Yt(v)) }); ctx.stroke()
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '10px monospace'; ctx.fillText('spectrum: in (violet) vs out (cyan)', 6, 12);[20, 40, 60].forEach((f) => ctx.fillText(f + '', X(f) - 5, H - 3))
    }
  }

  useEffect(() => { const ro = new ResizeObserver(() => draw());[respRef, sigRef, irRef, specRef].forEach((r) => r.current && ro.observe(r.current)); return () => ro.disconnect() }, [])

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — digital filter designer</div>
          <div className="lifsim-sub">Design a <b>windowed-sinc FIR band-pass</b> filter and apply it live to a signal made of 8 Hz + 40 Hz rhythms, 60 Hz line noise, and 1/f background. Drag the band edges to keep only the band you want; the number of taps sets the steepness.</div>
        </div>
        <button className="lifsim-expand" onClick={() => setSeed((s) => s + 1)}>↻ new noise</button>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip cy"><b>{Math.min(fL, fH - 2)}–{Math.max(fH, fL + 2)} Hz</b> passband</span>
        <span className="ilab-chip mag"><b>{taps % 2 ? taps : taps + 1}</b> taps</span>
        <span className="ilab-chip"><b>{(FS / 2)} Hz</b> Nyquist</span>
      </div>

      <div className="lifsim-cell lifsim-cell-wide" style={{ marginBottom: 14 }}>
        <div className="lifsim-cap">Frequency response &amp; passband</div>
        <canvas ref={respRef} className="lifsim-canvas" style={{ height: 150 }} />
      </div>
      <div className="lifsim-cell lifsim-cell-wide" style={{ marginBottom: 14 }}>
        <div className="lifsim-cap">Signal: raw <span className="sub">(violet)</span> vs filtered <span className="sub">(cyan)</span>, first second</div>
        <canvas ref={sigRef} className="lifsim-canvas" style={{ height: 130 }} />
      </div>
      <div className="lifsim-grid">
        <div className="lifsim-cell"><div className="lifsim-cap">Impulse response (the FIR kernel)</div><canvas ref={irRef} className="lifsim-canvas" style={{ height: 140 }} /></div>
        <div className="lifsim-cell"><div className="lifsim-cap">Power spectrum: input vs output</div><canvas ref={specRef} className="lifsim-canvas" style={{ height: 140 }} /></div>
      </div>

      <div className="lifsim-controls">
        <label><span>low edge = {Math.min(fL, fH - 2)} Hz</span>
          <input type="range" min={1} max={120} step={1} value={fL} onChange={(e) => setFL(+e.target.value)} /></label>
        <label><span>high edge = {Math.max(fH, fL + 2)} Hz</span>
          <input type="range" min={3} max={124} step={1} value={fH} onChange={(e) => setFH(+e.target.value)} /></label>
        <label><span>taps = {taps % 2 ? taps : taps + 1} {taps < 50 ? '· gentle roll-off' : taps > 150 ? '· sharp roll-off' : ''}</span>
          <input type="range" min={11} max={201} step={2} value={taps} onChange={(e) => setTaps(+e.target.value)} /></label>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> Set the band to <b>35–45 Hz</b> to isolate the 40 Hz rhythm, the filtered trace becomes a clean sinusoid and the output spectrum keeps only that peak. Put a narrow notch around <b>58–62 Hz</b>... actually leave the band away from 60 Hz to <i>reject</i> the line noise. Now drop the <b>taps</b> to ~15: the frequency response becomes broad and ripply (poor selectivity); raise it to ~180 and the passband gets sharp, at the cost of a longer impulse response and more delay, the classic FIR length vs selectivity trade-off.</p>
      </div>
    </div>
  )
}
