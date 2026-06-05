import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react'
import { buildSS, transferFn, polySub, polyAddK, polyEval, roots, cabs, carg, cmul } from './controlMath'

// Free-form block-diagram sandbox for linear systems & control. Drag blocks
// from the palette, wire output ports to input ports, press Run: a discrete-time
// engine integrates the whole diagram (feedback loops included) and the scope
// plots every signal you connect to a Scope block. Open- vs closed-loop is just
// whether the feedback wire is present.

type BType = 'step' | 'impulse' | 'sine' | 'sum' | 'gain' | 'integrator' | 'tf1' | 'tf2' | 'deriv' | 'delay' | 'sat' | 'scope'
type Block = { id: number; type: BType; x: number; y: number; p: Record<string, number>; role?: string }
type Wire = { id: number; from: number; fromPort: number; to: number; toPort: number }

const BW = 104, BH = 56
// palette grouped by role, each with a glyph icon
const PALETTE: { group: string; items: { type: BType; label: string; icon: string }[] }[] = [
  { group: 'Sources', items: [{ type: 'step', label: 'Step', icon: '⎍' }, { type: 'impulse', label: 'Impulse', icon: 'δ' }, { type: 'sine', label: 'Sine', icon: '∿' }] },
  { group: 'Operators', items: [{ type: 'sum', label: 'Sum', icon: '⊕' }, { type: 'gain', label: 'Gain', icon: '◁' }] },
  { group: 'Dynamics', items: [{ type: 'integrator', label: 'Integrator', icon: '∫' }, { type: 'deriv', label: 'Derivative', icon: 'ⅆ' }, { type: 'tf1', label: '1st-order', icon: '⅟' }, { type: 'tf2', label: '2nd-order', icon: 'ω' }, { type: 'delay', label: 'Delay', icon: '⧖' }] },
  { group: 'Nonlinear', items: [{ type: 'sat', label: 'Saturate', icon: '⎍̄' }] },
  { group: 'Sinks', items: [{ type: 'scope', label: 'Scope', icon: '▦' }] },
]
const nIn = (t: BType) => (t === 'step' || t === 'impulse' || t === 'sine' ? 0 : t === 'sum' || t === 'scope' ? 2 : 1)
const hasOut = (t: BType) => t !== 'scope'
const COLORS = ['#22e1ff', '#ff2d8f', '#ffb84d', '#54e6a0', '#9b8cff', '#5b8bff']

const defaults = (t: BType): Record<string, number> => ({
  step: { amp: 1, t0: 0.5 }, impulse: { amp: 1, t0: 0.5 }, sine: { amp: 1, freq: 0.5 }, sum: { s0: 1, s1: -1 },
  gain: { K: 2 }, integrator: {}, tf1: { K: 1, tau: 1 }, tf2: { K: 1, wn: 2, zeta: 0.3 },
  deriv: { Kd: 1, N: 20 }, delay: { T: 0.5 }, sat: { lo: -1, hi: 1 }, scope: {},
}[t])

const label = (b: Block): string[] => ({
  step: ['step', `A=${b.p.amp}`], impulse: ['δ(t)', `A=${b.p.amp}`], sine: ['sine', `f=${b.p.freq}`], sum: ['Σ', `${b.p.s0 > 0 ? '+' : '−'} ${b.p.s1 > 0 ? '+' : '−'}`],
  gain: ['gain', `K=${b.p.K}`], integrator: ['1/s', 'integ.'], tf1: ['K/(τs+1)', `K=${b.p.K} τ=${b.p.tau}`],
  tf2: ['2nd order', `ωₙ=${b.p.wn} ζ=${b.p.zeta}`], deriv: ['Kd·s/(s+N)', `Kd=${b.p.Kd} N=${b.p.N}`], delay: ['e^(−sT)', `T=${b.p.T}`], sat: ['saturate', `[${b.p.lo},${b.p.hi}]`], scope: ['▦ scope', ''],
}[b.type])

// port coordinates
const inPort = (b: Block, i: number) => ({ x: b.x, y: b.y + (BH * (i + 1)) / (nIn(b.type) + 1) })
const outPort = (b: Block) => ({ x: b.x + BW, y: b.y + BH / 2 })

// ----- a worked closed-loop example -----
function example(): { blocks: Block[]; wires: Wire[] } {
  // a third-order loop (controller · actuator lag · 2nd-order plant) — stable at
  // low gain, but it crosses into instability as the controller gain is raised.
  const blocks: Block[] = [
    { id: 1, type: 'step', x: 14, y: 150, p: defaults('step'), role: 'reference' },
    { id: 2, type: 'sum', x: 140, y: 150, p: { s0: 1, s1: -1 }, role: 'error' },
    { id: 3, type: 'gain', x: 266, y: 150, p: { K: 2 }, role: 'controller' },
    { id: 4, type: 'tf1', x: 392, y: 150, p: { K: 1, tau: 0.3 }, role: 'actuator' },
    { id: 5, type: 'tf2', x: 518, y: 150, p: { K: 1, wn: 2, zeta: 0.5 }, role: 'plant' },
    { id: 6, type: 'scope', x: 644, y: 150, p: {}, role: 'output' },
  ]
  const wires: Wire[] = [
    { id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 },
    { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 },
    { id: 3, from: 3, fromPort: 0, to: 4, toPort: 0 },
    { id: 4, from: 4, fromPort: 0, to: 5, toPort: 0 },
    { id: 5, from: 5, fromPort: 0, to: 6, toPort: 0 },
    { id: 6, from: 5, fromPort: 0, to: 2, toPort: 1 },   // feedback
    { id: 7, from: 1, fromPort: 0, to: 6, toPort: 1 },   // reference on the scope too
  ]
  return { blocks, wires }
}

