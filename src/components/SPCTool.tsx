import { useEffect, useMemo, useRef, useState } from 'react'

// Browser port of the spike-phase coupling (SPC) method from Vissani et al. 2025
// (github.com/Brain-Modulation-Lab/code_SPC_ECoG_STN_Speech). It simulates
// phase-coupled spike/LFP data (as in run_simulation.m) and runs the real
// pipeline: Hilbert phase -> phase at spikes -> PLV = |mean e^{iφ}| ->
// PPC = n/(n-1)(PLV²-1/n) (Vinck 2010), time-resolved with a constant-spike-
// count window (Fischer et al.), and a phase-shuffle permutation null.

// ---- math ----
function fft(re: Float64Array, im: Float64Array, inverse: boolean) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) { [re[i], re[j]] = [re[j], re[i]];[im[i], im[j]] = [im[j], im[i]] }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len
    const wr = Math.cos(ang), wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2
        const tr = re[b] * cwr - im[b] * cwi, ti = re[b] * cwi + im[b] * cwr
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti
        const ncwr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = ncwr
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n }
}
// instantaneous phase via the analytic (Hilbert) signal
function hilbertPhase(x: Float64Array): Float64Array {
  const N = x.length
  let M = 1; while (M < N) M <<= 1
  const re = new Float64Array(M), im = new Float64Array(M)
  re.set(x)
  fft(re, im, false)
  for (let i = 0; i < M; i++) { const h = i === 0 || i === M / 2 ? 1 : i < M / 2 ? 2 : 0; re[i] *= h; im[i] *= h }
  fft(re, im, true)
  const ph = new Float64Array(N)
  for (let i = 0; i < N; i++) ph[i] = Math.atan2(im[i], re[i])
  return ph
}
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function gauss(r: () => number) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
const PPCcorr = (plv: number, n: number) => (n > 1 ? (n / (n - 1)) * (plv * plv - 1 / n) : 0)
function plvOf(phases: number[]) { let cr = 0, ci = 0; for (const p of phases) { cr += Math.cos(p); ci += Math.sin(p) }; const n = phases.length; return n ? Math.hypot(cr, ci) / n : 0 }
function meanPhaseOf(phases: number[]) { let cr = 0, ci = 0; for (const p of phases) { cr += Math.cos(p); ci += Math.sin(p) }; return Math.atan2(ci, cr) }

type P = { coupling: number; phaseTarget: number; fOsc: number; frBase: number; nTrials: number; winC: number; winW: number }

type Sim = {
  fs: number; dur: number; N: number; nTrials: number
  osc: Float64Array[]; phase: Float64Array[]; spk: Uint8Array[]
  result: { plv: number; ppc: number; mean: number; n: number; hist: number[]; tppc: { t: number; ppc: number; thr: number; mean: number }[] }
}

