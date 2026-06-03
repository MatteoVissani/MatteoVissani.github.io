import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const spikePhase: DemoNote = {
  title: 'Spike–phase coupling (teaching demo)',
  theme: 'Neural coding & information',
  tagline: 'From a phase-modulated point process to the phase-locking value as a unit resultant.',

  foundations: (
    <>
      <p>
        A spike train is a <b>point process</b>: a list of times, well described as <b>Poisson</b> when the
        instantaneous rate <T>{r`\lambda(t)`}</T> is given (probability of a spike in <T>{r`dt`}</T> is <T>{r`\lambda\,dt`}</T>).
        Phase coupling means that rate is not constant but rides on the <b>phase</b> <T>{r`\phi=2\pi f t`}</T> of an
        ongoing oscillation. The natural way to put a bump of preferred phase on a circle is the <b>von Mises</b>
        distribution (the circular analogue of a Gaussian), whose shape parameter <T>{r`\kappa`}</T> is the
        concentration:
      </p>
      <TB>{r`\lambda(\phi) = r_0\,\exp\!\big(\kappa[\cos(\phi-\phi_{\text{pref}})-1]\big).`}</TB>
      <p>
        To summarize how tightly spikes cluster in phase, treat each spike phase as a <b>unit vector</b>
        <T>{r`e^{i\phi_k}`}</T> on the circle and average them. If phases are scattered the vectors cancel; if they
        align the average is long. Its length is the <b>phase-locking value</b> (PLV) and its angle is the
        preferred phase.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Poisson with a rate',
      tex: r`\Pr[\text{spike in }dt] = \lambda(t)\,dt`,
      note: <p>Discretize time at <T>{r`\Delta t=1`}</T> ms and emit a spike when a uniform draw <T>{r`U(0,1)`}</T> falls below <T>{r`\lambda\,\Delta t`}</T> — exact Bernoulli thinning of an inhomogeneous Poisson process.</p>,
    },
    {
      title: 'Phase modulation (von Mises)',
      tex: r`\lambda(\phi) = r_0\,e^{\kappa[\cos(\phi-\phi_{\text{pref}})-1]}\in(0,r_0]`,
      note: <p>The <T>{r`-1`}</T> in the exponent pins the peak rate at exactly <T>{r`r_0`}</T>, so the <T>{r`\kappa`}</T> slider changes the <i>shape</i> of the modulation, not the mean rate. <T>{r`\phi_{\text{pref}}=2\pi f\cdot\text{offset}`}</T>.</p>,
    },
    {
      title: 'Phases as unit vectors',
      tex: r`z_k = e^{i\phi_k} = \cos\phi_k + i\sin\phi_k`,
      note: <p>A phase is a circular variable: <T>{r`\phi`}</T> and <T>{r`\phi+2\pi`}</T> are identical, so an ordinary arithmetic mean of the angles is ill-defined (it depends on where the branch cut is placed). Mapping each spike phase to the unit vector <T>{r`e^{i\phi_k}\in\mathbb C`}</T> removes this ambiguity: vector addition respects the wrap-around, so a meaningful average can be formed. Tight clustering of the <T>{r`\phi_k`}</T> produces aligned vectors; a uniform spread produces vectors that cancel.</p>,
    },
    {
      title: 'The mean resultant vector',
      tex: r`\bar z = \tfrac1n\sum_{k=1}^n e^{i\phi_k},\qquad |\bar z|^2 = \frac{1}{n^2}\sum_{j,k}\cos(\phi_j-\phi_k)`,
      note: <p>The vector mean <T>{r`\bar z`}</T> has length <T>{r`R=|\bar z|\in[0,1]`}</T> (the mean resultant length) and angle equal to the circular mean of the phases. Expanding the squared modulus, <T>{r`|\bar z|^2`}</T> is the average cosine of the angle between all spike-phase pairs — so the resultant length is, equivalently, a measure of pairwise phase alignment. Uniform phases give <T>{r`R\approx 0`}</T>; identical phases give <T>{r`R=1`}</T>.</p>,
    },
    {
      title: 'PLV and preferred phase',
      tex: r`\text{PLV} = |\bar z| = \frac{\sqrt{(\sum\cos\phi_k)^2+(\sum\sin\phi_k)^2}}{n},\quad \phi_{\text{pref}} = \arg\bar z`,
      note: <p>The length <T>{r`\in[0,1]`}</T> is the PLV (1 = perfect locking, 0 = none); the angle is the preferred phase. The cyan arrow in the polar plot <i>is</i> <T>{r`\bar z`}</T>, drawn at length PLV.</p>,
    },
    {
      title: 'Why a caveat',
      tex: r`\mathbb E[\text{PLV}^2] = \tfrac1n\ \text{for uniform phases}`,
      note: <p>With few spikes the PLV is biased upward — a low-rate unit can look coupled by chance. The spike–phase coupling <b>toolkit</b> on this page replaces PLV with the bias-corrected PPC; see its notes.</p>,
    },
  ],

  deep: [
    {
      heading: 'The von Mises distribution and the concentration κ',
      body: (
        <>
          <p>The circular analogue of the Gaussian is the <b>von Mises</b> density</p>
          <TB>{r`p(\phi) = \frac{1}{2\pi I_0(\kappa)}\,e^{\kappa\cos(\phi-\mu)},`}</TB>
          <p>with mean direction <T>{r`\mu`}</T>, concentration <T>{r`\kappa`}</T>, and <T>{r`I_0`}</T> the modified Bessel function of order zero (the normalizer). As <T>{r`\kappa\to 0`}</T> it tends to the uniform distribution on the circle; as <T>{r`\kappa\to\infty`}</T> it tends to a Gaussian of variance <T>{r`1/\kappa`}</T> about <T>{r`\mu`}</T>. The firing-rate kernel in the model, <T>{r`\lambda(\phi)\propto e^{\kappa\cos(\phi-\phi_{\text{pref}})}`}</T>, has exactly this angular shape, so the spike phases are von Mises distributed.</p>
          <p>For a von Mises sample the expected mean resultant length is</p>
          <TB>{r`\mathbb E[R] = \frac{I_1(\kappa)}{I_0(\kappa)},`}</TB>
          <p>which is the population PLV the demo approaches as the buffer fills. It increases monotonically from 0 (at <T>{r`\kappa=0`}</T>) toward 1, so the PLV slider and the coupling slider track each other.</p>
        </>
      ),
    },
    {
      heading: 'Why the PLV is biased, and the fix',
      body: (
        <>
          <p>For <T>{r`n`}</T> independent phases drawn uniformly (no coupling) the resultant length does not vanish; its second moment is</p>
          <TB>{r`\mathbb E\big[\text{PLV}^2\big] = \frac{1}{n}.`}</TB>
          <p>Thus a unit with few spikes reports an apparent PLV of order <T>{r`1/\sqrt n`}</T> even when uncoupled, and comparisons between conditions with different firing rates are confounded. The <b>pairwise phase consistency</b> removes this floor exactly,</p>
          <TB>{r`\text{PPC} = \frac{n}{n-1}\Big(\text{PLV}^2 - \tfrac1n\Big),`}</TB>
          <p>so that <T>{r`\mathbb E[\text{PPC}] = 0`}</T> under the null and <T>{r`\mathbb E[\text{PPC}] = R^2`}</T> under coupling, independent of <T>{r`n`}</T>. This is the estimator used in the spike–phase coupling toolkit on the same site.</p>
        </>
      ),
    },
    {
      heading: 'Testing for coupling: the Rayleigh test',
      body: (
        <>
          <p>The natural null hypothesis is a uniform phase distribution. The <b>Rayleigh test</b> rejects it for large resultant length: with statistic <T>{r`Z = n R^2`}</T>, the p-value is approximately <T>{r`p \approx e^{-Z}`}</T> for moderate <T>{r`n`}</T>, so coupling is significant at the 5% level once <T>{r`Z \gtrsim 3`}</T>. The preferred phase is meaningful only when this test passes; the time-resolved analysis in the toolkit replaces the parametric test with a permutation null for robustness.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: coupling strength to PLV',
      body: (
        <>
          <p>Take a concentration <T>{r`\kappa=2`}</T>. A well-sampled unit then has expected mean resultant length</p>
          <TB>{r`\mathbb E[R] = \frac{I_1(2)}{I_0(2)} = \frac{1.5906}{2.2796} \approx 0.70,`}</TB>
          <p>so its spikes fill about <T>{r`70\%`}</T> of one phase and the cyan mean vector reaches <T>{r`0.70`}</T> of the circle radius. Raising the slider to <T>{r`\kappa=4`}</T> gives <T>{r`I_1(4)/I_0(4)=9.76/11.30\approx 0.86`}</T>; lowering it to <T>{r`\kappa=0.5`}</T> gives <T>{r`\approx 0.24`}</T>. The PLV read-out tracks these values once enough spikes have accumulated.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Oscillation phase modulating a spike train, summarized on a circle">
      <defs><marker id="sparr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#9b8cff" /></marker></defs>
      {/* sine */}
      <path d="M20,70 C60,20 100,120 140,70 C180,20 220,120 260,70" fill="none" stroke="#9b8cff" strokeWidth="2" />
      <text x="20" y="36" fill="#9b8cff" fontSize="11" fontFamily="monospace">oscillation φ=2πft</text>
      {/* spikes preferentially at troughs */}
      {[52, 96, 140, 184, 228].map((x, i) => (
        <line key={i} x1={x} y1="150" x2={x} y2="120" stroke="#ff2d8f" strokeWidth="2" />
      ))}
      <text x="20" y="168" fill="#ff2d8f" fontSize="11" fontFamily="monospace">spikes (rate ∝ e<tspan dy="-4" fontSize="8">κcosφ</tspan><tspan dy="4">)</tspan></text>
      <line x1="285" y1="100" x2="340" y2="100" stroke="#9b8cff" strokeWidth="2" markerEnd="url(#sparr)" />
      {/* circle with resultant */}
      <circle cx="430" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" />
      {[20, 35, 50, 60, 75].map((d, i) => { const a = (d - 50) * Math.PI / 60; return <circle key={i} cx={430 + 58 * Math.cos(a)} cy={100 - 58 * Math.sin(a)} r="3" fill="#ff2d8f" /> })}
      <line x1="430" y1="100" x2={430 + 42 * Math.cos(0.2)} y2={100 - 42 * Math.sin(0.2)} stroke="#22e1ff" strokeWidth="3" markerEnd="url(#sparr)" />
      <text x="430" y="178" textAnchor="middle" fill="#22e1ff" fontSize="11" fontFamily="monospace">resultant z̄ (len = PLV)</text>
    </svg>
  ),

  numerics: (
    <p>
      Steps at <T>{r`\Delta t=1`}</T> ms over a 1.2 s window (1200 samples), 16 substeps per frame. On each
      substep the field value <T>{r`\sin(2\pi f t)`}</T> is stored, a spike is drawn by thinning, and on a spike the
      wrapped phase enters a buffer of the last 180 spike phases. The polar plot bins those into 18 sectors and
      draws the mean vector; PLV and preferred phase refresh every 300 ms.
    </p>
  ),

  pseudocode: `
# dt = 1 ms ;  phi_pref = 2*pi*f*offset
phases ← [ ]
for each step:
    phi ← 2*pi*f*t
    m   ← exp(kappa·(cos(phi − phi_pref) − 1))        # von Mises kernel, in (0,1]
    if rand() < rate·m·dt:                            # inhomogeneous Poisson
        append (phi mod 2*pi) to phases               # keep last 180

# Phase-locking value and preferred phase
sx ← sum(cos(phases)) ;  sy ← sum(sin(phases)) ;  n ← len(phases)
PLV  ← sqrt(sx² + sy²) / n
pref ← atan2(sy, sx)
`,
  params: [
    { name: 'frequency', range: '2–40 Hz (1, 7)', role: 'field-oscillation frequency (δ at 2 Hz to γ at 40 Hz)' },
    { name: 'κ', range: '0–5 (0.1, 2.2)', role: 'von Mises concentration; coupling strength' },
    { name: 'phase offset', range: '0–40 ms (1, 0)', role: 'sets φ_pref = 2πf·offset' },
    { name: 'firing rate', range: '5–80 Hz (1, 35)', role: 'mean rate r₀' },
  ],

  refs: <>Lachaux et al., <i>Hum. Brain Mapp.</i> 8 (1999) 194; Fisher, <i>Statistical Analysis of Circular Data</i> (1993).</>,
}
