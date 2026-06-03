import { useEffect, useRef } from 'react'

// Lightweight, non-interactive, looping canvas animations that illustrate one
// aspect of each topic in the notes (the full interactive demo lives in the
// Software section). Each draw(ctx, W, H, t) renders a single frame at time t.

const CY = '#22e1ff', PK = '#ff2d8f', VI = '#a35bff', AM = '#ffb84d'
const GRID = 'rgba(255,255,255,0.10)', TXT = 'rgba(215,218,230,0.6)'
const TAU = Math.PI * 2

// deterministic pseudo-noise so the animation doesn't flicker chaotically
const RND = Array.from({ length: 512 }, (_, i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x) })
const noise = (i: number) => RND[((i % 512) + 512) % 512]

type Draw = (c: CanvasRenderingContext2D, W: number, H: number, t: number) => void

function Canvas({ draw, height }: { draw: Draw; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv)
    const t0 = performance.now(); let raf = 0
    const loop = (now: number) => {
      const W = cv.clientWidth, H = cv.clientHeight
      ctx.clearRect(0, 0, W, H)
      if (W > 0 && H > 0) draw(ctx, W, H, (now - t0) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [draw])
  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} />
}

// ---------------------------------------------------------------- draws
const lif: Draw = (c, W, H, t) => {
  const P = 1.1, tau = 0.34, win = 2.4
  const Vof = (tt: number) => { const ph = ((tt % P) + P) % P; return (1 - Math.exp(-ph / tau)) / (1 - Math.exp(-P / tau)) }
  const yV = (v: number) => H * 0.84 - v * (H * 0.56)
  c.strokeStyle = 'rgba(255,45,143,0.5)'; c.setLineDash([5, 4]); c.lineWidth = 1
  c.beginPath(); c.moveTo(0, yV(1)); c.lineTo(W, yV(1)); c.stroke(); c.setLineDash([])
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('V_th', 6, yV(1) - 6)
  c.strokeStyle = CY; c.lineWidth = 2; c.beginPath()
  for (let i = 0; i <= 200; i++) { const tt = t - win + (i / 200) * win; const x = (i / 200) * W, y = yV(Vof(tt)); i ? c.lineTo(x, y) : c.moveTo(x, y) }
  c.stroke()
  c.strokeStyle = PK; c.lineWidth = 2
  for (let k = Math.ceil((t - win) / P); k * P <= t; k++) { const x = ((k * P - (t - win)) / win) * W; c.beginPath(); c.moveTo(x, yV(1)); c.lineTo(x, yV(1) - 20); c.stroke() }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(W - 2, yV(Vof(t)), 3.2, 0, TAU); c.fill()
}

const wilsonCowan: Draw = (c, W, H, t) => {
  const cx = W * 0.5, cy = H * 0.5, rx = Math.min(W * 0.3, 150), ry = H * 0.3
  c.strokeStyle = GRID; c.lineWidth = 1; c.strokeRect(W * 0.12, H * 0.1, W * 0.76, H * 0.8)
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('E →', W * 0.82, H * 0.95)
  c.save(); c.translate(W * 0.09, H * 0.55); c.rotate(-Math.PI / 2); c.fillText('I →', 0, 0); c.restore()
  c.strokeStyle = 'rgba(163,91,255,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke()
  const w = TAU * 0.2
  for (let k = 0; k < 44; k++) { const a = w * (t - k * 0.03); c.fillStyle = `rgba(34,225,255,${0.55 * (1 - k / 44)})`; c.beginPath(); c.arc(cx + rx * Math.cos(a), cy + ry * Math.sin(a), 2.3, 0, TAU); c.fill() }
  const a = w * t; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + rx * Math.cos(a), cy + ry * Math.sin(a), 4, 0, TAU); c.fill()
}