function compute(p: P): Sim {
  const fs = 500, dur = 2.0, N = Math.round(fs * dur), nTrials = p.nTrials
  const r = mulberry32(12345)
  const ES = (1 + 2 * Math.sqrt(p.coupling)) / (1 - 2 * Math.sqrt(p.coupling))
  const k = (ES - 1) / (ES + 1)
  const c0 = p.winC - p.winW / 2, c1 = p.winC + p.winW / 2
  const osc: Float64Array[] = [], phase: Float64Array[] = [], spk: Uint8Array[] = []
  for (let tr = 0; tr < nTrials; tr++) {
    const o = new Float64Array(N), s = new Uint8Array(N)
    const ph0 = -Math.PI + 2 * Math.PI * r()
    for (let i = 0; i < N; i++) o[i] = Math.sin(2 * Math.PI * p.fOsc * (i / fs) + ph0) + 0.25 * gauss(r)
    const ph = hilbertPhase(o)
    for (let i = 0; i < N; i++) {
      const t = i / fs
      let prob = p.frBase / fs
      if (t >= c0 && t <= c1) prob *= 1 + k * Math.cos(ph[i] - p.phaseTarget)
      if (r() < prob) s[i] = 1
    }
    osc.push(o); phase.push(ph); spk.push(s)
  }
  // overall coupling-window SPC
  const winPh: number[] = []
  const i0 = Math.round(c0 * fs), i1 = Math.round(c1 * fs)
  for (let tr = 0; tr < nTrials; tr++) for (let i = i0; i <= i1; i++) if (spk[tr][i]) winPh.push(phase[tr][i])
  const plv = plvOf(winPh), ppc = PPCcorr(plv, winPh.length), mean = meanPhaseOf(winPh)
  const BIN = 18, hist = new Array(BIN).fill(0)
  for (const ph of winPh) { let b = Math.floor(((ph + Math.PI) / (2 * Math.PI)) * BIN); b = (b % BIN + BIN) % BIN; hist[b]++ }
  // time-resolved PPC with the repo's constant-spike-count window + permutation null.
  // every spike across trials, with its phase, sorted later by distance to centre.
  const allSpk: { i: number; ph: number }[] = []
  for (let tr = 0; tr < nTrials; tr++) for (let i = 0; i < N; i++) if (spk[tr][i]) allSpk.push({ i, ph: phase[tr][i] })
  // constant spike count (target) held the same for every window (de-biases firing rate)
  const target = Math.max(40, Math.round(0.1 * allSpk.length))
  const centers = 40, nperm = 40
  const tppc: { t: number; ppc: number; thr: number; mean: number }[] = []
  for (let c = 0; c < centers; c++) {
    const ci = Math.round(((c + 0.5) / centers) * N)
    // first half-width whose symmetric window holds >= target spikes (calc_binLen_selectSpikes)
    const byDist = allSpk.map((s) => ({ ph: s.ph, d: Math.abs(s.i - ci) })).sort((a, b) => a.d - b.d)
    const sel = byDist.slice(0, Math.min(target, byDist.length))
    const got = sel.length
    const realPPC = PPCcorr(plvOf(sel.map((s) => s.ph)), got)
    // null: re-pair each selected spike with the phase from a random trial at the same time
    const perms: number[] = []
    for (let pm = 0; pm < nperm; pm++) {
      const rr = mulberry32(1000 + pm + c * 97)
      const sh: number[] = []
      for (const s of sel) { const ii = ci + (s as { ph: number; d: number }).d * (rr() < 0.5 ? -1 : 1); const tr2 = Math.floor(rr() * nTrials); sh.push(phase[tr2][Math.max(0, Math.min(N - 1, ii))]) }
      perms.push(PPCcorr(plvOf(sh), got))
    }
    perms.sort((a, b) => a - b)
    tppc.push({ t: ci / fs, ppc: realPPC, thr: perms[Math.floor(0.95 * nperm)], mean: meanPhaseOf(sel.map((s) => s.ph)) })
  }
  return { fs, dur, N, nTrials, osc, phase, spk, result: { plv, ppc, mean, n: winPh.length, hist, tppc } }
}

