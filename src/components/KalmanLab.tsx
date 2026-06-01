import { useEffect, useRef, useState } from 'react'

// Kalman-filter brain–computer-interface decoder. An intended 2D cursor performs
// center-out reaches; the "neural" read-out is a noisy measurement of its
// position. A constant-velocity Kalman filter (state = [pos, vel] per axis)
// tracks the true trajectory far better than the raw, jittery measurement.

const TARGETS: [number, number][] = [[0, 0], ...Array.from({ length: 8 }, (_, k) => {
  const a = (k / 8) * 2 * Math.PI; return [0.8 * Math.cos(a), 0.8 * Math.sin(a)] as [number, number]
})]

export default function KalmanLab() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [rstd, setRstd] = useState(0.18)  // measurement noise (neural read-out)
  const [q, setQ] = useState(0.02)        // process noise (filter smoothness)
  const [running, setRunning] = useState(true)
  const [stats, setStats] = useState({ raw: 0, kal: 0 })

  const P = useRef({ rstd, q, running }); P.current = { rstd, q, running }
  const statRef = useRef({ raw: 0, kal: 0 })

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv)

    const dt = 0.045
    let tp = [0, 0], tv = [0, 0]          // true position / velocity
    let ti = 1, dwell = 0, seqOut = true  // target index, center-out toggle, dwell timer
    // Kalman state per axis: pos, vel, and covariance [P00,P01,P11]
    const kp = [0, 0], kv = [0, 0], C = [[0.1, 0, 0.1], [0.1, 0, 0.1]]
    const truePath: [number, number][] = [], kalPath: [number, number][] = [], meas: [number, number][] = []
    const errRaw: number[] = [], errKal: number[] = []
    let raf = 0

    const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }

    const step = () => {
      const R = P.current.rstd ** 2, qq = P.current.q
      const tgt = TARGETS[ti]
      // true cursor: spring toward target
      for (let d = 0; d < 2; d++) { const acc = 6.5 * (tgt[d] - tp[d]) - 3.2 * tv[d]; tv[d] += acc * dt; tp[d] += tv[d] * dt }
      const dist = Math.hypot(tp[0] - tgt[0], tp[1] - tgt[1])
      if (dist < 0.06) { dwell += dt; if (dwell > 0.25) { dwell = 0; if (seqOut) { ti = 0; seqOut = false } else { ti = 1 + Math.floor(Math.random() * 8); seqOut = true } } }
      // noisy neural measurement of position
      const z = [tp[0] + P.current.rstd * gauss(), tp[1] + P.current.rstd * gauss()]
      // Kalman per axis (constant-velocity model)
      for (let d = 0; d < 2; d++) {
        // predict
        const p = kp[d] + kv[d] * dt, v = kv[d]
        let [P00, P01, P11] = C[d]
        P00 = P00 + dt * 2 * P01 + dt * dt * P11 + qq * (dt ** 3) / 3
        P01 = P01 + dt * P11 + qq * (dt ** 2) / 2
        P11 = P11 + qq * dt
        // update with z[d]
        const S = P00 + R, K0 = P00 / S, K1 = P01 / S, innov = z[d] - p
        kp[d] = p + K0 * innov; kv[d] = v + K1 * innov
        C[d] = [(1 - K0) * P00, (1 - K0) * P01, P11 - K1 * P01]
      }
      truePath.push([tp[0], tp[1]]); kalPath.push([kp[0], kp[1]]); meas.push([z[0], z[1]])
      if (truePath.length > 220) truePath.shift(); if (kalPath.length > 220) kalPath.shift(); if (meas.length > 45) meas.shift()
      errRaw.push((z[0] - tp[0]) ** 2 + (z[1] - tp[1]) ** 2); errKal.push((kp[0] - tp[0]) ** 2 + (kp[1] - tp[1]) ** 2)
      if (errRaw.length > 200) { errRaw.shift(); errKal.shift() }
      statRef.current = { raw: Math.sqrt(errRaw.reduce((a, b) => a + b, 0) / errRaw.length), kal: Math.sqrt(errKal.reduce((a, b) => a + b, 0) / errKal.length) }
    }

    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, R = Math.min(W, H) / 2 - 16, cx = W / 2, cy = H / 2
      const X = (x: number) => cx + x * R, Y = (y: number) => cy - y * R
      ctx.clearRect(0, 0, W, H)
      // targets
      TARGETS.forEach((t, i) => { ctx.strokeStyle = i === ti ? '#ffc24d' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = i === ti ? 2 : 1; ctx.beginPath(); ctx.arc(X(t[0]), Y(t[1]), 11, 0, 2 * Math.PI); ctx.stroke() })
      // raw measurements
      ctx.fillStyle = 'rgba(255,45,143,0.5)'; meas.forEach((m) => { ctx.beginPath(); ctx.arc(X(m[0]), Y(m[1]), 2, 0, 2 * Math.PI); ctx.fill() })
      // true path
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); truePath.forEach((p, i) => { i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])) }); ctx.stroke()
      // kalman path
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(34,225,255,0.5)'; ctx.shadowBlur = 5; ctx.beginPath(); kalPath.forEach((p, i) => { i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])) }); ctx.stroke(); ctx.shadowBlur = 0
      // current points
      if (truePath.length) { const p = truePath[truePath.length - 1]; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 4, 0, 2 * Math.PI); ctx.fill() }
      if (kalPath.length) { const p = kalPath[kalPath.length - 1]; ctx.fillStyle = '#22e1ff'; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 5, 0, 2 * Math.PI); ctx.fill() }
      ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('● true', 8, 16); ctx.fillStyle = 'rgba(255,45,143,0.8)'; ctx.fillText('● neural read-out', 60, 16); ctx.fillStyle = '#22e1ff'; ctx.fillText('● Kalman estimate', 188, 16)
    }

    const loop = () => { if (P.current.running) { for (let s = 0; s < 2; s++) step() } draw(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    const id = setInterval(() => setStats({ ...statRef.current }), 350)
    return () => { cancelAnimationFrame(raf); clearInterval(id); ro.disconnect() }
  }, [])

  const improve = stats.kal > 0 ? stats.raw / stats.kal : 0
  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — Kalman-filter BCI decoder</div>
          <div className="lifsim-sub">An intended 2D cursor performs center-out reaches; the <b>neural read-out</b> is only a noisy measurement of its position. A constant-velocity <b>Kalman filter</b> fuses the noisy measurements with a movement model to recover a smooth, accurate trajectory, the core of a motor brain–computer interface.</div>
        </div>
        <div className="lifsim-rate"><b>{improve.toFixed(1)}×</b><span>better</span></div>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip mag"><b>{stats.raw.toFixed(3)}</b> raw read-out error</span>
        <span className="ilab-chip cy"><b>{stats.kal.toFixed(3)}</b> Kalman error</span>
        <span className="ilab-chip"><b>{improve.toFixed(1)}×</b> error reduction</span>
      </div>

      <div className="lifsim-cell lifsim-cell-wide">
        <div className="lifsim-cap">2D cursor: true path <span className="sub">(white)</span>, neural read-out <span className="sub">(pink)</span>, Kalman estimate <span className="sub">(cyan)</span></div>
        <canvas ref={cvRef} className="lifsim-canvas" style={{ height: 360 }} />
      </div>

      <div className="lifsim-controls">
        <label><span>measurement noise <i>σ</i> = {rstd.toFixed(2)} {rstd > 0.3 ? '· very noisy read-out' : ''}</span>
          <input type="range" min={0.03} max={0.45} step={0.01} value={rstd} onChange={(e) => setRstd(+e.target.value)} /></label>
        <label><span>process noise <i>q</i> = {q.toFixed(3)} {q < 0.005 ? '· stiff/laggy' : q > 0.06 ? '· loose/jittery' : ''}</span>
          <input type="range" min={0.001} max={0.1} step={0.001} value={q} onChange={(e) => setQ(+e.target.value)} /></label>
        <button className="btn ghost lifsim-btn" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
      </div>

      <div className="lifsim-explain">
        <p><b>What to try.</b> Crank up the <b>measurement noise</b>: the pink read-out scatters wildly, yet the cyan Kalman estimate still tracks the true path, the error-reduction factor (top right) climbs well above 1×. The <b>process noise</b> <i>q</i> tunes the filter's trust in its motion model: too low and it lags behind fast reaches (over-smoothing); too high and it chases every noisy measurement (under-smoothing). The sweet spot, matching the filter's assumed dynamics to the real movement, is exactly the tuning problem in a real BCI decoder.</p>
      </div>
    </div>
  )
}
