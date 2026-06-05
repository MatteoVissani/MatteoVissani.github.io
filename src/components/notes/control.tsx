import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const control: DemoNote = {
  title: 'Block diagrams, feedback & stability',
  theme: 'Systems & control',
  tagline: 'From transfer functions and the feedback formula to poles, Bode, Nyquist and the root locus.',

  foundations: (
    <>
      <p>
        A <b>linear time-invariant</b> (LTI) system maps an input <T>{r`u(t)`}</T> to an output <T>{r`y(t)`}</T> through a
        linear differential equation with constant coefficients. The Laplace transform <T>{r`\mathcal L\{f\}(s)=\int_0^\infty f(t)e^{-st}dt`}</T>
        turns differentiation into multiplication, <T>{r`\mathcal L\{\dot f\}=s\,F(s)-f(0)`}</T>, so the differential
        equation becomes algebra. The ratio of output to input transforms is the <b>transfer function</b>
      </p>
      <TB>{r`G(s) = \frac{Y(s)}{U(s)},`}</TB>
      <p>
        a rational function of the complex frequency <T>{r`s=\sigma+j\omega`}</T>. Each block in the sandbox <i>is</i> such a
        transfer function, and wiring blocks in series, in parallel, or in a loop combines them by simple algebra. The
        whole point of feedback control is the loop: comparing the output to a reference and feeding the error back, which
        changes the system's poles — and therefore its speed, damping and stability.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Each block is a transfer function',
      tex: r`\text{gain } K;\quad \tfrac1s;\quad \frac{K}{\tau s+1};\quad \frac{K\,\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}`,
      note: <p>A <b>gain</b> scales, <T>{r`y=Ku`}</T>. An <b>integrator</b> <T>{r`\dot y=u`}</T> gives <T>{r`1/s`}</T>. A <b>first-order lag</b> <T>{r`\tau\dot y=-y+Ku`}</T> transforms to <T>{r`K/(\tau s+1)`}</T> (one real pole at <T>{r`-1/\tau`}</T>). A <b>second-order</b> block <T>{r`\ddot y + 2\zeta\omega_n\dot y + \omega_n^2 y = K\omega_n^2 u`}</T> has natural frequency <T>{r`\omega_n`}</T> and damping ratio <T>{r`\zeta`}</T>.</p>,
    },
    {
      title: 'Series and the comparator',
      tex: r`Y = G_2 G_1\,U;\qquad e = r - y`,
      note: <p>Blocks in series multiply, <T>{r`G_2(s)G_1(s)`}</T>. A <b>sum</b> block with a <T>{r`+`}</T> and a <T>{r`-`}</T> input forms the error <T>{r`e=r-y`}</T> between the reference and the fed-back output — the heart of feedback.</p>,
    },
    {
      title: 'The feedback formula',
      tex: r`T(s) = \frac{Y}{R} = \frac{G(s)}{1 + G(s)H(s)}`,
      note: <p>For a forward path <T>{r`G`}</T> and feedback path <T>{r`H`}</T>, <T>{r`y=G(r-Hy)`}</T> gives <T>{r`y(1+GH)=Gr`}</T>, hence the closed-loop transfer function above. With <b>unity feedback</b> (<T>{r`H=1`}</T>) and loop gain <T>{r`L=GC`}</T>, <T>{r`T=L/(1+L)`}</T>.</p>,
    },
    {
      title: 'Open vs. closed loop',
      tex: r`L(s) = C(s)\,G(s)\quad\text{(open)};\qquad T = \frac{L}{1+L}\quad\text{(closed)}`,
      note: <p>The <b>open-loop</b> transfer <T>{r`L(s)`}</T> is the product around the loop with the feedback broken; the <b>closed-loop</b> <T>{r`T(s)`}</T> is the system running with the loop connected. Deleting the feedback wire in the sandbox switches between them. The sandbox recovers <T>{r`L`}</T> from the simulated closed loop via <T>{r`L = T/(1-T)`}</T>.</p>,
    },
    {
      title: 'Poles set the stability',
      tex: r`1 + L(s) = 0 \;\Longleftrightarrow\; \text{den}(s) = 0`,
      note: <p>The closed-loop poles are the roots of the denominator of <T>{r`T`}</T>, equivalently the roots of the <b>characteristic equation</b> <T>{r`1+L(s)=0`}</T>. The system is <b>stable</b> iff every pole has negative real part (lies in the left half-plane); a single pole in the right half-plane makes the output diverge. This is exactly what the <b>poles</b> tab plots.</p>,
    },
    {
      title: 'Steady-state error',
      tex: r`e_{ss} = \lim_{s\to 0} s\,E(s) = \frac{1}{1+L(0)}\quad(\text{step input})`,
      note: <p>By the final-value theorem, the steady-state error to a unit step is <T>{r`1/(1+L(0))`}</T>. A larger DC loop gain <T>{r`L(0)`}</T> shrinks the error; an integrator in the loop (<T>{r`L(0)\to\infty`}</T>) drives it to zero. Raising the controller gain in the sandbox visibly reduces the gap between the reference and the output.</p>,
    },
    {
      title: 'Frequency response → Bode',
      tex: r`G(j\omega) = |G(j\omega)|\,e^{j\angle G(j\omega)}`,
      note: <p>Evaluating <T>{r`G`}</T> on the imaginary axis <T>{r`s=j\omega`}</T> gives the steady-state response to a sinusoid of frequency <T>{r`\omega`}</T>. The <b>Bode</b> plot shows the magnitude in decibels, <T>{r`20\log_{10}|G(j\omega)|`}</T>, and the phase in degrees, against <T>{r`\log\omega`}</T>. Each real pole adds <T>{r`-20`}</T> dB/decade and <T>{r`-90^\circ`}</T>; the gain and phase margins (how far the open-loop curve sits from <T>{r`0`}</T> dB at <T>{r`-180^\circ`}</T>) measure robustness.</p>,
    },
    {
      title: 'Nyquist criterion',
      tex: r`Z = N + P`,
      note: <p>The <b>Nyquist</b> plot is the parametric curve <T>{r`L(j\omega)`}</T> in the complex plane. The criterion counts encirclements: the number of unstable closed-loop poles <T>{r`Z`}</T> equals the clockwise encirclements <T>{r`N`}</T> of the point <T>{r`-1`}</T> plus the open-loop unstable poles <T>{r`P`}</T>. For an open-loop-stable system, <b>any encirclement of <T>{r`-1`}</T> means instability</b> — which is why the <T>{r`-1`}</T> point is marked.</p>,
    },
    {
      title: 'Root locus',
      tex: r`\text{den}(s) + k\,\text{num}(s) = 0,\quad k:0\to\infty`,
      note: <p>The <b>root locus</b> traces the closed-loop poles as a loop gain <T>{r`k`}</T> is swept. They start (<T>{r`k=0`}</T>) at the open-loop poles and end (<T>{r`k\to\infty`}</T>) at the open-loop zeros, moving continuously through the plane. It shows at a glance how much gain the loop can take before a branch crosses into the right half-plane and the system goes unstable.</p>,
    },
  ],

  deep: [
    {
      heading: 'How the sandbox builds the model from the wiring',
      body: (
        <>
          <p>The diagram is converted to a linear <b>state-space</b> model <T>{r`\dot{\mathbf x}=A\mathbf x+Bu,\ y=C\mathbf x+Du`}</T>. Each dynamic block contributes states: an integrator and a first-order lag one each, a second-order block two. Every wire's signal is written as a linear combination of the states and the input <T>{r`u`}</T> (the first source). Memoryless blocks (gain, sum, saturation-as-unit-gain) are resolved in topological order; the state-derivative equations then fill the rows of <T>{r`A`}</T> and <T>{r`B`}</T>, and the signal feeding the scope gives <T>{r`C,D`}</T>. Saturation is treated as a unit gain, since Bode/Nyquist/root-locus are defined only for linear systems.</p>
        </>
      ),
    },
    {
      heading: 'From state-space to the transfer function',
      body: (
        <>
          <p>The denominator is the characteristic polynomial <T>{r`\det(sI-A)`}</T>, computed by the Faddeev–LeVerrier recursion. The numerator uses the identity</p>
          <TB>{r`\det\!\big(sI-(A-BC)\big) = \det(sI-A)\,\big(1 + C(sI-A)^{-1}B\big),`}</TB>
          <p>so that <T>{r`C(sI-A)^{-1}B = \det(sI-(A-BC))/\det(sI-A) - 1`}</T> and the closed-loop transfer function is</p>
          <TB>{r`T(s) = D + C(sI-A)^{-1}B = \frac{(D-1)\det(sI-A) + \det(sI-(A-BC))}{\det(sI-A)}.`}</TB>
          <p>Both determinants are characteristic polynomials, so two Faddeev–LeVerrier passes give <T>{r`\text{num}(s)`}</T> and <T>{r`\text{den}(s)`}</T>. Poles are the roots of the denominator, found by the Durand–Kerner iteration; the open-loop <T>{r`L=\text{num}/(\text{den}-\text{num})`}</T> follows from <T>{r`T=L/(1+L)`}</T>.</p>
        </>
      ),
    },
    {
      heading: 'Why the time simulation handles feedback',
      body: (
        <>
          <p>The scope integrates the diagram directly in time with forward Euler at <T>{r`\Delta t=0.01`}</T> s. Each step first reads the source and the stateful-block outputs (which depend only on their stored state), then evaluates the memoryless blocks in topological order, then updates the states. Because a feedback signal always passes through at least one stateful block (an integrator or a transfer function), its value at the current step is already available from that block's state — so the loop closes without an algebraic-loop deadlock, and no artificial delay is introduced in the forward path.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: the default loop',
      body: (
        <>
          <p>The default diagram is <i>step → ⊕(+,−) → gain K=2 → plant <T>{r`1/(s+1)`}</T> → scope</i> with unity feedback. The loop gain is <T>{r`L(s)=2/(s+1)`}</T>, so</p>
          <TB>{r`T(s) = \frac{L}{1+L} = \frac{2/(s+1)}{1+2/(s+1)} = \frac{2}{s+3}.`}</TB>
          <p>One closed-loop pole at <T>{r`s=-3`}</T> (stable, faster than the open-loop pole at <T>{r`-1`}</T>), DC gain <T>{r`T(0)=2/3`}</T>, and a steady-state error <T>{r`1/(1+L(0))=1/(1+2)=1/3`}</T> — exactly the gap you see on the scope. Raising <T>{r`K`}</T> pushes the pole further left (faster, smaller error); since the plant is first order the loop never becomes unstable, but adding a second pole (the 2nd-order plant) lets a high gain drive a branch of the root locus into the right half-plane.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 170" role="img" aria-label="Unity-feedback control loop">
      <defs><marker id="ctlarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#7c89b5" /></marker></defs>
      <line x1="14" y1="60" x2="70" y2="60" stroke="#9b8cff" strokeWidth="2" markerEnd="url(#ctlarr)" />
      <text x="14" y="50" fill="#9b8cff" fontSize="11" fontFamily="monospace">r (reference)</text>
      <circle cx="84" cy="60" r="14" fill="none" stroke="#e9ebfb" strokeWidth="1.6" />
      <text x="84" y="64" textAnchor="middle" fill="#e9ebfb" fontSize="13" fontFamily="monospace">Σ</text>
      <text x="74" y="54" fill="#54e6a0" fontSize="11" fontFamily="monospace">+</text>
      <text x="74" y="92" fill="#ff2d8f" fontSize="12" fontFamily="monospace">−</text>
      <line x1="98" y1="60" x2="150" y2="60" stroke="#7c89b5" strokeWidth="2" markerEnd="url(#ctlarr)" />
      <text x="120" y="52" fill="#22e1ff" fontSize="9" fontFamily="monospace">e</text>
      <rect x="152" y="42" width="92" height="36" rx="6" fill="rgba(34,225,255,0.08)" stroke="#22e1ff" strokeWidth="1.6" />
      <text x="198" y="64" textAnchor="middle" fill="#22e1ff" fontSize="13" fontFamily="monospace">C(s)</text>
      <text x="198" y="34" textAnchor="middle" fill="#22e1ff" fontSize="9" fontFamily="monospace">controller</text>
      <line x1="244" y1="60" x2="296" y2="60" stroke="#7c89b5" strokeWidth="2" markerEnd="url(#ctlarr)" />
      <rect x="298" y="42" width="92" height="36" rx="6" fill="rgba(255,184,77,0.08)" stroke="#ffb84d" strokeWidth="1.6" />
      <text x="344" y="64" textAnchor="middle" fill="#ffb84d" fontSize="13" fontFamily="monospace">G(s)</text>
      <text x="344" y="34" textAnchor="middle" fill="#ffb84d" fontSize="9" fontFamily="monospace">plant</text>
      <line x1="390" y1="60" x2="486" y2="60" stroke="#7c89b5" strokeWidth="2" markerEnd="url(#ctlarr)" />
      <circle cx="430" cy="60" r="3" fill="#fff" />
      <text x="470" y="50" fill="#e9ebfb" fontSize="11" fontFamily="monospace">y (output)</text>
      {/* feedback */}
      <path d="M430,60 L430,128 L84,128 L84,74" fill="none" stroke="#7c89b5" strokeWidth="1.8" markerEnd="url(#ctlarr)" />
      <text x="250" y="142" textAnchor="middle" fill="#7c89b5" fontSize="10" fontFamily="monospace">feedback  H(s)</text>
    </svg>
  ),

  numerics: (
    <p>
      Time domain: forward Euler, <T>{r`\Delta t=0.01`}</T> s, 3 steps per animation frame, a 10 s scrolling scope. The analysis
      is recomputed whenever the diagram changes: a state-space model is extracted, reduced to <T>{r`\text{num}/\text{den}`}</T>
      polynomials, and evaluated over <T>{r`\omega\in[10^{-2},10^{2}]`}</T> rad/s for Bode/Nyquist; root locus sweeps the loop
      gain <T>{r`k`}</T> logarithmically over the same range, with <T>{r`k=1`}</T> the running closed loop. Saturation is linearized
      (unit gain) for the frequency-domain views.
    </p>
  ),

  pseudocode: `
# ---- time-domain step (forward Euler, dt = 0.01) ----
for each step:
    # sources and stateful read-outs
    for b in sources:   out[b] = source_value(b, t)
    for b in {integrator, tf1, tf2}:  out[b] = readout(state[b])
    # memoryless blocks in topological order
    for b in topo(gain, sum, sat):
        out[b] = combine(b, inputs(b))            # K·u | s0·u0+s1·u1 | clamp(u)
    record scope inputs
    # update states
    for b in integrator:  state[b] += input(b)·dt
    for b in tf1:         state[b] += (−state[b] + K·input(b))/tau · dt
    for b in tf2:         # [y, v]
        v += (wn²(K·u − y) − 2·zeta·wn·v)·dt ;  y += v·dt
    t += dt

# ---- analysis: graph → transfer function ----
(A,B,C,D) ← buildStateSpace(blocks, wires)          # input = first source, output = scope
den  ← charPoly(A)                                   # Faddeev–LeVerrier
num  ← (D−1)·den + charPoly(A − B·Cᵀ)                # via det identity
poles ← roots(den)                                   # Durand–Kerner
L = num / (den − num)                                # open-loop loop gain
Bode:  H(jω) = num(jω)/den(jω)
Nyquist: plot L(jω) for ω = 10^-2 .. 10^2
RootLocus: roots(den_open + k·num_open),  k = 0 .. ∞
`,

  params: [
    { name: 'palette', range: 'step/sine, sum, gain, 1/s, 1st/2nd-order, saturate, scope', role: 'blocks you drag onto the canvas' },
    { name: 'wire', range: 'output → input port', role: 'drag to connect; click a wire to delete it' },
    { name: 'gain K', range: 'any', role: 'controller / loop gain; raises speed, lowers steady-state error' },
    { name: 'τ (1st-order)', range: 'any > 0', role: 'plant time constant; pole at −1/τ' },
    { name: 'ωₙ, ζ (2nd-order)', range: 'ωₙ > 0, ζ ≥ 0', role: 'natural frequency and damping; ζ→0 rings' },
    { name: 'analysis tab', range: 'poles / Bode / Nyquist / root locus', role: 'frequency- and s-domain views of the wired system' },
  ],

  refs: <>Ogata, <i>Modern Control Engineering</i> (2010); Franklin, Powell &amp; Emami-Naeini, <i>Feedback Control of Dynamic Systems</i> (2019); Åström &amp; Murray, <i>Feedback Systems</i> (2008).</>,
}
