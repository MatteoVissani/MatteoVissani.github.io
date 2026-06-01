import { useEffect, useRef, useState } from 'react'

// Interactive adaptive leaky integrate-and-fire neuron, integrated live in the
// browser with the Euler–Maruyama scheme. Shows the voltage + adaptation trace,
// the (V, w) phase plane with nullclines, and the f–I input–output curve.
//
//   tau_m dV/dt = -(V - EL) + RI - w + noise ;   spike at Vth -> V=Vr, w += b
//   tau_w dw/dt = -w
//
// b = 0 recovers the pure LIF neuron; b > 0 gives spike-frequency adaptation.

const EL = -70, Vth = -50, Vr = -65 // mV

function gauss() {
  let u = 0, w = 0
  while (u === 0) u = Math.random()
  while (w === 0) w = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w)
}

// quick simulation sweep to measure the f–I curve for the current parameters
function measureFI(b: number, tauw: number, sigma: number, taum: number) {
  const dt = 0.5, out: { x: number; y: number }[] = []
  for (let drive = 0; drive <= 45.01; drive += 1.5) {
    let v = EL, w = 0, spikes = 0
    const burn = 400, T = 1400, n = Math.round((burn + T) / dt)
    for (let k = 0; k < n; k++) {
      const noise = sigma * Math.sqrt(dt / taum) * gauss()
      v += (-(v - EL) + drive - w) / taum * dt + noise
      w += (-w) / tauw * dt
      if (v >= Vth) { v = Vr; w += b; if (k * dt > burn) spikes++ }
    }
    out.push({ x: drive, y: (spikes / T) * 1000 })
  }
  return out
}

