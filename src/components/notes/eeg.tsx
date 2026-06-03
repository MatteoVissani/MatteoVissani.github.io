import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const eeg: DemoNote = {
  title: 'EEG source localization & spatial mixing',
  theme: 'Neurotechnology',
  tagline: 'From the dipole forward model and volume conduction to a matching-pursuit inverse.',

  foundations: (
    <>
      <p>
        Scalp EEG does not see neurons directly; it sees the <b>potential</b> their currents set up after spreading
        through the head — <b>volume conduction</b>. A small patch of synchronous cortex behaves as a current
        <b> dipole</b>, and its potential reaches <i>every</i> electrode, weighted by geometry. Stacking the
        electrode-by-source weights into a matrix <T>{r`\mathbf L`}</T> (the <b>lead field</b>) gives the linear
        <b> forward model</b>:
      </p>
      <TB>{r`\mathbf y = \mathbf L\,\mathbf m + \text{noise},`}</TB>
      <p>
        where <T>{r`\mathbf m`}</T> are the source moments and <T>{r`\mathbf y`}</T> the measurements. The <b>inverse problem</b> —
        recover <T>{r`\mathbf m`}</T> from <T>{r`\mathbf y`}</T> — is <b>ill-posed</b>: there are far more candidate sources than electrodes,
        so many source configurations explain the same scalp map. Extra assumptions (here: few point dipoles) are
        required. The demo uses an illustrative 2-D head with a 19-channel 10–20 montage.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Dipole potential (forward)',
      tex: r`V(q;s) = \frac{\cos(\theta)\,\Delta x + \sin(\theta)\,\Delta y}{\Delta x^2 + \Delta y^2 + \varepsilon}`,
      note: <p>A 2-D dipole at <T>{r`(x,y)`}</T> with orientation <T>{r`\theta`}</T> produces, at sensor <T>{r`q`}</T>, a potential that falls with distance and projects onto the moment direction. <T>{r`\varepsilon=0.0035`}</T> regularizes the singularity.</p>,
    },
    {
      title: 'Superpose + add noise',
      tex: r`y_i = \sum_{\text{sources}} V(\text{elec}_i;s) + \text{noise}\cdot\xi_i`,
      note: <p>Linearity ⇒ the measurement at each electrode is the sum over sources. Every source touches every electrode — that mixing is volume conduction.</p>,
    },
    {
      title: 'Interpolate the topomap',
      tex: r`\hat y(q) = \frac{\sum_i w_i\,y_i}{\sum_i w_i},\quad w_i = \frac{1}{d_i^2+0.02}`,
      note: <p>The scalp map is Shepard inverse-distance interpolation of the 19 electrode values onto a 120×120 grid, quantized to 12 colour bands.</p>,
    },
    {
      title: 'Fit one dipole (least squares)',
      tex: r`\hat{\mathbf m}(g) = \big(\mathbf L_g^\top\mathbf L_g\big)^{-1}\mathbf L_g^\top\,\mathbf r`,
      note: <p>At a candidate location <T>{r`g`}</T> the moment is linear, so the best <T>{r`(m_0,m_1)`}</T> solves a 2×2 normal-equation system from the two lead-field columns <T>{r`\Delta x/r^2,\ \Delta y/r^2`}</T>, against the residual <T>{r`\mathbf r`}</T>.</p>,
    },
    {
      title: 'Search the location',
      tex: r`\hat g = \argmin_g \sum_i\Big(r_i - \tfrac{\Delta x\,\hat m_0 + \Delta y\,\hat m_1}{r^2}\Big)^2`,
      note: <p>Scan <T>{r`g`}</T> on a grid (step 0.05, inside the cortex), keep the location with the smallest residual.</p>,
    },
    {
      title: 'Matching pursuit (K dipoles)',
      tex: r`\mathbf r \leftarrow \mathbf r - \mathbf L_{\hat g}\hat{\mathbf m}(\hat g),\ \text{repeat } K\times`,
      note: <p>Subtract the fitted dipole's field from the residual and refit — greedy matching pursuit. With too few dipoles the fit lands between true sources (large error); matching the count snaps the cyan rings onto the red sources, when they are well separated. Reported error = mean distance from each source to its nearest fit, scaled to mm.</p>,
    },
  ],

  deep: [
    {
      heading: 'The least-squares moment at a fixed location',
      body: (
        <>
          <p>Fix a candidate dipole position <T>{r`g`}</T>. The potential it produces at electrode <T>{r`i`}</T> is linear in the moment <T>{r`\mathbf m=(m_0,m_1)`}</T>: <T>{r`V_i = \mathbf a_i^\top\mathbf m`}</T> with lead-field row <T>{r`\mathbf a_i = (\Delta x_i, \Delta y_i)/r_i^2`}</T>. Stacking the electrodes into <T>{r`\mathbf L_g`}</T>, the best-fitting moment minimizes <T>{r`\lVert \mathbf r - \mathbf L_g\mathbf m\rVert^2`}</T> and solves the normal equations</p>
          <TB>{r`\mathbf L_g^\top\mathbf L_g\,\hat{\mathbf m} = \mathbf L_g^\top\mathbf r \;\Longrightarrow\; \hat{\mathbf m} = (\mathbf L_g^\top\mathbf L_g)^{-1}\mathbf L_g^\top\mathbf r.`}</TB>
          <p>This is the <T>{r`2\times 2`}</T> system the demo solves at every grid point: the position is nonlinear and must be searched, but the moment given the position is a closed-form linear solve. The residual at the best position is what the location search minimizes.</p>
        </>
      ),
    },
    {
      heading: 'Why the inverse is ill-posed',
      body: (
        <>
          <p>The forward map <T>{r`\mathbf y = \mathbf L\mathbf m`}</T> sends a high-dimensional source space to only <T>{r`N=19`}</T> measurements, so <T>{r`\mathbf L`}</T> has a large null space: many source configurations <T>{r`\mathbf m + \mathbf m_0`}</T> with <T>{r`\mathbf L\mathbf m_0 = 0`}</T> produce identical scalp data. Even within the measurable subspace, the singular values of <T>{r`\mathbf L`}</T> decay quickly, so small measurement noise is amplified enormously in any naive inverse. Uniqueness is recovered only by adding constraints — here, the strong prior that the source is a small number of point dipoles. This is why the demo asks you to choose the number of fit dipoles, and why deep or numerous sources, or added noise, destabilize the estimate.</p>
        </>
      ),
    },
    {
      heading: 'Matching pursuit as a greedy sparse solver',
      body: (
        <>
          <p>Fitting <T>{r`K`}</T> dipoles jointly is a nonconvex search over <T>{r`K`}</T> positions. <b>Matching pursuit</b> approximates it greedily: place the single dipole that best explains the current residual, subtract its field, and repeat on what remains. Each pass is the cheap one-dipole solve above. The approach is exact when the true sources are well separated (their fields are nearly orthogonal over the sensors) and degrades when they overlap — which is exactly the failure the demo shows when two sources are dragged close together or placed deep, where their scalp patterns become nearly collinear and the greedy choice is ambiguous.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: depth and localizability',
      body: (
        <>
          <p>The model maps the disc radius to depth by <T>{r`d = (1-\lVert\text{pos}\rVert)\cdot 85`}</T> mm. A shallow source at radius <T>{r`0.45`}</T> therefore sits</p>
          <TB>{r`d = (1 - 0.45)\times 85 = 46.8\ \text{mm}`}</TB>
          <p>below the scalp, producing a focal topography that the single-dipole fit localizes to within a few millimetres. A deep source at radius <T>{r`0.2`}</T> lies at <T>{r`d=(1-0.2)\times85=68`}</T> mm: its scalp pattern is broad and low-amplitude, the lead-field columns of nearby positions become nearly collinear, and the localization error grows from millimetres to centimetres even at the correct model order. This is the practical signature of the inverse problem's ill-conditioning.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Dipole spreading to scalp electrodes">
      <circle cx="180" cy="100" r="80" fill="rgba(155,140,255,0.05)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      {/* electrodes */}
      {[[-1, 0], [-0.7, 0.7], [0, 1], [0.7, 0.7], [1, 0], [0.7, -0.7], [0, -1], [-0.7, -0.7]].map(([dx, dy], i) => (
        <circle key={i} cx={180 + dx * 80} cy={100 - dy * 80} r="4" fill="#e9ebfb" />
      ))}
      {/* dipole */}
      <circle cx="210" cy="70" r="7" fill="#ff4d6d" />
      <line x1="210" y1="70" x2="226" y2="56" stroke="#fff" strokeWidth="2" />
      {/* spreading field */}
      {[20, 36, 52].map((rr, i) => <circle key={i} cx="210" cy="70" r={rr} fill="none" stroke="rgba(255,77,109,0.4)" strokeWidth="1" />)}
      <text x="100" y="196" fill="#ff4d6d" fontSize="11" fontFamily="monospace">dipole → all electrodes</text>
      {/* arrow */}
      <line x1="280" y1="100" x2="330" y2="100" stroke="#22e1ff" strokeWidth="2" />
      <text x="360" y="70" fill="#22e1ff" fontSize="11" fontFamily="monospace">y = L m + noise</text>
      <text x="360" y="120" fill="#9b8cff" fontSize="11" fontFamily="monospace">inverse: fit m̂, ĝ</text>
      <text x="360" y="138" fill="#9b8cff" fontSize="10" fontFamily="monospace">(ill-posed)</text>
    </svg>
  ),

  numerics: (
    <p>
      19 electrodes (10–20). The inverse scans <T>{r`g_x,g_y\in[-0.85,0.85]`}</T> (step 0.05), skipping points with
      <T>{r`g_x^2+g_y^2>0.73`}</T>, solving the 2×2 normal equations at each and peeling off <T>{r`K`}</T> dipoles in sequence. The
      localization error is scaled by 85 to read in mm; the depth chip reports <T>{r`(1-\lVert\text{pos}\rVert)\cdot85`}</T> mm.
    </p>
  ),

  pseudocode: `
# ---- forward model ----
for each electrode i:
    y[i] ← noise·xi_i
    for each source s = (x, y, ori):
        dx ← elec_i.x − x ;  dy ← elec_i.y − y
        y[i] += (cos(ori)·dx + sin(ori)·dy) / (dx² + dy² + eps)

# ---- inverse: matching pursuit, K dipoles ----
resid ← y
for step in 1 .. K:
    best ← +inf
    for g = (gx, gy) on grid, inside cortex:
        # lead field a_i = (dx, dy)/r²;  solve 2×2 normal equations for moment (p0,p1)
        (p0, p1) ← argmin_m  sum_i ( resid[i] − (dx·m0 + dy·m1)/r² )²
        res      ← that minimum residual
        if res < best:  best ← res ;  keep (g, p0, p1)
    add dipole at best
    resid ← resid − field(best, p0, p1)               # peel off
`,
  params: [
    { name: 'drag dipoles', range: 'on the head panel', role: 'move each source (x, y)' },
    { name: 'add / remove', range: 'buttons', role: 'change the number of true sources' },
    { name: 'orientation', range: '0–360° (5)', role: 'moment direction of the selected dipole' },
    { name: 'sensor noise', range: '0–0.5 (0.01, 0.08)', role: 'additive measurement noise' },
    { name: 'fit dipoles', range: '1–4', role: 'model order K of the inverse' },
  ],

  refs: <>Hämäläinen et al., <i>Rev. Mod. Phys.</i> 65 (1993) 413; Grech et al., <i>J. NeuroEng. Rehabil.</i> 5 (2008) 25; Michel et al., <i>Clin. Neurophysiol.</i> 115 (2004) 2195.</>,
}
