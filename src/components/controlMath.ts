// Numerical core for the control sandbox: extract a linear state-space model
// (A,B,C,D) from a block diagram, turn it into a SISO transfer function
// num(s)/den(s), and provide the primitives for poles, Bode, Nyquist and root
// locus. Saturation is treated as unit gain (linear analysis); only one input
// (the first source) and one output (the first signal into a Scope) are used.

export type C = { re: number; im: number }
export const cadd = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im })
export const csub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im })
export const cmul = (a: C, b: C): C => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re })
export const cdiv = (a: C, b: C): C => { const d = b.re * b.re + b.im * b.im || 1e-30; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d } }
export const cabs = (a: C) => Math.hypot(a.re, a.im)
export const carg = (a: C) => Math.atan2(a.im, a.re)

// ---- graph types (mirror of ControlLab) ----
type BType = 'step' | 'impulse' | 'sine' | 'sum' | 'gain' | 'integrator' | 'tf1' | 'tf2' | 'deriv' | 'delay' | 'sat' | 'scope'
export type GBlock = { id: number; type: BType; p: Record<string, number> }
export type GWire = { from: number; to: number; toPort: number }

const nInOf = (t: BType) => (t === 'step' || t === 'sine' ? 0 : t === 'sum' ? 2 : 1)

// Build the SISO state-space (A,B,C,D). Returns null if it has no states or no
// well-defined input/output.
export function buildSS(blocks: GBlock[], wires: GWire[]) {
  const byId: Record<number, GBlock> = {}; blocks.forEach((b) => (byId[b.id] = b))
  const input = blocks.find((b) => b.type === 'step' || b.type === 'impulse' || b.type === 'sine')
  const scope = blocks.find((b) => b.type === 'scope')
  if (!input || !scope) return null
  const outWire = wires.find((w) => w.to === scope.id)
  if (!outWire) return null

  // assign state indices
  const stateIdx: Record<number, number> = {}; let n = 0; const states: number[] = []   // states[i] = id of the block owning state i
  for (const b of blocks) {
    if (b.type === 'integrator' || b.type === 'tf1' || b.type === 'deriv' || b.type === 'delay') { stateIdx[b.id] = n; states[n] = b.id; n++ }
    else if (b.type === 'tf2') { stateIdx[b.id] = n; states[n] = b.id; states[n + 1] = b.id; n += 2 }
  }
  if (n === 0) return null

  // each block output as a coefficient vector over [x_0..x_{n-1}, u] (length n+1)
  const zero = () => new Array(n + 1).fill(0)
  const out: Record<number, number[]> = {}
  const e = (i: number) => { const v = zero(); v[i] = 1; return v }
  // sources + state read-outs
  for (const b of blocks) {
    if (b.id === input.id) out[b.id] = (() => { const v = zero(); v[n] = 1; return v })()      // = u
    else if (b.type === 'step' || b.type === 'impulse' || b.type === 'sine') out[b.id] = zero()    // other sources → 0
    else if (b.type === 'integrator' || b.type === 'tf1') out[b.id] = e(stateIdx[b.id])
    else if (b.type === 'tf2') out[b.id] = e(stateIdx[b.id])                                     // output = state0
  }
  const inVec = (id: number, port: number) => { const w = wires.find((w) => w.to === id && w.toPort === port); return w && out[w.from] ? out[w.from] : zero() }
  // feedthrough nodes (output depends directly on input) in topological order.
  // 'deriv' is stateful but also has a direct feedthrough term, so it lives here.
  const mem = blocks.filter((b) => b.type === 'sum' || b.type === 'gain' || b.type === 'sat' || b.type === 'deriv' || b.type === 'delay')
  const memSet = new Set(mem.map((b) => b.id))
  const indeg: Record<number, number> = {}; mem.forEach((b) => (indeg[b.id] = 0))
  for (const w of wires) if (memSet.has(w.from) && memSet.has(w.to)) indeg[w.to]++
  const q = mem.filter((b) => indeg[b.id] === 0).map((b) => b.id); const order: number[] = []
  while (q.length) { const id = q.shift()!; order.push(id); for (const w of wires) if (w.from === id && memSet.has(w.to)) if (--indeg[w.to] === 0) q.push(w.to) }
  for (const b of mem) if (!order.includes(b.id)) order.push(b.id)
  const scale = (v: number[], k: number) => v.map((x) => x * k)
  const add = (a: number[], b: number[]) => a.map((x, i) => x + b[i])
  for (const id of order) {
    const b = byId[id]
    if (!memSet.has(id) || !b) continue
    if (b.type === 'gain') out[id] = scale(inVec(id, 0), b.p.K)
    else if (b.type === 'sum') out[id] = add(scale(inVec(id, 0), b.p.s0), scale(inVec(id, 1), b.p.s1))
    else if (b.type === 'sat') out[id] = inVec(id, 0)
    else if (b.type === 'deriv') { const g = b.p.Kd * b.p.N; out[id] = add(scale(inVec(id, 0), g), scale(e(stateIdx[id]), -g)) }   // y = Kd·N·(u − x)
    else if (b.type === 'delay') { const a = 2 / Math.max(1e-3, b.p.T); out[id] = add(scale(inVec(id, 0), -1), scale(e(stateIdx[id]), 2 * a)) }   // 1st-order Padé: y = −u + 2a·x
  }
  void nInOf

  // assemble A, B from state derivatives; C, D from the output node
  const A = Array.from({ length: n }, () => new Array(n).fill(0))
  const B = new Array(n).fill(0)
  const setRow = (row: number, vec: number[]) => { for (let j = 0; j < n; j++) A[row][j] = vec[j]; B[row] = vec[n] }
  for (const b of blocks) {
    if (b.type === 'integrator') { setRow(stateIdx[b.id], inVec(b.id, 0)) }
    else if (b.type === 'deriv') { const u = inVec(b.id, 0), i = stateIdx[b.id]; setRow(i, add(scale(u, b.p.N), scale(e(i), -b.p.N))) }   // ẋ = N·(u − x)
    else if (b.type === 'delay') { const u = inVec(b.id, 0), i = stateIdx[b.id], a = 2 / Math.max(1e-3, b.p.T); setRow(i, add(scale(u, 1), scale(e(i), -a))) }   // Padé: ẋ = −a·x + u
    else if (b.type === 'tf1') { const u = inVec(b.id, 0), i = stateIdx[b.id]; const r = add(scale(u, b.p.K / Math.max(1e-3, b.p.tau)), scale(e(i), -1 / Math.max(1e-3, b.p.tau))); setRow(i, r) }
    else if (b.type === 'tf2') {
      const i = stateIdx[b.id], u = inVec(b.id, 0)
      setRow(i, e(i + 1))                                                                         // ẏ = v
      const r = add(add(scale(u, b.p.wn * b.p.wn * b.p.K), scale(e(i), -b.p.wn * b.p.wn)), scale(e(i + 1), -2 * b.p.zeta * b.p.wn))
      setRow(i + 1, r)                                                                            // v̇
    }
  }
  const o = out[outWire.from] || zero()
  const Cv = o.slice(0, n), D = o[n]
  return { A, B, C: Cv, D, n, states, inputId: input.id, outputId: outWire.from }
}

