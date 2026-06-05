import { T } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const kuramoto: DemoNote = {
  title: 'The Kuramoto model — synchronization',
  theme: 'Neuronal dynamics',
  tagline: 'A population of coupled phase oscillators that spontaneously locks above a critical coupling — the toy model of neural synchrony and the target of desynchronizing stimulation.',

  foundations: (
    <>
      <p>
        Strip a self-sustained oscillator down to a single variable — its <b>phase</b> <T>{r`\theta`}</T>, advancing at a natural
        frequency <T>{r`\omega`}</T>. Couple many of them so that each is gently pulled toward the others, and a remarkable thing
        happens: despite all having different natural frequencies, above a threshold coupling they suddenly tick <i>together</i>.
        This is <b>synchronization</b>, and the Kuramoto model is its canonical description.
      </p>
      <p>
        It is the minimal model behind fireflies flashing in unison, the power grid, circadian cells — and, in the brain, the
        collective rhythms that an electrode records as an LFP or EEG. Crucially, <b>pathological</b> synchrony — the
        hypersynchronous beta of Parkinson’s disease, or a seizure — is a population locked too strongly, which is exactly what
        desynchronizing stimulation tries to undo.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Coupled phase oscillators',
      tex: r`\dot\theta_i = \omega_i + \frac{K}{N}\sum_{j=1}^{N}\sin(\theta_j-\theta_i)`,
      note: (
        <>
          Each oscillator <T>{r`i`}</T> runs at its own frequency <T>{r`\omega_i`}</T> (drawn from a distribution
          <T>{r`g(\omega)`}</T>) and is pulled toward every other by an all-to-all sinusoidal coupling of strength <T>{r`K`}</T>.
          The <T>{r`\sin`}</T> pulls a lagging oscillator forward and a leading one back, toward agreement.
        </>
      ),
    },
    {
      title: 'The order parameter',
      tex: r`r\,e^{i\psi} = \frac{1}{N}\sum_{j=1}^{N} e^{i\theta_j}`,
      note: (
        <>
          Place each phase on the unit circle and average: the resultant is a vector of length <T>{r`r\in[0,1]`}</T> at mean phase
          <T>{r`\psi`}</T>. When phases are scattered the contributions cancel and <T>{r`r\approx 0`}</T> (<b>incoherent</b>); when
          they clump, <T>{r`r\to 1`}</T> (<b>synchronized</b>). <T>{r`r`}</T> is the single number that summarizes the population —
          the white arrow in the demo.
        </>
      ),
    },
    {
      title: 'Every oscillator feels only the mean field',
      tex: r`\dot\theta_i = \omega_i + K\,r\,\sin(\psi-\theta_i)`,
      note: (
        <>
          Substituting the order parameter into the sum collapses the all-to-all coupling into a <b>mean-field</b> form: each
          oscillator is pulled toward the average phase <T>{r`\psi`}</T> with an <i>effective</i> strength <T>{r`K r`}</T>. So the
          coupling and the synchrony reinforce each other — more order makes the pull stronger, which makes more order. (It also
          makes the simulation <T>{r`O(N)`}</T> rather than <T>{r`O(N^2)`}</T>.)
        </>
      ),
    },
    {
      title: 'Locked vs drifting',
      tex: r`|\omega_i-\bar\omega| \le K r \;\Rightarrow\; \text{phase-locked}`,
      note: (
        <>
          In the rotating frame an oscillator settles to a fixed phase offset — <b>locks</b> — only if its frequency is within
          <T>{r`Kr`}</T> of the mean; faster or slower ones keep <b>drifting</b>. As <T>{r`K`}</T> grows, the locked band widens and
          swallows more of the population, raising <T>{r`r`}</T>, which widens the band further.
        </>
      ),
    },
    {
      title: 'The phase transition',
      tex: r`K_c = \frac{2}{\pi\,g(0)}, \qquad r \approx \sqrt{\tfrac{8}{\pi}}\,\frac{1}{\,K_c^{2}\,}\sqrt{K-K_c}`,
      note: (
        <>
          Below a <b>critical coupling</b> <T>{r`K_c`}</T> the only self-consistent solution is <T>{r`r=0`}</T> (only chance
          alignment, <T>{r`r\sim 1/\sqrt N`}</T> for finite <T>{r`N`}</T>). Above it a synchronized branch appears, with <T>{r`r`}</T>
          rising continuously from zero — a second-order phase transition. <T>{r`K_c`}</T> is set by the spread of natural
          frequencies through the density at its centre, <T>{r`g(0)`}</T>: a broader spread (smaller <T>{r`g(0)`}</T>) demands
          stronger coupling to lock.
        </>
      ),
    },
  ],

  deep: [
    {
      heading: 'Why it matters for the brain — and for stimulation',
      body: (
        <>
          <p>
            A recorded brain rhythm is, to first approximation, the mean field of a synchronized population: the amplitude of the
            LFP/EEG oscillation tracks <T>{r`r`}</T>. Healthy dynamics keep coupling near or below <T>{r`K_c`}</T> — flexible,
            desynchronizable. Disease pushes it well above: the rigid beta synchrony of Parkinson’s, or the runaway recruitment of a
            seizure, are high-<T>{r`r`}</T> states.
          </p>
          <p>
            This reframes deep-brain stimulation. Fighting a strong attractor with constant high-amplitude current is costly and
            crude. Instead, a brief, well-timed <b>desynchronizing pulse</b> scatters the phases and collapses <T>{r`r`}</T>; if the
            coupling is only modestly supercritical the population stays apart for a while before slowly re-locking. Delivering such
            pulses to subpopulations at staggered phases is the idea behind <b>coordinated-reset</b> stimulation, and reading the
            phase to time them is <b>phase-locked</b> DBS — both visible in the demo when you fire the pulse at different
            <T>{r`K`}</T>.
          </p>
        </>
      ),
    },
  ],

  schema: (
    <svg viewBox="0 0 520 180" width="100%" style={{ maxWidth: 460 }}>
      <circle cx="100" cy="90" r="62" fill="none" stroke="rgba(255,255,255,0.25)" />
      {[20, 35, 55, 70, 95, 120, 200, 300].map((a, i) => { const t = a * Math.PI / 180; return <circle key={i} cx={100 + 62 * Math.cos(t)} cy={90 - 62 * Math.sin(t)} r="5" fill="#22e1ff" /> })}
      <line x1="100" y1="90" x2={100 + 50 * Math.cos(0.9)} y2={90 - 50 * Math.sin(0.9)} stroke="#fff" strokeWidth="2.5" />
      <text x="100" y="172" textAnchor="middle" fill="#9aa3c0" fontFamily="monospace" fontSize="10">phases + mean field r·e^{'{iψ}'}</text>
      <text x="250" y="60" fill="#9aa3c0" fontFamily="monospace" fontSize="12">θ̇ᵢ = ωᵢ + K·r·sin(ψ − θᵢ)</text>
      <text x="250" y="92" fill="#54e6a0" fontFamily="monospace" fontSize="12">K &lt; K꜀ : incoherent  (r ≈ 0)</text>
      <text x="250" y="116" fill="#ffb84d" fontFamily="monospace" fontSize="12">K &gt; K꜀ : locked  (r → 1)</text>
    </svg>
  ),

  numerics: (
    <>
      <p>
        Each frame, the order parameter is formed from the running sums <T>{r`\sum\cos\theta_i`}</T> and
        <T>{r`\sum\sin\theta_i`}</T>, giving <T>{r`r`}</T> and <T>{r`\psi`}</T>; then every phase is advanced by forward Euler with
        the mean-field update <T>{r`\theta_i \mathrel{+}= (\omega_i + K r\sin(\psi-\theta_i))\,\Delta t`}</T>. Natural frequencies are
        a fixed spread of quantiles scaled by the spread knob; the population signal is the imaginary part of the order parameter,
        <T>{r`(1/N)\sum\sin\theta_i = r\sin\psi`}</T>. The desync pulse simply re-randomizes all phases, sending <T>{r`r\to 0`}</T>.
      </p>
    </>
  ),

  pseudocode: `# Kuramoto, mean-field form, N oscillators
θ  = random phases;   ω = ω0 + spread·z   # z: fixed spread of quantiles

every step dt:
    C = Σ cos θ;  S = Σ sin θ
    r = hypot(C, S) / N;  ψ = atan2(S, C)      # order parameter
    for i: θ[i] += (ω[i] + K·r·sin(ψ − θ[i])) · dt
    signal = S / N                              # the "LFP"

on desync pulse:                                # coordinated reset
    θ = random phases                           # r collapses toward 0`,

  params: [
    { name: 'coupling K', range: '0 – 4', role: 'pull toward the mean phase; synchrony appears above K꜀.' },
    { name: 'frequency spread', range: '0.05 – 2', role: 'heterogeneity of natural frequencies; wider spread raises K꜀ (∝ spread).' },
    { name: '⚡ desync pulse', range: 'button', role: 'randomizes all phases (coordinated reset) — collapses r; it re-locks only if K is supercritical.' },
    { name: 'N', range: '72 (fixed)', role: 'population size; residual synchrony of an incoherent state scales as 1/√N.' },
  ],

  refs: (
    <>
      Kuramoto (1975) <i>Self-entrainment of a population of coupled non-linear oscillators</i>; Strogatz (2000) <i>From Kuramoto to
      Crawford</i>, Physica D; Acebrón et al. (2005) review, Rev. Mod. Phys.; Tass (2003) on coordinated-reset stimulation.
    </>
  ),
}
