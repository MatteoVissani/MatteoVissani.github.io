import { useEffect, useMemo, useRef, useState } from 'react'

// Spectral parameterization (specparam / FOOOF): a neural power spectrum is an
// aperiodic 1/f background  L(f) = b − log10(k + f^χ)  plus a few Gaussian peaks
// in log-power. You set the aperiodic fit; the oscillation peaks emerge from the
// flattened residual — get the background wrong and you "find" the wrong peaks.

const N = 120
const F = Array.from({ length: N }, (_, i) => Math.pow(10, (i / (N - 1)) * Math.log10(95))) // 1 … 95 Hz, log-spaced

type Peak = { c: number; a: number; s: number }
type Preset = { name: string; b: number; chi: number; fk: number; peaks: Peak[]; note: string }
const P: Preset[] = [
  { name: 'alpha + 1/f', b: 1.1, chi: 1.3, fk: 0, peaks: [{ c: 10, a: 0.7, s: 1.4 }], note: 'a clean alpha peak on a shallow background — the textbook case.' },
  { name: 'beta, steep 1/f', b: 1.4, chi: 2.1, fk: 0, peaks: [{ c: 22, a: 0.5, s: 3 }], note: 'a small beta peak on a steep background; easy to miss without removing the 1/f.' },
  { name: 'NO oscillation ⚠', b: 1.2, chi: 1.6, fk: 0, peaks: [], note: 'pure 1/f, no peak at all — yet naïve “alpha band power” is high. The trap parameterization avoids.' },
  { name: 'with a knee', b: 1.8, chi: 2.2, fk: 7, peaks: [{ c: 10, a: 0.6, s: 1.4 }], note: 'the background bends (a knee at low frequency); a single slope can’t fit it.' },
  { name: 'two peaks', b: 1.1, chi: 1.3, fk: 0, peaks: [{ c: 10, a: 0.6, s: 1.3 }, { c: 24, a: 0.45, s: 3 }], note: 'alpha and beta together on the same background.' },
]

const ap = (f: number, b: number, chi: number, k: number) => b - Math.log10(k + Math.pow(f, chi))
// deterministic smooth-ish noise per preset
function genData(p: Preset): number[] {
  let seed = 1234 + p.name.length * 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5 }
  const k = p.fk > 0 ? Math.pow(p.fk, p.chi) : 0
  const raw = F.map((f) => ap(f, p.b, p.chi, k) + p.peaks.reduce((s, pk) => s + pk.a * Math.exp(-((f - pk.c) ** 2) / (2 * pk.s * pk.s)), 0) + rnd() * 0.14)
  return raw.map((v, i) => (raw[Math.max(0, i - 1)] + v + raw[Math.min(N - 1, i + 1)]) / 3)   // light smoothing
}

// fit Gaussian peaks to the flattened residual (iterative, FOOOF-style)
function fitPeaks(flat: number[], thr = 0.08, maxN = 4) {
  const r = flat.slice(), peaks: { cf: number; pw: number; bw: number }[] = []
  for (let n = 0; n < maxN; n++) {
    let mi = 0; for (let i = 0; i < N; i++) if (r[i] > r[mi]) mi = i
    if (r[mi] < thr) break
    const cf = F[mi], pw = r[mi]
    // half-max width → σ (in Hz, via neighbouring samples)
    let lo = mi, hi = mi; while (lo > 0 && r[lo] > pw / 2) lo--; while (hi < N - 1 && r[hi] > pw / 2) hi++
    const bw = Math.max(1, (F[hi] - F[lo])), s = bw / 2.355
    for (let i = 0; i < N; i++) r[i] -= pw * Math.exp(-((F[i] - cf) ** 2) / (2 * s * s))
    peaks.push({ cf, pw, bw })
  }
  return peaks
}

