import { useEffect, useRef, useState } from 'react'

// Wilson–Cowan model of coupled excitatory (E) and inhibitory (I) populations,
// with phase-plane (nullclines) and bifurcation analysis. As the external drive
// is swept, a stable fixed point loses stability through a Hopf bifurcation and
// the network breaks into oscillations.
//   τ_E Ė = −E + S(w_EE E − w_EI I + P)
//   τ_I İ = −I + S(w_IE E − w_II I + Q)

const tauE = 1, wIE = 10, wII = 2, theta = 3, Q = 0
const Smax = 1

export default function WilsonCowanLab() {
  const tsRef = useRef<HTMLCanvasElement>(null)
  const ppRef = useRef<HTMLCanvasElement>(null)
  const bifRef = useRef<HTMLCanvasElement>(null)

  const [P, setP] = useState(3)       // external drive to E (bifurcation parameter)
  const [wEE, setWEE] = useState(10)  // recurrent excitation (controls 1 vs 3 fixed points)
  const [wEI, setWEI] = useState(10)  // I→E coupling
  const [tauI, setTauI] = useState(2) // inhibitory time constant
  const [a, setA] = useState(1.2)     // sigmoid gain
  const [running, setRunning] = useState(true)
  const [ver, setVer] = useState(0)
  const Pr = useRef({ P, wEE, wEI, tauI, a, running }); Pr.current = { P, wEE, wEI, tauI, a, running }
  const bif = useRef<{ P: number; lo: number; hi: number }[]>([])

  const S = (x: number, g: number) => Smax / (1 + Math.exp(-g * (x - theta)))
  const Sinv = (yv: number, g: number) => theta + Math.log(yv / (Smax - yv)) / g

  // bifurcation sweep (recompute when shape params change, not when P moves)
  useEffect(() => {
    const id = setTimeout(() => {
      const out: { P: number; lo: number; hi: number }[] = []
      const dt = 0.04
      for (let k = 0; k < 80; k++) {
        const Pp = (k / 79) * 12
        let E = 0.1, I = 0.1
        for (let n = 0; n < 1600; n++) { const dE = (-E + S(wEE * E - wEI * I + Pp, a)) / tauE, dI = (-I + S(wIE * E - wII * I + Q, a)) / tauI; E += dE * dt; I += dI * dt }
        let lo = 1, hi = 0
        for (let n = 0; n < 1500; n++) { const dE = (-E + S(wEE * E - wEI * I + Pp, a)) / tauE, dI = (-I + S(wIE * E - wII * I + Q, a)) / tauI; E += dE * dt; I += dI * dt; if (E < lo) lo = E; if (E > hi) hi = E }
        out.push({ P: Pp, lo, hi })
      }
      bif.current = out; setVer((v) => v + 1)
    }, 120)
    return () => clearTimeout(id)
  }, [wEE, wEI, tauI, a])

  useEffect(() => {
    const ts = tsRef.current, pp = ppRef.current, bc = bifRef.current; if (!ts || !pp || !bc) return
    const tx = ts.getContext('2d')!, px = pp.getContext('2d')!, bx = bc.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const fit = (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    const fitAll = () => { fit(ts, tx); fit(pp, px); fit(bc, bx) }; fitAll()
    const ro = new ResizeObserver(fitAll); ro.observe(ts); ro.observe(pp); ro.observe(bc)

    const dt = 0.04, WIN = 700
    let E = 0.2, I = 0.1, raf = 0
    const histE: number[] = [], histI: number[] = [], orbit: [number, number][] = []
    const tracers = Array.from({ length: 18 }, () => ({ p: [Math.random() * 0.96 + 0.02, Math.random() * 0.96 + 0.02] as [number, number], age: Math.random() * 240 }))

    const loop = () => {
      const { P, wEE, wEI, tauI, a, running } = Pr.current
      if (running) for (let s = 0; s < 6; s++) {
        const dE = (-E + S(wEE * E - wEI * I + P, a)) / tauE, dI = (-I + S(wIE * E - wII * I + Q, a)) / tauI
        E += dE * dt; I += dI * dt
        histE.push(E); histI.push(I); if (histE.length > WIN) { histE.shift(); histI.shift() }
        orbit.push([E, I]); if (orbit.length > 400) orbit.shift()
      }
      // time series
      const TW = ts.clientWidth, TH = ts.clientHeight, Y = (v: number) => TH - 6 - v * (TH - 18)
      tx.clearRect(0, 0, TW, TH)
      const plot = (h: number[], col: string) => { tx.strokeStyle = col; tx.lineWidth = 2; tx.beginPath(); h.forEach((v, i) => { const x = (i / WIN) * TW, y = Y(v); i ? tx.lineTo(x, y) : tx.moveTo(x, y) }); tx.stroke() }
      plot(histI, '#ff2d8f'); plot(histE, '#22e1ff')
      tx.fillStyle = '#22e1ff'; tx.font = '11px monospace'; tx.fillText('E (excitatory)', 8, 14); tx.fillStyle = '#ff2d8f'; tx.fillText('I (inhibitory)', 96, 14)
      // phase plane
      const PW = pp.clientWidth, PH = pp.clientHeight, X = (e: number) => 6 + e * (PW - 12), YY = (i: number) => PH - 6 - i * (PH - 12)
      px.clearRect(0, 0, PW, PH)
      const { wEI: we, a: ga, P: Pp } = Pr.current
      // flow field f(E,I): direction of motion at each point
      const fEI = (e: number, i: number): [number, number] => [(-e + S(wEE * e - we * i + Pp, ga)) / tauE, (-i + S(wIE * e - wII * i + Q, ga)) / tauI]
      for (let gi = 0; gi < 11; gi++) for (let ge = 0; ge < 11; ge++) {
        const e = 0.05 + ge * 0.09, i = 0.05 + gi * 0.09, d = fEI(e, i), sp = Math.hypot(d[0], d[1]); if (sp < 1e-4) continue
        const ux = d[0] / sp, uy = d[1] / sp, x0 = X(e), y0 = YY(i), x1 = X(e + ux * 0.04), y1 = YY(i + uy * 0.04)
        px.strokeStyle = `rgba(150,135,255,${Math.min(0.45, 0.1 + sp * 0.22)})`; px.lineWidth = 1
        px.beginPath(); px.moveTo(x0, y0); px.lineTo(x1, y1); px.stroke()
        const an = Math.atan2(y1 - y0, x1 - x0)
        px.beginPath(); px.moveTo(x1, y1); px.lineTo(x1 - 4 * Math.cos(an - 0.45), y1 - 4 * Math.sin(an - 0.45)); px.moveTo(x1, y1); px.lineTo(x1 - 4 * Math.cos(an + 0.45), y1 - 4 * Math.sin(an + 0.45)); px.stroke()
      }
      // tracer particles streaming along the flow (state movement)
      if (running) for (const tr of tracers) {
        for (let s = 0; s < 2; s++) { const d = fEI(tr.p[0], tr.p[1]); tr.p[0] += d[0] * 0.03; tr.p[1] += d[1] * 0.03 }
        tr.age++; const d2 = fEI(tr.p[0], tr.p[1]), sp2 = Math.hypot(d2[0], d2[1])
        if (tr.age > 260 || sp2 < 0.008 || tr.p[0] < -0.05 || tr.p[0] > 1.05 || tr.p[1] < -0.05 || tr.p[1] > 1.05) { tr.p = [Math.random() * 0.96 + 0.02, Math.random() * 0.96 + 0.02]; tr.age = 0 }
      }
      px.fillStyle = 'rgba(160,225,255,0.8)'
      for (const tr of tracers) { px.beginPath(); px.arc(X(tr.p[0]), YY(tr.p[1]), 2.2, 0, 2 * Math.PI); px.fill() }
      px.strokeStyle = '#22e1ff'; px.lineWidth = 1.8; px.beginPath(); let started = false // E-nullcline: I = (wEE E + P − Sinv(E))/wEI
      for (let e = 0.005; e < 0.995; e += 0.005) { const iv = (wEE * e + Pp - Sinv(e, ga)) / we; if (iv >= -0.05 && iv <= 1.05) { const x = X(e), y = YY(iv); started ? px.lineTo(x, y) : px.moveTo(x, y); started = true } else started = false } px.stroke()
      px.strokeStyle = '#ffc24d'; px.lineWidth = 1.8; px.beginPath(); started = false // I-nullcline: E = (Sinv(I) + wII I − Q)/wIE
      for (let iv = 0.005; iv < 0.995; iv += 0.005) { const e = (Sinv(iv, ga) + wII * iv - Q) / wIE; if (e >= -0.05 && e <= 1.05) { const x = X(e), y = YY(iv); started ? px.lineTo(x, y) : px.moveTo(x, y); started = true } else started = false } px.stroke()
      px.strokeStyle = 'rgba(255,255,255,0.6)'; px.lineWidth = 1.4; px.beginPath(); orbit.forEach((o, i) => { const x = X(o[0]), y = YY(o[1]); i ? px.lineTo(x, y) : px.moveTo(x, y) }); px.stroke()
      // fixed points = nullcline intersections (roots of g(E)); 1 or 3 of them
      const Istar = (E2: number) => { let I2 = 0.3; for (let z = 0; z < 80; z++) I2 = S(wIE * E2 - wII * I2 + Q, ga); return I2 }
      const gfun = (E2: number) => -E2 + S(wEE * E2 - we * Istar(E2) + Pp, ga)
      let pe = 0.0015, pg = gfun(0.0015), nfp = 0
      for (let E2 = 0.004; E2 < 0.9985; E2 += 0.0025) { const gg = gfun(E2); if (gg * pg < 0) { const Er = pe - pg * (E2 - pe) / (gg - pg), Ir = Istar(Er); px.fillStyle = '#54e6a0'; px.strokeStyle = '#0c0d1e'; px.lineWidth = 1.5; px.beginPath(); px.arc(X(Er), YY(Ir), 5, 0, 2 * Math.PI); px.fill(); px.stroke(); nfp++ } pg = gg; pe = E2 }
      px.fillStyle = '#54e6a0'; px.font = '11px monospace'; px.fillText(`${nfp} fixed point${nfp > 1 ? 's' : ''}`, 8, PH - 8)
      px.shadowColor = 'rgba(255,255,255,0.9)'; px.shadowBlur = 10; px.fillStyle = '#fff'; px.beginPath(); px.arc(X(E), YY(I), 4.5, 0, 2 * Math.PI); px.fill(); px.shadowBlur = 0
      px.fillStyle = 'rgba(233,235,251,0.6)'; px.font = '11px monospace'; px.fillText('phase plane (E→, I↑)', 8, 14); px.fillStyle = '#22e1ff'; px.fillText('E-null', PW - 96, 14); px.fillStyle = '#ffc24d'; px.fillText('I-null', PW - 44, 14)
      // bifurcation
      const BW = bc.clientWidth, BH = bc.clientHeight, BX = (p: number) => 6 + (p / 12) * (BW - 12), BY = (v: number) => BH - 16 - v * (BH - 28)
      bx.clearRect(0, 0, BW, BH)
      const data = bif.current
      bx.strokeStyle = '#9b8cff'; bx.lineWidth = 1.5
      bx.beginPath(); data.forEach((d, i) => { const x = BX(d.P), y = BY(d.hi); i ? bx.lineTo(x, y) : bx.moveTo(x, y) }); bx.stroke()
      bx.beginPath(); data.forEach((d, i) => { const x = BX(d.P), y = BY(d.lo); i ? bx.lineTo(x, y) : bx.moveTo(x, y) }); bx.stroke()
      // shade oscillatory region (where hi-lo notable)
      bx.fillStyle = 'rgba(255,45,141,0.12)'; data.forEach((d) => { if (d.hi - d.lo > 0.02) { bx.fillRect(BX(d.P) - 1, BY(d.hi), 3, BY(d.lo) - BY(d.hi)) } })
      bx.strokeStyle = 'rgba(255,255,255,0.4)'; bx.setLineDash([3, 3]); bx.beginPath(); bx.moveTo(BX(P), 6); bx.lineTo(BX(P), BH - 16); bx.stroke(); bx.setLineDash([])
      bx.fillStyle = '#ff2d8f'; bx.beginPath(); bx.arc(BX(P), BY(E), 4, 0, 2 * Math.PI); bx.fill()
      bx.fillStyle = 'rgba(233,235,251,0.6)'; bx.font = '11px monospace'; bx.fillText('bifurcation: E vs drive P', 8, 14); bx.fillText('drive P →', BW - 64, BH - 4)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [ver])

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Interactive lab — Wilson–Cowan dynamics &amp; bifurcation</div>
          <div className="lifsim-sub">Two coupled neural populations (excitatory <span style={{ color: '#22e1ff' }}>E</span> + inhibitory <span style={{ color: '#ff2d8f' }}>I</span>). Sweep the external drive <i>P</i> and watch a stable fixed point lose stability through a <b>Hopf bifurcation</b> into sustained oscillations, shown live in the time series, the phase plane, and the bifurcation diagram.</div>
        </div>
        <button className="lifsim-expand" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
      </div>

      <div className="lifsim-cell lifsim-cell-wide" style={{ marginBottom: 14 }}>
        <div className="lifsim-cap">Population activity E(t), I(t)</div>
        <canvas ref={tsRef} className="lifsim-canvas" style={{ height: 150 }} />
      </div>
      <div className="lifsim-grid">
        <div className="lifsim-cell"><div className="lifsim-cap">Phase plane: flow field <span className="sub">(violet arrows)</span> + nullclines, state <span className="sub">(white)</span></div><canvas ref={ppRef} className="lifsim-canvas" style={{ height: 240 }} /></div>
        <div className="lifsim-cell"><div className="lifsim-cap">Bifurcation diagram (Hopf)</div><canvas ref={bifRef} className="lifsim-canvas" style={{ height: 240 }} /></div>
      </div>

      <div className="lifsim-controls">
        <label><span>external drive <i>P</i> = {P.toFixed(1)}</span>
          <input type="range" min={0} max={12} step={0.1} value={P} onChange={(e) => setP(+e.target.value)} /></label>
        <label><span>recurrent excitation <i>w<sub>EE</sub></i> = {wEE} {wEE >= 13 && wEE <= 16 ? '· S-shaped nullcline' : ''}</span>
          <input type="range" min={4} max={16} step={1} value={wEE} onChange={(e) => setWEE(+e.target.value)} /></label>
        <label><span>I→E coupling <i>w<sub>EI</sub></i> = {wEI}</span>
          <input type="range" min={6} max={22} step={1} value={wEI} onChange={(e) => setWEI(+e.target.value)} /></label>
        <label><span>inhibitory time constant <i>τ<sub>I</sub></i> = {tauI.toFixed(1)}</span>
          <input type="range" min={1} max={4} step={0.1} value={tauI} onChange={(e) => setTauI(+e.target.value)} /></label>
        <label><span>sigmoid gain <i>a</i> = {a.toFixed(1)}</span>
          <input type="range" min={0.8} max={2.5} step={0.1} value={a} onChange={(e) => setA(+e.target.value)} /></label>
      </div>

      <div className="lifsim-explain">
        <p><b>Reading the phase plane.</b> The violet arrows are the <b>flow field</b>: at every point they show the direction the state (E, I) moves next. The drifting blue dots are tracer particles released into that flow, they reveal where the system is pulled, converging onto the attractor (a fixed point or, in the oscillatory regime, the limit cycle). The bright white dot is the live <b>state</b>, tracing its own orbit.</p>
        <p><b>What to try.</b> Move the <b>drive P</b> across the shaded band in the bifurcation diagram: outside it the network settles to a steady fixed point (the phase-plane trajectory spirals into the nullcline crossing); inside it the fixed point is unstable and the trajectory settles onto a <b>limit cycle</b>, the E and I populations oscillate (a gamma-like rhythm). The split between the upper/lower branches is the oscillation amplitude, which grows continuously from zero at the <b>Hopf bifurcation</b> (a supercritical Hopf) as you enter the band. A slower <b>τ<sub>I</sub></b> or stronger <b>I→E coupling</b> widens the oscillatory range. <b>About the nullclines:</b> with weak recurrent excitation they cross once (a single fixed point, green). Set <b>w<sub>EE</sub>≈14</b> with <b>P≈3</b> and the E-nullcline bends into an S-shape, so the two nullclines cross in <b>three</b> points (you'll see three green dots) - two stable states plus a middle saddle - giving bistability and hysteresis (the cusp / saddle-node regime), exactly as in the textbooks. So yes: 1 or 3 crossings, depending on parameters (and at very strong w<sub>EE</sub> the network simply locks into one saturated high state).</p>
      </div>
    </div>
  )
}
