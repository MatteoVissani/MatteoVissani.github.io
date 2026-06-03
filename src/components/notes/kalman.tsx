import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const kalman: DemoNote = {
  title: 'Kalman-filter BCI decoder',
  theme: 'Signals & time–frequency',
  tagline: 'From a linear-Gaussian state-space model to the predict/update recursion of optimal tracking.',

  foundations: (
    <>
      <p>
        A motor brain–computer interface must turn a noisy neural read-out into a smooth cursor trajectory. Model the
        cursor as a hidden <b>state</b> <T>{r`\mathbf x=[\,p,\,v\,]^\top`}</T> (position, velocity) that evolves by a known
        linear rule and is observed through noise. If both the dynamics and the noise are linear and Gaussian, the
        <b> Kalman filter</b> is the exact, optimal (minimum-mean-square) estimator. It maintains a Gaussian belief
        — a mean <T>{r`\hat{\mathbf x}`}</T> and a covariance <T>{r`\mathbf P`}</T> — and alternates two moves:
      </p>
      <TB>{r`\text{predict (trust the model)}\ \longrightarrow\ \text{update (trust the measurement)}.`}</TB>
      <p>
        Predict pushes the belief forward through the motion model and grows its uncertainty by the process noise
        <T>{r`q`}</T>; update pulls it toward the new measurement by an amount set by the <b>Kalman gain</b>, which weighs
        model uncertainty against measurement noise <T>{r`R`}</T>. Tracking quality lives entirely in the balance of
        <T>{r`q`}</T> and <T>{r`R`}</T>.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'State-space model',
      tex: r`\mathbf x_{t+1} = \mathbf F\,\mathbf x_t + \mathbf w,\quad z_t = \mathbf H\,\mathbf x_t + v,\quad \mathbf F=\begin{bmatrix}1&\Delta t\\0&1\end{bmatrix},\ \mathbf H=[\,1\ \,0\,]`,
      note: <p>Constant-velocity dynamics: position advances by <T>{r`v\,\Delta t`}</T>, velocity drifts by white acceleration <T>{r`\mathbf w`}</T>. The read-out <T>{r`z`}</T> measures position only, with noise <T>{r`v\sim\mathcal N(0,R)`}</T>, <T>{r`R=\sigma^2`}</T>.</p>,
    },
    {
      title: 'Predict the mean',
      tex: r`\hat p \leftarrow \hat p + \hat v\,\Delta t,\qquad \hat v\ \text{unchanged}`,
      note: <p>Propagate the belief through <T>{r`\mathbf F`}</T>: the predicted position uses the current velocity estimate.</p>,
    },
    {
      title: 'Predict the covariance',
      tex: r`\mathbf P \leftarrow \mathbf F\mathbf P\mathbf F^\top + \mathbf Q,\quad \mathbf Q = q\begin{bmatrix}\Delta t^3/3 & \Delta t^2/2\\ \Delta t^2/2 & \Delta t\end{bmatrix}`,
      note: <p>Uncertainty grows. Expanding <T>{r`\mathbf F\mathbf P\mathbf F^\top`}</T> gives the demo's element updates; <T>{r`\mathbf Q`}</T> is the continuous white-noise-acceleration process noise with intensity <T>{r`q`}</T>.</p>,
    },
    {
      title: 'Innovation',
      tex: r`\nu = z - \mathbf H\hat{\mathbf x} = z - \hat p,\qquad S = \mathbf H\mathbf P\mathbf H^\top + R = P_{00}+R`,
      note: <p>The surprise: measured minus predicted position. <T>{r`S`}</T> is its variance — how much disagreement is expected.</p>,
    },
    {
      title: 'Kalman gain',
      tex: r`\mathbf K = \mathbf P\mathbf H^\top S^{-1} = \begin{bmatrix}P_{00}/S\\ P_{01}/S\end{bmatrix}`,
      note: <p>The optimal blend factor. Large model uncertainty <T>{r`P_{00}`}</T> ⇒ trust the measurement (gain →1); large <T>{r`R`}</T> ⇒ trust the model (gain →0).</p>,
    },
    {
      title: 'Update',
      tex: r`\hat{\mathbf x} \leftarrow \hat{\mathbf x} + \mathbf K\nu,\qquad \mathbf P \leftarrow (\mathbf I - \mathbf K\mathbf H)\,\mathbf P`,
      note: <p>Correct the mean toward the measurement (note position and velocity both move, via <T>{r`K_0,K_1`}</T>) and shrink the covariance. Crucially, a position-only measurement still updates velocity — that is how the filter smooths.</p>,
    },
    {
      title: 'The tuning trade-off',
      tex: r`q\ \text{small}\Rightarrow\text{lag};\quad q\ \text{large}\Rightarrow\text{jitter}`,
      note: <p>Small <T>{r`q`}</T> over-trusts the constant-velocity model and lags fast reaches; large <T>{r`q`}</T> follows every noisy sample. Matching <T>{r`q`}</T> to the true acceleration statistics minimizes the RMSE — the BCI tuning problem.</p>,
    },
  ],

  deep: [
    {
      heading: 'The gain minimizes the posterior variance',
      body: (
        <>
          <p>After prediction the state estimate has covariance <T>{r`\mathbf P^-`}</T>. Given a scalar measurement <T>{r`z = \mathbf H\mathbf x + v`}</T> with <T>{r`\operatorname{Var}(v)=R`}</T>, consider the linear update <T>{r`\hat{\mathbf x} = \hat{\mathbf x}^- + \mathbf K\,(z - \mathbf H\hat{\mathbf x}^-)`}</T> for an as-yet-unknown gain <T>{r`\mathbf K`}</T>. The posterior covariance is</p>
          <TB>{r`\mathbf P = (\mathbf I - \mathbf K\mathbf H)\,\mathbf P^-(\mathbf I - \mathbf K\mathbf H)^\top + \mathbf K R\,\mathbf K^\top.`}</TB>
          <p>Minimizing its trace, <T>{r`\partial\,\operatorname{tr}\mathbf P/\partial\mathbf K = 0`}</T>, gives the <b>Kalman gain</b></p>
          <TB>{r`\mathbf K = \mathbf P^-\mathbf H^\top\big(\mathbf H\mathbf P^-\mathbf H^\top + R\big)^{-1},`}</TB>
          <p>which for the position-only measurement reduces to the demo’s <T>{r`K_0 = P_{00}/S`}</T>, <T>{r`K_1 = P_{01}/S`}</T> with <T>{r`S = P_{00}+R`}</T>. The off-diagonal term <T>{r`P_{01}`}</T> is what lets a position measurement correct the velocity estimate — the mechanism behind the filter’s smoothing.</p>
        </>
      ),
    },
    {
      heading: 'Where the process-noise matrix Q comes from',
      body: (
        <>
          <p>The constant-velocity model is driven by a continuous white-noise acceleration of spectral density <T>{r`q`}</T>. Integrating that acceleration over one step <T>{r`\Delta t`}</T> produces correlated increments in velocity and position; the resulting discrete covariance is</p>
          <TB>{r`\mathbf Q = q\begin{bmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{bmatrix}.`}</TB>
          <p>The <T>{r`\Delta t^3/3`}</T> position term, <T>{r`\Delta t^2/2`}</T> cross term, and <T>{r`\Delta t`}</T> velocity term are exactly the element updates in the predict step. Larger <T>{r`q`}</T> assumes a more agile target and makes the filter trust measurements more.</p>
        </>
      ),
    },
    {
      heading: 'Steady state and the bias–variance tuning',
      body: (
        <>
          <p>Run long enough with fixed <T>{r`R`}</T> and <T>{r`q`}</T>, the covariance and gain converge to constants (the solution of the algebraic Riccati equation); the Kalman filter then behaves like a fixed-coefficient smoother (an α–β filter). The steady-state gain depends only on the dimensionless ratio <T>{r`q\,\Delta t^3 / R`}</T>. A small ratio yields a small gain — heavy smoothing, low variance but lag (bias) on fast reaches; a large ratio yields a gain near 1 — little smoothing, low lag but high variance. Minimizing tracking error means matching this ratio to the true reach dynamics, which is precisely the practical tuning problem in a motor BCI.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: the tuning ratio at the defaults',
      body: (
        <>
          <p>The steady-state behaviour depends on the dimensionless ratio <T>{r`\rho = q\,\Delta t^3 / R`}</T>. With the defaults <T>{r`q=0.02`}</T>, <T>{r`\Delta t = 0.045`}</T> s and <T>{r`R=\sigma^2=0.18^2=0.0324`}</T>,</p>
          <TB>{r`\rho = \frac{0.02\times(0.045)^3}{0.0324} = \frac{1.82\times 10^{-6}}{0.0324} \approx 5.6\times 10^{-5}.`}</TB>
          <p>This is a small ratio, so the filter trusts its constant-velocity model far more than each measurement: the steady-state position gain is well below 1 and the estimate is heavily smoothed, suppressing most of the read-out noise. Raising <T>{r`q`}</T> by <T>{r`100\times`}</T> raises <T>{r`\rho`}</T> to <T>{r`\sim 6\times10^{-3}`}</T>, increasing the gain so the estimate tracks fast reaches but admits more noise — the lag-versus-jitter trade-off the sliders expose.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 180" role="img" aria-label="Kalman predict-update loop">
      <defs><marker id="kalarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker></defs>
      <rect x="60" y="60" width="130" height="60" rx="8" fill="rgba(155,140,255,0.1)" stroke="#9b8cff" strokeWidth="2" />
      <text x="125" y="86" textAnchor="middle" fill="#9b8cff" fontSize="12" fontFamily="monospace">PREDICT</text>
      <text x="125" y="104" textAnchor="middle" fill="#9b8cff" fontSize="10" fontFamily="monospace">x̂←Fx̂, P←FPFᵀ+Q</text>
      <rect x="330" y="60" width="130" height="60" rx="8" fill="rgba(34,225,255,0.1)" stroke="#22e1ff" strokeWidth="2" />
      <text x="395" y="86" textAnchor="middle" fill="#22e1ff" fontSize="12" fontFamily="monospace">UPDATE</text>
      <text x="395" y="104" textAnchor="middle" fill="#22e1ff" fontSize="10" fontFamily="monospace">x̂←x̂+K(z−Hx̂)</text>
      <line x1="190" y1="78" x2="328" y2="78" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#kalarr)" />
      <path d="M330,108 C260,150 190,150 192,118" fill="none" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#kalarr)" />
      {/* measurement in */}
      <line x1="395" y1="20" x2="395" y2="58" stroke="#ff2d8f" strokeWidth="2" markerEnd="url(#kalarr)" />
      <text x="402" y="26" fill="#ff2d8f" fontSize="11" fontFamily="monospace">z (neural read-out)</text>
      <text x="232" y="150" fill="#22e1ff" fontSize="10" fontFamily="monospace">recurse each Δt</text>
    </svg>
  ),

  numerics: (
    <p>
      Two axes, independent filters, <T>{r`\Delta t=0.045`}</T> s, 2 steps per frame. The true cursor follows a spring–damper
      <T>{r`\ddot p = 6.5(p_{\text{tgt}}-p) - 3.2\dot p`}</T> toward 9 center-out targets (centre + 8 on radius 0.8), dwelling 0.25 s.
      The read-out is <T>{r`z=p_{\text{true}}+\sigma\xi`}</T>. RMSE of the raw read-out and the Kalman estimate is averaged over the trailing 200 steps; their ratio is the “× better” factor.
    </p>
  ),

  pseudocode: `
# per axis: state (p, v), covariance (P00, P01, P11);  R = sigma², dt, q
# ---- predict ----
p   ← p + v·dt
P00 ← P00 + 2·dt·P01 + dt²·P11 + q·dt³/3
P01 ← P01 + dt·P11 + q·dt²/2
P11 ← P11 + q·dt
# ---- update with measurement z (position) ----
S   ← P00 + R
K0  ← P00 / S ;  K1 ← P01 / S                          # Kalman gain
nu  ← z − p                                            # innovation
p   ← p + K0·nu ;  v ← v + K1·nu                        # note: z corrects v too
P00 ← (1 − K0)·P00
P01 ← (1 − K0)·P01
P11 ← P11 − K1·P01
`,
  params: [
    { name: 'measurement noise σ', range: '0.03–0.45 (0.01, 0.18)', role: 'read-out noise; sets R = σ²' },
    { name: 'process noise q', range: '0.001–0.1 (0.001, 0.02)', role: 'assumed acceleration intensity; filter flexibility' },
  ],

  refs: <>Kalman, <i>Trans. ASME J. Basic Eng.</i> 82 (1960) 35; Wu et al., <i>Neural Comput.</i> 18 (2006) 80; Bar-Shalom, Li &amp; Kirubarajan, <i>Estimation with Applications to Tracking and Navigation</i> (2001).</>,
}