// ---- linear algebra over reals ----
const matMul = (A: number[][], B: number[][]) => { const n = A.length; const R = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i][k]; if (a) for (let j = 0; j < n; j++) R[i][j] += a * B[k][j] } return R }
const trace = (A: number[][]) => A.reduce((s, r, i) => s + r[i], 0)

// Faddeev–LeVerrier: characteristic polynomial of A, returned descending,
// monic: [1, c1, ..., cn]  →  s^n + c1 s^{n-1} + ... + cn.
export function charPoly(A: number[][]): number[] {
  const n = A.length
  if (n === 0) return [1]
  const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
  const c = [1]; let M = I.map((r) => r.slice())
  for (let k = 1; k <= n; k++) {
    if (k > 1) { const AM = matMul(A, M); M = AM.map((r, i) => r.map((v, j) => v + c[k - 1] * (i === j ? 1 : 0))) }
    const ck = -trace(matMul(A, M)) / k
    c.push(ck)
  }
  return c
}

// SISO transfer function num/den from state-space, using
// C(sI-A)^{-1}B = det(sI-(A-BC))/det(sI-A) - 1.
export function transferFn(ss: { A: number[][]; B: number[]; C: number[]; D: number }) {
  const { A, B, C, D, } = ss as { A: number[][]; B: number[]; C: number[]; D: number }
  const den = charPoly(A)
  const ABC = A.map((row, i) => row.map((v, j) => v - B[i] * C[j]))
  const p2 = charPoly(ABC)
  // num = (D-1)*den + p2   (both descending, same length n+1)
  const num = den.map((d, i) => (D - 1) * d + (p2[i] ?? 0))
  return { num, den }
}

// ---- polynomial helpers (descending coeffs) ----
const trim = (p: number[]) => { let i = 0; while (i < p.length - 1 && Math.abs(p[i]) < 1e-12) i++; return p.slice(i) }
export const polyEval = (p: number[], s: C): C => { let acc: C = { re: 0, im: 0 }; for (const c of p) acc = cadd(cmul(acc, s), { re: c, im: 0 }); return acc }
export const polySub = (a: number[], b: number[]) => { const L = Math.max(a.length, b.length); const pa = new Array(L - a.length).fill(0).concat(a); const pb = new Array(L - b.length).fill(0).concat(b); return pa.map((v, i) => v - pb[i]) }
export const polyAddK = (a: number[], k: number, b: number[]) => { const L = Math.max(a.length, b.length); const pa = new Array(L - a.length).fill(0).concat(a); const pb = new Array(L - b.length).fill(0).concat(b); return pa.map((v, i) => v + k * pb[i]) }

// Durand–Kerner: all complex roots of a real polynomial (descending coeffs).
export function roots(poly: number[]): C[] {
  const p = trim(poly); const deg = p.length - 1
  if (deg <= 0) return []
  const a = p.map((c) => c / p[0])                                  // monic
  let z: C[] = Array.from({ length: deg }, (_, i) => ({ re: 0.4 * Math.cos(2.4 * i), im: 0.9 * Math.sin(2.4 * i + 0.7) }))
  const ev = (s: C) => { let acc: C = { re: 0, im: 0 }; for (const c of a) acc = cadd(cmul(acc, s), { re: c, im: 0 }); return acc }
  for (let it = 0; it < 120; it++) {
    let maxd = 0
    const zn = z.map((zi, i) => {
      let denom: C = { re: 1, im: 0 }
      for (let j = 0; j < deg; j++) if (j !== i) denom = cmul(denom, csub(zi, z[j]))
      const d = cdiv(ev(zi), denom); maxd = Math.max(maxd, cabs(d)); return csub(zi, d)
    })
    z = zn; if (maxd < 1e-12) break
  }
  return z
}