// a small library of classic example systems
function preset1st() {
  return {
    blocks: [
      { id: 1, type: 'step', x: 14, y: 150, p: defaults('step'), role: 'reference' },
      { id: 2, type: 'sum', x: 140, y: 150, p: { s0: 1, s1: -1 }, role: 'error' },
      { id: 3, type: 'gain', x: 266, y: 150, p: { K: 4 }, role: 'controller' },
      { id: 4, type: 'tf1', x: 392, y: 150, p: { K: 1, tau: 1 }, role: 'plant' },
      { id: 5, type: 'scope', x: 518, y: 150, p: {}, role: 'output' },
    ] as Block[],
    wires: [{ id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 }, { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 }, { id: 3, from: 3, fromPort: 0, to: 4, toPort: 0 }, { id: 4, from: 4, fromPort: 0, to: 5, toPort: 0 }, { id: 5, from: 4, fromPort: 0, to: 2, toPort: 1 }, { id: 6, from: 1, fromPort: 0, to: 5, toPort: 1 }] as Wire[],
  }
}
function preset2nd() {
  return {
    blocks: [
      { id: 1, type: 'step', x: 14, y: 150, p: defaults('step'), role: 'reference' },
      { id: 2, type: 'sum', x: 140, y: 150, p: { s0: 1, s1: -1 }, role: 'error' },
      { id: 3, type: 'gain', x: 266, y: 150, p: { K: 1.5 }, role: 'controller' },
      { id: 4, type: 'tf2', x: 392, y: 150, p: { K: 1, wn: 2, zeta: 0.4 }, role: 'plant' },
      { id: 5, type: 'scope', x: 518, y: 150, p: {}, role: 'output' },
    ] as Block[],
    wires: [{ id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 }, { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 }, { id: 3, from: 3, fromPort: 0, to: 4, toPort: 0 }, { id: 4, from: 4, fromPort: 0, to: 5, toPort: 0 }, { id: 5, from: 4, fromPort: 0, to: 2, toPort: 1 }, { id: 6, from: 1, fromPort: 0, to: 5, toPort: 1 }] as Wire[],
  }
}
function presetDoubleInt() {
  return {
    blocks: [
      { id: 1, type: 'step', x: 14, y: 150, p: defaults('step'), role: 'reference' },
      { id: 2, type: 'sum', x: 132, y: 150, p: { s0: 1, s1: -1 }, role: 'error' },
      { id: 3, type: 'gain', x: 250, y: 150, p: { K: 1 }, role: 'controller' },
      { id: 4, type: 'integrator', x: 368, y: 150, p: {}, role: 'plant' },
      { id: 5, type: 'integrator', x: 486, y: 150, p: {}, role: 'plant' },
      { id: 6, type: 'scope', x: 632, y: 150, p: {}, role: 'output' },
    ] as Block[],
    wires: [{ id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 }, { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 }, { id: 3, from: 3, fromPort: 0, to: 4, toPort: 0 }, { id: 4, from: 4, fromPort: 0, to: 5, toPort: 0 }, { id: 5, from: 5, fromPort: 0, to: 6, toPort: 0 }, { id: 6, from: 5, fromPort: 0, to: 2, toPort: 1 }, { id: 7, from: 1, fromPort: 0, to: 6, toPort: 1 }] as Wire[],
  }
}
function presetOpen() {
  return {
    blocks: [
      { id: 1, type: 'step', x: 30, y: 150, p: defaults('step'), role: 'input' },
      { id: 2, type: 'gain', x: 190, y: 150, p: { K: 2 }, role: 'gain' },
      { id: 3, type: 'tf1', x: 350, y: 150, p: { K: 1, tau: 1 }, role: 'plant' },
      { id: 4, type: 'scope', x: 510, y: 150, p: {}, role: 'output' },
    ] as Block[],
    wires: [{ id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 }, { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 }, { id: 3, from: 3, fromPort: 0, to: 4, toPort: 0 }, { id: 4, from: 1, fromPort: 0, to: 4, toPort: 1 }] as Wire[],
  }
}
// non-unity feedback: a sensor with its own dynamics sits IN the feedback path
function presetSensor() {
  return {
    blocks: [
      { id: 1, type: 'step', x: 14, y: 120, p: defaults('step'), role: 'reference' },
      { id: 2, type: 'sum', x: 130, y: 120, p: { s0: 1, s1: -1 }, role: 'error' },
      { id: 3, type: 'gain', x: 246, y: 120, p: { K: 3 }, role: 'controller' },
      { id: 4, type: 'tf2', x: 362, y: 120, p: { K: 1, wn: 2, zeta: 0.4 }, role: 'plant' },
      { id: 5, type: 'scope', x: 520, y: 120, p: {}, role: 'output' },
      { id: 6, type: 'tf1', x: 362, y: 256, p: { K: 1, tau: 0.15 }, role: 'sensor' },
    ] as Block[],
    wires: [
      { id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 }, { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 },
      { id: 3, from: 3, fromPort: 0, to: 4, toPort: 0 }, { id: 4, from: 4, fromPort: 0, to: 5, toPort: 0 },
      { id: 5, from: 4, fromPort: 0, to: 6, toPort: 0 }, { id: 6, from: 6, fromPort: 0, to: 2, toPort: 1 },   // plant → sensor → error
      { id: 7, from: 1, fromPort: 0, to: 5, toPort: 1 },
    ] as Wire[],
  }
}
// textbook PID: three parallel terms (Kp, Ki/s, Kd·s) summed into the plant
function presetPID() {
  return {
    blocks: [
      { id: 1, type: 'step', x: 8, y: 160, p: defaults('step'), role: 'reference' },
      { id: 2, type: 'sum', x: 110, y: 160, p: { s0: 1, s1: -1 }, role: 'error' },
      { id: 3, type: 'gain', x: 224, y: 56, p: { K: 3 }, role: 'P · Kp' },
      { id: 4, type: 'integrator', x: 224, y: 160, p: {}, role: 'I · ∫' },
      { id: 5, type: 'gain', x: 336, y: 160, p: { K: 2 }, role: 'Ki' },
      { id: 6, type: 'deriv', x: 224, y: 268, p: { Kd: 1, N: 20 }, role: 'D · Kd·s' },
      { id: 7, type: 'sum', x: 448, y: 104, p: { s0: 1, s1: 1 }, role: 'P + I' },
      { id: 8, type: 'sum', x: 560, y: 188, p: { s0: 1, s1: 1 }, role: 'u = P+I+D' },
      { id: 9, type: 'tf2', x: 672, y: 188, p: { K: 1, wn: 2, zeta: 0.3 }, role: 'plant' },
      { id: 10, type: 'scope', x: 800, y: 188, p: {}, role: 'output' },
    ] as Block[],
    wires: [
      { id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 },
      { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 }, { id: 3, from: 2, fromPort: 0, to: 4, toPort: 0 }, { id: 4, from: 2, fromPort: 0, to: 6, toPort: 0 },
      { id: 5, from: 4, fromPort: 0, to: 5, toPort: 0 },
      { id: 6, from: 3, fromPort: 0, to: 7, toPort: 0 }, { id: 7, from: 5, fromPort: 0, to: 7, toPort: 1 },
      { id: 8, from: 7, fromPort: 0, to: 8, toPort: 0 }, { id: 9, from: 6, fromPort: 0, to: 8, toPort: 1 },
      { id: 10, from: 8, fromPort: 0, to: 9, toPort: 0 }, { id: 11, from: 9, fromPort: 0, to: 10, toPort: 0 },
      { id: 12, from: 9, fromPort: 0, to: 2, toPort: 1 }, { id: 13, from: 1, fromPort: 0, to: 10, toPort: 1 },
    ] as Wire[],
  }
}
// open-loop step responses (no feedback): just drive a plant and watch it
function presetOpenN(plant: Block): { blocks: Block[]; wires: Wire[] } {
  return {
    blocks: [
      { id: 1, type: 'step', x: 60, y: 150, p: defaults('step'), role: 'input' },
      { ...plant, id: 2, x: 280, y: 150 },
      { id: 3, type: 'scope', x: 500, y: 150, p: {}, role: 'output' },
    ],
    wires: [{ id: 1, from: 1, fromPort: 0, to: 2, toPort: 0 }, { id: 2, from: 2, fromPort: 0, to: 3, toPort: 0 }, { id: 3, from: 1, fromPort: 0, to: 3, toPort: 1 }],
  }
}
const presetOpen1 = () => presetOpenN({ id: 2, type: 'tf1', x: 0, y: 0, p: { K: 1, tau: 1 }, role: 'plant' })
const presetOpen2 = () => presetOpenN({ id: 2, type: 'tf2', x: 0, y: 0, p: { K: 1, wn: 2, zeta: 0.3 }, role: 'plant' })

// example presets, grouped open-loop vs closed-loop
const PRESET_GROUPS: { group: string; items: { name: string; make: () => { blocks: Block[]; wires: Wire[] } }[] }[] = [
  { group: 'Open loop', items: [{ name: '1st-order', make: presetOpen1 }, { name: '2nd-order', make: presetOpen2 }, { name: 'gain · lag', make: presetOpen }] },
  { group: 'Closed loop', items: [{ name: '1st-order', make: preset1st }, { name: '2nd-order', make: preset2nd }, { name: '3rd-order ⚠', make: example }, { name: 'double ∫', make: presetDoubleInt }, { name: 'PID', make: presetPID }, { name: 'sensor feedback', make: presetSensor }] },
]