export default function LIFSim() {
  const traceRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef<HTMLCanvasElement>(null)
  const fiRef = useRef<HTMLCanvasElement>(null)

  const [drive, setDrive] = useState(28)
  const [sigma, setSigma] = useState(1.5)
  const [b, setB] = useState(4)       // adaptation increment (mV)
  const [tauw, setTauw] = useState(150) // adaptation timescale (ms)
  const [taum, setTaum] = useState(20)  // membrane time constant (ms)
  const [running, setRunning] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [rate, setRate] = useState(0)

  const P = useRef({ drive, sigma, b, tauw, taum, running })
  P.current = { drive, sigma, b, tauw, taum, running }
  const fi = useRef<{ x: number; y: number }[]>([])

  // recompute the f–I curve (debounced) when shape parameters change
  useEffect(() => {
    const id = setTimeout(() => { fi.current = measureFI(b, tauw, sigma, taum) }, 150)
    return () => clearTimeout(id)
  }, [b, tauw, sigma, taum])

  useEffect(() => {
    const tc = traceRef.current, pc = phaseRef.current, fc = fiRef.current
    if (!tc || !pc || !fc) return
    const tx = tc.getContext('2d')!, px = pc.getContext('2d')!, fx = fc.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const fit = (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const fitAll = () => { fit(tc, tx); fit(pc, px); fit(fc, fx) }
    fitAll()
    const ro = new ResizeObserver(fitAll); ro.observe(tc); ro.observe(pc); ro.observe(fc)

    const dt = 0.5, winMs = 800, N = Math.round(winMs / dt)
    const V = new Float32Array(N).fill(EL), W = new Float32Array(N), spk = new Uint8Array(N)
    let head = 0, v = EL, w = 0, tms = 0, raf = 0
    const spikeTimes: number[] = []
    const orbit: [number, number][] = [] // recent (V,w) for phase plane
    let wseen = 6

    const drawTrace = () => {
      const W0 = tc.clientWidth, H = tc.clientHeight
      const vmin = EL - 8, vmax = Vth + 22
      const yV = (val: number) => H - ((val - vmin) / (vmax - vmin)) * H
      tx.clearRect(0, 0, W0, H)
      tx.lineWidth = 1; tx.setLineDash([5, 4]); tx.strokeStyle = 'rgba(255,45,143,0.55)'
      tx.beginPath(); tx.moveTo(0, yV(Vth)); tx.lineTo(W0, yV(Vth)); tx.stroke(); tx.setLineDash([])
      // adaptation current w(t), scaled, amber
      tx.lineWidth = 1.6; tx.strokeStyle = 'rgba(255,194,77,0.9)'; tx.beginPath()
      for (let i = 0; i < N; i++) { const idx = (head + i) % N; const x = (i / (N - 1)) * W0; const y = H - (W[idx] / 30) * H * 0.5; i ? tx.lineTo(x, y) : tx.moveTo(x, y) }
      tx.stroke()
      // membrane V(t), cyan glow
      tx.lineWidth = 2; tx.strokeStyle = '#22e1ff'; tx.shadowColor = 'rgba(34,225,255,0.5)'; tx.shadowBlur = 6; tx.beginPath()
      for (let i = 0; i < N; i++) { const idx = (head + i) % N; const x = (i / (N - 1)) * W0; const y = yV(V[idx]); i ? tx.lineTo(x, y) : tx.moveTo(x, y) }
      tx.stroke(); tx.shadowBlur = 0
      tx.strokeStyle = '#ff2d8f'; tx.lineWidth = 2; tx.beginPath()
      for (let i = 0; i < N; i++) { const idx = (head + i) % N; if (spk[idx]) { const x = (i / (N - 1)) * W0; tx.moveTo(x, yV(Vth)); tx.lineTo(x, yV(Vth) - 15) } }
      tx.stroke()
      tx.fillStyle = '#22e1ff'; tx.font = '11px monospace'; tx.fillText('V(t)', 6, 14)
      tx.fillStyle = 'rgba(255,194,77,0.95)'; tx.fillText('w(t) adaptation', 46, 14)
    }

    const drawPhase = () => {
      const W0 = pc.clientWidth, H = pc.clientHeight
      const vmin = EL - 8, vmax = Vth + 6
      wseen = Math.max(wseen * 0.999, ...orbit.map((o) => o[1]), 6)
      const wmax = wseen * 1.15 + 2, wmin = -2
      const X = (val: number) => ((val - vmin) / (vmax - vmin)) * W0
      const Y = (val: number) => H - ((val - wmin) / (wmax - wmin)) * H
      px.clearRect(0, 0, W0, H)
      // V-nullcline: w = drive - (V - EL)
      px.strokeStyle = 'rgba(34,225,255,0.6)'; px.lineWidth = 1.5; px.setLineDash([6, 4]); px.beginPath()
      px.moveTo(X(vmin), Y(P.current.drive - (vmin - EL))); px.lineTo(X(vmax), Y(P.current.drive - (vmax - EL))); px.stroke()
      // w-nullcline: w = 0
      px.strokeStyle = 'rgba(255,194,77,0.6)'; px.beginPath(); px.moveTo(X(vmin), Y(0)); px.lineTo(X(vmax), Y(0)); px.stroke(); px.setLineDash([])
      // threshold + reset verticals
      px.strokeStyle = 'rgba(255,45,143,0.5)'; px.beginPath(); px.moveTo(X(Vth), 0); px.lineTo(X(Vth), H); px.stroke()
      // orbit
      px.strokeStyle = '#e9ebfb'; px.lineWidth = 1.4; px.globalAlpha = 0.85; px.beginPath()
      orbit.forEach(([ov, ow], i) => { const x = X(ov), y = Y(ow); i ? px.lineTo(x, y) : px.moveTo(x, y) }); px.stroke(); px.globalAlpha = 1
      // current point
      px.fillStyle = '#ff2d8f'; px.beginPath(); px.arc(X(v), Y(w), 4, 0, 2 * Math.PI); px.fill()
      px.fillStyle = 'var(--text)'; px.font = '11px monospace'
      px.fillStyle = 'rgba(233,235,251,0.7)'; px.fillText('V →', W0 - 30, H - 6); px.save(); px.translate(10, 16); px.fillText('w ↑', 0, 0); px.restore()
      px.fillStyle = 'rgba(34,225,255,0.8)'; px.fillText('V-nullcline', 12, H - 8)
    }

    const drawFI = () => {
      const W0 = fc.clientWidth, H = fc.clientHeight, pad = 6
      const xmax = 45, ymax = Math.max(60, ...fi.current.map((d) => d.y)) * 1.1
      const X = (val: number) => pad + (val / xmax) * (W0 - 2 * pad)
      const Y = (val: number) => H - pad - (val / ymax) * (H - 2 * pad)
      fx.clearRect(0, 0, W0, H)
      // curve
      fx.strokeStyle = '#9b8cff'; fx.lineWidth = 2; fx.beginPath()
      fi.current.forEach((d, i) => { const x = X(d.x), y = Y(d.y); i ? fx.lineTo(x, y) : fx.moveTo(x, y) }); fx.stroke()
      // operating point at current drive
      let yr = 0
      for (let i = 1; i < fi.current.length; i++) {
        const a = fi.current[i - 1], c = fi.current[i]
        if (P.current.drive >= a.x && P.current.drive <= c.x) { const t = (P.current.drive - a.x) / (c.x - a.x); yr = a.y + t * (c.y - a.y) }
      }
      fx.strokeStyle = 'rgba(255,255,255,0.25)'; fx.setLineDash([3, 3]); fx.beginPath(); fx.moveTo(X(P.current.drive), H - pad); fx.lineTo(X(P.current.drive), Y(yr)); fx.stroke(); fx.setLineDash([])
      fx.fillStyle = '#ff2d8f'; fx.beginPath(); fx.arc(X(P.current.drive), Y(yr), 4, 0, 2 * Math.PI); fx.fill()
      fx.fillStyle = 'rgba(233,235,251,0.7)'; fx.font = '11px monospace'; fx.fillText('rate (Hz)', 8, 14); fx.fillText('drive R·I →', W0 - 78, H - 6)
    }

    const loop = () => {
      if (P.current.running) {
        for (let s = 0; s < 8; s++) {
          const noise = P.current.sigma * Math.sqrt(dt / P.current.taum) * gauss()
          v += (-(v - EL) + P.current.drive - w) / P.current.taum * dt + noise
          w += (-w) / P.current.tauw * dt
          let fired = 0
          if (v >= Vth) { v = Vr; w += P.current.b; fired = 1; spikeTimes.push(tms) }
          V[head] = v; W[head] = w; spk[head] = fired; head = (head + 1) % N; tms += dt
          orbit.push([v, w]); if (orbit.length > 600) orbit.shift()
        }
        while (spikeTimes.length && spikeTimes[0] < tms - 1000) spikeTimes.shift()
      }
      drawTrace(); drawPhase(); drawFI()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const id = setInterval(() => setRate(spikeTimes.length), 400)
    return () => { cancelAnimationFrame(raf); clearInterval(id); ro.disconnect() }
  }, [])

  const rheobase = 20
  return (
    <div className={`lifsim panel${expanded ? ' lifsim-expanded' : ''}`}>
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — the (adaptive) integrate-and-fire neuron</div>
          <div className="lifsim-sub">A live Euler–Maruyama simulation of <i>τ<sub>m</sub> V̇ = −(V−E<sub>L</sub>) + R·I − w</i>, with adaptation <i>τ<sub>w</sub> ẇ = −w</i> and a spike-triggered jump <i>w → w + b</i>. Set <b>b = 0</b> for a pure LIF neuron; raise <b>b</b> to see spike-frequency adaptation.</div>
        </div>
        <div className="lifsim-headright">
          <div className="lifsim-rate"><b>{rate}</b><span>Hz</span></div>
          <button className="lifsim-expand" onClick={() => setExpanded((e) => !e)}>{expanded ? '✕ Close' : '⤢ Expand'}</button>
        </div>
      </div>

      <div className="lifsim-grid">
        <div className="lifsim-cell lifsim-cell-wide">
          <div className="lifsim-cap">Membrane potential <span className="cy">V(t)</span> &amp; adaptation <span className="am">w(t)</span></div>
          <canvas ref={traceRef} className="lifsim-canvas lifsim-trace" />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Phase plane <span className="sub">(V, w)</span> with nullclines</div>
          <canvas ref={phaseRef} className="lifsim-canvas lifsim-square" />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Input–output (f–I) curve</div>
          <canvas ref={fiRef} className="lifsim-canvas lifsim-square" />
        </div>
      </div>

      <div className="lifsim-controls">
        <label><span>input drive <i>R·I</i> = {drive} mV {drive < rheobase ? '· sub-threshold' : '· supra-threshold'}</span>
          <input type="range" min={0} max={45} step={1} value={drive} onChange={(e) => setDrive(+e.target.value)} /></label>
        <label><span>noise <i>σ</i> = {sigma} mV</span>
          <input type="range" min={0} max={8} step={0.5} value={sigma} onChange={(e) => setSigma(+e.target.value)} /></label>
        <label><span>adaptation <i>b</i> = {b} mV {b === 0 ? '· (pure LIF)' : ''}</span>
          <input type="range" min={0} max={10} step={0.5} value={b} onChange={(e) => setB(+e.target.value)} /></label>
        <label><span>adapt. timescale <i>τ<sub>w</sub></i> = {tauw} ms</span>
          <input type="range" min={40} max={300} step={10} value={tauw} onChange={(e) => setTauw(+e.target.value)} /></label>
        <label><span>membrane <i>τ<sub>m</sub></i> = {taum} ms</span>
          <input type="range" min={5} max={40} step={1} value={taum} onChange={(e) => setTaum(+e.target.value)} /></label>
        <button className="btn ghost lifsim-btn" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> (1) With <i>b</i>=0, sweep the <b>drive</b>: below the rheobase (20 mV) the neuron is silent; above it, it fires periodically and faster, read this off the <b>f–I curve</b>, whose operating point (pink dot) follows your slider. (2) Add <b>noise</b> while keeping the drive just below threshold: the neuron fires irregularly on fluctuations, and the f–I curve’s sharp corner rounds off. (3) Increase the <b>adaptation</b> <i>b</i>: each spike kicks <span className="am">w</span> upward (amber), which subtracts from the drive, so the intervals lengthen and the f–I curve flattens, spike-frequency adaptation. (4) In the <b>phase plane</b>, the trajectory rides up the cyan <i>V</i>-nullcline toward threshold, resets leftward, and is pushed up by <i>b</i> at every spike.</p>
      </div>
    </div>
  )
}
