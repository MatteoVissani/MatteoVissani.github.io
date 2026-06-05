import { useEffect, useRef, useState } from 'react'

// Kuramoto model: N phase oscillators with spread natural frequencies, coupled
//   θ̇ᵢ = ωᵢ + (K/N) Σⱼ sin(θⱼ − θᵢ) = ωᵢ + K·r·sin(ψ − θᵢ)
// where the order parameter  r·e^{iψ} = (1/N) Σ e^{iθ}  measures synchrony.
// Above a critical coupling the population spontaneously locks; a desynchronizing
// pulse (coordinated-reset DBS) shatters the synchrony.

const N = 72

export default function KuramotoLab() {
  const [K, setK] = useState(1.6)
  const [spread, setSpread] = useState(0.7)
  const [info, setInfo] = useState({ r: 0 })
  const circ = useRef<HTMLCanvasElement>(null)
  const trace = useRef<HTMLCanvasElement>(null)
  const par = useRef({ K, spread }); par.current = { K, spread }
  const sim = useRef<{ th: number[]; z: number[]; hist: { t: number; r: number; s: number }[]; t: number; kick: boolean }>({ th: [], z: [], hist: [], t: 0, kick: false })

  // init oscillators
  useEffect(() => {
    const s = sim.current
    s.th = Array.from({ length: N }, () => Math.random() * 2 * Math.PI)
    // deterministic spread: standard-normal-ish quantiles
    s.z = Array.from({ length: N }, (_, i) => { const u = (i + 0.5) / N; return Math.sqrt(2) * erfinv(2 * u - 1) })
    for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[s.z[i], s.z[j]] = [s.z[j], s.z[i]] }
    s.hist = []; s.t = 0
  }, [])

  const kick = () => { sim.current.kick = true }

  // simulation + draw
  useEffect(() => {
    const cc = circ.current, tc = trace.current; if (!cc || !tc) return
    const ctxA = cc.getContext('2d'), ctxB = tc.getContext('2d'); if (!ctxA || !ctxB) return
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const fit = (cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(cc, ctxA); fit(tc, ctxB); const ro = new ResizeObserver(() => { fit(cc, ctxA); fit(tc, ctxB) }); ro.observe(cc); ro.observe(tc)
    let raf = 0; const WIN = 10
    const step = (dt: number) => {
      const s = sim.current, { K, spread } = par.current
      if (s.kick) { s.th = s.th.map(() => Math.random() * 2 * Math.PI); s.kick = false }   // desync pulse
      let sc = 0, ss = 0; for (const t of s.th) { sc += Math.cos(t); ss += Math.sin(t) }
      const r = Math.hypot(sc, ss) / N, psi = Math.atan2(ss, sc)
      for (let i = 0; i < N; i++) s.th[i] += (1 + spread * s.z[i] + K * r * Math.sin(psi - s.th[i])) * dt
      s.t += dt; s.hist.push({ t: s.t, r, s: ss / N }); while (s.hist.length && s.hist[0].t < s.t - WIN) s.hist.shift()
      return { r, psi }
    }
    let frame = 0
    const loop = () => {
      let r = 0, psi = 0
      for (let k = 0; k < 2; k++) { const o = step(0.03); r = o.r; psi = o.psi }
      const s = sim.current
      // ---- phase circle ----
      const W = cc.clientWidth, H = cc.clientHeight, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 22
      ctxA.clearRect(0, 0, W, H)
      ctxA.strokeStyle = 'rgba(255,255,255,0.14)'; ctxA.lineWidth = 1.5; ctxA.beginPath(); ctxA.arc(cx, cy, R, 0, 7); ctxA.stroke()
      for (let i = 0; i < N; i++) { const th = s.th[i], x = cx + R * Math.cos(th), y = cy - R * Math.sin(th); const c = (s.z[i] + 2.4) / 4.8; ctxA.fillStyle = `hsl(${180 + c * 150}, 80%, 62%)`; ctxA.beginPath(); ctxA.arc(x, y, 4.2, 0, 7); ctxA.fill() }
      // mean-field arrow
      ctxA.strokeStyle = '#fff'; ctxA.fillStyle = '#fff'; ctxA.lineWidth = 2.5; ctxA.beginPath(); ctxA.moveTo(cx, cy); ctxA.lineTo(cx + R * r * Math.cos(psi), cy - R * r * Math.sin(psi)); ctxA.stroke()
      ctxA.beginPath(); ctxA.arc(cx + R * r * Math.cos(psi), cy - R * r * Math.sin(psi), 4, 0, 7); ctxA.fill()
      ctxA.fillStyle = 'rgba(233,235,251,0.85)'; ctxA.font = 'bold 13px monospace'; ctxA.textAlign = 'center'
      ctxA.fillText(`order parameter  r = ${r.toFixed(2)}`, cx, H - 8)
      ctxA.fillStyle = r > 0.55 ? '#54e6a0' : r > 0.25 ? '#ffb84d' : '#ff6b6b'; ctxA.font = '11px monospace'
      ctxA.fillText(r > 0.55 ? 'synchronized' : r > 0.25 ? 'partially locked' : 'incoherent', cx, 16)
      // ---- traces ----
      const w = tc.clientWidth, h = tc.clientHeight; ctxB.clearRect(0, 0, w, h)
      ctxB.strokeStyle = 'rgba(255,255,255,0.07)'; for (let g = 0; g <= 4; g++) { const y = (g / 4) * h; ctxB.beginPath(); ctxB.moveTo(0, y); ctxB.lineTo(w, y); ctxB.stroke() }
      const X = (t: number) => ((t - (s.t - WIN)) / WIN) * w
      const Yr = (v: number) => h - 4 - v * (h - 8)                  // r in [0,1] bottom
      const Ys = (v: number) => h * 0.5 - v * (h * 0.42)             // signal centered
      ctxB.strokeStyle = 'rgba(34,225,255,0.7)'; ctxB.lineWidth = 1.5; ctxB.beginPath(); s.hist.forEach((p, i) => { const x = X(p.t), y = Ys(p.s); i ? ctxB.lineTo(x, y) : ctxB.moveTo(x, y) }); ctxB.stroke()
      ctxB.strokeStyle = '#54e6a0'; ctxB.lineWidth = 2; ctxB.beginPath(); s.hist.forEach((p, i) => { const x = X(p.t), y = Yr(p.r); i ? ctxB.lineTo(x, y) : ctxB.moveTo(x, y) }); ctxB.stroke()
      ctxB.fillStyle = 'rgba(215,218,230,0.75)'; ctxB.font = '10px monospace'; ctxB.textAlign = 'left'
      ctxB.fillText('— population signal  (1/N)Σ sin θ  (an LFP)', 8, 13)
      ctxB.fillStyle = '#54e6a0'; ctxB.fillText('— synchrony r(t)', 8, h - 7)
      if (frame % 6 === 0) setInfo({ r })
      frame++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop); return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <div className="lifsim panel ss">
      <div className="lifsim-head"><div>
        <div className="lifsim-title">The Kuramoto model — how a population synchronizes</div>
        <div className="lifsim-sub">{N} oscillators, each ticking at its own natural frequency. Each one feels a pull toward the average phase with strength <b>K</b>. Below a critical coupling they drift incoherently; above it they spontaneously <b>lock</b> and a collective rhythm appears — the toy model of neural synchrony, seizures, and the target of desynchronizing stimulation.</div>
      </div></div>

      <div className="ss-sysbar">
        <label className="ss-rng" style={{ minWidth: 250 }}>coupling K <input type="range" min={0} max={4} step={0.05} value={K} onChange={(e) => setK(+e.target.value)} /><b>{K.toFixed(2)}</b></label>
        <label className="ss-rng" style={{ minWidth: 250 }}>frequency spread <input type="range" min={0.05} max={2} step={0.05} value={spread} onChange={(e) => setSpread(+e.target.value)} /><b>{spread.toFixed(2)}</b></label>
        <button className="wav-modebtn cl-clear" onClick={kick}>⚡ desync pulse</button>
        <span className="ss-tag">r = {info.r.toFixed(2)} · K꜀ ≈ {(1.6 * spread).toFixed(2)}</span>
      </div>

      <div className="ss-concepts">
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">The population</span> <b>phases on the circle</b></div>
          <p className="ss-def">Each dot is an oscillator’s phase (coloured by its natural frequency). The <b style={{ color: '#fff' }}>white arrow</b> is the mean field — its length is the order parameter <b>r</b>. Clumped dots → long arrow → synchronized; evenly spread → arrow ≈ 0 → incoherent.</p>
          <canvas ref={circ} className="ss-canvas" style={{ height: 250 }} />
        </div>
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">What you’d record</span> <b>synchrony &amp; the population signal</b></div>
          <p className="ss-def">The summed activity <b style={{ color: '#22e1ff' }}>(1/N)Σ sin θ</b> is what an electrode would see: flat noise when incoherent, a strong rhythm when locked. The <b style={{ color: '#54e6a0' }}>green</b> trace is r(t). Raise K past K꜀ and watch the rhythm switch on.</p>
          <canvas ref={trace} className="ss-canvas" style={{ height: 250 }} />
        </div>
      </div>

      <div className="lifsim-explain">
        <p><b>The phase transition.</b> For a spread of natural frequencies there is a <b>critical coupling K꜀</b> (∝ the spread): below it the order parameter <T>r</T> hovers near zero (only chance alignment, <T>r ∼ 1/√N</T>); above it a fraction of the oscillators entrain into a single collective rhythm and <T>r</T> jumps up — a continuous phase transition. Crank <b>K</b> through K꜀, or widen the <b>frequency spread</b> (which raises K꜀, demanding stronger coupling to lock).</p>
        <p><b>The neuro / DBS connection.</b> Pathological synchrony — the hypersynchronous beta of Parkinson’s, or a seizure — is exactly a population sitting in the high-<T>r</T> state. The <b>⚡ desync pulse</b> scrambles the phases, collapsing <T>r</T> to zero; if the coupling is strong the population fights back and re-locks, if it is near K꜀ it stays scattered. That is the principle behind <b>coordinated-reset</b> and phase-locked deep-brain stimulation: don’t fight the rhythm with constant current, just nudge the phases apart at the right moments.</p>
      </div>
    </div>
  )
}

// inverse error function (Winitzki approximation) for the frequency quantiles
function erfinv(x: number): number {
  const a = 0.147, ln = Math.log(1 - x * x), t = 2 / (Math.PI * a) + ln / 2
  return Math.sign(x) * Math.sqrt(Math.sqrt(t * t - ln / a) - t)
}

function T({ children }: { children: string }) { return <span className="ss-inl">{children}</span> }