export default function ControlLab() {
  const ex = example()
  const [blocks, setBlocks] = useState<Block[]>(ex.blocks)
  const [wires, setWires] = useState<Wire[]>(ex.wires)
  const [sel, setSel] = useState<number | null>(null)
  const [running, setRunning] = useState(true)
  const nextId = useRef(100)

  const svgRef = useRef<SVGSVGElement>(null)
  const scopeRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ kind: 'move' | 'wire'; id?: number; dx?: number; dy?: number; from?: number; mx?: number; my?: number; over?: { id: number; port: number } } | null>(null)
  const [, force] = useState(0)
  const graph = useRef({ blocks, wires }); graph.current = { blocks, wires }

  // ---------- simulation ----------
  const rt = useRef<{ t: number; out: Record<number, number>; st: Record<number, number[]>; hist: { t: number[]; sig: Record<number, number[]> } }>({ t: 0, out: {}, st: {}, hist: { t: [], sig: {} } })
  const resetSim = () => { rt.current = { t: 0, out: {}, st: {}, hist: { t: [], sig: {} } } }

  useEffect(() => {
    const cv = scopeRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv)
    const dt = 0.01, WIN = 10
    let raf = 0
    const step = () => {
      const { blocks, wires } = graph.current, r = rt.current
      const byId: Record<number, Block> = {}; blocks.forEach((b) => (byId[b.id] = b))
      const getIn = (id: number, port: number) => { const w = wires.find((w) => w.to === id && w.toPort === port); return w ? (r.out[w.from] ?? 0) : 0 }
      // A: sources + stateful read-out
      for (const b of blocks) {
        if (b.type === 'step') r.out[b.id] = r.t >= b.p.t0 ? b.p.amp : 0
        else if (b.type === 'impulse') r.out[b.id] = (r.t >= b.p.t0 && r.t - dt < b.p.t0) ? b.p.amp / dt : 0   // unit-area pulse over one step
        else if (b.type === 'sine') r.out[b.id] = b.p.amp * Math.sin(2 * Math.PI * b.p.freq * r.t)
        else if (b.type === 'integrator') r.out[b.id] = (r.st[b.id] ||= [0])[0]
        else if (b.type === 'tf1') r.out[b.id] = (r.st[b.id] ||= [0])[0]
        else if (b.type === 'tf2') r.out[b.id] = (r.st[b.id] ||= [0, 0])[0]
        else if (b.type === 'delay') { const buf = (r.st[b.id] ||= []); const d = Math.max(1, Math.round(b.p.T / dt)); r.out[b.id] = buf.length >= d ? buf[buf.length - d] : 0 }   // exact transport delay y(t)=u(t−T)
      }
      // B: feedthrough nodes in topological order (deriv has a direct term too)
      const mem = blocks.filter((b) => b.type === 'sum' || b.type === 'gain' || b.type === 'sat' || b.type === 'deriv')
      const memSet = new Set(mem.map((b) => b.id))
      const indeg: Record<number, number> = {}; mem.forEach((b) => (indeg[b.id] = 0))
      for (const w of wires) if (memSet.has(w.from) && memSet.has(w.to)) indeg[w.to]++
      const q = mem.filter((b) => indeg[b.id] === 0).map((b) => b.id); const order: number[] = []
      while (q.length) { const id = q.shift()!; order.push(id); for (const w of wires) if (w.from === id && memSet.has(w.to)) { if (--indeg[w.to] === 0) q.push(w.to) } }
      for (const b of mem) if (!order.includes(b.id)) order.push(b.id)   // leftover (memoryless loop)
      for (const id of order) {
        const b = byId[id]
        if (b.type === 'gain') r.out[id] = b.p.K * getIn(id, 0)
        else if (b.type === 'sum') r.out[id] = b.p.s0 * getIn(id, 0) + b.p.s1 * getIn(id, 1)
        else if (b.type === 'sat') r.out[id] = Math.max(b.p.lo, Math.min(b.p.hi, getIn(id, 0)))
        else if (b.type === 'deriv') { const s = (r.st[id] ||= [0]); r.out[id] = b.p.Kd * b.p.N * (getIn(id, 0) - s[0]) }
      }
      // C: record scope inputs — keep ONE coherent table where every signal array
      // is the same length as the time axis, so a signal wired in mid-run aligns
      // (back-filled with NaN) instead of being annihilated by the trim below.
      const tapped = new Map<number, number>()
      for (const b of blocks) if (b.type === 'scope') {
        for (let port = 0; port < 2; port++) { const w = wires.find((w) => w.to === b.id && w.toPort === port); if (w) tapped.set(w.from, r.out[w.from] ?? 0) }
      }
      const T = r.hist.t.length
      for (const src of tapped.keys()) if (!(src in r.hist.sig)) r.hist.sig[src] = new Array(T).fill(NaN)   // new tap: pad past with NaN
      for (const k in r.hist.sig) { const id = Number(k); r.hist.sig[id].push(tapped.has(id) ? tapped.get(id)! : NaN) }
      r.hist.t.push(r.t)
      // D: update states
      for (const b of blocks) {
        if (b.type === 'integrator') { const s = (r.st[b.id] ||= [0]); s[0] += getIn(b.id, 0) * dt }
        else if (b.type === 'tf1') { const s = (r.st[b.id] ||= [0]); s[0] += ((-s[0] + b.p.K * getIn(b.id, 0)) / Math.max(1e-3, b.p.tau)) * dt }
        else if (b.type === 'tf2') { const s = (r.st[b.id] ||= [0, 0]); const u = getIn(b.id, 0); const a = b.p.wn * b.p.wn * (b.p.K * u - s[0]) - 2 * b.p.zeta * b.p.wn * s[1]; s[1] += a * dt; s[0] += s[1] * dt }
        else if (b.type === 'deriv') { const s = (r.st[b.id] ||= [0]); s[0] += b.p.N * (getIn(b.id, 0) - s[0]) * dt }
        else if (b.type === 'delay') { const buf = (r.st[b.id] ||= []); buf.push(getIn(b.id, 0)); const d = Math.max(1, Math.round(b.p.T / dt)); while (buf.length > d + 1) buf.shift() }
      }
      r.t += dt
      // trim history to WIN seconds — all arrays stay equal length to t, so this is safe
      while (r.hist.t.length && r.hist.t[0] < r.t - WIN) { r.hist.t.shift(); for (const k in r.hist.sig) r.hist.sig[k].shift() }
      // drop signals that scrolled fully off-screen and are no longer tapped (frees their colour)
      for (const k in r.hist.sig) { const id = Number(k); if (!tapped.has(id) && !r.hist.sig[id].some((v) => Number.isFinite(v))) delete r.hist.sig[id] }
    }
    const draw = () => {
      const W = cv.clientWidth, H = cv.clientHeight, r = rt.current
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      for (let g = 0; g <= 4; g++) { const y = (g / 4) * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      const sigs = Object.keys(r.hist.sig).map(Number)
      const n = r.hist.t.length
      let mn = -1.2, mx = 1.2
      for (const k of sigs) for (const v of r.hist.sig[k]) { if (Number.isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v } }
      const pad = (mx - mn) * 0.1 || 0.5; mn -= pad; mx += pad
      const X = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W)
      const Y = (v: number) => H - ((v - mn) / (mx - mn)) * H
      sigs.forEach((k, ci) => {
        const arr = r.hist.sig[k]; ctx.strokeStyle = COLORS[ci % COLORS.length]; ctx.lineWidth = 1.8; ctx.beginPath()
        let pen = false
        arr.forEach((v, i) => { if (!Number.isFinite(v)) { pen = false; return } const x = X(i), y = Y(v); if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true } }); ctx.stroke()
      })
      ctx.fillStyle = 'rgba(233,235,251,0.6)'; ctx.font = '11px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`t = ${r.t.toFixed(1)} s   ·   y ∈ [${mn.toFixed(1)}, ${mx.toFixed(1)}]`, 8, 16)
      // legend: colour ↔ signal source (so multiple scopes / signals are readable)
      const byId = graph.current.blocks.reduce((m, b) => (m[b.id] = b, m), {} as Record<number, Block>)
      let lx = W - 8; ctx.textAlign = 'right'
      sigs.forEach((k, ci) => {
        const b = byId[k]; if (!b) return; const name = (b.role || label(b)[0])
        ctx.font = '10px monospace'; const tw = ctx.measureText(name).width
        ctx.fillStyle = COLORS[ci % COLORS.length]; ctx.fillText(name, lx, 16); lx -= tw + 6
        ctx.fillRect(lx - 4, 12, 8, 3); lx -= 14
      })
      // divergence warning
      if (sigs.some((k) => { const a = r.hist.sig[k]; const last = [...a].reverse().find((v) => Number.isFinite(v)); return last !== undefined && Math.abs(last) > 1e4 })) {
        ctx.fillStyle = '#ff6b6b'; ctx.textAlign = 'left'; ctx.fillText('⚠ unstable: output diverging', 8, 32)
      }
    }
    const loop = () => { if (running) for (let i = 0; i < 3; i++) step(); draw(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [running])

  // ---------- interaction ----------
  const pt = (e: RPE) => { const r = svgRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  const onBlockDown = (e: RPE, b: Block) => { e.stopPropagation(); setSel(b.id); const m = pt(e); drag.current = { kind: 'move', id: b.id, dx: m.x - b.x, dy: m.y - b.y }; svgRef.current!.setPointerCapture(e.pointerId) }
  const onOutDown = (e: RPE, b: Block) => { e.stopPropagation(); const m = pt(e); drag.current = { kind: 'wire', from: b.id, mx: m.x, my: m.y }; svgRef.current!.setPointerCapture(e.pointerId) }
  // nearest input port to a canvas point (within grab radius), excluding `fromId`
  const hitInPort = (m: { x: number; y: number }, fromId?: number) => {
    let best: { id: number; port: number; d: number } | null = null
    for (const b of graph.current.blocks) {
      if (b.id === fromId) continue
      for (let i = 0; i < nIn(b.type); i++) {
        const p = inPort(b, i), d = Math.hypot(p.x - m.x, p.y - m.y)
        if (d < 18 && (!best || d < best.d)) best = { id: b.id, port: i, d }
      }
    }
    return best
  }
  const onMove = (e: RPE) => {
    const d = drag.current; if (!d) return; const m = pt(e)
    if (d.kind === 'move') setBlocks((bs) => bs.map((b) => (b.id === d.id ? { ...b, x: Math.max(0, m.x - d.dx!), y: Math.max(0, m.y - d.dy!) } : b)))
    else { d.mx = m.x; d.my = m.y; d.over = hitInPort(m, d.from) ?? undefined; force((n) => n + 1) }
  }
  const onUp = (e: RPE) => {
    const d = drag.current
    if (d?.kind === 'wire' && d.from != null) {
      const hit = hitInPort(pt(e), d.from)
      if (hit) { const from = d.from, to = hit.id, port = hit.port; setWires((ws) => [...ws.filter((w) => !(w.to === to && w.toPort === port)), { id: nextId.current++, from, fromPort: 0, to, toPort: port }]) }
    }
    drag.current = null; force((n) => n + 1)
  }

  // drop new blocks into the open lower-left area, cascading so they don't stack on each other or the existing row
  const add = (type: BType) => setBlocks((bs) => { const k = bs.length; return [...bs, { id: nextId.current++, type, x: 24 + (k % 8) * 42, y: 250 + (k % 3) * 20, p: defaults(type) }] })
  const delBlock = (id: number) => { setBlocks((bs) => bs.filter((b) => b.id !== id)); setWires((ws) => ws.filter((w) => w.from !== id && w.to !== id)); setSel(null) }
  const delWire = (id: number) => setWires((ws) => ws.filter((w) => w.id !== id))
  const setParam = (id: number, k: string, v: number) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, p: { ...b.p, [k]: v } } : b)))
  const setRole = (id: number, role: string) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, role: role || undefined } : b)))

  const selBlock = blocks.find((b) => b.id === sel) || null
  const byId: Record<number, Block> = {}; blocks.forEach((b) => (byId[b.id] = b))
  const contentW = Math.max(760, ...blocks.map((b) => b.x + BW)) + 56   // canvas width so wide diagrams (e.g. PID) scroll
  const wirePath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2
    if (b.x < a.x - 10) {                                  // feedback: smooth loop below the diagram
      const dip = Math.max(a.y, b.y) + 92, e = Math.min(90, (a.x - b.x) * 0.45)
      return `M${a.x},${a.y} C${a.x + e},${a.y} ${mx + e},${dip} ${mx},${dip} C${mx - e},${dip} ${b.x - e},${b.y} ${b.x},${b.y}`
    }
    if (b.x - a.x > BW * 2.1) {                             // long forward: smooth arc above the diagram
      const rise = Math.max(14, Math.min(a.y, b.y) - 92), e = Math.min(90, (b.x - a.x) * 0.32)
      return `M${a.x},${a.y} C${a.x + e},${a.y} ${mx - e},${rise} ${mx},${rise} C${mx + e},${rise} ${b.x - e},${b.y} ${b.x},${b.y}`
    }
    const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5)
    return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`
  }

  return (
    <div className="lifsim panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Block-diagram sandbox — linear systems &amp; control</div>
          <div className="lifsim-sub">Drag blocks from the palette, wire an output port (right) to an input port (left), and watch the scope. Feedback loops, open vs closed loop, stability — build it and see what happens. The default diagram is a closed loop; delete the feedback wire to open it.</div>
        </div>
        <div className="lifsim-headright">
          <button className="lifsim-expand" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Run'}</button>
          <button className="lifsim-expand" onClick={() => { resetSim() }}>Reset</button>
          <button className="lifsim-expand cl-clear" title="Remove every block and wire" onClick={() => { if (blocks.length && !confirm('Clear the whole diagram?')) return; setBlocks([]); setWires([]); resetSim(); setSel(null) }}>✕ Clear all</button>
        </div>
      </div>

      <div className="cl-addbar">
        <span className="wav-modelabel">examples</span>
        {PRESET_GROUPS.map((grp) => (
          <div key={grp.group} className="cl-addgroup">
            <span className="cl-addgroup-label">{grp.group}</span>
            <div className="cl-addgroup-btns">
              {grp.items.map((p) => (
                <button key={p.name} className="cl-addbtn" onClick={() => { const g = p.make(); setBlocks(g.blocks); setWires(g.wires); nextId.current = 100; resetSim(); setSel(null) }}>{p.name}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="cl-addbar">
        <span className="wav-modelabel">add block</span>
        {PALETTE.map((g) => (
          <div key={g.group} className="cl-addgroup">
            <span className="cl-addgroup-label">{g.group}</span>
            <div className="cl-addgroup-btns">
              {g.items.map((it) => (
                <button key={it.type} className="cl-addbtn" onClick={() => add(it.type)} title={`Add ${it.label}`}>
                  <span className="cl-addbtn-ic">{it.icon}</span>{it.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="cl-stage">
       <div className="cl-scroll">
        <svg ref={svgRef} className="cl-canvas" style={{ width: contentW }} onPointerMove={onMove} onPointerUp={onUp} onPointerDown={() => setSel(null)}>
          <defs><marker id="cl-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="3" orient="auto"><path d="M0,0 L7.5,3 L0,6 Z" fill="#7c89b5" /></marker></defs>
          {wires.map((w) => { const a = byId[w.from] && outPort(byId[w.from]); const b = byId[w.to] && inPort(byId[w.to], w.toPort); if (!a || !b) return null
            return <g key={w.id} className="cl-wire">
              <path d={wirePath(a, b)} fill="none" stroke="transparent" strokeWidth="12" onClick={() => delWire(w.id)} style={{ cursor: 'pointer' }} />
              <path d={wirePath(a, b)} fill="none" stroke="#7c89b5" strokeWidth="2" markerEnd="url(#cl-arrow)" pointerEvents="none" />
            </g> })}
          {drag.current?.kind === 'wire' && byId[drag.current.from!] && (
            <path d={wirePath(outPort(byId[drag.current.from!]), { x: drag.current.mx!, y: drag.current.my! })} fill="none" stroke="#22e1ff" strokeWidth="2" strokeDasharray="4 3" pointerEvents="none" />
          )}
          {blocks.map((b) => {
            const [l0, l1] = label(b)
            return <g key={b.id}>
              {b.role && <text x={b.x + BW / 2} y={b.y - 9} textAnchor="middle" className="cl-role">{b.role}</text>}
              <rect x={b.x} y={b.y} width={BW} height={BH} rx="9" className={`cl-block${sel === b.id ? ' sel' : ''}${b.type === 'scope' ? ' scope' : ''}`} onPointerDown={(e) => onBlockDown(e, b)} />
              <text x={b.x + BW / 2} y={b.y + 23} textAnchor="middle" className="cl-bt">{l0}</text>
              {l1 && <text x={b.x + BW / 2} y={b.y + 40} textAnchor="middle" className="cl-bs">{l1}</text>}
              {Array.from({ length: nIn(b.type) }).map((_, i) => { const p = inPort(b, i); const tgt = drag.current?.over?.id === b.id && drag.current?.over?.port === i; return <g key={i}><circle cx={p.x} cy={p.y} r={tgt ? 9 : 6.5} className={`cl-port${tgt ? ' tgt' : ''}`} /><circle cx={p.x} cy={p.y} r="13" className="cl-hit" pointerEvents="none" /></g> })}
              {hasOut(b.type) && (() => { const p = outPort(b); return <g><circle cx={p.x} cy={p.y} r="6.5" className="cl-port" /><circle cx={p.x} cy={p.y} r="13" className="cl-hit out" onPointerDown={(e) => onOutDown(e, b)} /></g> })()}
            </g>
          })}
        </svg>
       </div>

        {selBlock && (
          <div className="cl-inspect">
            <div className="cl-inspect-h">{label(selBlock)[0]} <button onClick={() => delBlock(selBlock.id)}>delete</button></div>
            <label className="cl-caption">caption <input type="text" value={selBlock.role ?? ''} placeholder="(none)" onChange={(e) => setRole(selBlock.id, e.target.value)} /></label>
            {Object.keys(selBlock.p).length === 0 && <p className="cl-hint">no parameters</p>}
            {selBlock.type === 'sum' ? (
              <>
                <label>input 1 <select value={selBlock.p.s0} onChange={(e) => setParam(selBlock.id, 's0', +e.target.value)}><option value={1}>+</option><option value={-1}>−</option></select></label>
                <label>input 2 <select value={selBlock.p.s1} onChange={(e) => setParam(selBlock.id, 's1', +e.target.value)}><option value={1}>+</option><option value={-1}>−</option></select></label>
              </>
            ) : Object.entries(selBlock.p).map(([k, v]) => (
              <label key={k}>{k} <input type="number" step={0.1} value={v} onChange={(e) => setParam(selBlock.id, k, +e.target.value)} /></label>
            ))}
          </div>
        )}
      </div>

      <DiagramEqs blocks={blocks} wires={wires} />

      <div className="lifsim-cell lifsim-cell-wide" style={{ marginTop: 12 }}>
        <div className="lifsim-cap">Scope — every signal wired into a Scope block</div>
        <canvas ref={scopeRef} className="lifsim-canvas" style={{ height: 170 }} />
      </div>

      <ControlAnalysis blocks={blocks} wires={wires} />

      <div className="lifsim-explain">
        <p><b>How it works.</b> Each block is a transfer function: a <i>gain</i> scales, <i>1/s</i> integrates, <i>K/(τs+1)</i> is a first-order lag (pole at −1/τ), and the 2nd-order block has a natural frequency ωₙ and damping ζ. The sum forms the error e = r − y; feeding the output back and comparing it to the reference is what closes the loop. The closed-loop transfer function is T = G/(1+GH), and its denominator roots — the <b>poles</b> — decide everything: all in the left half-plane ⇒ stable; one in the right half-plane ⇒ the output diverges.</p>
        <p><b>The analysis tabs.</b> <span style={{ color: '#22e1ff' }}>Poles</span> plots the closed-loop poles in the s-plane (σ = decay rate, jω = oscillation) over a grid of constant natural frequency <span style={{ color: '#9b8cff' }}>ωₙ</span> (violet circles) and constant damping <span style={{ color: '#54e6a0' }}>ζ</span> (green rays), and reads off the dominant pole's ωₙ, ζ and percent overshoot. <span style={{ color: '#22e1ff' }}>Bode</span> shows magnitude (dB) and phase vs frequency with an open/closed-loop toggle; on the open loop it marks the <span style={{ color: '#54e6a0' }}>phase margin</span> (at the 0 dB gain-crossover) and <span style={{ color: '#ffb84d' }}>gain margin</span> (at the −180° phase-crossover) — both positive ⇒ stable. <span style={{ color: '#22e1ff' }}>Nyquist</span> draws the open-loop L(jω); encircling −1 means instability. <span style={{ color: '#22e1ff' }}>Root locus</span> traces the closed-loop poles as the loop gain rises 0→∞; the amber <b>◆</b> marks where a branch crosses the jω axis — the <b>critical gain</b> beyond which the loop is unstable.</p>
        <p><b>Try this.</b> The default is a third-order closed loop: <i>step → Σ(+,−) → gain → actuator lag → 2nd-order plant → scope</i>. Click the <b>gain (controller)</b> block and raise <b>K</b> in the inspector: around <b>K ≈ 3.3</b> the complex pole pair crosses into the right half-plane — the <b>poles</b> turn red, the <b>root locus</b> branch crosses the jω axis (amber ◆), the <b>Nyquist</b> curve swings around −1, and the scope diverges. Below that gain it is stable, and a larger gain just speeds it up. (Note: a <i>first-order</i> loop can never be destabilized by gain — you need at least three poles, which is why this example has them.) Delete the <b>feedback wire</b> to run open-loop. Full derivation, state-space extraction and pseudocode are in the <b>∑ notes</b>.</p>
      </div>
    </div>
  )
}

// ---------- frequency-domain & root-locus analysis ----------
type ABlock = { id: number; type: BType; p: Record<string, number>; role?: string }
type AWire = { from: number; to: number; toPort: number }
type Tab = 'rlocus' | 'bode' | 'nyquist'

// the scalar gain of a block that enters the characteristic polynomial affinely
// (so a parameter root locus is exact): K for gain/1st/2nd-order, Kd for derivative.
const sweepKey = (t: BType): string | null => (t === 'gain' || t === 'tf1' || t === 'tf2' ? 'K' : t === 'deriv' ? 'Kd' : null)

// does the signal-flow graph contain a directed cycle? (i.e. is the loop closed)
function hasFeedback(blocks: ABlock[], wires: AWire[]): boolean {
  const adj: Record<number, number[]> = {}; for (const w of wires) (adj[w.from] ||= []).push(w.to)
  const state: Record<number, number> = {}   // 0/undef = unseen, 1 = on stack, 2 = done
  const dfs = (u: number): boolean => {
    state[u] = 1
    for (const v of adj[u] || []) { if (state[v] === 1) return true; if (!state[v] && dfs(v)) return true }
    state[u] = 2; return false
  }
  for (const b of blocks) if (!state[b.id] && dfs(b.id)) return true
  return false
}

function ControlAnalysis({ blocks, wires }: { blocks: ABlock[]; wires: AWire[] }) {
  const [tab, setTab] = useState<Tab>('rlocus')
  const [sweep, setSweep] = useState<string>('loop')   // 'loop' = overall loop gain, else a gain block id
  const cvRef = useRef<HTMLCanvasElement>(null)

  const tf = useMemo(() => {
    const ss = buildSS(blocks, wires); if (!ss) return null
    const { num, den } = transferFn(ss)               // H = input→output transfer fn, exactly as drawn
    const closed = hasFeedback(blocks, wires)
    // open-loop L: if a loop is closed, H is the closed-loop T and L = H/(1−H) = num/(den−num);
    // with no feedback, H IS the open loop, so L = H and there is no distinct closed-loop curve.
    const numO = num, denO = closed ? polySub(den, num) : den
    // exact delay for the frequency domain: rebuild a rational L with delays removed and carry the
    // total transport delay Td, so Bode/Nyquist can multiply by the exact factor e^{−jωTd}.
    const Td = blocks.reduce((s, b) => s + (b.type === 'delay' ? b.p.T : 0), 0)
    let dl: { numO: number[]; denO: number[]; Td: number } | null = null
    if (Td > 1e-9) {
      const bf = blocks.map((b) => (b.type === 'delay' ? { ...b, type: 'gain' as BType, p: { K: 1 } } : b))
      const ssf = buildSS(bf, wires)
      if (ssf) { const r = transferFn(ssf); dl = { numO: r.num, denO: closed ? polySub(r.den, r.num) : r.den, Td } }
    }
    return { closed, num, den, numO, denO, dl }
  }, [blocks, wires])

  // always-on stability verdict for the open loop L (and the closed loop T when one exists),
  // straight from the pole locations. A delay e^{−sT} adds no poles, so the rational part decides.
  const stab = useMemo(() => {
    if (!tf) return null
    const judge = (den: number[]) => {
      const ps = roots(den)
      if (ps.length === 0) return { kind: 'ok', text: '✓ stable (no poles — static gain)' }
      const rmax = Math.max(...ps.map((p) => p.re))
      const axis = ps.filter((p) => Math.abs(p.re) <= 1e-6)
      let rep = false
      for (let i = 0; i < axis.length; i++) for (let j = i + 1; j < axis.length; j++) if (Math.abs(axis[i].im - axis[j].im) < 1e-3) rep = true
      if (rmax > 1e-6) return { kind: 'bad', text: `⚠ unstable (pole at Re = +${rmax.toFixed(2)})` }
      if (rep) return { kind: 'bad', text: '⚠ unstable (repeated pole on the jω axis, e.g. 1/s²)' }
      if (axis.length) return { kind: 'mid', text: '◐ marginally stable (pole on the jω axis)' }
      return { kind: 'ok', text: `✓ stable (rightmost pole Re = ${rmax.toFixed(2)})` }
    }
    return { open: judge(tf.denO), closed: tf.closed ? judge(tf.den) : null }
  }, [tf])

  // every block with an affine gain is available as a root-locus parameter
  const sweepables = useMemo(() => blocks.map((b) => { const pk = sweepKey(b.type); return pk ? { id: b.id, pk, name: b.role || b.type, val: b.p[pk] } : null }).filter((g): g is { id: number; pk: string; name: string; val: number } => !!g), [blocks])
  useEffect(() => { if (sweep !== 'loop' && !sweepables.some((g) => String(g.id) === sweep)) setSweep('loop') }, [sweepables, sweep])

  // root-locus model: closed-loop char poly is AFFINE in the swept parameter,
  //   Δ(s; θ) = base(s) + θ·delta(s),  operating point at θ = θ0.
  // • overall loop gain: base = den−num (open-loop den), delta = num, θ0 = 1.
  // • a single gain K: base = den|K=0, delta = den|K=1 − den|K=0, θ0 = current K
  //   (a gain is a rank-1 update to A, so det(sI−A) is linear in K — two evals suffice).
  const locus = useMemo(() => {
    if (sweep === 'loop') { if (!tf) return null; return { base: tf.denO, delta: tf.numO, theta0: 1, kind: 'loop' as const, name: 'overall loop gain' } }
    const id = +sweep, blk = blocks.find((b) => b.id === id), pk = blk && sweepKey(blk.type); if (!blk || !pk) return null
    const denAt = (val: number) => { const ss = buildSS(blocks.map((b) => (b.id === id ? { ...b, p: { ...b.p, [pk]: val } } : b)), wires); return ss ? transferFn(ss).den : null }
    const d0 = denAt(0), d1 = denAt(1); if (!d0 || !d1) return null
    return { base: d0, delta: polySub(d1, d0), theta0: blk.p[pk], kind: 'param' as const, name: `${blk.role || blk.type} · ${pk}` }
  }, [blocks, wires, sweep, tf])

  // textual read-outs for the root locus, shown in an HTML strip (keeps the plot itself clean)
  const rlInfo = useMemo(() => {
    if (!locus) return null
    const { base, delta, theta0, kind, name } = locus
    const cur = roots(polyAddK(base, theta0, delta))
    const stable = cur.every((p) => p.re < 1e-6)
    let dom = cur[0] || { re: 0, im: 0 }; for (const p of cur) if (p.re > dom.re) dom = p
    const wn = Math.hypot(dom.re, dom.im), ze = wn > 1e-6 ? Math.min(1, Math.max(-1, -dom.re / wn)) : 1
    const os = ze > 0 && ze < 1 ? 100 * Math.exp(-Math.PI * ze / Math.sqrt(1 - ze * ze)) : null
    let crit: number | null = null
    for (let i = 1; i <= 400; i++) { const th = (i / 400) * Math.max(50, theta0 * 8); if (roots(polyAddK(base, th, delta)).some((p) => p.re > 1e-6)) { crit = th; break } }
    return { stable, wn, ze, os, crit, kind, name, theta0, closed: !!tf?.closed }
  }, [locus, tf])

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(() => { fit(); draw() }); ro.observe(cv)
    const W = () => cv.clientWidth, H = () => cv.clientHeight
    const GRID = 'rgba(255,255,255,0.09)', AX = 'rgba(255,255,255,0.35)', TXT = 'rgba(215,218,230,0.6)'

    const niceStep = (span: number) => { const raw = span / 6; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p }
    const fmt = (v: number, step: number) => v.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)
    const sPlane = (pts: { re: number; im: number }[], extra: { re: number; im: number }[] = [], grid = false) => {
      const w = W(), h = H(); ctx.clearRect(0, 0, w, h)
      let m = 1; for (const p of [...pts, ...extra]) m = Math.max(m, Math.abs(p.re), Math.abs(p.im)); m *= 1.3
      const sx = (w / 2 - 26) / m, sy = (h / 2 - 20) / m, cx = w / 2, cy = h / 2
      const X = (re: number) => cx + re * sx, Y = (im: number) => cy - im * sy
      ctx.fillStyle = 'rgba(84,230,160,0.05)'; ctx.fillRect(0, 0, w / 2, h)         // LHP = stable
      ctx.fillStyle = 'rgba(255,107,107,0.05)'; ctx.fillRect(w / 2, 0, w / 2, h)    // RHP = unstable
      const step = niceStep(2 * m)
      ctx.font = '9px monospace'
      for (let v = step; v < m; v += step) for (const val of [v, -v]) {            // real-axis ticks
        const x = X(val); ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
        ctx.fillStyle = TXT; ctx.textAlign = 'center'; ctx.fillText(fmt(val, step), x, h / 2 + 11)
      }
      for (let v = step; v < m; v += step) for (const val of [v, -v]) {            // imag-axis ticks
        const y = Y(val); ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
        ctx.fillStyle = TXT; ctx.textAlign = 'left'; ctx.fillText(fmt(val, step), w / 2 + 4, y - 2)
      }
      if (grid) {
        ctx.font = '8.5px monospace'
        // a few constant natural-frequency ωₙ circles (|s| = ωₙ), subtle
        const wstep = step * 2
        for (let wn = wstep; wn < m; wn += wstep) {
          ctx.strokeStyle = 'rgba(123,92,255,0.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, wn * sx, wn * sy, 0, 0, Math.PI * 2); ctx.stroke()
          ctx.fillStyle = 'rgba(155,140,255,0.5)'; ctx.textAlign = 'center'; ctx.fillText(fmt(wn, step), X(-wn) + 1, cy + 10)
        }
        // constant damping-ratio ζ rays into the left half-plane (pole = −ζωₙ ± jωₙ√(1−ζ²))
        for (const z of [0.5]) { const q = Math.sqrt(1 - z * z); for (const sg of [1, -1]) { ctx.strokeStyle = 'rgba(84,230,160,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X(-z * m), Y(sg * q * m)); ctx.stroke() } ctx.fillStyle = 'rgba(84,230,160,0.5)'; ctx.textAlign = 'left'; ctx.fillText('ζ=' + z, X(-z * m * 0.9), Y(q * m * 0.9)) }
      }
      ctx.strokeStyle = AX; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
      ctx.fillStyle = TXT; ctx.font = '10px monospace'; ctx.textAlign = 'left'
      ctx.fillText('Re  σ (1/s)', w - 70, h / 2 - 5); ctx.fillText('Im  jω (rad/s)', w / 2 + 5, 12)
      return { X, Y }
    }

    const draw = () => {
      const w = W(), h = H(); ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = TXT; ctx.font = '11px monospace'
      if (!tf) { ctx.fillText('connect  source → … → scope  to analyze', 10, h / 2); return }

      if (tab === 'bode') {
        const N = 260, w0 = -2, w1 = 2                                   // ω = 10^-2 .. 10^2 rad/s
        // open-loop L(jω): rational part × exact delay e^{−jωTd}; closed-loop T = L/(1+L) pointwise
        const nO = tf.dl ? tf.dl.numO : tf.numO, dO = tf.dl ? tf.dl.denO : tf.denO
        const Lat = (om: number) => { const s = { re: 0, im: om }; let L = divC(polyEval(nO, s), polyEval(dO, s)); if (tf.dl) { const t = om * tf.dl.Td; L = cmul(L, { re: Math.cos(t), im: -Math.sin(t) }) } return L }
        const unwrap = (ph: number[]) => { for (let i = 1; i < ph.length; i++) { while (ph[i] - ph[i - 1] > 180) ph[i] -= 360; while (ph[i] - ph[i - 1] < -180) ph[i] += 360 } }
        const Lm0: number[] = [], Lp0: number[] = [], Tm0: number[] = [], Tp0: number[] = []
        for (let i = 0; i < N; i++) { const om = Math.pow(10, w0 + (i / (N - 1)) * (w1 - w0)); const L = Lat(om); Lm0.push(20 * Math.log10(Math.max(1e-6, cabs(L)))); Lp0.push(carg(L) * 180 / Math.PI); if (tf.closed) { const T = divC(L, { re: 1 + L.re, im: L.im }); Tm0.push(20 * Math.log10(Math.max(1e-6, cabs(T)))); Tp0.push(carg(T) * 180 / Math.PI) } }
        unwrap(Lp0); if (tf.closed) unwrap(Tp0)
        const O = { mag: Lm0, ph: Lp0 }                            // open-loop L (always meaningful)
        const Cl = tf.closed ? { mag: Tm0, ph: Tp0 } : null        // closed-loop T only when a loop is actually closed
        const Lm = 42, R = 8, magTop = 22, magBot = h * 0.52, phTop = h * 0.6, phBot = h - 18
        const Xf = (i: number) => Lm + (i / (N - 1)) * (w - Lm - R)
        let mn = Math.min(...O.mag, ...(Cl ? Cl.mag : [])), mx = Math.max(...O.mag, ...(Cl ? Cl.mag : [])); if (mx - mn < 6) { mx += 3; mn -= 3 }
        let pmn = Math.min(...O.ph, ...(Cl ? Cl.ph : [])), pmx = Math.max(...O.ph, ...(Cl ? Cl.ph : [])); if (pmx - pmn < 10) { pmx += 5; pmn -= 5 }
        const Ym = (v: number) => magTop + (1 - (v - mn) / (mx - mn)) * (magBot - magTop)
        const Yp = (v: number) => phTop + (1 - (v - pmn) / (pmx - pmn)) * (phBot - phTop)
        ctx.font = '9px monospace'; ctx.textAlign = 'center'
        for (let d = w0; d <= w1; d++) { const x = Xf(((d - w0) / (w1 - w0)) * (N - 1)); ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, magTop); ctx.lineTo(x, phBot); ctx.stroke(); ctx.fillStyle = TXT; ctx.fillText(String(Math.pow(10, d)), x, h - 4) }
        ctx.textAlign = 'right'; ctx.fillStyle = TXT
        if (mn < 0 && mx > 0) { const y = Ym(0); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(Lm, y); ctx.lineTo(w - R, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillText('0', Lm - 3, y + 3) }
        ctx.fillText(`${mx.toFixed(0)} dB`, Lm - 3, magTop + 7); ctx.fillText(`${mn.toFixed(0)}`, Lm - 3, magBot - 1)
        for (let pv = Math.ceil(pmn / 90) * 90; pv <= pmx; pv += 90) { const y = Yp(pv); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(Lm, y); ctx.lineTo(w - R, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = TXT; ctx.fillText(`${pv}°`, Lm - 3, y + 3) }
        // curves: open-loop (cyan) and closed-loop (violet), both magnitude & phase
        const curve = (arr: number[], Yf: (v: number) => number, col: string, dash: number[]) => { ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.setLineDash(dash); ctx.beginPath(); arr.forEach((v, i) => { i ? ctx.lineTo(Xf(i), Yf(v)) : ctx.moveTo(Xf(i), Yf(v)) }); ctx.stroke(); ctx.setLineDash([]) }
        curve(O.mag, Ym, '#22e1ff', []); if (Cl) curve(Cl.mag, Ym, '#9b8cff', [5, 3])
        curve(O.ph, Yp, '#22e1ff', []); if (Cl) curve(Cl.ph, Yp, '#9b8cff', [5, 3])
        // gain & phase margins from the open-loop L
        let pm: number | null = null, gm: number | null = null
        let gcI = -1; for (let i = 1; i < N; i++) if ((O.mag[i - 1] <= 0) !== (O.mag[i] <= 0)) { gcI = i; break }
        let pcI = -1; for (let i = 1; i < N; i++) if ((O.ph[i - 1] + 180 <= 0) !== (O.ph[i] + 180 <= 0)) { pcI = i; break }
        if (gcI > 0) { const t = O.mag[gcI - 1] / (O.mag[gcI - 1] - O.mag[gcI]), phg = O.ph[gcI - 1] + t * (O.ph[gcI] - O.ph[gcI - 1]); pm = 180 + phg; const x = Xf(gcI - 1 + t); ctx.strokeStyle = 'rgba(84,230,160,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, magTop); ctx.lineTo(x, phBot); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#54e6a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, Yp(phg)); ctx.lineTo(x, Yp(-180)); ctx.stroke(); ctx.fillStyle = '#54e6a0'; ctx.beginPath(); ctx.arc(x, Ym(0), 3, 0, Math.PI * 2); ctx.fill(); ctx.textAlign = 'left'; ctx.font = '9px monospace'; ctx.fillText(`PM ${pm.toFixed(0)}°`, Math.min(w - 54, x + 5), Yp(-180) - 3) }
        if (pcI > 0) { const t = (O.ph[pcI - 1] + 180) / ((O.ph[pcI - 1] + 180) - (O.ph[pcI] + 180)), magp = O.mag[pcI - 1] + t * (O.mag[pcI] - O.mag[pcI - 1]); gm = -magp; const x = Xf(pcI - 1 + t); ctx.strokeStyle = 'rgba(255,184,77,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, magTop); ctx.lineTo(x, phBot); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#ffb84d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, Ym(magp)); ctx.lineTo(x, Ym(0)); ctx.stroke(); ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.arc(x, Ym(magp), 3, 0, Math.PI * 2); ctx.fill(); ctx.textAlign = 'left'; ctx.font = '9px monospace'; ctx.fillText(`GM ${gm.toFixed(1)} dB`, Math.min(w - 62, x + 5), Ym(0) - 3) }
        const ok = (pm === null || pm > 0) && (gm === null || gm > 0)
        ctx.textAlign = 'left'; ctx.font = '10px monospace'
        ctx.fillStyle = '#22e1ff'; ctx.fillText((tf.closed ? '— open-loop L' : '— open-loop L (no feedback)') + (tf.dl ? '  ·exact e^{−sT}' : ''), Lm + 2, 12); if (tf.closed) { ctx.fillStyle = '#9b8cff'; ctx.fillText('-- closed-loop T', Lm + 168, 12) }
        ctx.fillStyle = ok ? '#54e6a0' : '#ff6b6b'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'right'; ctx.fillText(`PM ${pm === null ? '∞' : pm.toFixed(0) + '°'} · GM ${gm === null ? '∞' : gm.toFixed(1) + ' dB'}`, w - R, 12)
        ctx.textAlign = 'left'; ctx.fillStyle = TXT; ctx.font = '10px monospace'
        ctx.fillText('magnitude (dB)', Lm + 2, magBot - 13); ctx.fillText('phase (deg)', Lm + 2, phTop - 3); ctx.fillText('ω (rad/s, log)', w - 110, h - 4)
      } else if (tab === 'nyquist') {
        const num = tf.dl ? tf.dl.numO : tf.numO, den = tf.dl ? tf.dl.denO : tf.denO, N = 600
        const pts: { re: number; im: number }[] = []
        for (let i = 0; i < N; i++) { const om = Math.pow(10, -2.5 + (i / (N - 1)) * 5); let v = divC(polyEval(num, { re: 0, im: om }), polyEval(den, { re: 0, im: om })); if (tf.dl) { const t = om * tf.dl.Td; v = cmul(v, { re: Math.cos(t), im: -Math.sin(t) }) } if (cabs(v) < 60) pts.push(v) }
        // isotropic plane so the unit circle is a true circle and angles read correctly
        let m = 1.4; for (const p of pts) m = Math.max(m, Math.abs(p.re), Math.abs(p.im)); m *= 1.18
        const w = W(), h = H(), cx = w / 2, cy = h / 2, sc = Math.min((w / 2 - 30) / m, (h / 2 - 16) / m)
        const X = (re: number) => cx + re * sc, Y = (im: number) => cy - im * sc
        ctx.clearRect(0, 0, w, h)
        // axes + ticks
        ctx.strokeStyle = AX; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
        const stp = niceStep(2 * m); ctx.fillStyle = TXT; ctx.font = '9px monospace'; ctx.textAlign = 'center'
        for (let v = stp; v < m; v += stp) for (const val of [v, -v]) { ctx.fillText(fmt(val, stp), X(val), cy + 11) }
        // unit circle (|L| = 1) — read the phase margin against it
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
        // the locus: ω > 0 (cyan) and its mirror ω < 0 (faint)
        ctx.strokeStyle = 'rgba(34,225,255,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach((p, i) => { const x = X(p.re), y = Y(-p.im); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke()
        ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, i) => { const x = X(p.re), y = Y(p.im); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.stroke()
        // arrow showing increasing ω
        if (pts.length > 40) { const k = Math.floor(pts.length * 0.55), a = pts[k], b = pts[k + 3] || pts[k]; const x1 = X(b.re), y1 = Y(b.im); const an = Math.atan2(Y(b.im) - Y(a.im), X(b.re) - X(a.re)); ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 6 * Math.cos(an - 0.4), y1 - 6 * Math.sin(an - 0.4)); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 6 * Math.cos(an + 0.4), y1 - 6 * Math.sin(an + 0.4)); ctx.stroke(); ctx.fillStyle = TXT; ctx.font = '9px monospace'; ctx.textAlign = 'left'; ctx.fillText('ω↑', x1 + 4, y1) }
        // −1 critical point
        ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(X(-1), Y(0), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X(-1), Y(0), 8, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = TXT; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('−1', X(-1), Y(0) - 12)
        // gain margin: negative-real-axis crossing → GM = 1/|x|
        let gm: number | null = null
        for (let i = 1; i < pts.length; i++) if (pts[i - 1].im * pts[i].im < 0 && pts[i].re < 0) { const t = pts[i - 1].im / (pts[i - 1].im - pts[i].im); const xr = pts[i - 1].re + t * (pts[i].re - pts[i - 1].re); if (xr > -1.0001) gm = -20 * Math.log10(Math.abs(xr)); ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.arc(X(xr), Y(0), 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffb84d'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText('1/GM', X(xr), Y(0) + 13); break }
        // phase margin: unit-circle crossing |L| = 1 → angle to the negative real axis
        let pm: number | null = null
        for (let i = 1; i < pts.length; i++) { const a = cabs(pts[i - 1]) - 1, c = cabs(pts[i]) - 1; if (a * c < 0) { const t = a / (a - c); const u = { re: pts[i - 1].re + t * (pts[i].re - pts[i - 1].re), im: pts[i - 1].im + t * (pts[i].im - pts[i - 1].im) }; pm = 180 + Math.atan2(u.im, u.re) * 180 / Math.PI; ctx.strokeStyle = '#54e6a0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X(u.re), Y(u.im)); ctx.stroke(); ctx.fillStyle = '#54e6a0'; ctx.beginPath(); ctx.arc(X(u.re), Y(u.im), 3.5, 0, Math.PI * 2); ctx.fill(); break } }
        // stability test on the loop being closed (unity): char = den_L + num_L
        const unstable = roots(polyAddK(tf.denO, 1, tf.numO)).some((p) => p.re > 1e-6)
        ctx.textAlign = 'left'; ctx.fillStyle = TXT; ctx.font = '10px monospace'
        ctx.fillText(`Nyquist of open-loop L(jω)${tf.dl ? '  · exact delay e^{−sT}' : ''}   (Re →, Im ↑)`, 10, 14)
        ctx.fillText('dashed circle: |L|=1   ⊙ −1 critical point', 10, 26)
        ctx.fillStyle = unstable ? '#ff6b6b' : '#54e6a0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'right'
        const verdict = tf.closed ? (unstable ? '⚠ encircles −1 ⇒ unstable' : '✓ no −1 encirclement ⇒ stable') : (unstable ? '⚠ closing the loop ⇒ unstable' : '✓ closing the loop ⇒ stable')
        ctx.fillText(`${verdict}   ·   PM ${pm === null ? '∞' : pm.toFixed(0) + '°'} · GM ${gm === null ? '∞' : gm.toFixed(1) + ' dB'}`, w - 8, 14)
      } else {
        // root locus: closed-loop poles = roots(base + θ·delta) as θ: 0 → ∞.
        // θ0 = present value (loop gain ×1, or the gain block's current K).
        if (!locus) { ctx.fillStyle = TXT; ctx.fillText('connect  source → … → scope  to analyze', 10, h / 2); return }
        const { base, delta, theta0 } = locus
        const openP = roots(base), zeros = roots(delta), curP = roots(polyAddK(base, theta0, delta))
        const tmax = Math.max(50, theta0 * 30), tlo = -2, thi = Math.log10(tmax)
        const ks: number[] = [0]; for (let i = 0; i <= 110; i++) ks.push(Math.pow(10, tlo + (i / 110) * (thi - tlo)))
        const frames = ks.map((k) => roots(polyAddK(base, k, delta)))
        const n = frames[0].length
        // track each pole into a continuous branch by nearest-neighbour matching
        const branches: { re: number; im: number }[][] = frames[0].map((p) => [p])
        for (let f = 1; f < frames.length; f++) {
          const cur = frames[f].slice(); const used = new Array(cur.length).fill(false)
          for (let b = 0; b < n; b++) {
            const last = branches[b][branches[b].length - 1]; let bj = -1, bd = Infinity
            for (let j = 0; j < cur.length; j++) if (!used[j]) { const d = Math.hypot(cur[j].re - last.re, cur[j].im - last.im); if (d < bd) { bd = d; bj = j } }
            if (bj >= 0) { used[bj] = true; branches[b].push(cur[bj]) }
          }
        }
        // frame the view on the interesting region (poles, finite zeros, current poles)
        const fin = (a: { re: number; im: number }[]) => a.filter((p) => cabs(p) < 60)
        const { X, Y } = sPlane([...openP, ...fin(zeros), ...curP], [], true)
        ctx.fillStyle = 'rgba(84,230,160,0.45)'; ctx.font = '9px monospace'; ctx.textAlign = 'left'; ctx.fillText('stable ◀', 8, h - 6)
        ctx.fillStyle = 'rgba(255,107,107,0.45)'; ctx.textAlign = 'right'; ctx.fillText('▶ unstable', w - 8, h - 6); ctx.textAlign = 'left'
        // the branches as continuous glowing curves
        ctx.shadowColor = 'rgba(34,225,255,0.6)'; ctx.shadowBlur = 5
        for (const br of branches) { ctx.strokeStyle = '#22e1ff'; ctx.lineWidth = 1.8; ctx.beginPath(); let started = false; for (const p of br) { if (cabs(p) > 1e4) { started = false; continue } const x = X(p.re), y = Y(p.im); started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true } ctx.stroke() }
        ctx.shadowBlur = 0
        // imaginary-axis crossings (marginal stability) in amber
        for (const br of branches) for (let i = 1; i < br.length; i++) if (br[i - 1].re * br[i].re < 0 && Math.abs(br[i].im) > 1e-3) {
          const t = br[i - 1].re / (br[i - 1].re - br[i].re); const im = br[i - 1].im + t * (br[i].im - br[i - 1].im)
          ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.arc(X(0), Y(im), 4.5, 0, Math.PI * 2); ctx.fill()
        }
        // open-loop poles (×, start θ=0), zeros (○, end θ→∞), current closed-loop poles (●)
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1.8; for (const p of openP) { const x = X(p.re), y = Y(p.im); ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke() }
        ctx.strokeStyle = '#54e6a0'; ctx.lineWidth = 1.6; for (const z of fin(zeros)) { ctx.beginPath(); ctx.arc(X(z.re), Y(z.im), 5, 0, Math.PI * 2); ctx.stroke() }
        for (const p of curP) { const rhp = p.re > 1e-6; ctx.fillStyle = rhp ? '#ff6b6b' : '#fff'; ctx.beginPath(); ctx.arc(X(p.re), Y(p.im), 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#0c0d1e'; ctx.lineWidth = 1.2; ctx.stroke() }
      }
    }
    draw()
    return () => ro.disconnect()
  }, [tab, tf, locus])

  return (
    <div className="lifsim-cell lifsim-cell-wide" style={{ marginTop: 12 }}>
      <div className="wav-modes">
        <span className="wav-modelabel">analysis</span>
        {(([['rlocus', 'root locus + poles'], ['bode', 'Bode (open + closed)'], ['nyquist', 'Nyquist']]) as [Tab, string][]).map(([t, lab]) => (
          <button key={t} className={`wav-modebtn${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{lab}</button>
        ))}
        {tab === 'rlocus' && (
          <label className="cl-sweep">sweep
            <select value={sweep} onChange={(e) => setSweep(e.target.value)}>
              <option value="loop">overall loop gain</option>
              {sweepables.map((g) => <option key={g.id} value={String(g.id)}>{g.name} · {g.pk}={g.val}</option>)}
            </select>
          </label>
        )}
      </div>
      {stab && (
        <div className="cl-rlbar" style={{ marginTop: 0, marginBottom: 9 }}>
          <span className="cl-rlitem cl-dim">stability (pole locations):</span>
          <span className={`cl-pill ${stab.open.kind}`}>open loop L: {stab.open.text}</span>
          {stab.closed
            ? <span className={`cl-pill ${stab.closed.kind}`}>closed loop T: {stab.closed.text}</span>
            : <span className="cl-rlitem cl-dim">no feedback wire — the diagram runs open-loop only</span>}
        </div>
      )}
      <canvas ref={cvRef} className="lifsim-canvas" style={{ height: 300 }} />
      {tab === 'rlocus' && rlInfo && (
        <div className="cl-rlbar">
          {!rlInfo.closed && <span className="cl-rlitem cl-dim">root locus shows the <i>hypothetical</i> unity-feedback closure (no feedback wired)</span>}
          <span className="cl-rlitem">dominant <b>ωₙ {rlInfo.wn.toFixed(2)}</b> · <b>ζ {rlInfo.ze.toFixed(2)}</b>{rlInfo.os !== null ? <> · overshoot <b>{rlInfo.os.toFixed(0)}%</b></> : null}</span>
          <span className="cl-rlitem">{rlInfo.crit !== null
            ? <>goes unstable at <b className="amber">{rlInfo.name === 'overall loop gain' ? `×${rlInfo.crit.toFixed(2)} present gain` : `${rlInfo.name.split('·')[0].trim()} = ${rlInfo.crit.toFixed(2)}`}</b> <span className="cl-dim">(now {rlInfo.kind === 'loop' ? '×1' : rlInfo.theta0.toFixed(2)})</span></>
            : <span className="cl-dim">stable for all values of this parameter</span>}</span>
          <span className="cl-rllegend"><b className="x">×</b> θ=0 &nbsp; <b className="o">○</b> θ→∞ &nbsp; <b className="dot">●</b> now &nbsp; <b className="amber">◆</b> jω cross</span>
        </div>
      )}
    </div>
  )
}

