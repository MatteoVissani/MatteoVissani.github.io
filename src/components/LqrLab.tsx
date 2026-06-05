import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { lqr, eig2, subM, mul, fmt, type Mat } from './stateSpaceMath'

// LQR on a cart (position x₁, velocity x₂, force u). Drag the cart and LQR catches
// it. The point: you don't place poles, you pick a cost ∫(xᵀQx + Ru²); the effort
// penalty R slides you along the optimal effort-vs-error frontier, and you can
// watch where LQR puts the closed-loop poles on the symmetric root locus.

const A: Mat = [[0, 1], [0, 0]], B: Mat = [[0], [1]]

function metrics(K: number[], q: number) {
  let x = [1, 0], Ju = 0, Jx = 0, peak = 0, settle = 0; const dt = 0.01
  for (let i = 0; i < 1600; i++) {
    const t = i * dt, u = -(K[0] * x[0] + K[1] * x[1])
    Ju += u * u * dt; Jx += q * x[0] * x[0] * dt; peak = Math.max(peak, Math.abs(u))
    if (Math.hypot(x[0], x[1]) > 0.05) settle = t
    x = [x[0] + x[1] * dt, x[1] + u * dt]
  }
  return { Ju, Jx, peak, settle }
}

export default function LqrLab() {
  const [q, setQ] = useState(1)
  const [R, setR] = useState(1)
  const cartCv = useRef<HTMLCanvasElement>(null)
  const respCv = useRef<HTMLCanvasElement>(null)
  const rlCv = useRef<HTMLCanvasElement>(null)
  const tcCv = useRef<HTMLCanvasElement>(null)
  const sim = useRef({ x: [2.4, 0] as number[], grab: false, idle: 0 })

  const Q: Mat = [[q, 0], [0, 0]]   // penalise position error (gives the clean Butterworth locus)
  const des = useMemo(() => { const K = lqr(A, B, Q, [[R]]).K[0]; const m = metrics(K, q); return { K, eig: eig2(subM(A, mul(B, [K]))), ...m, J: m.Jx + R * m.Ju } }, [q, R])

  // symmetric root locus + Pareto frontier: sweep R at this Q
  const sweep = useMemo(() => {
    const poles: { re: number; im: number }[] = [], pareto: { R: number; Ju: number; Jx: number }[] = []
    for (let i = 0; i <= 44; i++) { const Rs = Math.pow(10, -2 + (i / 44) * 4); const K = lqr(A, B, Q, [[Rs]]).K[0]; const es = eig2(subM(A, mul(B, [K]))); poles.push(es[0], es[1]); const m = metrics(K, q); pareto.push({ R: Rs, Ju: m.Ju, Jx: m.Jx }) }
    return { poles, pareto }
  }, [q])

  // ----- cart: drag it, LQR brings it back -----
  const cmap = () => { const cv = cartCv.current!, W = cv.clientWidth, M = 40; return { W, M, X: (p: number) => W / 2 + p / 3.4 * (W / 2 - M), iX: (px: number) => (px - W / 2) / (W / 2 - M) * 3.4 } }
  const onDown = (e: PointerEvent) => { const cv = cartCv.current!, r = cv.getBoundingClientRect(), m = cmap(); if (Math.abs((e.clientX - r.left) - m.X(sim.current.x[0])) < 40) { sim.current.grab = true; cv.setPointerCapture(e.pointerId); onMove(e) } }
  const onMove = (e: PointerEvent) => { if (!sim.current.grab) return; const cv = cartCv.current!, r = cv.getBoundingClientRect(), m = cmap(); sim.current.x = [Math.max(-3.3, Math.min(3.3, m.iX(e.clientX - r.left))), 0] }
  const onUp = () => { sim.current.grab = false; sim.current.idle = 0 }

  useEffect(() => {
    const cv = cartCv.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv); let raf = 0
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, { M, X } = cmap(), trackY = H * 0.62, s = sim.current, K = des.K
      const dt = 0.016
      if (!s.grab) { const u = -(K[0] * s.x[0] + K[1] * s.x[1]); for (let k = 0; k < 3; k++) { s.x = [s.x[0] + s.x[1] * dt / 3, s.x[1] + u * dt / 3] } s.idle += dt; if (Math.hypot(s.x[0], s.x[1]) < 0.03 && s.idle > 1.4) { s.x = [(Math.random() * 2 - 1) * 3, 0]; s.idle = 0 } } else s.idle = 0
      const u = -(K[0] * s.x[0] + K[1] * s.x[1])
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M - 14, trackY + 16); ctx.lineTo(W - M + 14, trackY + 16); ctx.stroke()
      // target at 0
      ctx.strokeStyle = 'rgba(84,230,160,0.6)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(0), trackY - 26); ctx.lineTo(X(0), trackY + 16); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(84,230,160,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('target', X(0), trackY - 30)
      // cart
      const cx = X(s.x[0]), cw = 52, ch = 30
      ctx.fillStyle = s.grab ? '#2a3a6a' : '#18254a'; ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.roundRect(cx - cw / 2, trackY - ch, cw, ch, 6); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#0a0c13'; for (const wx of [-15, 15]) { ctx.beginPath(); ctx.arc(cx + wx, trackY + 4, 6, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke() }
      // force arrow
      if (Math.abs(u) > 0.05) { const al = Math.max(-70, Math.min(70, u * 9)), ay = trackY - ch / 2; ctx.strokeStyle = '#ffb84d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, ay); ctx.lineTo(cx + al, ay); ctx.stroke(); const d = Math.sign(al); ctx.beginPath(); ctx.moveTo(cx + al, ay); ctx.lineTo(cx + al - 7 * d, ay - 5); ctx.moveTo(cx + al, ay); ctx.lineTo(cx + al - 7 * d, ay + 5); ctx.stroke(); ctx.fillStyle = '#ffb84d'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('force u', cx, ay - 10) }
      ctx.fillStyle = 'rgba(215,218,230,0.65)'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.fillText(s.grab ? '↔ release to let LQR catch it' : 'drag the cart away — LQR brings it back', 12, 18)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw); return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [des])

  // ----- time response -----
  useEffect(() => {
    const cv = respCv.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv); let raf = 0, x = [1, 0], t = 0; const hist: { t: number; p: number; u: number }[] = []; const WIN = 8, K = des.K
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, dt = 0.02
      for (let k = 0; k < 2; k++) { const u = -(K[0] * x[0] + K[1] * x[1]); x = [x[0] + x[1] * dt, x[1] + u * dt]; t += dt; hist.push({ t, p: x[0], u }); while (hist.length && hist[0].t < t - WIN) hist.shift(); if (Math.hypot(x[0], x[1]) < 0.02 && t > 1.5) x = [1, 0] }
      ctx.clearRect(0, 0, W, H); const mid = H / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; for (let g = 0; g <= 4; g++) { const yy = (g / 4) * H; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke() }
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()
      let m = 1.2; for (const h of hist) m = Math.max(m, Math.abs(h.p), Math.abs(h.u)); m = Math.min(m * 1.1, 10)
      const X = (tt: number) => ((tt - (t - WIN)) / WIN) * W, Y = (v: number) => mid - (Math.max(-m, Math.min(m, v)) / m) * (mid - 10)
      const ln = (sel: (h: typeof hist[0]) => number, col: string, w: number) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); hist.forEach((h, i) => { i ? ctx.lineTo(X(h.t), Y(sel(h))) : ctx.moveTo(X(h.t), Y(sel(h))) }); ctx.stroke() }
      ln((h) => h.u, 'rgba(255,184,77,0.7)', 1.6); ln((h) => h.p, '#22e1ff', 2)
      ctx.fillStyle = 'rgba(215,218,230,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.fillText('— position   — control effort u', 8, 13)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw); return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [des])

  // ----- symmetric root locus -----
  useEffect(() => {
    const cv = rlCv.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw() }
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight; ctx.clearRect(0, 0, W, H)
      let m = 1; for (const p of sweep.poles) m = Math.max(m, Math.abs(p.re), Math.abs(p.im)); m = Math.min(m, 14) * 1.12
      const cx = W * 0.78, cy = H / 2, sc = Math.min((W - 30) / (m + 1), (H / 2 - 14) / m)
      const X = (re: number) => cx + re * sc, Y = (im: number) => cy - im * sc
      ctx.fillStyle = 'rgba(84,230,160,0.06)'; ctx.fillRect(0, 0, X(0), H); ctx.fillStyle = 'rgba(255,107,107,0.06)'; ctx.fillRect(X(0), 0, W - X(0), H)
      ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke()
      ctx.fillStyle = 'rgba(215,218,230,0.55)'; ctx.font = '9px monospace'; ctx.textAlign = 'right'; ctx.fillText('σ', W - 4, cy - 4); ctx.fillText('jω', X(0) - 4, 10)
      // locus
      ctx.strokeStyle = 'rgba(123,92,255,0.6)'; ctx.lineWidth = 1.6
      for (const branch of [0, 1]) { ctx.beginPath(); for (let i = 0; i < sweep.poles.length; i += 2) { const p = sweep.poles[i + branch]; const x = X(Math.max(-m, p.re)), y = Y(Math.max(-m, Math.min(m, p.im))); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke() }
      // open-loop poles ×
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.4; const ox = X(0), oy = Y(0); ctx.beginPath(); ctx.moveTo(ox - 4, oy - 4); ctx.lineTo(ox + 4, oy + 4); ctx.moveTo(ox + 4, oy - 4); ctx.lineTo(ox - 4, oy + 4); ctx.stroke()
      // current poles ●
      for (const e of des.eig) { ctx.fillStyle = '#22e1ff'; ctx.beginPath(); ctx.arc(X(Math.max(-m, e.re)), Y(Math.max(-m, Math.min(m, e.im))), 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#0c0d1e'; ctx.lineWidth = 1.4; ctx.stroke() }
      ctx.fillStyle = 'rgba(215,218,230,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'
      ctx.fillText('violet: poles as R sweeps · ● current · × open-loop', 8, 13)
      ctx.fillText('small R → far left (fast) · large R → toward origin', 8, H - 8)
    }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv); return () => ro.disconnect()
  }, [sweep, des])

  // ----- Pareto frontier -----
  useEffect(() => {
    const cv = tcCv.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2); const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw() }
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, P = 36; ctx.clearRect(0, 0, W, H)
      const lu = (v: number) => Math.log10(Math.max(1e-3, v)), cu = sweep.pareto
      const us = cu.map((p) => lu(p.Ju)), xs = cu.map((p) => lu(p.Jx))
      const u0 = Math.min(...us), u1 = Math.max(...us), j0 = Math.min(...xs), j1 = Math.max(...xs)
      const X = (l: number) => P + (l - u0) / (u1 - u0 || 1) * (W - P - 12), Y = (l: number) => H - 22 - (l - j0) / (j1 - j0 || 1) * (H - 38)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(P, 10, W - P - 12, H - 36)
      ctx.strokeStyle = '#54e6a0'; ctx.lineWidth = 2; ctx.beginPath(); cu.forEach((p, i) => { const x = X(lu(p.Ju)), y = Y(lu(p.Jx)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke()
      let best = cu[0]; for (const p of cu) if (Math.abs(Math.log10(p.R) - Math.log10(R)) < Math.abs(Math.log10(best.R) - Math.log10(R))) best = p
      ctx.fillStyle = '#22e1ff'; ctx.beginPath(); ctx.arc(X(lu(best.Ju)), Y(lu(best.Jx)), 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#0c0d1e'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.fillStyle = 'rgba(215,218,230,0.65)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('control effort  ∫u² →', W / 2, H - 6)
      ctx.save(); ctx.translate(11, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('state error  ∫xᵀQx →', 0, 0); ctx.restore()
      ctx.textAlign = 'left'; ctx.fillStyle = '#54e6a0'; ctx.fillText('Pareto frontier — every point is an optimal K', P + 6, 22)
    }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv); return () => ro.disconnect()
  }, [sweep, R])

  return (
    <div className="lifsim panel ss">
      <div className="lifsim-head"><div>
        <div className="lifsim-title">LQR — design by trade-off, not by poles</div>
        <div className="lifsim-sub">A force must hold a cart at the target. Instead of choosing where the closed-loop poles go, LQR minimises a cost <b>J = ∫(xᵀQx + R u²) dt</b> and returns the single optimal gain K. One knob — the effort penalty <b>R</b> against the state penalty <b>Q</b> — trades speed for effort. <b>Drag the cart</b> and watch LQR catch it.</div>
      </div></div>

      <canvas ref={cartCv} className="ss-cart" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />

      <div className="ss-sysbar">
        <label className="ss-rng" style={{ minWidth: 240 }}>state penalty Q <input type="range" min={0.1} max={40} step={0.1} value={q} onChange={(e) => setQ(+e.target.value)} /><b>{q.toFixed(1)}</b></label>
        <label className="ss-rng" style={{ minWidth: 240 }}>effort penalty R <input type="range" min={0.01} max={40} step={0.01} value={R} onChange={(e) => setR(+e.target.value)} /><b>{R.toFixed(2)}</b></label>
        <span className="ss-tag">K = [{fmt(des.K[0])}, {fmt(des.K[1])}] · poles {des.eig.map((e) => (Math.abs(e.im) < 1e-6 ? e.re.toFixed(2) : `${e.re.toFixed(2)}±${Math.abs(e.im).toFixed(2)}j`)).join(', ')} · settle {des.settle.toFixed(1)}s · peak |u| {des.peak.toFixed(1)} · J {des.J.toFixed(1)}</span>
      </div>

      <div className="ss-concepts">
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">The response</span> <b>position &amp; effort</b></div>
          <p className="ss-def">Small R → effort is cheap → fast but a big <b style={{ color: '#ffb84d' }}>force</b>. Large R → effort is costly → smooth and slow. You only set R; LQR picks the gain.</p>
          <canvas ref={respCv} className="ss-canvas" />
        </div>
        <div className="ss-concept">
          <div className="ss-conh"><span className="ss-q">Where LQR puts the poles</span> <b>symmetric root locus</b></div>
          <p className="ss-def">As R sweeps, the optimal closed-loop poles trace the <b style={{ color: '#9b8cff' }}>violet locus</b> — LQR <i>is</i> choosing poles, just optimally. The <b style={{ color: '#22e1ff' }}>dots</b> are your current R; slide R and watch them glide along it.</p>
          <canvas ref={rlCv} className="ss-canvas" />
        </div>
      </div>

      <div className="ss-payoff">
        <div className="ss-conh"><span className="ss-q">The trade-off</span> <b>effort vs error — the Pareto frontier</b></div>
        <p className="ss-def">Sweeping R draws the least state error achievable for each amount of control effort. <b>No controller can sit below this curve</b> — LQR is the curve itself. Your R is the <b style={{ color: '#22e1ff' }}>dot</b>; that one choice replaces guessing pole locations.</p>
        <canvas ref={tcCv} className="ss-canvas ss-wide" style={{ height: 170 }} />
      </div>

      <div className="ss-payoff">
        <div className="ss-conh"><span className="ss-q">When does LQR make sense?</span></div>
        <div className="ss-quad">
          {[
            { t: 'Many inputs / outputs', d: 'With more than one actuator, pole placement is not unique — infinitely many K give the same poles. LQR returns one well-defined optimal gain.' },
            { t: 'You care about effort, not exact poles', d: 'Actuators saturate and burn energy. Tuning one ratio Q/R is far more natural than hand-picking n pole locations to hit an effort budget.' },
            { t: 'High-order systems', d: 'Choosing 6 or 10 pole locations sensibly is hopeless by hand; LQR scales to any n and always returns a stabilizing gain.' },
            { t: 'Robustness for free', d: 'The LQR state-feedback loop comes with guaranteed margins — ≥ 60° phase margin and infinite gain margin — which arbitrary pole placement does not promise.' },
          ].map((c, i) => <div key={i} className="ss-quadcell here"><div className="ss-quadt"><b>{c.t}</b></div><div className="ss-quadd">{c.d}</div></div>)}
        </div>
        <div className="ss-implic ok"><b>And when not?</b> If you need an <i>exact</i> spectrum — a specific resonance to cancel, a precise bandwidth — pole placement is the direct tool. LQR gives the optimal trade-off, then tells you where it put the poles (above).</div>
      </div>
    </div>
  )
}
