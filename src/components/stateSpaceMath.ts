// Small dense linear-algebra + control toolkit for the state-space lab.
// Everything is real, sized for n ≤ 4 states; the lab itself uses n = 2.

export type Mat = number[][]
export type Vec = number[]
export type Cx = { re: number; im: number }

export const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
export const zeros = (r: number, c: number): Mat => Array.from({ length: r }, () => new Array(c).fill(0))
export const T = (A: Mat): Mat => A[0].map((_, j) => A.map((row) => row[j]))
export const mul = (A: Mat, B: Mat): Mat => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)))
export const mv = (A: Mat, x: Vec): Vec => A.map((row) => row.reduce((s, a, k) => s + a * x[k], 0))
export const addM = (A: Mat, B: Mat): Mat => A.map((r, i) => r.map((v, j) => v + B[i][j]))
export const subM = (A: Mat, B: Mat): Mat => A.map((r, i) => r.map((v, j) => v - B[i][j]))
export const scalM = (A: Mat, k: number): Mat => A.map((r) => r.map((v) => v * k))
export const matpow = (A: Mat, k: number): Mat => { let R = eye(A.length); for (let i = 0; i < k; i++) R = mul(R, A); return R }

// determinant & inverse via Gauss–Jordan with partial pivoting (n small)
export function det(A: Mat): number {
  const n = A.length, M = A.map((r) => r.slice()); let d = 1
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-15) return 0
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; d = -d }
    d *= M[c][c]
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < n; k++) M[r][k] -= f * M[c][k] }
  }
  return d
}
export function inv(A: Mat): Mat | null {
  const n = A.length, M = A.map((r, i) => [...r, ...eye(n)[i]])
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-12) return null
    if (p !== c) { const t = M[p]; M[p] = M[c]; M[c] = t }
    const piv = M[c][c]; for (let k = 0; k < 2 * n; k++) M[c][k] /= piv
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k] }
  }
  return M.map((r) => r.slice(n))
}

// rank by row-echelon with tolerance
export function rank(A: Mat, tol = 1e-9): number {
  const M = A.map((r) => r.slice()), rows = M.length, cols = M[0].length
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = r; for (let i = r + 1; i < rows; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < tol) continue
    if (p !== r) { const t = M[p]; M[p] = M[r]; M[r] = t }
    for (let i = 0; i < rows; i++) if (i !== r) { const f = M[i][c] / M[r][c]; for (let k = c; k < cols; k++) M[i][k] -= f * M[r][k] }
    r++
  }
  return r
}

// eigenvalues of a 2×2 matrix (complex pair or two reals)
export function eig2(A: Mat): Cx[] {
  const tr = A[0][0] + A[1][1], dt = A[0][0] * A[1][1] - A[0][1] * A[1][0]
  const disc = tr * tr - 4 * dt
  if (disc >= 0) { const s = Math.sqrt(disc); return [{ re: (tr + s) / 2, im: 0 }, { re: (tr - s) / 2, im: 0 }] }
  const s = Math.sqrt(-disc); return [{ re: tr / 2, im: s / 2 }, { re: tr / 2, im: -s / 2 }]
}

// controllability  [B  AB  A²B …]   and observability  [C; CA; CA²; …]
export function ctrb(A: Mat, B: Mat): Mat {
  const n = A.length, cols: Vec[] = []; let Ak = eye(n)
  for (let k = 0; k < n; k++) { const AkB = mul(Ak, B); for (let j = 0; j < B[0].length; j++) cols.push(AkB.map((r) => r[j])); Ak = mul(Ak, A) }
  return T(cols)   // n × (n·m)
}
export function obsv(A: Mat, C: Mat): Mat {
  const n = A.length, rows: Vec[] = []; let Ak = eye(n)
  for (let k = 0; k < n; k++) { const CAk = mul(C, Ak); for (const r of CAk) rows.push(r.slice()); Ak = mul(Ak, A) }
  return rows   // (n·p) × n
}

// real monic polynomial (descending) from desired roots given as complex pairs
export function polyFromRoots(rts: Cx[]): number[] {
  let p: Cx[] = [{ re: 1, im: 0 }]
  for (const r of rts) { const np: Cx[] = p.map(() => ({ re: 0, im: 0 })); np.push({ re: 0, im: 0 })
    for (let i = 0; i < p.length; i++) { np[i].re += p[i].re; np[i].im += p[i].im; np[i + 1].re -= p[i].re * r.re - p[i].im * r.im; np[i + 1].im -= p[i].re * r.im + p[i].im * r.re }
    p = np }
  return p.map((c) => c.re)   // imaginary parts cancel for conjugate-closed root sets
}

// Ackermann pole placement (single input): K (1×n) so eig(A−BK) = desiredPoles
export function ackermann(A: Mat, b: Vec, desired: Cx[]): Vec {
  const n = A.length, Bc = b.map((v) => [v])
  const Wc = ctrb(A, Bc); const Wi = inv(Wc); if (!Wi) return new Array(n).fill(NaN)
  const a = polyFromRoots(desired)            // [1, a1, …, an], length n+1
  // φ(A) = Aⁿ + a1 A^{n-1} + … + an I
  let phi = zeros(n, n); let Ak = eye(n)
  for (let i = n; i >= 0; i--) { phi = addM(phi, scalM(Ak, a[i])); Ak = mul(Ak, A) }
  // K = (last row of Wc⁻¹) · φ(A)   [Ackermann's formula]
  const last = Wi[n - 1]
  return phi[0].map((_, j) => last.reduce((s, w, k) => s + w * phi[k][j], 0))
}

// observer gain L (n×1) by duality: place eig(A−LC) at desired
export function observerGain(A: Mat, C: Mat, desired: Cx[]): Vec {
  const cRow = C[0]
  const Lt = ackermann(T(A), cRow, desired)   // place on (Aᵀ, Cᵀ)
  return Lt                                    // L = (Kdual)ᵀ → as a vector
}

// Continuous-time LQR via backward integration of the Riccati ODE to steady state:
//   Ṗ = AᵀP + PA − P B R⁻¹ Bᵀ P + Q ,  K = R⁻¹ Bᵀ P
export function lqr(A: Mat, B: Mat, Q: Mat, R: Mat): { K: Mat; P: Mat } {
  const n = A.length, Ri = inv(R)!, At = T(A), Bt = T(B), BRBt = mul(mul(B, Ri), Bt)
  let P = eye(n).map((r) => r.map((v) => v))   // start from I
  // adaptive forward-Euler: clamp the step so the stiff −P B R⁻¹ Bᵀ P term (huge for small R) can't overshoot
  for (let it = 0; it < 120000; it++) {
    const dP = addM(subM(addM(mul(At, P), mul(P, A)), mul(mul(P, BRBt), P)), Q)
    let nrm = 0; for (const r of dP) for (const v of r) nrm = Math.max(nrm, Math.abs(v))
    if (nrm < 1e-8) break
    const step = Math.min(0.01, 0.3 / (nrm + 1))
    P = addM(P, scalM(dP, step))
  }
  const K = mul(mul(Ri, Bt), P)   // m×n
  return { K, P }
}

export const fmt = (v: number, d = 2) => { const r = +v.toFixed(d); return Object.is(r, -0) ? '0' : String(r) }
export const cstr = (c: Cx) => Math.abs(c.im) < 1e-6 ? fmt(c.re) : `${fmt(c.re)} ${c.im < 0 ? '−' : '+'} ${fmt(Math.abs(c.im))}j`
