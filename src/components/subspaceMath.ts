// Linear algebra for the four-subspaces demo: a closed-form SVD of 2×2, 3×2
// and 2×3 matrices via the eigendecomposition of the 2×2 Gram matrix AᵀA
// (or AAᵀ — the wide case is handled by transposing and swapping U ↔ V).

export type Vec = number[]
export type Mat = number[][]   // row-major: A[i][j], i = row

export const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0)
export const norm = (a: Vec) => Math.hypot(...a)
export const scale = (a: Vec, k: number): Vec => a.map((v) => v * k)
export const add = (a: Vec, b: Vec): Vec => a.map((v, i) => v + b[i])
export const sub = (a: Vec, b: Vec): Vec => a.map((v, i) => v - b[i])
export const matvec = (A: Mat, x: Vec): Vec => A.map((row) => dot(row, x))
export const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((row) => row[j]))

// eigendecomposition of a symmetric 2×2 [[a,b],[b,c]]: λ1 ≥ λ2, orthonormal v1 ⊥ v2
export function eig2sym(a: number, b: number, c: number) {
  const tr = a + c, d = Math.hypot(a - c, 2 * b)
  const l1 = (tr + d) / 2, l2 = (tr - d) / 2
  let v1: Vec = Math.abs(b) > 1e-12 ? [l1 - c, b] : a >= c ? [1, 0] : [0, 1]
  const nv = norm(v1); v1 = [v1[0] / nv, v1[1] / nv]
  return { l1, l2, v1, v2: [-v1[1], v1[0]] as Vec }
}

// append orthonormal vectors until `basis` spans ℝ^dim (Gram–Schmidt on the standard basis)
export function completeBasis(basis: Vec[], dim: number) {
  for (let e = 0; e < dim && basis.length < dim; e++) {
    let w: Vec = Array.from({ length: dim }, (_, i) => (i === e ? 1 : 0))
    for (const u of basis) w = sub(w, scale(u, dot(u, w)))
    const nw = norm(w)
    if (nw > 1e-6) basis.push(scale(w, 1 / nw))
  }
}

// Full SVD A = U Σ Vᵀ for shapes with exactly 2 columns or 2 rows (max dim 3).
// U: m orthonormal columns of ℝᵐ; V: n orthonormal columns of ℝⁿ; S: min(m,n)
// singular values, descending. The first `rank` columns of V span Row(A) and of
// U span Col(A); the remaining columns span Null(A) and Null(Aᵀ) respectively.
export type SVD = { U: Vec[]; S: number[]; V: Vec[]; rank: number }

export function svd(A: Mat): SVD {
  const m = A.length, n = A[0].length
  if (n > m) { const t = svd(transpose(A)); return { U: t.V, S: t.S, V: t.U, rank: t.rank } }
  // here n = 2 ≤ m: eigendecompose the 2×2 Gram matrix G = AᵀA = VΛVᵀ, σᵢ = √λᵢ
  const At = transpose(A)
  const { l1, l2, v1, v2 } = eig2sym(dot(At[0], At[0]), dot(At[0], At[1]), dot(At[1], At[1]))
  const S = [Math.sqrt(Math.max(0, l1)), Math.sqrt(Math.max(0, l2))]
  const V: Vec[] = [v1, v2]
  const tol = Math.max(1e-12, S[0] * 1e-7)
  const rank = S.filter((s) => s > tol).length
  // left singular vectors uᵢ = Avᵢ/σᵢ where σᵢ > 0, then complete to a basis of ℝᵐ
  const U: Vec[] = []
  for (let i = 0; i < 2; i++) if (S[i] > tol) U.push(scale(matvec(A, V[i]), 1 / S[i]))
  completeBasis(U, m)
  return { U, S, V, rank }
}