// ---------- extracted model: state-space + transfer function ----------
const SUB = '₀₁₂₃₄₅₆₇₈₉'
const subStr = (k: number) => String(k).split('').map((d) => SUB[+d]).join('')
const numFmt = (v: number) => { const r = +v.toFixed(3); return Object.is(r, -0) ? '0' : String(r) }
// LaTeX builders for the model panel
function polyTex(p: number[]): string {
  const deg = p.length - 1, parts: string[] = []
  for (let i = 0; i < p.length; i++) {
    const c = p[i]; if (Math.abs(c) < 1e-9) continue
    const pow = deg - i, a = Math.abs(c)
    const coef = (Math.abs(a - 1) < 1e-9 && pow > 0) ? '' : numFmt(a)
    const sv = pow === 0 ? '' : pow === 1 ? 's' : `s^{${pow}}`
    parts.push((parts.length === 0 ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + ') + coef + sv)
  }
  return parts.length ? parts.join('') : '0'
}
const matTex = (rows: number[][]) => `\\begin{bmatrix}${rows.map((r) => r.map((v) => numFmt(v)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`
const cplxTex = (c: { re: number; im: number }) => Math.abs(c.im) < 1e-6 ? numFmt(c.re) : `${numFmt(c.re)} ${c.im < 0 ? '-' : '+'} ${numFmt(Math.abs(c.im))}j`

// KaTeX, lazily imported so the heavy library stays out of the main bundle and
// only loads once the (collapsed-by-default) sandbox is actually opened.
function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const [html, setHtml] = useState('')
  useEffect(() => {
    let on = true
    Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([k]) => { if (on) setHtml(k.default.renderToString(tex, { displayMode: !!block, throwOnError: false })) })
    return () => { on = false }
  }, [tex, block])
  return <span className={block ? 'cl-tex-b' : 'cl-tex-i'} dangerouslySetInnerHTML={{ __html: html }} />
}

