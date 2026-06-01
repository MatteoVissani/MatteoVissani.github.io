import { useEffect, useRef, useState } from 'react'

// DBS waveform & charge-safety designer. Build a stimulation pulse (amplitude,
// pulse width, frequency, mono/biphasic, electrode area) and read off the
// charge per phase, charge density, charge balance, and the Shannon safety
// limit (log D + log Q < k).

type Wave = 'mono' | 'sym' | 'asym'
const GAP = 60 // interphase gap (µs)
const log10 = (x: number) => Math.log(Math.max(x, 1e-9)) / Math.LN10

export default function DBSLab() {
  const shapeRef = useRef<HTMLCanvasElement>(null)
  const trainRef = useRef<HTMLCanvasElement>(null)
  const shanRef = useRef<HTMLCanvasElement>(null)

  const [amp, setAmp] = useState(3)    // mA
  const [pw, setPw] = useState(90)     // µs
  const [freq, setFreq] = useState(130) // Hz
  const [wave, setWave] = useState<Wave>('sym')
  const [area, setArea] = useState(6)  // mm²
  const [tick, setTick] = useState(0)  // forces redraw on resize

  // ---- metrics ----
  const Q = (amp * pw) / 1000           // charge per phase, µC  (mA·µs = nC → /1000 = µC)
  const Acm2 = area / 100               // cm²
  const D = Q / Acm2                    // charge density, µC/cm²/phase
  const k = log10(D) + log10(Q)         // Shannon parameter
  const verdict = k < 1.5 ? ['SAFE', '#54e6a0'] : k < 2.0 ? ['CAUTION', '#ffc24d'] : ['UNSAFE', '#ff6b6b']
  const avgUA = Q * freq                // delivered cathodic charge per second (µA)
  const netDC = wave === 'mono' ? Q : 0 // uncompensated charge per pulse (µC)

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1
    const setup = (c: HTMLCanvasElement | null) => { if (!c) return null; const ctx = c.getContext('2d')!; c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx }

    // ---- pulse shape ----
    const sc = shapeRef.current, sctx = setup(sc)
    if (sc && sctx) {
      const W = sc.clientWidth, H = sc.clientHeight, mid = H * 0.52
      // breakpoints (t in µs, current in mA; cathodic negative)
      const bp: [number, number][] = [[-60, 0], [0, 0], [0, -amp], [pw, -amp], [pw, 0]]
      let tmax = pw + 120
      if (wave === 'sym') { bp.push([pw + GAP, 0], [pw + GAP, amp], [2 * pw + GAP, amp], [2 * pw + GAP, 0]); tmax = 2 * pw + GAP + 120 }
      if (wave === 'asym') { const rw = pw * 4, ra = amp / 4; bp.push([pw + GAP, 0], [pw + GAP, ra], [pw + GAP + rw, ra], [pw + GAP + rw, 0]); tmax = pw + GAP + rw + 120 }
      bp.push([tmax, 0])
      const X = (t: number) => ((t + 60) / (tmax + 60)) * W
      const amax = amp * 1.25, Y = (i: number) => mid - (i / amax) * (H * 0.4)
      sctx.clearRect(0, 0, W, H)
      sctx.strokeStyle = 'rgba(255,255,255,0.15)'; sctx.beginPath(); sctx.moveTo(0, mid); sctx.lineTo(W, mid); sctx.stroke()
      sctx.strokeStyle = '#22e1ff'; sctx.lineWidth = 2.4; sctx.beginPath(); bp.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]); i ? sctx.lineTo(x, y) : sctx.moveTo(x, y) }); sctx.stroke()
      sctx.fillStyle = 'rgba(233,235,251,0.6)'; sctx.font = '10px monospace'
      sctx.fillText('current (mA)', 6, 14); sctx.fillText('time (µs) →', W - 70, mid + 16)
      sctx.fillText(`◀ ${pw} µs ▶`, X(pw / 2) - 22, Y(-amp) + 14)
      sctx.fillText('cathodic', X(pw / 2) - 18, Y(-amp) - 6)
    }
    // ---- pulse train ----
    const tc = trainRef.current, tctx = setup(tc)
    if (tc && tctx) {
      const W = tc.clientWidth, H = tc.clientHeight, mid = H * 0.55, Tms = 1000 / freq, win = 3 * Tms
      tctx.clearRect(0, 0, W, H)
      tctx.strokeStyle = 'rgba(255,255,255,0.15)'; tctx.beginPath(); tctx.moveTo(0, mid); tctx.lineTo(W, mid); tctx.stroke()
      tctx.strokeStyle = '#ff2d8f'; tctx.lineWidth = 2
      for (let n = 0; n * Tms < win; n++) { const x = (n * Tms / win) * W, ww = Math.max(1.5, (pw / 1000 / win) * W); tctx.fillStyle = '#ff2d8f'; tctx.fillRect(x, mid, ww + 1, H * 0.34) }
      tctx.fillStyle = 'rgba(233,235,251,0.6)'; tctx.font = '10px monospace'; tctx.fillText(`${freq} Hz  ·  period ${Tms.toFixed(1)} ms`, 6, 14)
      // period bracket
      tctx.strokeStyle = 'rgba(255,255,255,0.4)'; tctx.beginPath(); tctx.moveTo(0, mid - 10); tctx.lineTo((Tms / win) * W, mid - 10); tctx.stroke()
    }
    // ---- Shannon plot ----
    const shc = shanRef.current, shx = setup(shc)
    if (shc && shx) {
      const W = shc.clientWidth, H = shc.clientHeight, pad = 30
      const qx0 = -2, qx1 = 1, dy0 = -1, dy1 = 3.5 // log ranges
      const X = (lq: number) => pad + ((lq - qx0) / (qx1 - qx0)) * (W - pad - 8)
      const Y = (ld: number) => H - pad - ((ld - dy0) / (dy1 - dy0)) * (H - pad - 8)
      shx.clearRect(0, 0, W, H)
      // safety lines log D = k - log Q
      const line = (kk: number, col: string) => { shx.strokeStyle = col; shx.lineWidth = 1.6; shx.setLineDash([5, 4]); shx.beginPath(); shx.moveTo(X(qx0), Y(kk - qx0)); shx.lineTo(X(qx1), Y(kk - qx1)); shx.stroke(); shx.setLineDash([]) }
      line(1.5, 'rgba(84,230,160,0.8)'); line(2.0, 'rgba(255,107,107,0.85)')
      // operating point
      shx.fillStyle = verdict[1]; shx.beginPath(); shx.arc(X(log10(Q)), Y(log10(D)), 5, 0, 2 * Math.PI); shx.fill()
      shx.fillStyle = 'rgba(233,235,251,0.65)'; shx.font = '10px monospace'
      shx.fillText('log₁₀ Q (charge/phase) →', pad, H - 8); shx.save(); shx.translate(11, H - pad); shx.rotate(-Math.PI / 2); shx.fillText('log₁₀ D (charge density)', 0, 0); shx.restore()
      shx.fillStyle = 'rgba(84,230,160,0.9)'; shx.fillText('k=1.5', X(0.2), Y(1.5 - 0.2) - 4); shx.fillStyle = 'rgba(255,107,107,0.9)'; shx.fillText('k=2.0 damage', X(0.0), Y(2.0 - 0.0) - 4)
    }
  }, [amp, pw, freq, wave, area, tick])

  useEffect(() => { const ro = new ResizeObserver(() => setTick((t) => t + 1));[shapeRef, trainRef, shanRef].forEach((r) => r.current && ro.observe(r.current)); return () => ro.disconnect() }, [])

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — DBS waveform &amp; charge-safety designer</div>
          <div className="lifsim-sub">Design a deep-brain-stimulation pulse and read off the engineering that keeps it safe: <b>charge per phase</b> Q = I·PW, <b>charge density</b> D = Q/area, charge balance, and the <b>Shannon limit</b> (tissue damage when log D + log Q ≳ k).</div>
        </div>
        <div className="lifsim-rate" style={{ color: verdict[1] }}><b style={{ color: verdict[1] }}>{verdict[0]}</b><span>k = {k.toFixed(2)}</span></div>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip cy"><b>{Q.toFixed(2)} µC</b> charge / phase</span>
        <span className="ilab-chip mag"><b>{D.toFixed(1)}</b> µC/cm² density</span>
        <span className="ilab-chip"><b>{avgUA.toFixed(0)} µA</b> mean current</span>
        <span className="ilab-chip" style={{ borderColor: netDC > 0 ? '#ff6b6b' : undefined }}><b style={{ color: netDC > 0 ? '#ff6b6b' : '#54e6a0' }}>{netDC > 0 ? netDC.toFixed(2) + ' µC' : 'balanced'}</b> net DC / pulse</span>
      </div>

      <div className="lifsim-cell lifsim-cell-wide" style={{ marginBottom: 14 }}>
        <div className="lifsim-cap">Pulse shape (one cycle)</div>
        <canvas ref={shapeRef} className="lifsim-canvas" style={{ height: 170 }} />
      </div>
      <div className="lifsim-grid">
        <div className="lifsim-cell"><div className="lifsim-cap">Pulse train (frequency)</div><canvas ref={trainRef} className="lifsim-canvas" style={{ height: 150 }} /></div>
        <div className="lifsim-cell"><div className="lifsim-cap">Shannon safety plot</div><canvas ref={shanRef} className="lifsim-canvas" style={{ height: 150 }} /></div>
      </div>

      <div className="wav-modes">
        <span className="wav-modelabel">waveform</span>
        <button className={`wav-modebtn${wave === 'mono' ? ' on' : ''}`} onClick={() => setWave('mono')}>monophasic</button>
        <button className={`wav-modebtn${wave === 'sym' ? ' on' : ''}`} onClick={() => setWave('sym')}>biphasic symmetric</button>
        <button className={`wav-modebtn${wave === 'asym' ? ' on' : ''}`} onClick={() => setWave('asym')}>biphasic asymmetric</button>
      </div>

      <div className="lifsim-controls">
        <label><span>amplitude <i>I</i> = {amp.toFixed(1)} mA</span>
          <input type="range" min={0.1} max={6} step={0.1} value={amp} onChange={(e) => setAmp(+e.target.value)} /></label>
        <label><span>pulse width <i>PW</i> = {pw} µs</span>
          <input type="range" min={20} max={450} step={10} value={pw} onChange={(e) => setPw(+e.target.value)} /></label>
        <label><span>frequency = {freq} Hz</span>
          <input type="range" min={2} max={250} step={1} value={freq} onChange={(e) => setFreq(+e.target.value)} /></label>
        <label><span>electrode area = {area} mm²</span>
          <input type="range" min={1} max={12} step={0.5} value={area} onChange={(e) => setArea(+e.target.value)} /></label>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> A typical DBS setting (≈3 mA, 90 µs, 130 Hz on a 6 mm² contact) sits comfortably in the <span style={{ color: '#54e6a0' }}>safe</span> zone. Now crank the <b>amplitude</b> and <b>pulse width</b> up and shrink the <b>electrode area</b>: the charge per phase and charge density climb, the operating point crosses the <span style={{ color: '#ff6b6b' }}>k = 2.0</span> Shannon line, and the verdict flips to UNSAFE, the same calculation used to set stimulation limits. Switch to <b>monophasic</b> and note the <span style={{ color: '#ff6b6b' }}>net DC charge</span> per pulse: uncompensated charge corrodes electrodes and damages tissue, which is why real devices use charge-balanced <b>biphasic</b> pulses (a short high-amplitude cathodic phase plus a long low-amplitude recharge).</p>
      </div>
    </div>
  )
}
