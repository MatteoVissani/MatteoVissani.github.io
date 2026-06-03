import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const fourier: DemoNote = {
  title: 'Fourier epicycles',
  theme: 'Signals & time–frequency',
  tagline: 'From the Fourier series of a complex signal to a chain of rotating vectors.',

  foundations: (
    <>
      <p>
        A closed planar curve, traced once as <T>{r`t`}</T> goes <T>{r`0\to1`}</T>, is a <b>periodic</b> function of time.
        Encode each point <T>{r`(x,y)`}</T> as a single <b>complex number</b> <T>{r`z=x+iy`}</T>. The Fourier series says any
        such periodic <T>{r`z(t)`}</T> is a sum of pure rotations <T>{r`e^{i2\pi k t}`}</T> with complex weights <T>{r`c_k`}</T>:
      </p>
      <TB>{r`z(t) = \sum_{k} c_k\,e^{i2\pi k t},\qquad c_k = \int_0^1 z(t)\,e^{-i2\pi k t}\,dt.`}</TB>
      <p>
        Each term is a vector of length <T>{r`|c_k|`}</T> spinning at integer frequency <T>{r`k`}</T> (positive = counter-clockwise,
        negative = clockwise) starting at angle <T>{r`\arg c_k`}</T>. Chained tip-to-tail, the rotating vectors —
        the <b>epicycles</b> — retrace the curve. The discrete Fourier transform (DFT) computes the <T>{r`c_k`}</T> from
        samples.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Sample the curve',
      tex: r`z_n = x_n + i\,y_n,\quad n=0,\dots,N-1,\ N=220`,
      note: <p>The path is arc-length resampled to <T>{r`N=220`}</T> equally spaced points so the tracing speed is uniform, then written as complex numbers.</p>,
    },
    {
      title: 'Discrete Fourier transform',
      tex: r`c_k = \frac1N\sum_{n=0}^{N-1} z_n\,e^{-i2\pi kn/N}`,
      note: <p>The discrete analogue of the integral. Computed directly as an <T>{r`O(N^2)`}</T> double sum (exact at this size).</p>,
    },
    {
      title: 'Center the chain',
      tex: r`c_0 = \tfrac1N\sum_n z_n = \text{centroid}`,
      note: <p>The <T>{r`k=0`}</T> coefficient is the mean position; subtracting it anchors the epicycle chain at the curve's centroid.</p>,
    },
    {
      title: 'Fold the frequencies',
      tex: r`f_k = \begin{cases}k & k\le N/2\\ k-N & k>N/2\end{cases}`,
      note: <p>Indices above <T>{r`N/2`}</T> represent negative frequencies (clockwise rotation), so each coefficient becomes a signed-frequency epicycle.</p>,
    },
    {
      title: 'Reconstruct with K terms',
      tex: r`z_K(t) = \sum_{|k|\le K} c_k\,e^{i2\pi f_k t}`,
      note: <p>Coefficients are sorted by amplitude <T>{r`|c_k|`}</T>; the slider keeps the largest <T>{r`K`}</T>. Drawn tip-to-tail, each epicycle's centre is the previous tip; the pink trail is the final tip over one period.</p>,
    },
    {
      title: 'Why corners are hard',
      tex: r`\text{sharp corner} \Rightarrow \text{slow }|c_k|\text{ decay}`,
      note: <p>A high-curvature feature needs large high-frequency content. Truncating to <T>{r`K`}</T> terms low-pass-filters the curve, so corners round off and ring (the Gibbs phenomenon) — visible on the square preset.</p>,
    },
  ],

  deep: [
    {
      heading: 'From the Fourier series to rotating vectors',
      body: (
        <>
          <p>A complex-valued periodic signal <T>{r`z(t)`}</T> of period 1 has the Fourier series <T>{r`z(t) = \sum_k c_k e^{i2\pi k t}`}</T> with coefficients <T>{r`c_k = \int_0^1 z(t) e^{-i2\pi k t}\,dt`}</T>. Each term is a vector of fixed length <T>{r`|c_k|`}</T> rotating at constant angular velocity <T>{r`2\pi k`}</T> from initial angle <T>{r`\arg c_k`}</T>. Writing the partial sum as a running tip,</p>
          <TB>{r`z_K(t) = \sum_{|k|\le K} c_k e^{i2\pi k t} = c_0 + \sum_{k\ge 1}\Big(c_k e^{i2\pi k t} + c_{-k} e^{-i2\pi k t}\Big),`}</TB>
          <p>the positive and negative frequencies are counter- and clockwise circles; chaining them tip-to-tail is the epicycle animation. The DFT replaces the integral with a sum over <T>{r`N=220`}</T> samples, exact for a band-limited reconstruction of the sampled curve.</p>
        </>
      ),
    },
    {
      heading: 'Why arc-length resampling',
      body: (
        <>
          <p>The Fourier coefficients depend on the <i>parametrization</i> <T>{r`z(t)`}</T>, not only on the geometric curve. If a hand-drawn path is sampled at uneven speed, the spectrum is distorted and the animation speeds up and slows down. Re-sampling to <T>{r`N`}</T> points equally spaced in <b>arc length</b> imposes a constant-speed traversal, so the coefficients reflect the shape and the tracer moves uniformly. The centroid is removed first (it is the <T>{r`c_0`}</T> term) so the chain is anchored at the curve’s mean position.</p>
        </>
      ),
    },
    {
      heading: 'Truncation, corners and the Gibbs phenomenon',
      body: (
        <>
          <p>For a smooth curve the coefficients decay rapidly and a few terms suffice. A corner (a discontinuity in the tangent) makes <T>{r`|c_k|`}</T> decay only like <T>{r`1/k`}</T>, so many high-frequency epicycles are needed. Truncating at <T>{r`K`}</T> terms is an ideal low-pass filter of the curve, which rounds corners and produces an overshoot of fixed relative size (about 9% of the jump) that does not vanish as <T>{r`K\to\infty`}</T> — the <b>Gibbs phenomenon</b>, visible as ringing near the corners of the square preset.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: how many terms a corner needs',
      body: (
        <>
          <p>For the square, each corner is a discontinuity in the tangent, so the Fourier amplitudes decay only as <T>{r`|c_k|\sim 1/|k|`}</T>. The energy missing from a <T>{r`K`}</T>-term reconstruction is the tail</p>
          <TB>{r`\sum_{|k|>K}|c_k|^2 \sim \sum_{k>K}\frac{1}{k^2} \approx \frac{1}{K},`}</TB>
          <p>so reducing the corner error by a factor of ten requires roughly ten times as many epicycles: a smooth ellipse is captured at <T>{r`K\approx 3`}</T>, but the square needs <T>{r`K\sim 100`}</T> before its corners look crisp, and even then a fixed <T>{r`\approx 9\%`}</T> overshoot (Gibbs) persists right at each corner. The terms slider makes this decay visible.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Chain of epicycles tracing a curve">
      <circle cx="140" cy="100" r="55" fill="none" stroke="rgba(155,140,255,0.5)" strokeWidth="1.4" />
      <line x1="140" y1="100" x2="190" y2="78" stroke="#fff" strokeWidth="1.4" />
      <circle cx="190" cy="78" r="30" fill="none" stroke="rgba(155,140,255,0.5)" strokeWidth="1.2" />
      <line x1="190" y1="78" x2="214" y2="92" stroke="#fff" strokeWidth="1.2" />
      <circle cx="214" cy="92" r="16" fill="none" stroke="rgba(155,140,255,0.5)" strokeWidth="1" />
      <line x1="214" y1="92" x2="226" y2="84" stroke="#fff" strokeWidth="1" />
      <circle cx="226" cy="84" r="4" fill="#22e1ff" />
      <path d="M226,84 C300,40 330,150 380,96 C420,54 470,150 470,100" fill="none" stroke="#ff2d8f" strokeWidth="2" />
      <text x="60" y="186" fill="#9b8cff" fontSize="11" fontFamily="monospace">epicycles c<tspan dy="3" fontSize="8">k</tspan></text>
      <text x="360" y="186" fill="#ff2d8f" fontSize="11" fontFamily="monospace">trace of the tip</text>
    </svg>
  ),

  numerics: (
    <p>
      The raw (drawn or preset) path is arc-length resampled to 220 points; the centroid is removed; the DFT is the direct
      <T>{r`O(N^2)`}</T> sum. Per frame <T>{r`t`}</T> advances by <T>{r`\text{speed}/220`}</T> and the trail resets at <T>{r`t=1`}</T>. Presets:
      heart, star, square; or draw your own with the mouse.
    </p>
  ),

  pseudocode: `
pts ← arc_length_resample(path, N = 220)             # equal spacing
ctr ← mean(pts)
z   ← [ (x − ctr.x) + i·(y − ctr.y)  for (x,y) in pts ]   # complex, centred

# discrete Fourier transform (direct, O(N²))
for k in 0 .. N−1:
    c[k]    ← (1/N) · sum_n z[n]·exp(−i·2*pi·k·n/N)
    freq[k] ← k  if k ≤ N/2  else  k − N             # fold to ±
sort indices by |c[k]| descending

# animate: chain the largest K epicycles tip-to-tail
tip ← ctr
for k in first K indices:
    tip ← tip + c[k]·exp(i·2*pi·freq[k]·t)
trace tip over t in [0,1)
`,
  params: [
    { name: 'number of terms', range: '1–220 (1, 40)', role: 'epicycles kept (largest |c_k| first)' },
    { name: 'speed', range: '0.2–4× (0.1, 1)', role: 'playback rate of t' },
    { name: 'shape', range: 'heart / star / square / draw', role: 'the closed curve to decompose' },
  ],

  refs: <>Bracewell, <i>The Fourier Transform and Its Applications</i> (2000); Oppenheim &amp; Schafer, <i>Discrete-Time Signal Processing</i> (2009), ch. 8.</>,
}