const spikePhase: Draw = (c, W, H, t) => {
  const L = W * 0.6, base = H * 0.46, amp = H * 0.26, f = 1.1, win = 3, pref = -Math.PI / 2
  c.strokeStyle = VI; c.lineWidth = 2; c.beginPath()
  for (let i = 0; i <= 180; i++) { const x = (i / 180) * L, tt = t - win + (i / 180) * win; const y = base - Math.sin(TAU * f * tt) * amp; i ? c.lineTo(x, y) : c.moveTo(x, y) }
  c.stroke()
  c.strokeStyle = PK; c.lineWidth = 2
  const yb = base - amp - 8
  for (let k = Math.floor((t - win) * f); k <= Math.ceil(t * f); k++) {
    if (noise(k + 7) < 0.8) { const tt = (-0.25 + k) / f + (noise(k + 50) - 0.5) * 0.07; const x = ((tt - (t - win)) / win) * L; if (x >= 0 && x <= L) { c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yb - 16); c.stroke() } }
  }
  const ccx = W * 0.82, ccy = H * 0.5, R = Math.min(W * 0.13, H * 0.36)
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1; c.beginPath(); c.arc(ccx, ccy, R, 0, TAU); c.stroke()
  let sx = 0, sy = 0
  for (let k = 0; k < 16; k++) { const ang = pref + (noise(k + 3) - 0.5) * 0.9; sx += Math.cos(ang); sy += Math.sin(ang); c.fillStyle = 'rgba(255,45,143,0.85)'; c.beginPath(); c.arc(ccx + Math.cos(ang) * R * 0.92, ccy - Math.sin(ang) * R * 0.92, 2.6, 0, TAU); c.fill() }
  const ang = Math.atan2(sy, sx), r = Math.hypot(sx, sy) / 16
  c.strokeStyle = CY; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ccx, ccy); c.lineTo(ccx + Math.cos(ang) * R * r, ccy - Math.sin(ang) * R * r); c.stroke()
}

