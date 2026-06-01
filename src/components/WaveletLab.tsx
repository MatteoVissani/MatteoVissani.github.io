import { useEffect, useRef, useState } from 'react'

// Time–frequency decomposition lab. Builds a synthetic neural signal (theta +
// beta-burst + 1/f noise) and computes its Morlet continuous wavelet transform
// (CWT) live in the browser, plus the power spectrum. Every parameter, the
// oscillation frequencies/amplitudes, the noise, and crucially the wavelet
// width (n_cycles, the time–frequency resolution trade-off), is adjustable.

const FS = 200, T = 3, N = FS * T // 200 Hz, 3 s

function colormap(v: number) {
  v = Math.max(0, Math.min(1, v))
  const s = [[0, 12, 13, 30], [0.35, 90, 50, 140], [0.6, 255, 45, 141], [0.8, 34, 225, 255], [1, 240, 255, 255]]
  for (let i = 1; i < s.length; i++) {
    if (v <= s[i][0]) { const a = s[i - 1], b = s[i], t = (v - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t] }
  }
  return [240, 255, 255]
}

// Gaussian std (seconds) of the Morlet wavelet, defined three ways (Cohen 2019).
// K = 2*sqrt(2 ln2) converts a Gaussian std to its full width at half maximum.
const K = 2 * Math.sqrt(2 * Math.LN2)
type Mode = 'ncyc' | 'fwhmt' | 'fwhmf'
function sigmaSec(mode: Mode, nCyc: number, fwhmT: number, fwhmF: number, f: number) {
  if (mode === 'fwhmt') return (fwhmT / 1000) / K              // fixed time resolution
  if (mode === 'fwhmf') return 1 / (2 * Math.PI * (fwhmF / K)) // fixed frequency resolution
  return nCyc / (2 * Math.PI * f)                              // constant cycles (frequency-dependent)
}

