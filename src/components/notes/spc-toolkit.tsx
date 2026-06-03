import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const spcToolkit: DemoNote = {
  title: 'Spike–phase coupling toolkit',
  theme: 'Toolkit',
  tagline: 'From the analytic-signal phase to the bias-corrected PPC and a permutation null.',

  foundations: (
    <>
      <p>
        This is a browser port of the analysis pipeline in <i>code_SPC_ECoG_STN_Speech</i> (Vissani et al., 2025). The
        scientific question: do a single unit's spikes lock to the <b>phase</b> of a field potential, and when? Three
        ideas carry it. First, the instantaneous phase of a real signal is read off its <b>analytic signal</b> via the
        Hilbert transform. Second, locking is summarized by a <b>resultant</b> of spike-phase unit vectors — but the
        phase-locking value is biased, so we use the unbiased <b>pairwise phase consistency</b> (PPC). Third,
        significance is established non-parametrically by a <b>permutation null</b>, and the firing-rate confound is
        removed by a <b>constant-spike-count window</b>.
      </p>
      <TB>{r`\text{PLV} = \Big|\tfrac1n\sum_k e^{i\phi_k}\Big|,\qquad \text{PPC} = \frac{n}{n-1}\Big(\text{PLV}^2 - \tfrac1n\Big).`}</TB>
    </>
  ),

  derivation: [
    {
      title: 'Instantaneous phase (Hilbert)',
      tex: r`\phi(t) = \arg\!\big(x(t) + i\,\mathcal H\{x\}(t)\big)`,
      note: <p>The analytic signal is built by FFT — zero the negative frequencies, double the positive ones, inverse FFT — and its argument is the instantaneous phase of the LFP <T>{r`x(t)=\sin(2\pi ft+\phi_0)+0.25\xi`}</T>.</p>,
    },
    {
      title: 'Generate coupled spikes',
      tex: r`\Pr[\text{spike}] = \frac{r_0}{F_s}\big(1 + \kappa\cos(\phi - \phi_{\text{target}})\big),\quad \kappa = \frac{\text{ES}-1}{\text{ES}+1}`,
      note: <p>Inside the coupling window the baseline probability is modulated by phase. The coupling strength <T>{r`c`}</T> enters through an effect size <T>{r`\text{ES}=\tfrac{1+2\sqrt c}{1-2\sqrt c}`}</T>, a monotone reparametrization.</p>,
    },
    {
      title: 'The PLV is biased',
      tex: r`\mathbb E[\text{PLV}^2] = \frac1n\quad\text{(uniform phases)}`,
      note: <p>With finitely many spikes, random phases yield a non-zero expected <T>{r`\text{PLV}^2`}</T> equal to <T>{r`1/n`}</T>. A low-rate unit therefore looks coupled even when it is not — the bias depends on the spike count <T>{r`n`}</T>.</p>,
    },
    {
      title: 'Pairwise phase consistency',
      tex: r`\text{PPC} = \frac{2}{n(n-1)}\sum_{j<k}\cos(\phi_j-\phi_k) = \frac{n}{n-1}\Big(\text{PLV}^2-\tfrac1n\Big)`,
      note: <p>Average the cosine of the angle between all distinct spike-phase <i>pairs</i> (Vinck 2010). The right-hand identity shows it subtracts exactly the <T>{r`1/n`}</T> floor, giving an <b>unbiased</b>, count-independent estimator — comparable across conditions with different firing rates.</p>,
    },
    {
      title: 'Constant-spike-count window',
      tex: r`\text{target} = \max(40,\ \lfloor 0.1\,N_{\text{spk}}\rceil)`,
      note: <p>For time-resolved coupling, each of 40 centres uses the <i>target</i> spikes nearest in time, so every estimate rests on the same <T>{r`n`}</T> — eliminating the rate confound across time (Fischer's first-crossing half-width).</p>,
    },
    {
      title: 'Permutation null',
      tex: r`\text{PPC}_{\text{real}} > \text{percentile}_{95}\{\text{PPC}_{\text{shuffled}}\}`,
      note: <p>Each selected spike is re-paired with the phase from a <i>random trial</i> at the mirrored time index (40 permutations, seeded RNG). A centre is significant when its real PPC exceeds the 95th percentile of this null — drawn green on the time-resolved panel.</p>,
    },
    {
      title: 'Confidence interval of preferred phase',
      tex: r`\delta = \arccos(t/R_n),\quad R_n = n\,r,\ c_2 = \chi^2_{1,0.95}=3.841`,
      note: <p>From CircStat's <i>circ_confmean</i> (Zar 26.24/26.25): for <T>{r`r<0.9`}</T>, <T>{r`t=\sqrt{\tfrac{2n(2R_n^2-nc_2)}{4n-c_2}}`}</T>; for <T>{r`r\ge0.9`}</T>, <T>{r`t=\sqrt{n^2-(n^2-R_n^2)e^{c_2/n}}`}</T>. Drawn as the arc outside the polar plot.</p>,
    },
  ],

  deep: [
    {
      heading: 'Instantaneous phase from the analytic signal',
      body: (
        <>
          <p>For a real narrowband signal <T>{r`x(t)`}</T>, the instantaneous phase is defined through the <b>analytic signal</b> <T>{r`x_a(t) = x(t) + i\,\mathcal H\{x\}(t)`}</T>, where <T>{r`\mathcal H`}</T> is the Hilbert transform — the filter that shifts every frequency component by <T>{r`-90^\circ`}</T>. In the frequency domain this is implemented exactly as the code does: take the FFT, zero the negative-frequency bins, double the positive ones, and invert. The phase is then <T>{r`\phi(t) = \arg x_a(t)`}</T> and the amplitude envelope is <T>{r`|x_a(t)|`}</T>. For a pure cosine this returns the expected linear phase ramp; for the simulated LFP it tracks the oscillation cycle that the spikes lock to.</p>
        </>
      ),
    },
    {
      heading: 'PPC as an unbiased pairwise estimator',
      body: (
        <>
          <p>Define the consistency as the average cosine of the angle between all distinct pairs of spike phases,</p>
          <TB>{r`\text{PPC} = \frac{2}{n(n-1)}\sum_{j<k}\cos(\phi_j-\phi_k).`}</TB>
          <p>Expanding <T>{r`\cos(\phi_j-\phi_k) = \cos\phi_j\cos\phi_k + \sin\phi_j\sin\phi_k`}</T> and relating the double sum to the squared resultant gives the computational identity used in the toolkit,</p>
          <TB>{r`\text{PPC} = \frac{n}{n-1}\Big(\text{PLV}^2 - \tfrac1n\Big).`}</TB>
          <p>Because each pair is computed from two independent spikes, the estimator has expectation <T>{r`R^2`}</T> (the squared true coupling) regardless of <T>{r`n`}</T>; under the null of uniform phases its expectation is exactly zero. This rate-independence is essential when comparing units or conditions with different spike counts, the situation throughout the speech recordings the library was written for.</p>
        </>
      ),
    },
    {
      heading: 'Constant-spike-count windows and the permutation null',
      body: (
        <>
          <p>Even with PPC, a sliding fixed-<i>time</i> window mixes a varying number of spikes across the trial, reintroducing a rate confound in the variance of the estimate. The pipeline instead uses a constant-spike-<i>count</i> window: at each of 40 time centres it collects the <T>{r`\text{target}=\max(40,\lfloor 0.1 N_{\text{spk}}\rceil)`}</T> spikes nearest in time (the first-crossing half-width), so every PPC value rests on the same <T>{r`n`}</T>. Significance is assessed non-parametrically: each selected spike is re-paired with the phase taken from a <i>random trial</i> at the mirrored time index, breaking any true coupling while preserving the marginal phase distribution; repeating this 40 times builds a null, and a centre is significant when its real PPC exceeds the null’s 95th percentile. The preferred-phase overlay is drawn only at those significant centres.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: the coupling parametrization and the bias floor',
      body: (
        <>
          <p>The effect-size parametrization simplifies algebraically. With <T>{r`\text{ES} = (1+2\sqrt c)/(1-2\sqrt c)`}</T>,</p>
          <TB>{r`\kappa = \frac{\text{ES}-1}{\text{ES}+1} = \frac{4\sqrt c/(1-2\sqrt c)}{2/(1-2\sqrt c)} = 2\sqrt c,`}</TB>
          <p>so the modulation depth is simply <T>{r`\kappa = 2\sqrt c`}</T>; at <T>{r`c=0.1`}</T> the in-window rate varies by <T>{r`\pm\kappa = \pm 0.63`}</T> about baseline. On the bias side, a window holding <T>{r`n=40`}</T> spikes from an uncoupled unit yields an expected <T>{r`\text{PLV}^2 = 1/40 = 0.025`}</T> — a spurious PLV of <T>{r`\approx 0.16`}</T> — whereas the PPC has expectation exactly zero, which is why the time-resolved panel uses PPC against a permutation null rather than the raw PLV.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Spike-phase coupling pipeline">
      <defs><marker id="spcarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker></defs>
      {/* lfp */}
      <path d="M16,50 C40,20 64,80 88,50 C112,20 136,80 160,50" fill="none" stroke="#22e1ff" strokeWidth="2" />
      <text x="16" y="30" fill="#22e1ff" fontSize="10" fontFamily="monospace">LFP x(t)</text>
      {/* spikes */}
      {[40, 70, 112, 150].map((x, i) => <line key={i} x1={x} y1="100" x2={x} y2="78" stroke="#ff2d8f" strokeWidth="2" />)}
      <text x="16" y="118" fill="#ff2d8f" fontSize="10" fontFamily="monospace">spikes</text>
      <line x1="170" y1="70" x2="206" y2="70" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#spcarr)" />
      {/* hilbert box */}
      <rect x="210" y="50" width="74" height="40" rx="6" fill="none" stroke="#9b8cff" strokeWidth="2" />
      <text x="247" y="66" textAnchor="middle" fill="#9b8cff" fontSize="9" fontFamily="monospace">Hilbert</text>
      <text x="247" y="80" textAnchor="middle" fill="#9b8cff" fontSize="9" fontFamily="monospace">φ(t)</text>
      <line x1="284" y1="70" x2="318" y2="70" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#spcarr)" />
      {/* circle */}
      <circle cx="360" cy="70" r="34" fill="none" stroke="rgba(255,255,255,0.25)" />
      {[0.2, 0.5, 0.8, 1.0].map((d, i) => <circle key={i} cx={360 + 32 * Math.cos(d)} cy={70 - 32 * Math.sin(d)} r="2.6" fill="#ff2d8f" />)}
      <line x1="360" y1="70" x2={360 + 24 * Math.cos(0.6)} y2={70 - 24 * Math.sin(0.6)} stroke="#22e1ff" strokeWidth="2.4" />
      <line x1="404" y1="70" x2="438" y2="70" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#spcarr)" />
      <rect x="442" y="50" width="64" height="40" rx="6" fill="none" stroke="#54e6a0" strokeWidth="2" />
      <text x="474" y="66" textAnchor="middle" fill="#54e6a0" fontSize="9" fontFamily="monospace">PPC</text>
      <text x="474" y="80" textAnchor="middle" fill="#54e6a0" fontSize="9" fontFamily="monospace">+ perm</text>
      {/* bottom: time-resolved */}
      <path d="M20,170 C80,168 120,150 160,130 C200,150 260,168 320,170" fill="none" stroke="#22e1ff" strokeWidth="2" />
      <line x1="20" y1="150" x2="320" y2="150" stroke="#ffc24d" strokeWidth="1" strokeDasharray="4 3" />
      <text x="330" y="146" fill="#ffc24d" fontSize="9" fontFamily="monospace">95% null</text>
      <text x="120" y="190" fill="#22e1ff" fontSize="10" fontFamily="monospace">time-resolved PPC; green where significant</text>
    </svg>
  ),

  numerics: (
    <p>
      <T>{r`F_s=500`}</T> Hz, 2 s (<T>{r`N=1000`}</T>), per-trial random offset <T>{r`\phi_0`}</T>. The across-trial map is a 56×22 (time×phase)
      histogram, column-normalized to show phase concentration; the preferred phase (circular mean) is overlaid only at
      significant centres. The coupling slider runs <T>{r`c\in[0,0.23]`}</T> (step 0.005). Permutations use a seeded mulberry32 RNG.
    </p>
  ),

  pseudocode: `
PPC(plv, n) = n/(n−1) · (plv² − 1/n)                   # Vinck 2010

# ---- generate one trial (Fs = 500, dur = 2 s) ----
x   ← sin(2*pi*f*t + phi0) + 0.25·gauss
phi ← angle( hilbert(x) )                              # FFT analytic signal
kappa ← (ES−1)/(ES+1),  ES = (1+2√c)/(1−2√c)           # = 2√c
for each sample:
    p ← r0/Fs
    if t in coupling window:  p *= (1 + kappa·cos(phi − phi_target))
    spike if rand() < p

# ---- overall coupling ----
plv ← | mean( exp(i·phi[spikes]) ) | ;  ppc ← PPC(plv, n)

# ---- time-resolved (constant spike-count window + permutation null) ----
target ← max(40, round(0.1·N_spikes))
for each of 40 time centers:
    sel  ← the (target) spikes nearest in time
    real ← PPC(plv(sel), target)
    null ← [ PPC of sel re-paired with phase from a random trial | 40 perms ]
    significant if real > percentile(null, 95)
`,
  params: [
    { name: 'coupling c', range: '0–0.23 (0.005)', role: 'coupling strength via the effect-size κ' },
    { name: 'φ_target', range: '—', role: 'true preferred phase' },
    { name: 'frequency', range: '—', role: 'LFP oscillation frequency f' },
    { name: 'base rate', range: '—', role: 'baseline firing rate r₀' },
    { name: 'trials', range: '—', role: 'number of trials pooled' },
    { name: 'window centre / width', range: '—', role: 'coupling window winC, winW' },
  ],

  refs: <>Vinck et al., <i>NeuroImage</i> 51 (2010) 112; Berens, <i>J. Stat. Softw.</i> 31 (2009) 1; Zar, <i>Biostatistical Analysis</i> (1999); Vissani et al., 2025.</>,
}