export default function SPCTool() {
  const [p, setP] = useState<P>({ coupling: 0.08, phaseTarget: 0, fOsc: 18, frBase: 40, nTrials: 40, winC: 1.0, winW: 0.4 })
  const sim = useMemo(() => compute(p), [p])
  const trRef = useRef<HTMLCanvasElement>(null)
  const rasterRef = useRef<HTMLCanvasElement>(null)
  const polRef = useRef<HTMLCanvasElement>(null)
  const tRef = useRef<HTMLCanvasElement>(null)
  const set = (k: keyof P, v: number) => setP((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    // example trial: oscillation + spike raster — SAME plot geometry (L,R margins,
    // time axis) as the density map below, so the two time axes line up.
    const cv = trRef.current; if (cv) {
      const ctx = cv.getContext('2d')!, W = cv.clientWidth, H = cv.clientHeight, dpr = devicePixelRatio || 1
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
      const o = sim.osc[0], s = sim.spk[0], N = sim.N
      const top = 18, L = 52, Rm = 10, B = 20
      const px0 = L, py0 = top, PW = W - L - Rm, PH = H - top - B, py1 = py0 + PH, px1 = px0 + PW
      const c0 = px0 + (p.winC - p.winW / 2) / sim.dur * PW, c1 = px0 + (p.winC + p.winW / 2) / sim.dur * PW
      ctx.fillStyle = 'rgba(255,45,143,0.12)'; ctx.fillRect(c0, py0, c1 - c0, PH)
      const lfpMid = py0 + PH * 0.4, lfpAmp = PH * 0.26
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 1.4; ctx.beginPath()
      for (let i = 0; i < N; i++) { const x = px0 + i / N * PW, y = lfpMid - o[i] * lfpAmp; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke()
      const spkTop = py0 + PH * 0.78, spkBot = py0 + PH * 0.92
      ctx.strokeStyle = '#ff2d8f'; ctx.lineWidth = 1.4; ctx.beginPath()
      for (let i = 0; i < N; i++) if (s[i]) { const x = px0 + i / N * PW; ctx.moveTo(x, spkTop); ctx.lineTo(x, spkBot) } ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(px0, py0, PW, PH)
      ctx.fillStyle = 'rgba(233,235,251,0.65)'; ctx.font = '10px monospace'
      ctx.textAlign = 'center'; for (const tk of [0, 0.5, 1, 1.5, 2]) { const x = px0 + (tk / sim.dur) * PW; ctx.fillText(tk.toFixed(1), x, py1 + 13) }
      ctx.fillText('time (s)', (px0 + px1) / 2, H - 1)
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('LFP', px0 - 6, lfpMid); ctx.fillText('spk', px0 - 6, (spkTop + spkBot) / 2); ctx.textBaseline = 'alphabetic'
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(233,235,251,0.7)'; ctx.font = '11px monospace'
      ctx.fillText('Example trial: LFP (cyan) and spikes (pink); shaded = coupling window', px0, 12)
    }
    // spike phase over time, pooled across trials: 2D density (time x phase)
    const rc = rasterRef.current; if (rc) {
      const ctx = rc.getContext('2d')!, W = rc.clientWidth, H = rc.clientHeight, dpr = devicePixelRatio || 1
      rc.width = W * dpr; rc.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
      const top = 20, L = 52, B = 26, R = 10, TX = 56, PY = 22
      const px0 = L, py0 = top, PW = W - L - R, PH = H - top - B, py1 = py0 + PH, px1 = px0 + PW
      const counts = Array.from({ length: TX }, () => new Float64Array(PY))
      for (let tr = 0; tr < sim.nTrials; tr++) { const s = sim.spk[tr], ph = sim.phase[tr]; for (let i = 0; i < sim.N; i++) if (s[i]) { const tb = Math.min(TX - 1, Math.floor(i / sim.N * TX)); let pb = Math.floor((ph[i] + Math.PI) / (2 * Math.PI) * PY); pb = (pb % PY + PY) % PY; counts[tb][pb]++ } }
      const cw = PW / TX, chh = PH / PY
      // dark→cyan→white ramp; colour each (time,phase) cell by its phase CONCENTRATION
      // (column-normalised), so the uniform firing-rate background drops out
      const ramp = (t: number): [number, number, number] => t < 0.5 ? [10 + t * 2 * 24, 14 + t * 2 * 166, 32 + t * 2 * 223] : [34 + (t - 0.5) * 2 * 221, 180 + (t - 0.5) * 2 * 75, 255]
      for (let a = 0; a < TX; a++) {
        let sum = 0; for (let b = 0; b < PY; b++) sum += counts[a][b]
        for (let b = 0; b < PY; b++) {
          const pr = sum > 2 ? counts[a][b] / sum : 1 / PY            // P(phase | spike, time)
          const inten = Math.max(0, Math.min(1, (pr * PY - 1) * 0.8))  // excess over the uniform 1/PY
          const [r, g, bl] = ramp(inten)
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${bl | 0})`; ctx.fillRect(px0 + a * cw, py0 + (PY - 1 - b) * chh, cw + 0.6, chh + 0.6)
        }
      }
      // coupling window + preferred-phase line
      const c0 = px0 + (p.winC - p.winW / 2) / sim.dur * PW, c1 = px0 + (p.winC + p.winW / 2) / sim.dur * PW
      ctx.strokeStyle = 'rgba(255,45,143,0.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(c0, py0, c1 - c0, PH)
      // overlay: estimated preferred phase, shown ONLY at times where the time-resolved
      // PPC is significant (real PPC > permutation 95th-pct threshold). Green line + dots,
      // using the same constant-spike-count window phase estimate as the PPC test.
      const pref = sim.result.tppc.map((d) => {
        if (d.ppc <= d.thr) return null                              // not significant → blank
        const pbf = (d.mean + Math.PI) / (2 * Math.PI) * PY
        return { x: px0 + (d.t / sim.dur) * PW, y: py0 + (PY - 1 - pbf) * chh + chh / 2 }
      })
      ctx.strokeStyle = 'rgba(57,255,139,0.95)'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.shadowColor = 'rgba(57,255,139,0.8)'; ctx.shadowBlur = 6
      for (let a = 1; a < pref.length; a++) { const p0 = pref[a - 1], p1 = pref[a]; if (p0 && p1 && Math.abs(p1.y - p0.y) < PH / 2) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke() } }
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(120,255,170,1)'
      for (const pt of pref) if (pt) { ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.8, 0, 2 * Math.PI); ctx.fill() }
      // axes
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(px0, py0, PW, PH)
      ctx.fillStyle = 'rgba(233,235,251,0.65)'; ctx.font = '10px monospace'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.fillText('+π', px0 - 6, py0 + 4); ctx.fillText('0', px0 - 6, (py0 + py1) / 2); ctx.fillText('−π', px0 - 6, py1 - 4)
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
      for (const tk of [0, 0.5, 1, 1.5, 2]) { const x = px0 + (tk / sim.dur) * PW; ctx.fillText(tk.toFixed(1), x, py1 + 14) }
      ctx.fillText('time (s)', (px0 + px1) / 2, H - 2)
      ctx.save(); ctx.translate(11, (py0 + py1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('LFP phase (rad)', 0, 0); ctx.restore()
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(233,235,251,0.7)'; ctx.font = '11px monospace'
      ctx.fillText('Spike phase vs time (across trials); green = preferred phase where time-resolved PPC is significant', px0, 13)
    }
    // polar spike-phase histogram + resultant vector
    const pc = polRef.current; if (pc) {
      const ctx = pc.getContext('2d')!, W = pc.clientWidth, H = pc.clientHeight, dpr = devicePixelRatio || 1
      pc.width = W * dpr; pc.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) / 2 - 46
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke()
      const hist = sim.result.hist, mx = Math.max(1, ...hist), BIN = hist.length
      for (let b = 0; b < BIN; b++) {
        const a0 = (b / BIN) * 2 * Math.PI - Math.PI, a1 = ((b + 1) / BIN) * 2 * Math.PI - Math.PI
        const rr = (hist[b] / mx) * R
        ctx.fillStyle = 'rgba(34,225,255,0.45)'; ctx.beginPath(); ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, rr, a0, a1); ctx.closePath(); ctx.fill()
      }
      // 95% confidence interval of the preferred (mean) phase — CircStat circ_confmean
      // (Zar eq. 26.24/26.25): half-width δ = acos(t / Rn), Rn = n·r, c2 = χ²₁,₀.₉₅.
      const rmean = sim.result.plv, nsp = sim.result.n, Rn = nsp * rmean, c2 = 3.841
      let ciHalf = NaN
      if (rmean >= 0.9) ciHalf = Math.acos(Math.sqrt(nsp * nsp - (nsp * nsp - Rn * Rn) * Math.exp(c2 / nsp)) / Rn)
      else if (rmean > Math.sqrt(c2 / 2 / nsp)) ciHalf = Math.acos(Math.sqrt((2 * nsp * (2 * Rn * Rn - nsp * c2)) / (4 * nsp - c2)) / Rn)
      if (isFinite(ciHalf) && ciHalf > 0) {
        // draw the CI as a bold arc just OUTSIDE the unit circle, with radial end caps
        // and a marker at the preferred phase — clearly an angular interval, not a wedge.
        const arcR = R + 22, m = sim.result.mean
        ctx.strokeStyle = 'rgba(255,194,77,0.95)'; ctx.lineWidth = 5; ctx.lineCap = 'butt'
        ctx.beginPath(); ctx.arc(cx, cy, arcR, m - ciHalf, m + ciHalf); ctx.stroke()
        ctx.strokeStyle = 'rgba(255,194,77,0.9)'; ctx.lineWidth = 1.6
        for (const s of [-1, 1]) { const a = m + s * ciHalf; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R + 15), cy + Math.sin(a) * (R + 15)); ctx.lineTo(cx + Math.cos(a) * (R + 29), cy + Math.sin(a) * (R + 29)); ctx.stroke() }
        ctx.fillStyle = '#ffc24d'; ctx.beginPath(); ctx.arc(cx + Math.cos(m) * arcR, cy + Math.sin(m) * arcR, 3, 0, 2 * Math.PI); ctx.fill()
      }
      // resultant vector
      ctx.strokeStyle = '#ff2d8f'; ctx.lineWidth = 2.4
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sim.result.mean) * R * sim.result.plv, cy + Math.sin(sim.result.mean) * R * sim.result.plv); ctx.stroke()
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      ctx.fillText('0', cx + R + 6, cy + 3); ctx.fillText('π', cx - R - 14, cy + 3)
      ctx.textAlign = 'center'
      ctx.fillText('π/2', cx, cy + R + 32); ctx.fillText('−π/2', cx, cy - R - 18)
      ctx.fillStyle = 'rgba(255,194,77,0.85)'; ctx.textAlign = 'left'
      ctx.fillText(isFinite(ciHalf) ? `pref ${(sim.result.mean * 180 / Math.PI).toFixed(0)}° ± ${(ciHalf * 180 / Math.PI).toFixed(0)}° (95% CI)` : 'pref. phase: n/s', 8, H - 6)
    }
    // time-resolved PPC
    const tc = tRef.current; if (tc) {
      const ctx = tc.getContext('2d')!, W = tc.clientWidth, H = tc.clientHeight, dpr = devicePixelRatio || 1
      tc.width = W * dpr; tc.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
      const d = sim.result.tppc, mx = Math.max(0.02, ...d.map((x) => Math.max(x.ppc, x.thr)))
      const X = (t: number) => 6 + (t / sim.dur) * (W - 12), Y = (v: number) => H - 16 - (v / mx) * (H - 26)
      const c0 = X(p.winC - p.winW / 2), c1 = X(p.winC + p.winW / 2)
      ctx.fillStyle = 'rgba(255,45,143,0.10)'; ctx.fillRect(c0, 0, c1 - c0, H)
      ctx.strokeStyle = 'rgba(255,194,77,0.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.beginPath()
      d.forEach((x, i) => { const px = X(x.t), py = Y(x.thr); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py) }); ctx.stroke(); ctx.setLineDash([])
      // base PPC trace (cyan)
      ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2; ctx.beginPath()
      d.forEach((x, i) => { const px = X(x.t), py = Y(x.ppc); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py) }); ctx.stroke()
      // emphasise significant stretches: green fill down to the null, bold green glow line, big dots
      ctx.fillStyle = 'rgba(57,255,139,0.16)'
      d.forEach((x) => { if (x.ppc > x.thr) { const px = X(x.t); ctx.fillRect(px - (W - 12) / d.length / 2, Y(x.ppc), (W - 12) / d.length, Y(x.thr) - Y(x.ppc)) } })
      ctx.strokeStyle = 'rgba(57,255,139,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(57,255,139,0.8)'; ctx.shadowBlur = 7
      for (let i = 1; i < d.length; i++) { if (d[i - 1].ppc > d[i - 1].thr && d[i].ppc > d[i].thr) { ctx.beginPath(); ctx.moveTo(X(d[i - 1].t), Y(d[i - 1].ppc)); ctx.lineTo(X(d[i].t), Y(d[i].ppc)); ctx.stroke() } }
      ctx.shadowBlur = 0
      d.forEach((x) => { if (x.ppc > x.thr) { ctx.fillStyle = 'rgba(120,255,170,1)'; ctx.beginPath(); ctx.arc(X(x.t), Y(x.ppc), 3.4, 0, 2 * Math.PI); ctx.fill() } })
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '11px monospace'
      ctx.fillText('time-resolved PPC (cyan) · 95% perm null (amber) · green = significant', 8, 14)
    }
  }, [sim, p])

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Spike–phase coupling toolkit — run the method on data</div>
          <div className="lifsim-sub">
            A browser port of my SPC pipeline (<a href="https://github.com/Brain-Modulation-Lab/code_SPC_ECoG_STN_Speech" target="_blank" rel="noreferrer" style={{ color: 'var(--neon-cyan)' }}>code on GitHub</a>).
            It simulates phase-coupled spikes and an LFP, then computes the <b>phase-locking value</b> (PLV), the bias-corrected
            <b> PPC</b> (Vinck 2010), and a <b>time-resolved</b> estimate using the constant-spike-count window (Fischer et al.),
            with a phase-shuffle permutation null. Move the sliders and watch the method recover the coupling.
          </div>
        </div>
        <div className="lifsim-rate"><b>{sim.result.ppc.toFixed(3)}</b><span>PPC</span></div>
      </div>

      <div className="ilab-chips">
        <span className="ilab-chip cy"><b>{sim.result.plv.toFixed(3)}</b> PLV</span>
        <span className="ilab-chip mag"><b>{sim.result.ppc.toFixed(3)}</b> PPC (debiased)</span>
        <span className="ilab-chip"><b>{(sim.result.mean * 180 / Math.PI).toFixed(0)}°</b> preferred phase</span>
        <span className="ilab-chip"><b>{sim.result.n}</b> spikes in window</span>
      </div>

      <div className="lifsim-cell lifsim-cell-wide">
        <canvas ref={trRef} className="lifsim-canvas" style={{ height: 250 }} />
      </div>
      <div className="lifsim-cell lifsim-cell-wide" style={{ marginTop: 14 }}>
        <div className="lifsim-cap">Spike phase over time <span className="sub">(pooled across trials)</span></div>
        <canvas ref={rasterRef} className="lifsim-canvas" style={{ height: 200 }} />
      </div>
      <div className="lifsim-grid" style={{ marginTop: 14 }}>
        <div className="lifsim-cell"><div className="lifsim-cap">Spike-phase distribution + resultant (PLV)</div><canvas ref={polRef} className="lifsim-canvas" style={{ height: 250 }} /></div>
        <div className="lifsim-cell"><div className="lifsim-cap">Time-resolved coupling (PPC)</div><canvas ref={tRef} className="lifsim-canvas" style={{ height: 230 }} /></div>
      </div>

      <div className="lifsim-controls">
        <label><span>coupling strength = {p.coupling.toFixed(2)} {p.coupling < 0.005 ? '· none' : ''}</span>
          <input type="range" min={0} max={0.23} step={0.005} value={p.coupling} onChange={(e) => set('coupling', +e.target.value)} /></label>
        <label><span>preferred phase = {(p.phaseTarget * 180 / Math.PI).toFixed(0)}°</span>
          <input type="range" min={-3.14} max={3.14} step={0.1} value={p.phaseTarget} onChange={(e) => set('phaseTarget', +e.target.value)} /></label>
        <label><span>LFP frequency = {p.fOsc} Hz</span>
          <input type="range" min={4} max={40} step={1} value={p.fOsc} onChange={(e) => set('fOsc', +e.target.value)} /></label>
        <label><span>baseline firing = {p.frBase} Hz</span>
          <input type="range" min={10} max={80} step={5} value={p.frBase} onChange={(e) => set('frBase', +e.target.value)} /></label>
        <label><span>trials = {p.nTrials}</span>
          <input type="range" min={10} max={80} step={5} value={p.nTrials} onChange={(e) => set('nTrials', +e.target.value)} /></label>
        <label><span>coupling window = {(p.winW * 1000).toFixed(0)} ms @ {p.winC.toFixed(1)} s</span>
          <input type="range" min={0.1} max={1.0} step={0.05} value={p.winW} onChange={(e) => set('winW', +e.target.value)} /></label>
      </div>

      <div className="lifsim-explain">
        <p>
          <b>What to try.</b> With <b>coupling strength</b> at zero the spikes are random: PLV is small, PPC sits near zero and
          inside the permutation band. Increase it and a peak grows in the spike-phase distribution at your <b>preferred
          phase</b>, PLV/PPC rise, and the time-resolved PPC pops above the null specifically inside the coupling window,
          a transient spike-phase coupling event. PPC (unlike PLV) is unbiased by spike count, which is why it's the
          reported metric. This is the same computation used on the intracranial data in the paper.
        </p>
      </div>
    </div>
  )
}
