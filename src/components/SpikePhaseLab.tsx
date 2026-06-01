import { useEffect, useRef, useState } from 'react'

// Interactive demo of spike–phase coupling between subthalamic single units and
// a cortical theta–alpha oscillation. STN spikes are generated with a phase
// preference (concentration kappa) relative to the cortical rhythm; the demo
// reports the phase-locking value (PLV) and the preferred phase.

const FOSC = 7 // cortical theta–alpha frequency (Hz)

export default function SpikePhaseLab() {
  const traceRef = useRef<HTMLCanvasElement>(null)
  const polarRef = useRef<HTMLCanvasElement>(null)

  const [kappa, setKappa] = useState(2.2) // coupling strength (von Mises concentration)
  const [offset, setOffset] = useState(0) // preferred-phase offset (ms)
  const [rate, setRate] = useState(35)    // STN firing rate (Hz)
  const [freq, setFreq] = useState(FOSC)  // cortical oscillation frequency (Hz)
  const [running, setRunning] = useState(true)
  const [stats, setStats] = useState({ plv: 0, pref: 0 })

  const P = useRef({ kappa, offset, rate, freq, running })
  P.current = { kappa, offset, rate, freq, running }
  const statRef = useRef({ plv: 0, pref: 0 })

  useEffect(() => {
    const tc = traceRef.current, pc = polarRef.current
    if (!tc || !pc) return
    const tx = tc.getContext('2d')!, px = pc.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const fit = (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const fitAll = () => { fit(tc, tx); fit(pc, px) }
    fitAll()
    const ro = new ResizeObserver(fitAll); ro.observe(tc); ro.observe(pc)

    const dt = 0.001, winS = 1.2, N = Math.round(winS / dt) // 1.2 s window, 1 ms steps
    const wave = new Float32Array(N), spk = new Uint8Array(N)
    let head = 0, tS = 0, raf = 0
    const phases: number[] = [] // recent spike phases (rad)

    const drawTrace = () => {
      const W = tc.clientWidth, H = tc.clientHeight, mid = H * 0.5, amp = H * 0.32
      tx.clearRect(0, 0, W, H)
      tx.strokeStyle = '#9b8cff'; tx.lineWidth = 2; tx.beginPath()
      for (let i = 0; i < N; i++) { const idx = (head + i) % N; const x = (i / (N - 1)) * W; const y = mid - wave[idx] * amp; i ? tx.lineTo(x, y) : tx.moveTo(x, y) }
      tx.stroke()
      tx.strokeStyle = '#ff2d8f'; tx.lineWidth = 2; tx.beginPath()
      for (let i = 0; i < N; i++) { const idx = (head + i) % N; if (spk[idx]) { const x = (i / (N - 1)) * W; tx.moveTo(x, mid - amp - 10); tx.lineTo(x, mid - amp - 26) } }
      tx.stroke()
      tx.fillStyle = '#9b8cff'; tx.font = '11px monospace'; tx.fillText('cortical oscillation', 6, 14)
      tx.fillStyle = '#ff2d8f'; tx.fillText('STN spikes', 6, H - 8)
    }

    const drawPolar = () => {
      const W = pc.clientWidth, H = pc.clientHeight, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.40
      px.clearRect(0, 0, W, H)
      px.strokeStyle = 'rgba(255,255,255,0.14)'; px.lineWidth = 1
      px.beginPath(); px.arc(cx, cy, R, 0, 2 * Math.PI); px.stroke()
      px.beginPath(); px.moveTo(cx - R, cy); px.lineTo(cx + R, cy); px.moveTo(cx, cy - R); px.lineTo(cx, cy + R); px.stroke()
      const B = 18, bins = new Array(B).fill(0)
      phases.forEach((ph) => { let a = ph % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; bins[Math.floor((a / (2 * Math.PI)) * B) % B]++ })
      const mx = Math.max(1, ...bins)
      px.strokeStyle = '#ff4d8d'; px.lineWidth = Math.max(4, (2 * Math.PI * R) / B - 4)
      for (let k = 0; k < B; k++) {
        const a = ((k + 0.5) / B) * 2 * Math.PI, len = (bins[k] / mx) * R
        px.beginPath(); px.moveTo(cx, cy); px.lineTo(cx + Math.cos(a) * len, cy - Math.sin(a) * len); px.stroke()
      }
      let sx = 0, sy = 0; phases.forEach((ph) => { sx += Math.cos(ph); sy += Math.sin(ph) })
      const n = phases.length || 1, plv = Math.sqrt(sx * sx + sy * sy) / n, ang = Math.atan2(sy, sx)
      px.strokeStyle = '#22e1ff'; px.lineWidth = 2.5; px.beginPath(); px.moveTo(cx, cy); px.lineTo(cx + Math.cos(ang) * plv * R, cy - Math.sin(ang) * plv * R); px.stroke()
      px.fillStyle = '#22e1ff'; px.beginPath(); px.arc(cx + Math.cos(ang) * plv * R, cy - Math.sin(ang) * plv * R, 3.5, 0, 2 * Math.PI); px.fill()
      px.fillStyle = 'rgba(233,235,251,0.6)'; px.font = '10px monospace'; px.fillText('phase 0', cx + R - 6, cy + 13); px.fillText('π/2', cx + 4, cy - R + 12)
      statRef.current = { plv, pref: ((ang * 180 / Math.PI) + 360) % 360 }
    }

    const loop = () => {
      if (P.current.running) {
        const fosc = P.current.freq
        const phiPref = 2 * Math.PI * fosc * (P.current.offset / 1000) // offset -> preferred-phase shift
        for (let s = 0; s < 16; s++) {
          const phase = 2 * Math.PI * fosc * tS
          wave[head] = Math.sin(phase)
          const m = Math.exp(P.current.kappa * (Math.cos(phase - phiPref) - 1)) // bounded in (0,1]
          let fired = 0
          if (Math.random() < P.current.rate * m * dt) { fired = 1; let a = phase % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; phases.push(a); if (phases.length > 180) phases.shift() }
          spk[head] = fired; head = (head + 1) % N; tS += dt
        }
      }
      drawTrace(); drawPolar()
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
          <div className="lifsim-title">Interactive lab — spike–phase coupling</div>
          <div className="lifsim-sub">Subthalamic single units lock their spikes to the phase of a cortical oscillation (adjustable from δ to γ). The <b>phase-locking value</b> (PLV) measures how tightly the spikes concentrate at a particular phase, and the <b>preferred phase</b> is where they cluster.</div>
        </div>
        <div className="lifsim-rate"><b>{stats.plv.toFixed(2)}</b><span>PLV</span></div>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip cy"><b>{stats.plv.toFixed(2)}</b> phase-locking (PLV)</span>
        <span className="ilab-chip mag"><b>{stats.pref.toFixed(0)}°</b> preferred phase</span>
      </div>

      <div className="lifsim-grid">
        <div className="lifsim-cell lifsim-cell-wide">
          <div className="lifsim-cap">Cortical oscillation <span className="sub">(violet)</span> &amp; phase-locked STN spikes <span className="sub">(pink)</span></div>
          <canvas ref={traceRef} className="lifsim-canvas lifsim-trace" />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Spike phase histogram &amp; mean vector (length = PLV)</div>
          <canvas ref={polarRef} className="lifsim-canvas lifsim-square" />
        </div>
        <div className="lifsim-cell">
          <div className="lifsim-cap">Coupling strength &amp; preferred phase</div>
          <div className="spc-gauge">
            <div className="spc-gauge-num">{stats.plv.toFixed(2)}<span>PLV</span></div>
            <div className="spc-gauge-bar"><span style={{ width: `${stats.plv * 100}%` }} /></div>
            <div className="spc-gauge-note">Preferred phase: <b>{stats.pref.toFixed(0)}°</b>. PLV near <b>1</b> means tight phase-locking; near <b>0</b> means no coupling. The phase-offset slider rotates the preferred phase.</div>
          </div>
        </div>
      </div>

      <div className="lifsim-controls">
        <label><span>oscillation frequency = {freq} Hz · {freq < 4 ? 'δ' : freq < 8 ? 'θ' : freq <= 12 ? 'α' : freq <= 30 ? 'β' : 'γ'}</span>
          <input type="range" min={2} max={40} step={1} value={freq} onChange={(e) => setFreq(+e.target.value)} /></label>
        <label><span>coupling strength <i>κ</i> = {kappa.toFixed(1)} {kappa < 0.3 ? '· no locking' : ''}</span>
          <input type="range" min={0} max={5} step={0.1} value={kappa} onChange={(e) => setKappa(+e.target.value)} /></label>
        <label><span>phase offset = {offset} ms</span>
          <input type="range" min={0} max={40} step={1} value={offset} onChange={(e) => setOffset(+e.target.value)} /></label>
        <label><span>STN firing rate = {rate} Hz</span>
          <input type="range" min={5} max={80} step={1} value={rate} onChange={(e) => setRate(+e.target.value)} /></label>
        <button className="btn ghost lifsim-btn" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> Raise <i>κ</i>: the spikes concentrate at one phase of the cortical wave, the histogram forms a tight cluster, and the cyan mean-vector (and the PLV) grows toward 1, strong phase-locking. Lower <i>κ</i> toward 0 and the spikes spread uniformly over all phases, so the PLV collapses. The <b>phase-offset</b> slider rotates where the spikes prefer to fire, changing the preferred phase without changing the locking strength.</p>
      </div>
    </div>
  )
}
