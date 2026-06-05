import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const subspaces: DemoNote = {
  title: 'Four fundamental subspaces & the SVD',
  theme: 'Mathematical foundations',
  tagline: 'Row space, null space, column space, left null space — and how the singular value decomposition hands you an orthonormal basis for each.',

  foundations: (
    <>
      <p>
        An <T>{r`m\times n`}</T> matrix <T>{r`A`}</T> is a linear map <T>{r`A:\mathbb{R}^n\to\mathbb{R}^m`}</T>. Four subspaces
        completely describe what the map does. Two live in the <b>domain</b> <T>{r`\mathbb{R}^n`}</T>: the <b>row space</b>{' '}
        <T>{r`\mathrm{Row}(A)=\mathrm{Col}(A^\mathsf{T})`}</T> — <i>what A listens to</i>, the only part of an input that
        influences the output — and the <b>null space</b> <T>{r`\mathrm{Null}(A)=\{x: Ax=0\}`}</T> — <i>what A ignores</i>,
        directions the map flattens to zero. Two live in the <b>codomain</b> <T>{r`\mathbb{R}^m`}</T>: the <b>column space</b>{' '}
        <T>{r`\mathrm{Col}(A)=\{Ax\}`}</T> — <i>what A can produce</i>, where every output lands — and the <b>left null
        space</b> <T>{r`\mathrm{Null}(A^\mathsf{T})=\{y: A^\mathsf{T}y=0\}`}</T> — <i>what A can never produce</i>, the
        directions of the codomain no input maps into (the home of the least-squares residual).
      </p>
      <p>
        The <b>fundamental theorem of linear algebra</b> (Strang) says these four are not arbitrary: with{' '}
        <T>{r`r=\mathrm{rank}(A)`}</T>,
      </p>
      <TB>{r`\underbrace{\mathrm{Row}(A)}_{\dim r}\ \perp\ \underbrace{\mathrm{Null}(A)}_{\dim n-r}\ =\ \mathbb{R}^n, \qquad \underbrace{\mathrm{Col}(A)}_{\dim r}\ \perp\ \underbrace{\mathrm{Null}(A^\mathsf{T})}_{\dim m-r}\ =\ \mathbb{R}^m.`}</TB>
      <p>
        The singular value decomposition <T>{r`A=U\Sigma V^\mathsf{T}`}</T> is the constructive version of this theorem: the
        columns of <T>{r`V`}</T> are an orthonormal basis of the domain whose first <T>{r`r`}</T> vectors span the row space and
        whose last <T>{r`n-r`}</T> span the null space; the columns of <T>{r`U`}</T> do the same for column space and left null
        space; and the singular values <T>{r`\sigma_i`}</T> are the gains that connect them pairwise, <T>{r`Av_i=\sigma_i u_i`}</T>.
        The demo draws exactly this: the unit circle in the <T>{r`v_1\text{–}v_2`}</T> plane maps to the ellipse with semi-axes{' '}
        <T>{r`\sigma_1 u_1,\ \sigma_2 u_2`}</T>.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Row space ⊥ null space',
      tex: r`Ax=0 \iff \text{(row}_i\text{)}\cdot x = 0\ \ \forall i \iff x\perp\mathrm{Row}(A)`,
      note: <p><T>{r`Ax`}</T> stacks the dot products of <T>{r`x`}</T> with every row, so <T>{r`x`}</T> is in the null space exactly when it is orthogonal to every row — hence to their whole span. The null space is the orthogonal complement of the row space, so their dimensions add to <T>{r`n`}</T> (rank–nullity).</p>,
    },
    {
      title: 'Column space ⊥ left null space',
      tex: r`\mathrm{Null}(A^\mathsf{T}) = \mathrm{Col}(A)^{\perp}`,
      note: <p>The same statement applied to <T>{r`A^\mathsf{T}`}</T>: <T>{r`A^\mathsf{T}y=0`}</T> means <T>{r`y`}</T> is orthogonal to every column of <T>{r`A`}</T>. So the codomain also splits orthogonally, with dimensions <T>{r`r`}</T> and <T>{r`m-r`}</T>.</p>,
    },
    {
      title: 'Diagonalize the Gram matrix',
      tex: r`A^\mathsf{T}A = V\Lambda V^\mathsf{T},\qquad \lambda_1\ge\cdots\ge\lambda_n\ge 0`,
      note: <p><T>{r`A^\mathsf{T}A`}</T> is symmetric positive-semidefinite, so the spectral theorem gives an orthonormal eigenbasis <T>{r`v_1,\dots,v_n`}</T> of the <i>domain</i> with eigenvalues <T>{r`\lambda_i = \|Av_i\|^2 \ge 0`}</T>. Define the <b>singular values</b> <T>{r`\sigma_i=\sqrt{\lambda_i}`}</T>.</p>,
    },
    {
      title: 'Build the left singular vectors',
      tex: r`u_i = \frac{Av_i}{\sigma_i}\quad(\sigma_i>0),\qquad u_i^\mathsf{T}u_j = \frac{v_i^\mathsf{T}A^\mathsf{T}Av_j}{\sigma_i\sigma_j} = \frac{\lambda_j\, v_i^\mathsf{T}v_j}{\sigma_i\sigma_j}=\delta_{ij}`,
      note: <p>The images of the <T>{r`v_i`}</T> with <T>{r`\sigma_i>0`}</T>, normalized, are automatically orthonormal in the codomain — orthogonality is inherited from the eigenvectors. Complete them to a full orthonormal basis <T>{r`u_1,\dots,u_m`}</T> of <T>{r`\mathbb{R}^m`}</T> (Gram–Schmidt).</p>,
    },
    {
      title: 'Assemble the SVD',
      tex: r`A = U\Sigma V^\mathsf{T} = \sum_{i=1}^{r}\sigma_i\, u_i v_i^\mathsf{T}`,
      note: <p>Both sides act identically on the basis <T>{r`\{v_i\}`}</T>: <T>{r`Av_i=\sigma_i u_i`}</T> for <T>{r`i\le r`}</T> and <T>{r`Av_i=0`}</T> beyond. So every matrix is a sum of <T>{r`r`}</T> rank-one layers: <i>rotate</i> (<T>{r`V^\mathsf{T}`}</T>), <i>stretch along axes</i> (<T>{r`\Sigma`}</T>), <i>rotate</i> (<T>{r`U`}</T>).</p>,
    },
    {
      title: 'Read off the four subspaces',
      tex: r`V = [\underbrace{v_1\cdots v_r}_{\mathrm{Row}(A)}\,|\,\underbrace{v_{r+1}\cdots v_n}_{\mathrm{Null}(A)}],\qquad U = [\underbrace{u_1\cdots u_r}_{\mathrm{Col}(A)}\,|\,\underbrace{u_{r+1}\cdots u_m}_{\mathrm{Null}(A^\mathsf{T})}]`,
      note: <p><T>{r`\sigma_i=0`}</T> means <T>{r`Av_i=0`}</T>: those <T>{r`v_i`}</T> span the null space, and the first <T>{r`r`}</T> (orthogonal to them) span the row space. Every output <T>{r`Ax=\sum_{i\le r}\sigma_i (v_i^\mathsf{T}x)\,u_i`}</T> is a combination of <T>{r`u_1..u_r`}</T> — the column space — and never touches the remaining <T>{r`u_i`}</T>.</p>,
    },
    {
      title: 'The action, vector by vector',
      tex: r`x = \underbrace{\textstyle\sum_{i\le r} c_i v_i}_{x_{\mathrm{row}}} + \underbrace{\textstyle\sum_{i> r} c_i v_i}_{x_{\mathrm{null}}} \;\longmapsto\; Ax = \sum_{i\le r} \sigma_i c_i\, u_i`,
      note: <p>Write <T>{r`x`}</T> in the <T>{r`V`}</T> basis (<T>{r`c_i = v_i^\mathsf{T}x`}</T> — the demo's sliders). The null component is annihilated; each row-space coordinate is scaled by <T>{r`\sigma_i`}</T> and re-expressed along <T>{r`u_i`}</T>. Restricted to <T>{r`\mathrm{Row}(A)\to\mathrm{Col}(A)`}</T>, the map is a bijection — every matrix is invertible <i>between the right pair of subspaces</i>.</p>,
    },
    {
      title: 'Geometry: sphere → ellipsoid',
      tex: r`\{Ax : \|x\|=1\} = \text{ellipsoid with semi-axes } \sigma_i u_i,\qquad \|A\|_2=\sigma_1`,
      note: <p>The unit sphere of the domain maps to an ellipsoid (flattened along annihilated directions). The longest semi-axis is the operator norm <T>{r`\sigma_1`}</T>; the ratio <T>{r`\sigma_1/\sigma_r`}</T> is the condition number. A nearly-flat ellipse (<T>{r`\sigma_2\ll\sigma_1`}</T>) is the demo's “almost rank-deficient” warning.</p>,
    },
  ],

  deep: [
    {
      heading: 'Least squares and the pseudoinverse',
      body: (
        <>
          <p>
            When <T>{r`Ax=b`}</T> has no solution (<T>{r`b\notin\mathrm{Col}(A)`}</T>, generic for tall matrices), the best one can
            do is minimize <T>{r`\|Ax-b\|`}</T>: project <T>{r`b`}</T> onto the column space. The SVD solves it in one line — the{' '}
            <b>Moore–Penrose pseudoinverse</b>
          </p>
          <TB>{r`A^{+} = V\Sigma^{+}U^\mathsf{T},\qquad \Sigma^{+} = \mathrm{diag}(1/\sigma_1,\dots,1/\sigma_r,0,\dots),\qquad \hat{x} = A^{+}b.`}</TB>
          <p>
            Reading it through the four subspaces: <T>{r`U^\mathsf{T}b`}</T> drops the <T>{r`\mathrm{Null}(A^\mathsf{T})`}</T>{' '}
            component of <T>{r`b`}</T> (the irreducible residual), <T>{r`\Sigma^{+}`}</T> undoes the gains <T>{r`\sigma_i`}</T>, and{' '}
            <T>{r`V`}</T> rebuilds a vector that lies entirely in the row space — the <i>minimum-norm</i> solution, since adding any
            null-space component would change nothing about <T>{r`Ax`}</T> but lengthen <T>{r`x`}</T>. This is exactly why the demo's
            wide (2×3) matrix has infinitely many preimages per output: they differ by the pink null line.
          </p>
        </>
      ),
    },
    {
      heading: 'Eckart–Young: the best low-rank approximation',
      body: (
        <>
          <p>
            Truncating the rank-one sum at <T>{r`k<r`}</T> terms gives <T>{r`A_k=\sum_{i\le k}\sigma_i u_i v_i^\mathsf{T}`}</T>, and
            the Eckart–Young theorem says no rank-<T>{r`k`}</T> matrix comes closer:
          </p>
          <TB>{r`\min_{\mathrm{rank}(B)\le k}\|A-B\|_2 = \|A-A_k\|_2 = \sigma_{k+1}.`}</TB>
          <p>
            The singular values are therefore a <i>budget</i>: they tell you exactly how much of the map lives at each rank. This is
            the engine behind image compression, denoising, and every “the data is effectively low-dimensional” claim — the tail{' '}
            <T>{r`\sigma_{k+1},\dots`}</T> quantifies what you throw away.
          </p>
        </>
      ),
    },
    {
      heading: 'PCA is the SVD of a data matrix',
      body: (
        <>
          <p>
            Stack <T>{r`T`}</T> observations of <T>{r`N`}</T> neurons (channels, sensors…) into a centered data matrix{' '}
            <T>{r`X\in\mathbb{R}^{T\times N}`}</T>. The sample covariance is <T>{r`C=X^\mathsf{T}X/(T{-}1)`}</T>, so the
            eigenvectors of <T>{r`C`}</T> — the <b>principal components</b> — are precisely the right singular vectors of{' '}
            <T>{r`X`}</T>, with variances <T>{r`\sigma_i^2/(T{-}1)`}</T>. “Neural activity lies on a low-dimensional manifold”
            is the statement that the singular-value spectrum of <T>{r`X`}</T> decays fast: the row space of the data is
            effectively <T>{r`k`}</T>-dimensional with <T>{r`k\ll N`}</T>. The four-subspace picture also explains what PCA
            discards — the near-null directions of <T>{r`X`}</T>, i.e. patterns of co-activity the population (almost) never
            produces.
          </p>
        </>
      ),
    },
    {
      heading: 'Worked example: a rank-1 matrix',
      body: (
        <>
          <p>
            Take the demo's 2×2 preset <T>{r`A=\begin{bmatrix}1&0.5\\2&1\end{bmatrix}`}</T>: the second column is half the first,
            so <T>{r`r=1`}</T>. Then <T>{r`A=\sigma_1 u_1 v_1^\mathsf{T}`}</T> with <T>{r`v_1\propto(2,1)`}</T>,{' '}
            <T>{r`u_1\propto(1,2)`}</T>, <T>{r`\sigma_1=\sqrt{(1+0.25)(1+4)}=2.5`}</T>. All four subspaces are lines: the row
            space along <T>{r`(2,1)`}</T>, the null space along the perpendicular <T>{r`(1,-2)`}</T>, the column space along{' '}
            <T>{r`(1,2)`}</T>, the left null space along <T>{r`(2,-1)`}</T>. The image of the whole plane is the single line{' '}
            <T>{r`\mathrm{Col}(A)`}</T>; the unit circle's image collapses to a segment of half-length <T>{r`\sigma_1`}</T>; sliding{' '}
            <T>{r`c_2`}</T> moves <T>{r`x`}</T> along the null line while <T>{r`Ax`}</T> does not move at all.
          </p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 560 230" role="img" aria-label="The four fundamental subspaces and the SVD map between them">
      {/* domain */}
      <ellipse cx="130" cy="115" rx="105" ry="92" fill="rgba(34,225,255,0.04)" stroke="rgba(255,255,255,0.22)" />
      <line x1="58" y1="160" x2="202" y2="70" stroke="#22e1ff" strokeWidth="2" />
      <line x1="70" y1="58" x2="190" y2="172" stroke="#ff2d8f" strokeWidth="2" />
      <text x="200" y="62" fill="#22e1ff" fontSize="11" fontFamily="monospace">Row(A)</text>
      <text x="170" y="188" fill="#ff2d8f" fontSize="11" fontFamily="monospace">Null(A)</text>
      <text x="92" y="30" fill="rgba(233,235,251,0.7)" fontSize="11" fontFamily="monospace">domain ℝⁿ</text>
      {/* codomain */}
      <ellipse cx="430" cy="115" rx="105" ry="92" fill="rgba(84,230,160,0.04)" stroke="rgba(255,255,255,0.22)" />
      <line x1="358" y1="155" x2="502" y2="75" stroke="#54e6a0" strokeWidth="2" />
      <line x1="375" y1="60" x2="485" y2="170" stroke="#ffb84d" strokeWidth="2" />
      <text x="498" y="66" fill="#54e6a0" fontSize="11" fontFamily="monospace">Col(A)</text>
      <text x="462" y="188" fill="#ffb84d" fontSize="11" fontFamily="monospace">Null(Aᵀ)</text>
      <text x="388" y="30" fill="rgba(233,235,251,0.7)" fontSize="11" fontFamily="monospace">codomain ℝᵐ</text>
      {/* maps */}
      <path d="M212,98 C260,80 320,80 358,98" fill="none" stroke="#9b8cff" strokeWidth="1.8" markerEnd="url(#ss-arr)" />
      <text x="285" y="74" fill="#9b8cff" fontSize="11" fontFamily="monospace" textAnchor="middle">Avᵢ = σᵢuᵢ</text>
      <path d="M178,150 C240,178 300,196 332,206" fill="none" stroke="#ff2d8f" strokeWidth="1.4" strokeDasharray="4 3" markerEnd="url(#ss-arr2)" />
      <circle cx="340" cy="208" r="3.5" fill="#ff2d8f" />
      <text x="268" y="222" fill="#ff2d8f" fontSize="11" fontFamily="monospace">Null(A) → 0</text>
      <defs>
        <marker id="ss-arr" markerWidth="9" markerHeight="9" refX="7.5" refY="3" orient="auto"><path d="M0,0 L7.5,3 L0,6 Z" fill="#9b8cff" /></marker>
        <marker id="ss-arr2" markerWidth="9" markerHeight="9" refX="7.5" refY="3" orient="auto"><path d="M0,0 L7.5,3 L0,6 Z" fill="#ff2d8f" /></marker>
      </defs>
    </svg>
  ),

  numerics: (
    <p>
      The demo supports shapes 2×2, 3×2 and 2×3, so the Gram matrix of the “thin” orientation is always 2×2 and the SVD is{' '}
      <b>closed-form</b>: <T>{r`A^\mathsf{T}A=\begin{bmatrix}a&b\\b&c\end{bmatrix}`}</T> has eigenvalues{' '}
      <T>{r`\lambda_{1,2}=\tfrac{(a+c)\pm\sqrt{(a-c)^2+4b^2}}{2}`}</T> with eigenvector <T>{r`v_1\propto(\lambda_1-c,\,b)`}</T> and{' '}
      <T>{r`v_2\perp v_1`}</T>. Wide matrices are handled by factoring <T>{r`A^\mathsf{T}`}</T> and swapping <T>{r`U\leftrightarrow V`}</T>.
      Left vectors are <T>{r`u_i=Av_i/\sigma_i`}</T>, completed to a full orthonormal basis by Gram–Schmidt against the standard
      basis. The numerical rank uses the tolerance <T>{r`\sigma_i>10^{-7}\sigma_1`}</T>, and a warning fires when{' '}
      <T>{r`\sigma_2<0.12\,\sigma_1`}</T> (nearly flat ellipse). The 3D panes are an orthographic projection (yaw then pitch,
      drag to rotate); the vector <T>{r`x`}</T> is stored in the <T>{r`V`}</T> basis as coefficients <T>{r`c_i`}</T>, so its
      row/null decomposition and the image <T>{r`Ax=\sum_i \sigma_i c_i u_i`}</T> are exact by construction.
    </p>
  ),

  pseudocode: `function svd_small(A):                  # m×n with two columns (transpose first if wide)
    G = Aᵀ A                            # 2×2 symmetric PSD Gram matrix [[a,b],[b,c]]
    d = sqrt((a−c)² + 4b²)
    λ1, λ2 = ((a+c)+d)/2, ((a+c)−d)/2   # eigenvalues, λ1 ≥ λ2 ≥ 0
    v1 = normalize((λ1−c, b))  if b≠0 else axis of max(a,c)
    v2 = rot90(v1)                      # orthonormal right singular vectors
    σ  = (√λ1, √λ2)                     # singular values
    r  = #{ σi > 1e-7·σ1 }              # numerical rank
    U  = [ A·vi / σi  for σi > tol ]    # left singular vectors (orthonormal automatically)
    complete U to an orthonormal basis of ℝᵐ   # Gram–Schmidt on e1, e2, e3

    # the four subspaces, for free:
    Row(A)  = span(v1..vr)      Null(A)   = span(v(r+1)..vn)
    Col(A)  = span(u1..ur)      Null(Aᵀ)  = span(u(r+1)..um)

  # action on a vector, in singular coordinates
  x  = Σ ci·vi                  # ci = viᵀx   (the demo's sliders)
  Ax = Σ_{i≤r} σi·ci·ui         # null components annihilated, gains σi applied`,

  params: [
    { name: 'shape m×n', range: '2×2 · 3×2 · 2×3', role: 'Domain and codomain dimensions; 3×2 makes Col(A) a plane in ℝ³, 2×3 forces a null line in the domain (rank ≤ 2 < n).' },
    { name: 'A entries', range: 'any (step 0.1, generic 2×2)', role: 'The matrix itself; every edit recomputes the SVD and redraws all four subspaces.' },
    { name: 'presets', range: 'generic / rank 1 / shear / rotation / projection / symmetric…', role: 'Canonical cases: rank-1 collapses the ellipse to a segment; rotation has σ1 = σ2 = 1 (circle → circle); projection kills e2.' },
    { name: 'c₁ … cₙ', range: '−2 … 2 (0.05, x = 1.1v₁ + 0.6v₂)', role: 'Coordinates of x in the right-singular basis: x = Σ cᵢvᵢ. Coefficients beyond the rank move x without moving Ax.' },
    { name: 'drag x (2D domain)', range: '|xᵢ| ≤ 3', role: 'Sets x directly; coefficients cᵢ = vᵢᵀx are read back into the sliders.' },
    { name: '▶ orbit x', range: 'θ += 0.012 rad/frame', role: 'Animates x = cos θ·v₁ + sin θ·v₂ (+ fixed c₃v₃) around the unit circle while Ax = σ₁cos θ·u₁ + σ₂sin θ·u₂ traces the image ellipse; color-matched dots mark corresponding points.' },
    { name: 'drag (3D panes)', range: 'pitch −1.35 … 1.45 rad', role: 'Rotates the orthographic view (yaw/pitch) of ℝ³.' },
  ],

  refs: (
    <>
      Strang G, <i>The Fundamental Theorem of Linear Algebra</i>, American Mathematical Monthly 100(9), 1993 ·
      Strang G, <i>Introduction to Linear Algebra</i>, Wellesley-Cambridge ·
      Trefethen LN &amp; Bau D, <i>Numerical Linear Algebra</i>, SIAM 1997 (lectures 4–5) ·
      Eckart C &amp; Young G, <i>The approximation of one matrix by another of lower rank</i>, Psychometrika 1, 1936 ·
      Cunningham JP &amp; Yu BM, <i>Dimensionality reduction for large-scale neural recordings</i>, Nat Neurosci 17, 2014.
    </>
  ),
}