// the transfer function (or signal) of a single block, as LaTeX with its current values
function blockTex(b: ABlock): string | null {
  const f = numFmt, p = b.p
  switch (b.type) {
    case 'gain': return `G(s) = ${f(p.K)}`
    case 'integrator': return `G(s) = \\dfrac{1}{s}`
    case 'tf1': return `G(s) = \\dfrac{${f(p.K)}}{${f(p.tau)}\\,s + 1}`
    case 'tf2': { const w2 = p.wn * p.wn; return `G(s) = \\dfrac{${f(p.K * w2)}}{s^2 + ${f(2 * p.zeta * p.wn)}\\,s + ${f(w2)}}` }
    case 'deriv': return `G(s) = \\dfrac{${f(p.Kd * p.N)}\\,s}{s + ${f(p.N)}}`
    case 'delay': return `G(s) = e^{-${f(p.T)}\\,s}`
    case 'sat': return `y = \\mathrm{sat}_{[${f(p.lo)},\\,${f(p.hi)}]}(u)`
    case 'sum': return `e = ${p.s0 < 0 ? '-\\,' : ''}u_1 ${p.s1 < 0 ? '-' : '+'}\\, u_2`
    case 'step': return `r(t) = ${f(p.amp)}\\cdot\\mathbf{1}(t \\ge ${f(p.t0)})`
    case 'impulse': return `r(t) = ${f(p.amp)}\\,\\delta(t - ${f(p.t0)})`
    case 'sine': return `r(t) = ${f(p.amp)}\\sin(2\\pi\\cdot${f(p.freq)}\\,t)`
    default: return null   // scope
  }
}