export default function SpecParamLab() {
  const [pi, setPi] = useState(0)
  const [b, setB] = useState(P[0].b)
  const [chi, setChi] = useState(P[0].chi)
  const [fk, setFk] = useState(0)         // knee frequency (0 = none)
  const specCv = useRef<HTMLCanvasElement>(null)
  const flatCv = useRef<HTMLCanvasElement>(null)

  const data = useMemo(() => genData(P[pi]), [pi])
  const load = (i: number) => { setPi(i); const fresh = genData(P[i]); autofit(fresh) }

  // robust aperiodic line fit (ignore peak points), set the sliders
  const autofit = (d = data) => {
    const x = F.map((f) => Math.log10(f)); let keep = d.map(() => true)
    let slope = 0, inter = 0
    for (let it = 0; it < 3; it++) {
      let sx = 0, sy = 0, sxx = 0, sxy = 0, nn = 0
      for (let i = 0; i < N; i++) if (keep[i]) { sx += x[i]; sy += d[i]; sxx += x[i] * x[i]; sxy += x[i] * d[i]; nn++ }
      slope = (nn * sxy - sx * sy) / (nn * sxx - sx * sx); inter = (sy - slope * sx) / nn
      keep = d.map((v, i) => v - (inter + slope * x[i]) < 0.06)   // drop points well above the line (peaks)
    }
    setB(inter); setChi(-slope); setFk(0)
  }

  const fit = useMemo(() => {
    const k = fk > 0 ? Math.pow(fk, chi) : 0
    const L = F.map((f) => ap(f, b, chi, k))
    const flat = data.map((v, i) => v - L[i])
    const peaks = fitPeaks(flat)
    const model = L.map((l, i) => l + peaks.reduce((s, p) => s + p.pw * Math.exp(-((F[i] - p.cf) ** 2) / (2 * (p.bw / 2.355) ** 2)), 0))
    const mean = data.reduce((s, v) => s + v, 0) / N
    const r2 = 1 - data.reduce((s, v, i) => s + (v - model[i]) ** 2, 0) / data.reduce((s, v) => s + (v - mean) ** 2, 0)
    return { L, flat, peaks, model, r2 }
  }, [data, b, chi, fk])

  // ---- spectrum plot (log-log) ----
  useEffect(() => {
    const cv = specCv.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fitC = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw() }
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, PL = 34, PB = 20; ctx.clearRect(0, 0, W, H)
      const all = [...data, ...fit.L, ...fit.model]; let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.08; lo -= pad; hi += pad
      const X = (f: number) => PL + Math.log10(f) / Math.log10(95) * (W - PL - 8), Y = (v: number) => H - PB - (v - lo) / (hi - lo) * (H - PB - 12)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.fillStyle = 'rgba(215,218,230,0.5)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
      for (const f of [1, 3, 10, 30, 90]) { const x = X(f); ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, H - PB); ctx.stroke(); ctx.fillText(f + '', x, H - 7) }
      ctx.textAlign = 'left'; ctx.fillText('Hz (log)', W - 48, H - 7); ctx.save(); ctx.translate(10, H / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('log power', 0, 0); ctx.restore()
      const line = (a: number[], col: string, w: number, dash: number[] = []) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath(); a.forEach((v, i) => { const x = X(F[i]), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke(); ctx.setLineDash([]) }
      line(data, 'rgba(34,225,255,0.85)', 1.8)          // measured
      line(fit.L, '#9b8cff', 1.6, [5, 3])               // aperiodic
      line(fit.model, '#54e6a0', 1.6)                   // full model
      for (const p of fit.peaks) { const x = X(p.cf); ctx.strokeStyle = 'rgba(255,184,77,0.5)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, H - PB); ctx.stroke(); ctx.setLineDash([]) }
      ctx.textAlign = 'left'; ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(34,225,255,0.9)'; ctx.fillText('— measured spectrum', PL + 2, 13)
      ctx.fillStyle = '#9b8cff'; ctx.fillText('-- aperiodic 1/f', PL + 142, 13)
      ctx.fillStyle = '#54e6a0'; ctx.fillText('— full fit', PL + 240, 13)
    }
    fitC(); const ro = new ResizeObserver(fitC); ro.observe(cv); return () => ro.disconnect()
  }, [data, fit])

  // ---- flattened spectrum (oscillations isolated) ----
  useEffect(() => {
    const cv = flatCv.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fitC = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw() }
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, PL = 34, PB = 20; ctx.clearRect(0, 0, W, H)
      let hi = 0.25; for (const v of fit.flat) hi = Math.max(hi, v); hi *= 1.15; const lo = Math.min(-0.1, Math.min(...fit.flat))
      const X = (f: number) => PL + Math.log10(f) / Math.log10(95) * (W - PL - 8), Y = (v: number) => H - PB - (v - lo) / (hi - lo) * (H - PB - 12)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.fillStyle = 'rgba(215,218,230,0.5)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
      for (const f of [1, 3, 10, 30, 90]) { const x = X(f); ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, H - PB); ctx.stroke(); ctx.fillText(f + '', x, H - 7) }
      const y0 = Y(0); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PL, y0); ctx.lineTo(W - 8, y0); ctx.stroke()
      // flattened data
      ctx.strokeStyle = 'rgba(34,225,255,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); fit.flat.forEach((v, i) => { const x = X(F[i]), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke()
      // fitted gaussians
      for (const p of fit.peaks) { ctx.strokeStyle = '#54e6a0'; ctx.lineWidth = 1.8; ctx.beginPath(); F.forEach((f, i) => { const g = p.pw * Math.exp(-((f - p.cf) ** 2) / (2 * (p.bw / 2.355) ** 2)); const x = X(f), y = Y(g); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke(); const x = X(p.cf); ctx.fillStyle = '#54e6a0'; ctx.beginPath(); ctx.arc(x, Y(p.pw), 3.5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(215,218,230,0.8)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText(p.cf.toFixed(1) + ' Hz', x, Y(p.pw) - 6) }
      ctx.fillStyle = 'rgba(215,218,230,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'
      ctx.fillText('flattened = spectrum − aperiodic  ·  bumps above 0 are the real oscillations', PL + 2, 13)
      if (!fit.peaks.length) { ctx.fillStyle = '#ffb84d'; ctx.fillText('no peaks above threshold — nothing oscillatory here', PL + 2, H / 2) }
    }
    fitC(); const ro = new ResizeObserver(fitC); ro.observe(cv); return () => ro.disconnect()
  }, [fit])

  return (
    <div className="lifsim panel ss">
      <div className="lifsim-head"><div>
        <div className="lifsim-title">Spectral parameterization — oscillations vs the 1/f background</div>
        <div className="lifsim-sub">A neural power spectrum is an <b style={{ color: '#9b8cff' }}>aperiodic 1/f background</b> plus a few <b style={{ color: '#54e6a0' }}>oscillatory peaks</b>. Fit the background, subtract it, and the true oscillations stand out — while the background’s <b>exponent</b> is itself a meaningful number. Get the background wrong and you “find” oscillations that aren’t there.</div>
      </div></div>

      <div className="ss-sysbar">
        <span className="wav-modelabel">spectrum</span>
        {P.map((p, i) => <button key={p.name} className={`wav-modebtn${pi === i ? ' on' : ''}`} onClick={() => load(i)}>{p.name}</button>)}
        <button className="wav-modebtn" onClick={() => autofit()}>⤳ auto-fit background</button>
      </div>
      <p className="ss-def" style={{ margin: '2px 0 0' }}>{P[pi].note}</p>

      <div className="ss-concepts">
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">The spectrum</span> <b>model = aperiodic + peaks</b></div>
          <canvas ref={specCv} className="ss-canvas" />
          <div className="ss-sliders" style={{ marginTop: 10 }}>
            <label><span style={{ minWidth: 96, display: 'inline-block' }}>exponent χ</span> <input type="range" min={0} max={3.5} step={0.05} value={chi} onChange={(e) => setChi(+e.target.value)} /> <b>{chi.toFixed(2)}</b></label>
            <label><span style={{ minWidth: 96, display: 'inline-block' }}>offset b</span> <input type="range" min={-1} max={3} step={0.05} value={b} onChange={(e) => setB(+e.target.value)} /> <b>{b.toFixed(2)}</b></label>
            <label><span style={{ minWidth: 96, display: 'inline-block' }}>knee freq</span> <input type="range" min={0} max={20} step={0.5} value={fk} onChange={(e) => setFk(+e.target.value)} /> <b>{fk === 0 ? 'none' : fk.toFixed(1) + ' Hz'}</b></label>
          </div>
        </div>
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">The oscillations</span> <b>flattened spectrum</b></div>
          <canvas ref={flatCv} className="ss-canvas" />
          <div className="ss-implic ok" style={{ marginTop: 10 }}>
            <b>aperiodic:</b> exponent χ = {chi.toFixed(2)}, offset = {b.toFixed(2)}{fk > 0 ? `, knee ${fk.toFixed(1)} Hz` : ''} · <b>fit R² = {fit.r2.toFixed(3)}</b><br />
            <b>peaks found:</b> {fit.peaks.length ? fit.peaks.map((p) => `${p.cf.toFixed(1)} Hz (pw ${p.pw.toFixed(2)}, bw ${p.bw.toFixed(1)})`).join(' · ') : 'none'}
          </div>
        </div>
      </div>

      <div className="lifsim-explain">
        <p><b>Why it matters.</b> “Band power” conflates two very different things: a true <b>oscillation</b> (a bump over the background) and a shift in the <b>aperiodic 1/f</b> slope or offset. Two conditions can differ in alpha-band power with <i>no change in any oscillation</i> — only the background tilted (try the <b>NO oscillation</b> spectrum: naïve band power is high, but there is no peak). Spectral parameterization separates them: it reports each oscillation’s <b>center frequency, power and bandwidth</b>, and the aperiodic <b>exponent</b> — which tracks excitation/inhibition balance, age and arousal in its own right. The catch the demo makes visceral: the peaks you recover depend entirely on getting the aperiodic fit right — too steep a slope invents peaks, too shallow buries them.</p>
      </div>
    </div>
  )
}