const decoding: Draw = (c, W, H, t) => {
  const N = 18, s = 0.5 + 0.18 * Math.sin(t * 0.5), sig = 0.13
  const X = (u: number) => W * 0.08 + u * W * 0.84, Y = (v: number) => H * 0.86 - v * H * 0.66
  const f = (u: number) => Math.exp(-((u - s) ** 2) / (2 * sig * sig))
  c.strokeStyle = 'rgba(163,91,255,0.45)'; c.lineWidth = 1.4; c.beginPath()
  for (let i = 0; i <= 100; i++) { const u = i / 100; const x = X(u), y = Y(f(u)); i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke()
  c.strokeStyle = CY; c.fillStyle = CY; c.lineWidth = 2
  const fr = Math.floor(t * 1.5)
  for (let i = 0; i < N; i++) { const u = i / (N - 1); const r = Math.max(0, f(u) + (noise(i + fr * N) - 0.5) * 0.22); const x = X(u); c.beginPath(); c.moveTo(x, Y(0)); c.lineTo(x, Y(r)); c.stroke(); c.beginPath(); c.arc(x, Y(r), 2.4, 0, TAU); c.fill() }
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.setLineDash([4, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(X(s), Y(0)); c.lineTo(X(s), Y(1.05)); c.stroke()
  const shat = s + (noise(fr) - 0.5) * 0.06
  c.strokeStyle = PK; c.beginPath(); c.moveTo(X(shat), Y(0)); c.lineTo(X(shat), Y(1.05)); c.stroke(); c.setLineDash([])
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('s', X(s) + 4, H * 0.2); c.fillStyle = PK; c.fillText('ŝ', X(shat) + 4, H * 0.3)
}

const information: Draw = (c, W, H, t) => {
  const lanes = [H * 0.36, H * 0.64], speed = W * 0.16
  c.fillStyle = 'rgba(163,91,255,0.10)'; c.fillRect(W * 0.4, 0, W * 0.2, H)
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('channel (flip w.p. f)', W * 0.4, 14)
  c.fillStyle = TXT; c.fillText('X', 6, H * 0.5); c.fillText('Y', W - 14, H * 0.5)
  for (let k = 0; k < 9; k++) {
    const prog = ((t * speed + k * 64) % (W + 80)) - 40
    const lane = k % 2; const flip = noise(k + Math.floor((t * speed + k * 64) / (W + 80)) * 9) < 0.25
    const flipped = flip && prog > W * 0.5
    c.fillStyle = flipped ? PK : CY
    c.font = 'bold 15px monospace'
    const bit = (k % 2) ^ (flipped ? 1 : 0)
    c.fillText(String(bit), prog, lanes[lane] + 5)
  }
}

const fourier: Draw = (c, W, H, t) => {
  const cx = W * 0.34, cy = H * 0.5
  const epi = [[1, 1, 0], [-3, 0.42, 0.6], [5, 0.26, 1.4]] as [number, number, number][]
  let x = cx, y = cy
  const scale = Math.min(W * 0.16, H * 0.32)
  for (const [fr, am, ph] of epi) {
    const a = TAU * fr * (t * 0.18) + ph
    c.strokeStyle = 'rgba(163,91,255,0.3)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, am * scale, 0, TAU); c.stroke()
    const nx = x + am * scale * Math.cos(a), ny = y + am * scale * Math.sin(a)
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); x = nx; y = ny
  }
  c.fillStyle = CY; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill()
  // trail of the tip over recent time
  c.strokeStyle = PK; c.lineWidth = 2; c.beginPath()
  for (let i = 0; i <= 120; i++) {
    const tt = t - (i / 120) * 5.5; let px = cx, py = cy
    for (const [fr, am, ph] of epi) { const a = TAU * fr * (tt * 0.18) + ph; px += am * scale * Math.cos(a); py += am * scale * Math.sin(a) }
    i ? c.lineTo(px, py) : c.moveTo(px, py)
  }
  c.stroke()
}

const filter: Draw = (c, W, H, t) => {
  const win = 2.2
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('raw', 6, H * 0.18); c.fillStyle = CY; c.fillText('filtered', W - 60, H * 0.18)
  const yT = H * 0.32, yB = H * 0.74, amp = H * 0.16
  c.strokeStyle = 'rgba(163,91,255,0.6)'; c.lineWidth = 1.4; c.beginPath()
  for (let i = 0; i <= 240; i++) { const x = (i / 240) * W, tt = t - win + (i / 240) * win; const v = Math.sin(TAU * 5 * tt) + 0.5 * Math.sin(TAU * 13 * tt + 1) + 0.5 * (noise(i) - 0.5); const y = yT - v * amp * 0.5; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke()
  c.strokeStyle = CY; c.lineWidth = 2; c.beginPath()
  for (let i = 0; i <= 240; i++) { const x = (i / 240) * W, tt = t - win + (i / 240) * win; const y = yB - Math.sin(TAU * 5 * tt) * amp; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke()
  c.fillStyle = TXT; c.fillText('band-pass keeps one rhythm', 6, H - 6)
}

const wavelet: Draw = (c, W, H, t) => {
  const mid = H * 0.5, sig = W * 0.07, fw = 16
  const cx = W * 0.12 + ((t * W * 0.16) % (W * 0.86))
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1.2; c.beginPath()
  for (let x = 0; x <= W; x += 3) { const v = Math.sin(x * 0.06) * 0.3 + (x > W * 0.45 && x < W * 0.7 ? Math.sin(x * 0.5) * 0.5 : 0); c.lineTo(x, mid - v * H * 0.22) } c.stroke()
  c.strokeStyle = AM; c.lineWidth = 1; c.beginPath()
  for (let x = cx - 3 * sig; x <= cx + 3 * sig; x += 2) { const g = Math.exp(-((x - cx) ** 2) / (2 * sig * sig)); c.lineTo(x, mid - g * H * 0.34) } c.stroke()
  c.strokeStyle = CY; c.lineWidth = 1.8; c.beginPath()
  for (let x = cx - 3 * sig; x <= cx + 3 * sig; x += 1) { const g = Math.exp(-((x - cx) ** 2) / (2 * sig * sig)); const y = mid - Math.cos((x - cx) / W * fw) * g * H * 0.34; x === cx - 3 * sig ? c.moveTo(x, y) : c.lineTo(x, y) } c.stroke()
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('Morlet wavelet sliding along the signal', 6, H - 6)
}

const kalman: Draw = (c, W, H, t) => {
  const mid = H * 0.5, amp = H * 0.28, win = 3
  const truth = (tt: number) => mid - Math.sin(tt * 1.3) * amp
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.4; c.beginPath()
  for (let i = 0; i <= 200; i++) { const x = (i / 200) * W, tt = t - win + (i / 200) * win; const y = truth(tt); i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke()
  c.fillStyle = 'rgba(255,45,143,0.6)'
  for (let i = 0; i < 46; i++) { const u = i / 45, x = u * W, tt = t - win + u * win; const y = truth(tt) + (noise(i + Math.floor(t * 6)) - 0.5) * H * 0.3; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill() }
  c.strokeStyle = CY; c.lineWidth = 2.2; c.beginPath()
  for (let i = 0; i <= 200; i++) { const x = (i / 200) * W, tt = t - win + (i / 200) * win; const y = truth(tt) + Math.sin(tt * 7) * 2; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke()
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('● true   ● noisy read-out   ● Kalman estimate', 6, H - 6)
}

const dbs: Draw = (c, W, H, t) => {
  const mid = H * 0.5, A = H * 0.3, P = W * 0.26, pw = P * 0.12
  c.strokeStyle = GRID; c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke()
  c.strokeStyle = CY; c.lineWidth = 2.2; c.beginPath()
  const shift = (t * W * 0.12) % P
  c.moveTo(0, mid)
  for (let n = -1; n * P < W + P; n++) {
    const x0 = n * P - shift
    c.lineTo(x0, mid); c.lineTo(x0, mid + A); c.lineTo(x0 + pw, mid + A); c.lineTo(x0 + pw, mid)         // cathodic
    c.lineTo(x0 + pw, mid - A * 0.4); c.lineTo(x0 + pw * 3, mid - A * 0.4); c.lineTo(x0 + pw * 3, mid)     // recharge
    c.lineTo((n + 1) * P - shift, mid)
  }
  c.stroke()
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('charge-balanced biphasic pulse train', 6, 16)
}

const eeg: Draw = (c, W, H, t) => {
  const cx = W * 0.5, cy = H * 0.52, R = Math.min(W * 0.36, H * 0.42)
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke()
  c.beginPath(); c.moveTo(cx - 9, cy - R + 2); c.lineTo(cx, cy - R - 10); c.lineTo(cx + 9, cy - R + 2); c.stroke()  // nose
  const dx = cx + R * 0.33, dy = cy - R * 0.28
  const period = 2.0, maxR = R * 1.75
  const fronts = [((t / period) % 1), ((t / period + 0.5) % 1)]            // two staggered wavefronts
  for (const ph of fronts) {
    c.strokeStyle = `rgba(255,45,143,${0.6 * (1 - ph)})`; c.lineWidth = 1.8
    c.beginPath(); c.arc(dx, dy, ph * maxR, 0, TAU); c.stroke()
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2
    const ex = cx + Math.cos(a) * R, ey = cy + Math.sin(a) * R, d = Math.hypot(ex - dx, ey - dy)
    let b = 0
    for (const ph of fronts) b = Math.max(b, Math.exp(-((((ph * maxR) - d) / (R * 0.22)) ** 2)))   // bright as a front passes
    c.fillStyle = `rgba(34,225,255,${0.25 + 0.75 * b})`
    c.beginPath(); c.arc(ex, ey, 3.5 + 2.5 * b, 0, TAU); c.fill()
  }
  c.fillStyle = '#ff4d6d'; c.beginPath(); c.arc(dx, dy, 6, 0, TAU); c.fill()
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + 12, dy - 12); c.stroke()
  c.fillStyle = TXT; c.font = '11px monospace'; c.fillText('one dipole → every electrode (volume conduction)', 6, H - 6)
}

const DRAW: Record<string, { fn: Draw; cap: string; h?: number }> = {
  lif: { fn: lif, cap: 'Membrane voltage charging to threshold, firing, and resetting — the integrate-and-fire cycle.' },
  'wilson-cowan': { fn: wilsonCowan, cap: 'A trajectory settling onto the limit cycle: the E–I network’s sustained oscillation.' },
  'spike-phase': { fn: spikePhase, cap: 'Spikes concentrate at a preferred phase of the rhythm; the resultant vector (cyan) is the PLV.' },
  decoding: { fn: decoding, cap: 'A noisy population hill encodes the stimulus s; the decoded estimate ŝ jitters around the truth.' },
  information: { fn: information, cap: 'Bits crossing a binary symmetric channel; some flip (pink) with probability f.' },
  fourier: { fn: fourier, cap: 'A few rotating vectors (epicycles) chained tip-to-tail trace out a closed curve.' },
  filter: { fn: filter, cap: 'A band-pass filter turns a mixed, noisy signal (violet) into a single clean rhythm (cyan).' },
  wavelet: { fn: wavelet, cap: 'A Morlet wavelet (cyan, amber envelope) slides along the signal — the convolution that builds the scalogram.' },
  kalman: { fn: kalman, cap: 'The Kalman estimate (cyan) tracks the true path through scattered noisy measurements (pink).' },
  dbs: { fn: dbs, cap: 'A charge-balanced biphasic pulse train: a short cathodic phase plus a long, low recharge phase.' },
  eeg: { fn: eeg, cap: 'A single cortical dipole spreads to every scalp electrode — volume conduction.' },
}

export const hasAnim = (slug: string) => slug in DRAW

export function Anim({ slug }: { slug: string }) {
  const d = DRAW[slug]
  if (!d) return null
  return (
    <figure className="np-anim">
      <Canvas draw={d.fn} height={d.h || 190} />
      <figcaption>{d.cap}</figcaption>
    </figure>
  )
}