export default function WaveletLab() {
  const sigRef = useRef<HTMLCanvasElement>(null)
  const scalRef = useRef<HTMLCanvasElement>(null)
  const specRef = useRef<HTMLCanvasElement>(null)
  const waveRef = useRef<HTMLCanvasElement>(null)

  const [fTheta, setFTheta] = useState(6)
  const [aTheta, setATheta] = useState(0.8)
  const [fBeta, setFBeta] = useState(22)
  const [aBeta, setABeta] = useState(0.9)
  const [burst, setBurst] = useState(true)
  const [noise, setNoise] = useState(0.35)
  const [mode, setMode] = useState<Mode>('ncyc')
  const [nCyc, setNCyc] = useState(7)
  const [fwhmT, setFwhmT] = useState(300) // FWHM in time (ms)
  const [fwhmF, setFwhmF] = useState(4)   // FWHM in frequency (Hz)
  const [seed, setSeed] = useState(1)

  const raw = useRef<Float32Array>(new Float32Array(N))
  const data = useRef<{ sig: Float32Array; mat: Float32Array; nf: number; nt: number; freqs: number[]; spec: Float32Array; sfreqs: number[] } | null>(null)

  // regenerate the raw white noise when the seed changes
  useEffect(() => { const r = new Float32Array(N); for (let i = 0; i < N; i++) r[i] = (Math.random() * 2 - 1); raw.current = r }, [seed])

  useEffect(() => {
    const handle = setTimeout(() => {
      // ---- build signal ----
      const sig = new Float32Array(N)
      let pink = 0
      for (let i = 0; i < N; i++) {
        const t = i / FS
        pink = 0.92 * pink + 0.4 * raw.current[i] // AR(1) -> 1/f-ish
        const win = burst ? Math.exp(-((t - 1.5) ** 2) / (2 * 0.28 ** 2)) : 1
        sig[i] = aTheta * Math.sin(2 * Math.PI * fTheta * t)
          + aBeta * win * Math.sin(2 * Math.PI * fBeta * t)
          + noise * pink
      }
      // ---- Morlet CWT ----
      const nf = 46, fmin = 2, fmax = 50
      const freqs: number[] = []
      for (let k = 0; k < nf; k++) freqs.push(fmin * Math.pow(fmax / fmin, k / (nf - 1)))
      const step = Math.max(1, Math.round(N / 280)), nt = Math.floor(N / step)
      const mat = new Float32Array(nf * nt)
      let lmin = Infinity, lmax = -Infinity
      for (let fi = 0; fi < nf; fi++) {
        const f = freqs[fi], sigSamp = sigmaSec(mode, nCyc, fwhmT, fwhmF, f) * FS, hw = Math.round(3 * sigSamp)
        for (let c = 0; c < nt; c++) {
          const center = c * step; let re = 0, im = 0
          for (let tau = -hw; tau <= hw; tau++) {
            const idx = center + tau; if (idx < 0 || idx >= N) continue
            const g = Math.exp(-(tau * tau) / (2 * sigSamp * sigSamp)), ph = 2 * Math.PI * f * tau / FS
            re += sig[idx] * Math.cos(ph) * g; im += sig[idx] * Math.sin(ph) * g
          }
          const p = Math.log10((re * re + im * im) / (sigSamp + 1) + 1e-6)
          mat[fi * nt + c] = p; if (p < lmin) lmin = p; if (p > lmax) lmax = p
        }
      }
      for (let i = 0; i < mat.length; i++) mat[i] = (mat[i] - lmin) / (lmax - lmin + 1e-9)
      // ---- power spectrum (direct DFT on a grid) ----
      const nfreq = 120, sfreqs: number[] = [], spec = new Float32Array(nfreq)
      for (let k = 0; k < nfreq; k++) {
        const f = 1 + (k / (nfreq - 1)) * 59; sfreqs.push(f)
        let re = 0, im = 0
        for (let n = 0; n < N; n++) { const ph = 2 * Math.PI * f * n / FS; re += sig[n] * Math.cos(ph); im += sig[n] * Math.sin(ph) }
        spec[k] = Math.sqrt(re * re + im * im) / N
      }
      data.current = { sig, mat, nf, nt, freqs, spec, sfreqs }
      draw()
    }, 120)
    return () => clearTimeout(handle)
  }, [fTheta, aTheta, fBeta, aBeta, burst, noise, mode, nCyc, fwhmT, fwhmF, seed])

  function draw() {
    const d = data.current; if (!d) return
    const dpr = window.devicePixelRatio || 1
    const setup = (c: HTMLCanvasElement) => { const ctx = c.getContext('2d')!; c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx }

    // signal
    if (sigRef.current) {
      const ctx = setup(sigRef.current), W = sigRef.current.clientWidth, H = sigRef.current.clientHeight
      ctx.clearRect(0, 0, W, H); let mx = 0; for (const v of d.sig) mx = Math.max(mx, Math.abs(v))
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 1.4; ctx.beginPath()
      for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * W, y = H / 2 - (d.sig[i] / (mx || 1)) * H * 0.42; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke()
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '11px monospace'; ctx.fillText('raw signal x(t)', 6, 14); ctx.fillText('3 s', W - 22, H - 6)
    }
    // scalogram
    if (scalRef.current) {
      const ctx = setup(scalRef.current), W = scalRef.current.clientWidth, H = scalRef.current.clientHeight
      const off = document.createElement('canvas'); off.width = d.nt; off.height = d.nf
      const octx = off.getContext('2d')!, img = octx.createImageData(d.nt, d.nf)
      for (let y = 0; y < d.nf; y++) { const fi = d.nf - 1 - y; for (let x = 0; x < d.nt; x++) { const [r, g, b] = colormap(d.mat[fi * d.nt + x]); const o = (y * d.nt + x) * 4; img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255 } }
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true; ctx.clearRect(0, 0, W, H); ctx.drawImage(off, 0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '10px monospace'
      ;[5, 10, 20, 40].forEach((f) => { const y = H - (Math.log(f / 2) / Math.log(50 / 2)) * H; ctx.fillText(f + ' Hz', 4, Math.max(10, y)) })
      ctx.fillText('time →', W - 48, H - 6)
    }
    // power spectrum
    if (specRef.current) {
      const ctx = setup(specRef.current), W = specRef.current.clientWidth, H = specRef.current.clientHeight
      ctx.clearRect(0, 0, W, H); let mx = 0; for (const v of d.spec) mx = Math.max(mx, v)
      ctx.strokeStyle = '#9b8cff'; ctx.lineWidth = 2; ctx.beginPath()
      d.spec.forEach((v, k) => { const x = (d.sfreqs[k] / 60) * W, y = H - 14 - (v / (mx || 1)) * (H - 22); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke()
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '10px monospace'; ctx.fillText('power', 6, 12);[10, 20, 40].forEach((f) => ctx.fillText(f + '', (f / 60) * W - 5, H - 3)); ctx.fillText('Hz', W - 16, H - 3)
    }
    // morlet wavelet preview at 10 Hz
    if (waveRef.current) {
      const ctx = setup(waveRef.current), W = waveRef.current.clientWidth, H = waveRef.current.clientHeight
      ctx.clearRect(0, 0, W, H); const f = 10, sigSamp = sigmaSec(mode, nCyc, fwhmT, fwhmF, f) * FS, hw = Math.round(3.2 * sigSamp)
      const env = (tau: number) => Math.exp(-(tau * tau) / (2 * sigSamp * sigSamp))
      const drawPart = (fn: (ph: number) => number, color: string, w: number) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); for (let tau = -hw; tau <= hw; tau++) { const x = ((tau + hw) / (2 * hw)) * W, y = H / 2 - fn(2 * Math.PI * f * tau / FS) * env(tau) * H * 0.4; tau === -hw ? ctx.moveTo(x, y) : ctx.lineTo(x, y) } ctx.stroke() }
      ctx.strokeStyle = 'rgba(255,194,77,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let tau = -hw; tau <= hw; tau++) { const x = ((tau + hw) / (2 * hw)) * W, y = H / 2 - env(tau) * H * 0.4; tau === -hw ? ctx.moveTo(x, y) : ctx.lineTo(x, y) } ctx.stroke()
      drawPart(Math.cos, '#22e1ff', 2); drawPart(Math.sin, '#ff2d8f', 1.5)
      const lbl = mode === 'ncyc' ? `${nCyc} cycles` : mode === 'fwhmt' ? `${fwhmT} ms FWHM` : `${fwhmF} Hz FWHM`
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '10px monospace'; ctx.fillText(`Morlet wavelet · ${lbl} @ 10 Hz`, 6, 14)
    }
  }

  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    ;[sigRef, scalRef, specRef, waveRef].forEach((r) => r.current && ro.observe(r.current))
    return () => ro.disconnect()
  }, [])

  const sref = sigmaSec(mode, nCyc, fwhmT, fwhmF, 10)
  const fwhmt10 = K * sref * 1000           // ms
  const fwhmf10 = K / (2 * Math.PI * sref)  // Hz

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — wavelet time–frequency decomposition</div>
          <div className="lifsim-sub">Build a neural-like signal (a slow θ rhythm + a transient β burst + 1/f noise) and watch its <b>Morlet continuous wavelet transform</b>, computed live in the browser. The wavelet width <i>n<sub>cycles</sub></i> sets the time vs frequency resolution trade-off.</div>
        </div>
        <button className="lifsim-expand" onClick={() => setSeed((s) => s + 1)}>↻ new noise</button>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip cy"><b>{fwhmt10.toFixed(0)} ms</b> FWHM in time{mode === 'ncyc' ? ' (@10 Hz)' : ''}</span>
        <span className="ilab-chip mag"><b>{fwhmf10.toFixed(1)} Hz</b> FWHM in frequency{mode === 'ncyc' ? ' (@10 Hz)' : ''}</span>
      </div>

      <div className="lifsim-cell lifsim-cell-wide" style={{ marginBottom: 14 }}>
        <div className="lifsim-cap">Signal <span className="sub">x(t)</span></div>
        <canvas ref={sigRef} className="lifsim-canvas" style={{ height: 120 }} />
      </div>
      <div className="lifsim-cell lifsim-cell-wide" style={{ marginBottom: 14 }}>
        <div className="lifsim-cap">Wavelet scalogram <span className="sub">(time–frequency power)</span></div>
        <canvas ref={scalRef} className="lifsim-canvas" style={{ height: 210 }} />
      </div>
      <div className="lifsim-grid">
        <div className="lifsim-cell"><div className="lifsim-cap">Power spectrum</div><canvas ref={specRef} className="lifsim-canvas" style={{ height: 150 }} /></div>
        <div className="lifsim-cell"><div className="lifsim-cap">The wavelet you’re using</div><canvas ref={waveRef} className="lifsim-canvas" style={{ height: 150 }} /></div>
      </div>

      <div className="wav-modes">
        <span className="wav-modelabel">define wavelet width by</span>
        {(([['ncyc', 'n_cycles'], ['fwhmt', 'FWHM time'], ['fwhmf', 'FWHM freq']]) as [Mode, string][]).map(([m, lab]) => (
          <button key={m} className={`wav-modebtn${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}>{lab}</button>
        ))}
      </div>

      <div className="lifsim-controls">
        {mode === 'ncyc' && <label><span>wavelet width <i>n<sub>cycles</sub></i> = {nCyc} {nCyc <= 4 ? '· sharp in time' : nCyc >= 11 ? '· sharp in frequency' : ''}</span>
          <input type="range" min={2} max={15} step={1} value={nCyc} onChange={(e) => setNCyc(+e.target.value)} /></label>}
        {mode === 'fwhmt' && <label><span>FWHM in time = {fwhmT} ms <i>· same at every frequency</i></span>
          <input type="range" min={40} max={800} step={10} value={fwhmT} onChange={(e) => setFwhmT(+e.target.value)} /></label>}
        {mode === 'fwhmf' && <label><span>FWHM in frequency = {fwhmF} Hz <i>· same at every frequency</i></span>
          <input type="range" min={1} max={15} step={0.5} value={fwhmF} onChange={(e) => setFwhmF(+e.target.value)} /></label>}
        <label><span>θ frequency = {fTheta} Hz · amp {aTheta.toFixed(1)}</span>
          <input type="range" min={3} max={12} step={1} value={fTheta} onChange={(e) => setFTheta(+e.target.value)} /></label>
        <label><span>β frequency = {fBeta} Hz · amp {aBeta.toFixed(1)}</span>
          <input type="range" min={14} max={40} step={1} value={fBeta} onChange={(e) => setFBeta(+e.target.value)} /></label>
        <label><span>θ amplitude = {aTheta.toFixed(1)}</span>
          <input type="range" min={0} max={1.5} step={0.1} value={aTheta} onChange={(e) => setATheta(+e.target.value)} /></label>
        <label><span>β amplitude = {aBeta.toFixed(1)}</span>
          <input type="range" min={0} max={1.5} step={0.1} value={aBeta} onChange={(e) => setABeta(+e.target.value)} /></label>
        <label><span>1/f noise = {noise.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.05} value={noise} onChange={(e) => setNoise(+e.target.value)} /></label>
        <button className="btn ghost lifsim-btn" onClick={() => setBurst((b) => !b)}>{burst ? 'β: burst' : 'β: continuous'}</button>
      </div>

      <div className="lifsim-explain">
        <p><b>Three ways to set the width</b> (Cohen 2019). <i>n_cycles</i> fixes the number of cycles, so the wavelet is <b>constant-Q</b>, wider in time at low frequencies, narrower at high (the classic scalogram). <i>FWHM time</i> fixes the temporal width at <b>every</b> frequency; <i>FWHM frequency</i> fixes the spectral width at every frequency. The two read-out chips show the equivalent FWHM in time and in frequency, and they always obey the uncertainty relation FWHM<sub>t</sub> · FWHM<sub>f</sub> ≈ {(K * K / (2 * Math.PI)).toFixed(2)} (a constant), sharpen one and the other must blur.</p>
        <p><b>What to try.</b> Keep β as a <b>burst</b>. In <i>n_cycles</i> mode, drop to 2–3 to pin the burst in <i>time</i> (smeared in frequency), or raise to 12–15 to sharpen the β band in <i>frequency</i> (spread in time). Switch to <i>FWHM time</i> and set 80 ms: the burst is crisp but the bands blur; set 600 ms and the bands sharpen but the burst spreads. The inset shows the actual Morlet wavelet you're using (cyan = real, pink = imaginary, amber = Gaussian envelope).</p>
      </div>
    </div>
  )
}