// per-block equations + the assembled system (poles/zeros, transfer fn, state-space)
function DiagramEqs({ blocks, wires }: { blocks: ABlock[]; wires: AWire[] }) {
  const rows = blocks.map((b) => ({ b, tex: blockTex(b) })).filter((r) => r.tex)
  const sys = useMemo(() => {
    const ss = buildSS(blocks, wires); if (!ss) return null
    const { num, den } = transferFn(ss)
    const closed = hasFeedback(blocks, wires)
    return { ss, num, den, numO: num, denO: closed ? polySub(den, num) : den, closed, poles: roots(den), zeros: roots(num).filter((z) => cabs(z) < 1e3) }
  }, [blocks, wires])
  if (!rows.length) return null
  return (
    <div className="cl-eqs">
      <div className="cl-eqs-title">Block equations <span className="cl-dim">— each block on its own</span></div>
      <div className="cl-eqs-list">
        {rows.map(({ b, tex }) => (
          <div key={b.id} className="cl-eqs-row">
            <span className="cl-eqs-chip">{b.role || b.type}</span>
            <Tex tex={tex!} />
          </div>
        ))}
      </div>
      {sys && (() => {
        const { ss, num, den, numO, denO, closed, poles, zeros } = sys
        const byId: Record<number, ABlock> = {}; blocks.forEach((b) => (byId[b.id] = b))
        const cnt: Record<number, number> = {}; ss.states.forEach((id) => (cnt[id] = (cnt[id] || 0) + 1))
        const seen: Record<number, number> = {}
        const stateNames = ss.states.map((id) => { const b = byId[id]; const base = (b && b.role) || (b && b.type) || `#${id}`; if (cnt[id] > 1) { seen[id] = (seen[id] || 0) + 1; return `${base} ${seen[id]}` } return base })
        const inName = (byId[ss.inputId]?.role) || byId[ss.inputId]?.type || 'u'
        return (
          <div className="cl-eqs-sys">
            <div className="cl-eqs-title">System <span className="cl-dim">— poles &amp; zeros, transfer function, state-space</span></div>
            {closed ? <>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">closed poles</span><Tex block tex={poles.length ? poles.map(cplxTex).join(',\\; ') : '\\text{—}'} /></div>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">open poles</span><Tex block tex={(() => { const op = roots(denO); return op.length ? op.map(cplxTex).join(',\\; ') : '\\text{—}' })()} /></div>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">zeros</span><Tex block tex={zeros.length ? zeros.map(cplxTex).join(',\\; ') : '\\text{none}'} /><span className="cl-eqs-note" style={{ marginLeft: 10 }}>open &amp; closed loop share the same zeros</span></div>
            </> : <>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">poles</span><Tex block tex={poles.length ? poles.map(cplxTex).join(',\\; ') : '\\text{—}'} /></div>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">zeros</span><Tex block tex={zeros.length ? zeros.map(cplxTex).join(',\\; ') : '\\text{none}'} /></div>
            </>}
            {closed ? <>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">loop gain</span><Tex block tex={`L(s) = \\dfrac{${polyTex(numO)}}{${polyTex(denO)}}`} /></div>
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">closed loop</span><Tex block tex={`T(s) = \\dfrac{Y}{R} = \\dfrac{L}{1+L} = \\dfrac{${polyTex(num)}}{${polyTex(den)}}`} /></div>
            </> : (
              <div className="cl-eqs-sysrow"><span className="cl-eqs-cap">series</span><Tex block tex={`G(s) = \\dfrac{Y}{U} = \\dfrac{${polyTex(num)}}{${polyTex(den)}}`} /></div>
            )}
            <div className="cl-eqs-sysrow cl-eqs-sstop"><span className="cl-eqs-cap">state-space<br /><span className="cl-eqs-sub">{closed ? 'closed loop' : 'open loop'}</span></span><Tex block tex={`\\dot{x} = ${matTex(ss.A)}\\,x + ${matTex(ss.B.map((v) => [v]))}\\,u`} /></div>
            <div className="cl-eqs-sysrow"><span className="cl-eqs-cap" /><Tex block tex={`y = ${matTex([ss.C])}\\,x + ${numFmt(ss.D)}\\,u`} /></div>
            <div className="cl-eqs-sysrow"><span className="cl-eqs-cap" /><span className="cl-legend"><span>u = {inName}</span>{stateNames.map((nm, i) => <span key={i}>x{subStr(i + 1)} = {nm}</span>)}<span>y = output</span></span></div>
            <div className="cl-eqs-sysrow"><span className="cl-eqs-cap" /><span className="cl-eqs-note">{closed ? 'feedback is folded into A — eig(A) = the closed-loop poles above' : 'no feedback — eig(A) = the open-loop poles above'}</span></div>
          </div>
        )
      })()}
    </div>
  )
}


function divC(a: { re: number; im: number }, b: { re: number; im: number }) { const d = b.re * b.re + b.im * b.im || 1e-30; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d } }
