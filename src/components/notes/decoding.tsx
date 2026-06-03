import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const decoding: DemoNote = {
  title: 'Population coding & neural decoding',
  theme: 'Neural coding & information',
  tagline: 'From Poisson likelihood to the maximum-likelihood decoder and the Cramér–Rao bound.',

  foundations: (
    <>
      <p>
        A single neuron is a noisy sensor, but a <b>population</b> with overlapping tuning curves encodes a
        continuous variable precisely. Each neuron <T>{r`i`}</T> has a preferred stimulus <T>{r`c_i`}</T> and a
        <b> tuning curve</b> <T>{r`f_i(s)`}</T> giving its expected spike count; counts are <b>Poisson</b> noisy.
        Two questions follow. (1) Given the noisy counts, what is the best estimate <T>{r`\hat s`}</T> of the
        stimulus? (2) How precise can <i>any</i> estimator be? The answers are the <b>maximum-likelihood</b>
        decoder and the <b>Cramér–Rao bound</b>, the latter set by the <b>Fisher information</b>
        <T>{r`J(s)`}</T>:
      </p>
      <TB>{r`\mathrm{Var}(\hat s) \;\ge\; \frac{1}{J(s)},\qquad J(s) = \mathbb E\!\left[\left(\frac{\partial}{\partial s}\ln P(\mathbf r\mid s)\right)^2\right].`}</TB>
      <p>
        Fisher information measures how sharply the likelihood changes with the stimulus: steep tuning slopes
        and more neurons make the data more informative, shrinking the achievable error.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Tuning + Poisson noise',
      tex: r`f_i(s) = 0.5 + r_{\max}\,e^{-(s-c_i)^2/2\sigma^2},\quad r_i\sim\text{Poisson}(f_i(s))`,
      note: <p><T>{r`N`}</T> Gaussian tuning curves tile <T>{r`s\in[0,180]^\circ`}</T> with centres <T>{r`c_i=\tfrac{i}{N-1}180^\circ`}</T>. The 0.5 baseline keeps the log-likelihood finite away from peaks.</p>,
    },
    {
      title: 'Likelihood of the counts',
      tex: r`P(\mathbf r\mid s) = \prod_i \frac{f_i(s)^{r_i}e^{-f_i(s)}}{r_i!}`,
      note: <p>Independent Poisson neurons multiply. Taking the log turns the product into a sum.</p>,
    },
    {
      title: 'Log-likelihood',
      tex: r`\ln P(\mathbf r\mid s) = \sum_i\big[r_i\ln f_i(s) - f_i(s)\big] + \text{const}`,
      note: <p>The <T>{r`\ln r_i!`}</T> term does not depend on <T>{r`s`}</T>, so it drops out of the maximization.</p>,
    },
    {
      title: 'Maximum-likelihood decode',
      tex: r`\hat s = \argmax_{g}\ \sum_i\big[r_i\ln f_i(g) - f_i(g)\big]`,
      note: <p>The decoder evaluates this sum on the integer grid <T>{r`g\in\{0,\dots,180\}`}</T> each trial and returns the maximizer — the pink <T>{r`\hat s`}</T> line in the demo.</p>,
    },
    {
      title: 'Fisher information for Poisson',
      tex: r`J(s) = \sum_i \frac{\big(f_i'(s)\big)^2}{f_i(s)}`,
      note: <p>For independent Poisson units the Fisher information adds across neurons; each term is the squared tuning slope divided by the local rate.</p>,
    },
    {
      title: 'Insert Gaussian tuning',
      tex: r`f_i'(s) = -f_i(s)\,\frac{s-c_i}{\sigma^2}\ \Rightarrow\ J(s) = \frac{1}{\sigma^4}\sum_i f_i(s)\,(c_i-s)^2`,
      note: <p>Differentiating the Gaussian and substituting cancels one factor of <T>{r`f_i`}</T>. This is exactly the sum the code accumulates.</p>,
    },
    {
      title: 'The bound vs. the error',
      tex: r`\mathrm{CRB} = 1/\sqrt{J(s)},\qquad \mathrm{RMSE}/\mathrm{CRB}\to 1`,
      note: <p>The demo overlays <T>{r`\mathcal N(0,\mathrm{CRB}^2)`}</T> on the empirical error histogram (200 trials). The maximum-likelihood decoder is asymptotically efficient, so the ratio sits near 1. Narrow tuning / more neurons raise <T>{r`J`}</T> and shrink both — but tuning that is too narrow leaves most neurons silent and the estimate degrades (the width–information trade-off).</p>,
    },
  ],

  deep: [
    {
      heading: 'Fisher information for a Poisson neuron, in full',
      body: (
        <>
          <p>For a single neuron with mean count <T>{r`f(s)`}</T> and Poisson statistics, the log-likelihood of a count <T>{r`r`}</T> is <T>{r`\ell = r\ln f(s) - f(s) - \ln r!`}</T>. Its derivative (the score) is</p>
          <TB>{r`\frac{\partial \ell}{\partial s} = \Big(\frac{r}{f} - 1\Big) f'(s).`}</TB>
          <p>Fisher information is the variance of the score. Since <T>{r`\operatorname{Var}(r) = f`}</T> for Poisson, <T>{r`\operatorname{Var}(r/f) = 1/f`}</T>, hence</p>
          <TB>{r`J_i(s) = \mathbb E\!\left[\Big(\frac{\partial\ell}{\partial s}\Big)^2\right] = \frac{\big(f'(s)\big)^2}{f(s)}.`}</TB>
          <p>Independent neurons contribute additively, <T>{r`J(s) = \sum_i J_i(s)`}</T>. Substituting the Gaussian tuning curve, for which <T>{r`f'_i(s) = -f_i(s)(s-c_i)/\sigma^2`}</T>, gives the population Fisher information</p>
          <TB>{r`J(s) = \frac{1}{\sigma^4}\sum_i f_i(s)\,(c_i - s)^2,`}</TB>
          <p>exactly the quantity accumulated in the code, and the Cramér–Rao bound is <T>{r`\sigma_{\hat s} \ge 1/\sqrt{J(s)}`}</T>.</p>
        </>
      ),
    },
    {
      heading: 'Dense uniform tiling makes J constant',
      body: (
        <>
          <p>If the preferred stimuli <T>{r`c_i`}</T> tile the range densely and uniformly with spacing <T>{r`\Delta c`}</T>, the sum becomes an integral:</p>
          <TB>{r`J(s) \approx \frac{1}{\sigma^4\,\Delta c}\int r_{\max}\,e^{-(c-s)^2/2\sigma^2}\,(c-s)^2\,dc = \frac{\sqrt{2\pi}\,r_{\max}}{\sigma\,\Delta c},`}</TB>
          <p>using the Gaussian moment <T>{r`\int e^{-x^2/2\sigma^2}x^2\,dx = \sqrt{2\pi}\,\sigma^3`}</T>. The surviving scaling <T>{r`J \propto r_{\max}/(\sigma\,\Delta c)`}</T> shows information grows with peak rate and neuron density and falls with tuning width. Narrower tuning therefore <i>increases</i> information per neuron — but only while enough neurons still respond to a given <T>{r`s`}</T>. With a fixed population, shrinking <T>{r`\sigma`}</T> too far leaves gaps between curves and the estimate degrades, which is the width–information trade-off the slider exposes.</p>
        </>
      ),
    },
    {
      heading: 'Why maximum likelihood attains the bound',
      body: (
        <>
          <p>The maximum-likelihood estimator is <b>asymptotically efficient</b>: as the amount of data (here, total spikes) grows, its distribution tends to <T>{r`\mathcal N\big(s,\,1/J(s)\big)`}</T>, so its standard deviation approaches the Cramér–Rao bound. This is why the empirical error histogram in the demo is well described by the overlaid Gaussian of width <T>{r`1/\sqrt J`}</T>, and the reported ratio <T>{r`\text{RMSE}/\text{CRB}`}</T> sits just above 1 rather than far above it. Departures appear only when few neurons respond (small effective sample) or near the edges of the stimulus range, where the estimator is biased.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: the Cramér–Rao bound at the defaults',
      body: (
        <>
          <p>Use the dense-tiling estimate with the default settings <T>{r`N=20`}</T>, <T>{r`\sigma=20^\circ`}</T>, <T>{r`r_{\max}=25`}</T>. The preferred-stimulus spacing is <T>{r`\Delta c = 180^\circ/(N-1) = 9.47^\circ`}</T>, so</p>
          <TB>{r`J \approx \frac{\sqrt{2\pi}\,r_{\max}}{\sigma\,\Delta c} = \frac{2.507\times 25}{20\times 9.47} \approx 0.33\ \text{deg}^{-2},\qquad \mathrm{CRB} = \frac{1}{\sqrt{J}} \approx 1.7^\circ.`}</TB>
          <p>The decoder's measured RMSE sits just above this floor. Halving the tuning width to <T>{r`\sigma=10^\circ`}</T> doubles <T>{r`J`}</T> and lowers the bound to <T>{r`\approx 1.2^\circ`}</T> — provided neurons still respond at <T>{r`s`}</T>; pushed further the dense-tiling assumption fails and the empirical error rises above the bound.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Tuning curves to Poisson counts to a decoder">
      <defs><marker id="dcarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker></defs>
      {/* tuning curves */}
      {[60, 120, 180].map((cx, i) => (
        <path key={i} d={`M30,150 Q${cx},${40} ${cx + 60},150`} fill="none" stroke="#9b8cff" strokeWidth="1.6" opacity="0.7" />
      ))}
      <text x="30" y="172" fill="#9b8cff" fontSize="11" fontFamily="monospace">tuning f<tspan dy="3" fontSize="8">i</tspan><tspan dy="-3">(s)</tspan></text>
      {/* stimulus marker */}
      <line x1="120" y1="30" x2="120" y2="150" stroke="#fff" strokeWidth="1.4" strokeDasharray="4 3" />
      <text x="124" y="40" fill="#fff" fontSize="11" fontFamily="monospace">s</text>
      {/* arrow to counts */}
      <line x1="250" y1="95" x2="305" y2="95" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#dcarr)" />
      <text x="252" y="86" fill="#22e1ff" fontSize="10" fontFamily="monospace">Poisson</text>
      {/* count stems */}
      {[330, 348, 366, 384, 402].map((x, i) => { const h = [30, 55, 70, 48, 26][i]; return <line key={i} x1={x} y1="150" x2={x} y2={150 - h} stroke="#22e1ff" strokeWidth="3" /> })}
      <text x="330" y="172" fill="#22e1ff" fontSize="11" fontFamily="monospace">counts r<tspan dy="3" fontSize="8">i</tspan></text>
      {/* arrow to decoder */}
      <line x1="420" y1="95" x2="455" y2="95" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#dcarr)" />
      <rect x="458" y="74" width="54" height="42" rx="6" fill="none" stroke="#ff2d8f" strokeWidth="2" />
      <text x="485" y="92" textAnchor="middle" fill="#ff2d8f" fontSize="10" fontFamily="monospace">arg max</text>
      <text x="485" y="106" textAnchor="middle" fill="#ff2d8f" fontSize="10" fontFamily="monospace">ŝ</text>
    </svg>
  ),

  numerics: (
    <p>
      Poisson sampling uses Knuth's multiplication method for <T>{r`\lambda\le30`}</T> and a Gaussian approximation
      <T>{r`\mathrm{round}(\lambda+\sqrt\lambda\,\xi)`}</T> for <T>{r`\lambda>30`}</T>. The decoder grid-searches <T>{r`g`}</T>
      over <T>{r`0\!-\!180^\circ`}</T> at 1° resolution. The error histogram uses 31 bins on <T>{r`[-30,30]^\circ`}</T> with the
      <T>{r`\mathcal N(0,\mathrm{CRB}^2)`}</T> overlay; RMSE and <T>{r`J`}</T> are averaged over the trailing 200 trials and refresh every 300 ms.
    </p>
  ),

  pseudocode: `
f(s, i) = 0.5 + rmax·exp(−(s − c_i)² / (2·sigma²))   # c_i = i/(N−1)·180

# one trial
for i in 1 .. N:
    r[i] ← Poisson(f(s, i))

# maximum-likelihood decode on a 1° grid
best ← −inf
for g in 0 .. 180:
    L ← sum over i of ( r[i]·ln f(g, i) − f(g, i) )
    if L > best:  best ← L ;  shat ← g

# Fisher information and Cramér–Rao bound
J   ← (1/sigma⁴) · sum over i of ( f(s, i)·(c_i − s)² )
CRB ← 1 / sqrt(J)
`,
  params: [
    { name: 's', range: '10–170° (1, 90)', role: 'true stimulus to decode' },
    { name: 'σ', range: '6–45° (1, 20)', role: 'tuning width' },
    { name: 'N', range: '6–40 (1, 20)', role: 'number of neurons' },
    { name: 'r_max', range: '5–50 (1, 25)', role: 'peak expected count' },
  ],

  refs: <>Dayan &amp; Abbott, <i>Theoretical Neuroscience</i> (2001), ch. 3–4; Seung &amp; Sompolinsky, <i>PNAS</i> 90 (1993) 10749; Paradiso, <i>Biol. Cybern.</i> 58 (1988) 35.</>,
}
