import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const wilsonCowan: DemoNote = {
  title: 'Wilson–Cowan dynamics & bifurcation',
  theme: 'Neuronal dynamics',
  tagline: 'From population firing-rate balance to nullclines, multistability, and a Hopf bifurcation.',

  foundations: (
    <>
      <p>
        Instead of tracking individual neurons, the Wilson–Cowan model tracks the <b>fraction of a population
        active per unit time</b>: <T>{r`E(t)`}</T> for an excitatory pool, <T>{r`I(t)`}</T> for an inhibitory pool.
        Two ingredients define the dynamics. First, activity decays unless sustained, giving a relaxation term
        <T>{r`-E/\tau_E`}</T>. Second, the drive that sustains it is the total synaptic input passed through a
        saturating <b>input–output gain</b> <T>{r`S`}</T> (few neurons fire at very low input, all fire at very high
        input — a sigmoid):
      </p>
      <TB>{r`S(x) = \frac{1}{1 + e^{-a(x-\theta)}},\qquad \theta = 3.`}</TB>
      <p>
        The total input to <T>{r`E`}</T> is recurrent excitation <T>{r`w_{EE}E`}</T> minus inhibition <T>{r`w_{EI}I`}</T>
        plus external drive <T>{r`P`}</T>; symmetrically for <T>{r`I`}</T>. This compact 2-D system already shows the
        signature behaviours of cortex: a single stable state, <b>bistability</b> with hysteresis, and self-sustained
        <b> oscillations</b> born at a Hopf bifurcation (the <T>{r`E`}</T>–<T>{r`I`}</T> loop is the canonical rhythm generator).
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Rate equations',
      tex: r`\tau_E\dot E = -E + S(w_{EE}E - w_{EI}I + P),\quad \tau_I\dot I = -I + S(w_{IE}E - w_{II}I + Q)`,
      note: <p>Each population relaxes toward the sigmoid of its net input. The demo fixes <T>{r`\tau_E=1,\ w_{IE}=10,\ w_{II}=2,\ Q=0`}</T> and exposes <T>{r`P,\ w_{EE},\ w_{EI},\ \tau_I,\ a`}</T>.</p>,
    },
    {
      title: 'Invert the sigmoid',
      tex: r`S^{-1}(y) = \theta + \tfrac1a\,\ln\frac{y}{1-y}`,
      note: <p>Because <T>{r`S`}</T> is monotonic it has a closed-form inverse. This turns the implicit nullcline conditions <T>{r`\dot E=0`}</T>, <T>{r`\dot I=0`}</T> into explicit curves.</p>,
    },
    {
      title: 'Nullclines (closed form)',
      tex: r`I = \frac{w_{EE}E + P - S^{-1}(E)}{w_{EI}},\qquad E = \frac{S^{-1}(I) + w_{II}I - Q}{w_{IE}}`,
      note: <p>Setting <T>{r`\dot E=0`}</T> gives <T>{r`S^{-1}(E)=w_{EE}E-w_{EI}I+P`}</T>; solve for <T>{r`I`}</T>. The <T>{r`E`}</T>-nullcline (cyan) and <T>{r`I`}</T>-nullcline (amber) in the phase plane are exactly these.</p>,
    },
    {
      title: 'Fixed points = intersections',
      tex: r`g(E) = -E + S\!\big(w_{EE}E - w_{EI}\,I^\ast(E) + P\big) = 0`,
      note: <p>A steady state lies on both nullclines. Eliminating <T>{r`I`}</T> via its own steady state <T>{r`I^\ast(E)`}</T> reduces the problem to the roots of one scalar function <T>{r`g(E)`}</T>. A sign-change scan finds <b>1 or 3</b> roots.</p>,
    },
    {
      title: 'Bistability (the cusp)',
      tex: r`w_{EE}\ \text{large} \Rightarrow \text{S-shaped } E\text{-nullcline} \Rightarrow 3\ \text{crossings}`,
      note: <p>With strong recurrent excitation (<T>{r`w_{EE}\approx14,\ P\approx3`}</T>) the <T>{r`E`}</T>-nullcline folds into an S, so the nullclines cross three times: two stable nodes flank a saddle — bistability and hysteresis (a saddle-node/cusp).</p>,
    },
    {
      title: 'Loss of stability → Hopf',
      tex: r`\text{eig}\,J(E^\ast,I^\ast):\ \lambda = \mu(P) \pm i\,\omega,\quad \mu(P_c)=0`,
      note: <p>Linearizing about a single fixed point, the Jacobian has a complex eigenvalue pair. As <T>{r`P`}</T> increases past <T>{r`P_c`}</T> the real part <T>{r`\mu`}</T> crosses zero: the fixed point becomes unstable and a <b>limit cycle</b> appears — a supercritical Hopf bifurcation, with amplitude growing as <T>{r`\sqrt{P-P_c}`}</T> from zero.</p>,
    },
    {
      title: 'Read it on the diagram',
      tex: r`\text{amplitude} = \max_t E - \min_t E`,
      note: <p>The bifurcation diagram sweeps <T>{r`P`}</T>, lets the system settle, then plots the min and max of <T>{r`E`}</T>. The two branches separate where the limit cycle exists — the shaded oscillatory band. Slower <T>{r`\tau_I`}</T> or stronger <T>{r`w_{EI}`}</T> widens it.</p>,
    },
  ],

  deep: [
    {
      heading: 'Linear stability and the Hopf condition',
      body: (
        <>
          <p>Let <T>{r`(E^\ast, I^\ast)`}</T> be a fixed point. Writing the input to each population as <T>{r`x_E = w_{EE}E - w_{EI}I + P`}</T> and <T>{r`x_I = w_{IE}E - w_{II}I + Q`}</T>, and linearizing <T>{r`(\dot E,\dot I)`}</T> about the fixed point, the Jacobian is</p>
          <TB>{r`J = \begin{bmatrix} \dfrac{-1 + w_{EE}\,S'_E}{\tau_E} & \dfrac{-w_{EI}\,S'_E}{\tau_E} \\[8pt] \dfrac{w_{IE}\,S'_I}{\tau_I} & \dfrac{-1 - w_{II}\,S'_I}{\tau_I} \end{bmatrix},`}</TB>
          <p>where <T>{r`S'_E = S'(x_E^\ast)`}</T>, <T>{r`S'_I = S'(x_I^\ast)`}</T> are the sigmoid slopes at the fixed point (for the logistic, <T>{r`S'(x) = a\,S(x)\,[1-S(x)]`}</T>). The fixed point is stable when the trace is negative and the determinant positive,</p>
          <TB>{r`\operatorname{tr} J < 0, \qquad \det J > 0.`}</TB>
          <p>A pair of complex eigenvalues crosses the imaginary axis — a <b>Hopf bifurcation</b> — precisely when <T>{r`\operatorname{tr} J = 0`}</T> while <T>{r`\det J > 0`}</T>. Increasing the drive <T>{r`P`}</T> raises <T>{r`S'_E`}</T> (the operating point moves onto the steep part of the excitatory sigmoid), which raises <T>{r`\operatorname{tr} J`}</T> toward zero; the crossing point is the edge of the shaded oscillatory band in the bifurcation diagram.</p>
        </>
      ),
    },
    {
      heading: 'Oscillation frequency near the bifurcation',
      body: (
        <>
          <p>At the Hopf point the eigenvalues are purely imaginary, <T>{r`\lambda = \pm i\,\omega_0`}</T>, with <T>{r`\omega_0 = \sqrt{\det J}`}</T> (since <T>{r`\operatorname{tr} J = 0`}</T> implies <T>{r`\lambda^2 = -\det J`}</T>). The emerging rhythm therefore has an angular frequency set by the coupling and time constants,</p>
          <TB>{r`f_{\text{osc}} \approx \frac{\omega_0}{2\pi} = \frac{\sqrt{\det J}}{2\pi}.`}</TB>
          <p>Because <T>{r`\det J`}</T> grows with the inhibitory feedback <T>{r`w_{EI}w_{IE}`}</T> and shrinks with a slower <T>{r`\tau_I`}</T>, the model places the rhythm in the beta–gamma range for physiological parameters; a slower <T>{r`\tau_I`}</T> lowers <T>{r`f_{\text{osc}}`}</T> and widens the band, as the <T>{r`\tau_I`}</T> slider shows.</p>
        </>
      ),
    },
    {
      heading: 'Multistability: the S-shaped nullcline',
      body: (
        <>
          <p>The number of fixed points equals the number of intersections of the two nullclines. The inhibitory nullcline is monotone, but the excitatory nullcline, <T>{r`I = (w_{EE}E + P - S^{-1}(E))/w_{EI}`}</T>, is non-monotone when the recurrent term <T>{r`w_{EE}E`}</T> can outrun the inverse-sigmoid term over an interval of <T>{r`E`}</T>. This requires the slope condition <T>{r`w_{EE} > \min_E (S^{-1})'(E) = 4/a`}</T> (the inverse logistic has minimum slope <T>{r`4/a`}</T> at its inflection). When met, the nullcline folds into an <b>S</b>, the curves cross three times, and the system is bistable: two stable nodes separated by a saddle, with hysteresis as <T>{r`P`}</T> is swept up and down. This is the cusp/saddle-node regime reached near <T>{r`w_{EE}\approx 14`}</T>.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: the fold condition for bistability',
      body: (
        <>
          <p>The excitatory nullcline folds into an S whenever <T>{r`w_{EE}E - S^{-1}(E)`}</T> is non-monotone, i.e. when <T>{r`w_{EE}`}</T> exceeds the minimum slope of the inverse sigmoid. Since <T>{r`(S^{-1})'(y) = 1/[a\,y(1-y)]`}</T> is minimized at <T>{r`y=\tfrac12`}</T>,</p>
          <TB>{r`w_{EE} > \min_y (S^{-1})'(y) = \frac{4}{a}.`}</TB>
          <p>At the default gain <T>{r`a=1.2`}</T> this threshold is <T>{r`4/1.2 \approx 3.3`}</T>, so the default <T>{r`w_{EE}=10`}</T> is well above it and a fold is possible; with <T>{r`P\approx 3`}</T> the fold places the operating point so the nullclines cross three times, giving the two stable states plus a saddle. Reducing <T>{r`w_{EE}`}</T> below <T>{r`3.3`}</T> removes the fold and only a single fixed point remains for any <T>{r`P`}</T>.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Excitatory and inhibitory population loop">
      <defs>
        <marker id="wcarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker>
        <marker id="wcinh" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><circle cx="5" cy="5" r="3.5" fill="#ff2d8f" /></marker>
      </defs>
      <circle cx="170" cy="100" r="40" fill="rgba(34,225,255,0.08)" stroke="#22e1ff" strokeWidth="2" />
      <text x="170" y="105" textAnchor="middle" fill="#22e1ff" fontSize="22" fontFamily="monospace">E</text>
      <circle cx="360" cy="100" r="40" fill="rgba(255,45,143,0.08)" stroke="#ff2d8f" strokeWidth="2" />
      <text x="360" y="105" textAnchor="middle" fill="#ff2d8f" fontSize="22" fontFamily="monospace">I</text>
      {/* E -> I excitatory */}
      <path d="M210,86 C260,66 310,66 350,80" fill="none" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#wcarr)" />
      <text x="270" y="60" textAnchor="middle" fill="#22e1ff" fontSize="11" fontFamily="monospace">w<tspan dy="3" fontSize="8">IE</tspan></text>
      {/* I -> E inhibitory */}
      <path d="M350,120 C310,138 260,138 214,118" fill="none" stroke="#ff2d8f" strokeWidth="2" markerEnd="url(#wcinh)" />
      <text x="270" y="150" textAnchor="middle" fill="#ff2d8f" fontSize="11" fontFamily="monospace">w<tspan dy="3" fontSize="8">EI</tspan></text>
      {/* recurrent E */}
      <path d="M150,64 C120,30 220,30 190,64" fill="none" stroke="#22e1ff" strokeWidth="1.8" markerEnd="url(#wcarr)" />
      <text x="170" y="26" textAnchor="middle" fill="#22e1ff" fontSize="11" fontFamily="monospace">w<tspan dy="3" fontSize="8">EE</tspan></text>
      {/* recurrent I */}
      <path d="M340,64 C310,30 410,30 380,64" fill="none" stroke="#ff2d8f" strokeWidth="1.8" markerEnd="url(#wcinh)" />
      <text x="360" y="26" textAnchor="middle" fill="#ff2d8f" fontSize="11" fontFamily="monospace">w<tspan dy="3" fontSize="8">II</tspan></text>
      {/* external drive */}
      <line x1="60" y1="100" x2="128" y2="100" stroke="#9b8cff" strokeWidth="2.2" markerEnd="url(#wcarr)" />
      <text x="50" y="104" textAnchor="end" fill="#9b8cff" fontSize="14" fontFamily="monospace">P</text>
    </svg>
  ),

  numerics: (
    <>
      <p>Forward Euler, <T>{r`\Delta t=0.04`}</T>, 6 substeps per frame; a 700-sample activity history. The phase-plane flow field samples <T>{r`(\dot E,\dot I)`}</T> on an 11×11 grid and advects 18 tracer particles along it. Nullclines are drawn from the closed forms above by sweeping <T>{r`E`}</T> (resp. <T>{r`I`}</T>) in 0.005 steps.</p>
      <p>The bifurcation diagram (debounced 120 ms) sweeps <T>{r`P\in[0,12]`}</T> in 80 steps; for each, 1600 settle steps then the running min/max of <T>{r`E`}</T> over 1500 steps. Fixed points come from a sign-change scan of <T>{r`g(E)`}</T> over <T>{r`[0.004,0.9985]`}</T> (step 0.0025), with <T>{r`I^\ast(E)`}</T> from 80 fixed-point iterations.</p>
    </>
  ),

  pseudocode: `
S(x) = 1 / (1 + exp(−a·(x − theta)))                 # logistic gain

# Forward Euler, dt = 0.04
E ← 0.2 ;  I ← 0.1
for each step:
    dE ← (−E + S(w_EE·E − w_EI·I + P)) / tau_E
    dI ← (−I + S(w_IE·E − w_II·I + Q)) / tau_I
    E ← E + dE·dt ;  I ← I + dI·dt

# Bifurcation diagram
for P in 0 .. 12 (80 values):
    settle 1600 steps
    lo, hi ← min, max of E over next 1500 steps
    plot (P, lo) and (P, hi)                          # branches; gap = amplitude

# Fixed points: roots of g(E) = −E + S(w_EE·E − w_EI·I*(E) + P)
#   I*(E) from iterating I ← S(w_IE·E − w_II·I + Q)
#   scan E, locate sign changes of g  → 1 or 3 roots
`,
  params: [
    { name: 'P', range: '0–12 (0.1, 3)', role: 'external drive to E; the bifurcation parameter' },
    { name: 'w_EE', range: '4–16 (1, 10)', role: 'recurrent excitation; sets 1 vs 3 fixed points' },
    { name: 'w_EI', range: '6–22 (1, 10)', role: 'inhibitory→excitatory coupling' },
    { name: 'τ_I', range: '1–4 (0.1, 2)', role: 'inhibitory time constant; widens the oscillatory band' },
    { name: 'a', range: '0.8–2.5 (0.1, 1.2)', role: 'steepness of the sigmoid gain S' },
  ],

  refs: <>Wilson &amp; Cowan, <i>Biophys. J.</i> 12 (1972) 1; Strogatz, <i>Nonlinear Dynamics and Chaos</i> (1994), ch. 8; Bressloff, <i>Waves in Neural Media</i> (2014).</>,
}
