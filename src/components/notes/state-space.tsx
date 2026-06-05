import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const stateSpace: DemoNote = {
  title: 'State feedback, observers & the Kalman filter',
  theme: 'Systems & control',
  tagline: 'Controllability and observability decide what control is possible; pole placement, LQR, the Luenberger observer and the Kalman filter build it.',

  foundations: (
    <>
      <p>
        A linear system is written in <b>state-space</b> form as
      </p>
      <TB>{r`\dot x = A\,x + B\,u, \qquad y = C\,x,`}</TB>
      <p>
        where <T>{r`x\in\mathbb R^n`}</T> is the internal <b>state</b>, <T>{r`u`}</T> the input you command, and <T>{r`y`}</T> the
        output you measure. The state is usually only partly visible: you act on it through <T>{r`B`}</T> and observe it through
        <T>{r`C`}</T>, but the dynamics live in the full <T>{r`x`}</T>. The eigenvalues of <T>{r`A`}</T> are the system’s <b>modes</b>:
        a mode <T>{r`\lambda`}</T> with eigenvector <T>{r`v`}</T> evolves as <T>{r`e^{\lambda t}v`}</T>, decaying if
        <T>{r`\operatorname{Re}\lambda<0`}</T> and growing if <T>{r`\operatorname{Re}\lambda>0`}</T>.
      </p>
      <p>
        Two structural questions govern everything you can do. <b>Controllability:</b> can the input <T>{r`u`}</T> drive the
        state to any configuration? <b>Observability:</b> can the output <T>{r`y`}</T> reveal the entire state? Their answers
        determine which controllers and estimators exist — and the demo is a guided tour of exactly these.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Reachable subspace → controllability',
      tex: r`\mathcal C = \begin{bmatrix} B & AB & A^2B & \cdots & A^{n-1}B\end{bmatrix}`,
      note: (
        <>
          Starting from the origin, the input can only build up motion in the directions <T>{r`B`}</T>, then (after the
          dynamics act) <T>{r`AB`}</T>, <T>{r`A^2B`}</T>, …. By the Cayley–Hamilton theorem nothing new appears past
          <T>{r`A^{n-1}B`}</T>, so the <b>reachable subspace</b> is the column span of <T>{r`\mathcal C`}</T>. The pair
          <T>{r`(A,B)`}</T> is <b>controllable</b> iff <T>{r`\operatorname{rank}\mathcal C = n`}</T> — the reachable set is all of
          <T>{r`\mathbb R^n`}</T>. If the rank is deficient, some direction is forever out of the input’s reach.
        </>
      ),
    },
    {
      title: 'Pole placement (full-state feedback)',
      tex: r`u=-Kx \;\Rightarrow\; \dot x=(A-BK)x`,
      note: (
        <>
          Feeding the state back through a gain <T>{r`K`}</T> replaces <T>{r`A`}</T> by <T>{r`A-BK`}</T>. If
          <T>{r`(A,B)`}</T> is controllable, <T>{r`K`}</T> can place the eigenvalues of <T>{r`A-BK`}</T> at <i>any</i> self-conjugate
          set you choose. <b>Ackermann’s formula</b> gives it in closed form for a single input,
          <TB>{r`K=\begin{bmatrix}0&\cdots&0&1\end{bmatrix}\,\mathcal C^{-1}\,\phi(A),`}</TB>
          where <T>{r`\phi(s)=\prod_i(s-\lambda_i^{\text{des}})`}</T> is the desired closed-loop characteristic polynomial and
          <T>{r`\phi(A)`}</T> is that polynomial evaluated on the matrix.
        </>
      ),
    },
    {
      title: 'Observability',
      tex: r`\mathcal O = \begin{bmatrix} C \\ CA \\ CA^2 \\ \vdots \\ CA^{n-1}\end{bmatrix}`,
      note: (
        <>
          The output and its derivatives are <T>{r`y=Cx`}</T>, <T>{r`\dot y=CAx`}</T>, <T>{r`\ddot y=CA^2x`}</T>, …. Stacking them,
          the initial state is recoverable from <T>{r`y(t)`}</T> iff <T>{r`\operatorname{rank}\mathcal O=n`}</T> — the pair
          <T>{r`(A,C)`}</T> is <b>observable</b>. A non-trivial null space of <T>{r`\mathcal O`}</T> is a set of states that produce
          the <i>same</i> output and so can never be told apart from <T>{r`y`}</T>.
        </>
      ),
    },
    {
      title: 'The observer (state estimator)',
      tex: r`\dot{\hat x}=A\hat x+Bu+L\,(y-C\hat x)`,
      note: (
        <>
          Run a copy of the model and correct it with the measurement residual <T>{r`y-C\hat x`}</T> through a gain
          <T>{r`L`}</T>. The estimation error <T>{r`e=x-\hat x`}</T> then obeys <T>{r`\dot e=(A-LC)e`}</T>. If
          <T>{r`(A,C)`}</T> is observable, <T>{r`L`}</T> places the eigenvalues of <T>{r`A-LC`}</T> anywhere — make them faster than
          the controller and the estimate locks onto the true state. By <b>duality</b>, designing <T>{r`L`}</T> for
          <T>{r`(A,C)`}</T> is the same problem as designing a feedback gain for <T>{r`(A^{\top},C^{\top})`}</T>.
        </>
      ),
    },
    {
      title: 'Separation principle',
      tex: r`\operatorname{eig}(\text{closed loop}) = \operatorname{eig}(A-BK)\,\cup\,\operatorname{eig}(A-LC)`,
      note: (
        <>
          Use the estimate in place of the state, <T>{r`u=-K\hat x`}</T>. Remarkably, the closed-loop eigenvalues are exactly the
          controller poles <T>{r`\operatorname{eig}(A-BK)`}</T> <i>together with</i> the observer poles
          <T>{r`\operatorname{eig}(A-LC)`}</T> — the two designs do not interfere. So you design <T>{r`K`}</T> and <T>{r`L`}</T>
          independently and simply combine them. This is the controller the demo runs.
        </>
      ),
    },
    {
      title: 'Optimal design: LQR and the Kalman filter',
      tex: r`K=R^{-1}B^{\top}P,\quad A^{\top}P+PA-PBR^{-1}B^{\top}P+Q=0`,
      note: (
        <>
          Instead of choosing poles by hand, the <b>LQR</b> picks <T>{r`K`}</T> to minimise the quadratic cost
          <T>{r`\int_0^\infty(x^{\top}Qx+u^{\top}Ru)\,dt`}</T>; the optimal gain comes from the symmetric solution <T>{r`P`}</T> of the
          algebraic <b>Riccati equation</b> above. Its dual, the <b>Kalman filter</b>, is the optimal observer when the system is
          driven by process noise (covariance <T>{r`Q_w`}</T>) and the measurement is corrupted by noise (covariance
          <T>{r`R_v`}</T>):
          <TB>{r`L=\Sigma C^{\top}R_v^{-1},\qquad A\Sigma+\Sigma A^{\top}-\Sigma C^{\top}R_v^{-1}C\Sigma+Q_w=0.`}</TB>
          LQR + Kalman is the LQG controller — optimal feedback from a noisy output.
        </>
      ),
    },
  ],

  deep: [
    {
      heading: 'Stabilizable & detectable — the part that actually matters',
      body: (
        <>
          <p>
            Controllability and observability are stronger than you usually need. To merely <i>stabilize</i> a system you only
            need every <b>unstable</b> mode to be controllable — the pair is then <b>stabilizable</b>. Likewise you only need every
            unstable mode to be observable — <b>detectable</b>. A mode you can neither steer nor see is harmless <i>if it is already
            stable</i>: it decays on its own and you ignore it. Only an <b>unstable</b> mode that is uncontrollable (you can’t move it)
            or unobservable (you can’t see it to act on it) is fatal.
          </p>
          <p>
            The <b>PBH test</b> pinpoints the offending mode: <T>{r`\lambda`}</T> is uncontrollable iff
            <T>{r`\operatorname{rank}\begin{bmatrix}\lambda I-A & B\end{bmatrix}<n`}</T>, and unobservable iff
            <T>{r`\operatorname{rank}\begin{bmatrix}\lambda I-A\\ C\end{bmatrix}<n`}</T>. The demo uses exactly this to name the stuck or
            hidden eigenvalue.
          </p>
        </>
      ),
    },
    {
      heading: 'Which feedback can you build — the four cases',
      body: (
        <>
          <p>
            There are two architectures. <b>Full-state feedback</b> <T>{r`u=-Kx`}</T> wires a gain to every state: it needs only
            controllability, but assumes you can measure the whole state. <b>Output feedback</b> <T>{r`u=-K\hat x`}</T> measures only
            <T>{r`y`}</T> and lets an observer supply the rest: it needs controllability <i>and</i> observability.
          </p>
          <ul>
            <li><b>Controllable &amp; observable</b> — both work; place all controller and observer poles freely.</li>
            <li><b>Not controllable, observable</b> — you can estimate everything, but feedback only moves the controllable modes; stabilizes iff the stuck mode is already stable.</li>
            <li><b>Controllable, not observable</b> — full-state feedback works if you can physically measure every state; no output-feedback controller exists unless the hidden mode is stable.</li>
            <li><b>Neither</b> — feedback governs only the steerable-and-visible part; the rest had better be stable.</li>
          </ul>
        </>
      ),
    },
  ],

  schema: (
    <svg viewBox="0 0 640 220" width="100%" style={{ maxWidth: 560 }}>
      <defs><marker id="ss-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#7c89b5" /></marker></defs>
      {[['Plant', 70, 40, 'ẋ=Ax+Bu, y=Cx'], ['Observer', 70, 130, 'x̂̇=Ax̂+Bu+L(y−Cx̂)']].map(([t, x, y, s], i) => (
        <g key={i}><rect x={x as number} y={y as number} width="180" height="52" rx="8" fill="#18103a" stroke="rgba(163,91,255,0.5)" /><text x={(x as number) + 90} y={(y as number) + 22} textAnchor="middle" fill="#fff" fontFamily="monospace" fontSize="13">{t}</text><text x={(x as number) + 90} y={(y as number) + 40} textAnchor="middle" fill="#9aa3c0" fontFamily="monospace" fontSize="10">{s}</text></g>
      ))}
      <g><rect x="430" y="86" width="120" height="48" rx="8" fill="#0e2230" stroke="rgba(34,225,255,0.5)" /><text x="490" y="115" textAnchor="middle" fill="#22e1ff" fontFamily="monospace" fontSize="14">u = −K x̂</text></g>
      <line x1="250" y1="66" x2="600" y2="66" stroke="#7c89b5" markerEnd="url(#ss-a)" /><text x="430" y="60" fill="#9aa3c0" fontFamily="monospace" fontSize="10">y</text>
      <line x1="600" y1="66" x2="600" y2="110" stroke="#7c89b5" /><line x1="600" y1="110" x2="552" y2="110" stroke="#7c89b5" markerEnd="url(#ss-a)" />
      <line x1="250" y1="156" x2="490" y2="156" stroke="#7c89b5" /><line x1="490" y1="156" x2="490" y2="136" stroke="#7c89b5" markerEnd="url(#ss-a)" /><text x="350" y="150" fill="#9aa3c0" fontFamily="monospace" fontSize="10">x̂</text>
      <line x1="430" y1="110" x2="20" y2="110" stroke="#7c89b5" /><line x1="20" y1="110" x2="20" y2="66" stroke="#7c89b5" /><line x1="20" y1="66" x2="68" y2="66" stroke="#7c89b5" markerEnd="url(#ss-a)" />
      <line x1="20" y1="110" x2="20" y2="156" stroke="#7c89b5" /><line x1="20" y1="156" x2="68" y2="156" stroke="#7c89b5" markerEnd="url(#ss-a)" /><text x="26" y="92" fill="#9aa3c0" fontFamily="monospace" fontSize="10">u</text>
    </svg>
  ),

  numerics: (
    <>
      <p>
        Everything is small dense linear algebra (the lab uses <T>{r`n=2`}</T>). The controllability and observability matrices are
        built by repeated multiplication; their <b>rank</b> comes from Gaussian elimination with a tolerance. Eigenvalues of the
        <T>{r`2\times2`}</T> blocks are the roots of <T>{r`s^2-\operatorname{tr}(M)s+\det(M)`}</T>. <b>Ackermann</b> needs
        <T>{r`\mathcal C^{-1}`}</T> and the matrix polynomial <T>{r`\phi(A)`}</T>; the <b>observer</b> gain is Ackermann applied to the
        dual <T>{r`(A^{\top},C^{\top})`}</T>. The <b>Riccati</b> equation is solved by integrating
        <T>{r`\dot P=A^{\top}P+PA-PBR^{-1}B^{\top}P+Q`}</T> to steady state (forward Euler), which converges to the stabilizing
        <T>{r`P`}</T>. The live regulator integrates the plant and the observer together with forward Euler.
      </p>
    </>
  ),

  pseudocode: `# controllability / observability
Wc = [B, A·B, …, A^{n-1}·B];  controllable = rank(Wc) == n
Wo = [C; C·A; …; C·A^{n-1}];  observable   = rank(Wo) == n

# pole placement (Ackermann), single input
phi = A^n + a1·A^{n-1} + … + an·I        # a = coeffs of desired char poly
K   = [0 … 0 1] · inv(Wc) · phi
# observer gain by duality
L   = ackermann(Aᵀ, Cᵀ, faster_poles)ᵀ

# LQR / Kalman: solve the Riccati ODE to steady state
P = I
repeat: Ṗ = AᵀP + PA − P B R⁻¹ Bᵀ P + Q;  P += Ṗ·dt   until ‖Ṗ‖→0
K = R⁻¹ Bᵀ P

# observer-based regulator (separation principle)
loop every dt:
    u   = −K · x̂
    x  += (A x + B u) dt
    x̂ += (A x̂ + B u + L (y − C x̂)) dt`,

  params: [
    { name: 'A, B, C', range: 'editable 2×2 / 2×1 / 1×2', role: 'the system; eig(A) are the open-loop modes.' },
    { name: 'example', range: 'healthy · unstable · can’t steer · can’t see · neither', role: 'each isolates one structural property.' },
    { name: 'architecture', range: 'open loop · full-state · observer+feedback · LQR+Kalman', role: 'the controller/observer pair; the tab dot flags validity here.' },
    { name: 'noise', range: '0 – 0.6', role: 'process/measurement noise; makes the Kalman gain the right estimator.' },
  ],

  refs: (
    <>
      Kalman (1960) <i>A new approach to linear filtering and prediction</i>; Kalman (1963) on controllability/observability;
      Luenberger (1964, 1971) on observers; Ackermann’s pole-placement formula; Anderson &amp; Moore, <i>Optimal Control: Linear
      Quadratic Methods</i>; Åström &amp; Murray, <i>Feedback Systems</i>.
    </>
  ),
}
