import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const spectralParameterization: DemoNote = {
  title: 'Spectral parameterization (specparam / FOOOF)',
  theme: 'Signals & time–frequency',
  tagline: 'A neural power spectrum is an aperiodic 1/f background plus a few oscillatory peaks — separate them, and read each out on its own terms.',

  foundations: (
    <>
      <p>
        A power spectrum <T>{r`P(f)`}</T> of an LFP, ECoG or EEG signal is not flat — power falls off with frequency
        roughly as <T>{r`1/f^{\chi}`}</T>, an <b>aperiodic</b> background, on top of which sit narrow <b>oscillatory</b> peaks
        (theta, alpha, beta…). The trouble with the classic summary — average power in a band — is that it <i>conflates</i> these
        two: a rise in “alpha power” can mean a genuine oscillation grew, or simply that the whole <T>{r`1/f`}</T> background
        shifted up or tilted, with no oscillation involved at all.
      </p>
      <p>
        Spectral parameterization (the <b>FOOOF</b> / <b>specparam</b> model of Donoghue et al.) resolves the ambiguity by fitting
        an explicit generative model to the spectrum: an aperiodic component plus a small number of Gaussian peaks, all in
        <b> log power</b>. It returns interpretable parameters — the aperiodic <b>exponent</b> and <b>offset</b>, and each
        oscillation’s <b>centre frequency, power and bandwidth</b> — instead of a single, confounded band average.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'The aperiodic background',
      tex: r`L(f) = b - \log_{10}\!\big(k + f^{\chi}\big)`,
      note: (
        <>
          In log–log axes the <T>{r`1/f`}</T> background is a straight line of slope <T>{r`-\chi`}</T> and intercept <T>{r`b`}</T>
          (the <b>offset</b>); <T>{r`\chi`}</T> is the <b>aperiodic exponent</b>. The optional <b>knee</b> term <T>{r`k`}</T> lets the
          spectrum flatten at low frequencies and bend into its slope around <T>{r`f_k = k^{1/\chi}`}</T> — without a knee
          (<T>{r`k=0`}</T>) it is simply <T>{r`L(f)=b-\chi\log_{10} f`}</T>.
        </>
      ),
    },
    {
      title: 'Oscillations as Gaussian peaks',
      tex: r`G_i(f) = a_i\,\exp\!\Big(-\tfrac{(f-c_i)^2}{2\sigma_i^2}\Big)`,
      note: (
        <>
          Each rhythm is a bump <i>above</i> the background, modelled as a Gaussian in log power with centre frequency
          <T>{r`c_i`}</T>, power <T>{r`a_i`}</T> and width <T>{r`\sigma_i`}</T> (bandwidth <T>{r`\approx 2.35\,\sigma_i`}</T>, the
          full width at half maximum). The full model is the sum
          <TB>{r`\log_{10} P(f) = \underbrace{b-\log_{10}(k+f^{\chi})}_{\text{aperiodic}} \;+\; \sum_i a_i\,e^{-(f-c_i)^2/2\sigma_i^2}.`}</TB>
        </>
      ),
    },
    {
      title: 'Fit the background first',
      note: (
        <>
          The aperiodic line is fit by least squares to <T>{r`\log_{10}P`}</T> versus <T>{r`\log_{10}f`}</T>, but the peaks would
          bias it upward. So the fit is <b>robust</b>: fit, look at the residual, drop the points that sit well above the line
          (those are oscillations), and re-fit — a couple of iterations converge to the true background. Get this wrong and
          everything downstream is wrong: too steep an exponent pushes the flattened spectrum down and invents peaks; too shallow
          buries real ones.
        </>
      ),
    },
    {
      title: 'Flatten, then peel off peaks',
      tex: r`R(f) = \log_{10}P(f) - L(f)`,
      note: (
        <>
          Subtracting the aperiodic fit gives the <b>flattened spectrum</b> <T>{r`R(f)`}</T>, whose bumps above zero are the
          oscillations. Peaks are extracted greedily: find the tallest point of <T>{r`R`}</T>; if it clears a threshold, fit a
          Gaussian there, subtract it, and repeat until no bump remains or a peak cap is reached. Each surviving Gaussian is one
          reported oscillation.
        </>
      ),
    },
    {
      title: 'Goodness of fit',
      tex: r`R^2 = 1 - \dfrac{\sum_f\big(\log_{10}P(f)-\widehat{\log_{10}P}(f)\big)^2}{\sum_f\big(\log_{10}P(f)-\overline{\log_{10}P}\,\big)^2}`,
      note: (
        <>
          The reconstructed model <T>{r`\hat P = L + \sum_i G_i`}</T> is compared with the data by the coefficient of
          determination <T>{r`R^2`}</T> (and the mean absolute error). A good fit on a real spectrum is typically
          <T>{r`R^2 > 0.95`}</T>; a poor one warns that the aperiodic form (slope vs. knee) or the fitting range was wrong.
        </>
      ),
    },
  ],

  deep: [
    {
      heading: 'The aperiodic exponent is not noise — it is a signal',
      body: (
        <>
          <p>
            For decades the <T>{r`1/f`}</T> background was discarded as “noise.” It is not. The <b>exponent</b> <T>{r`\chi`}</T> and
            <b> offset</b> <T>{r`b`}</T> carry information of their own: a steeper exponent has been linked to a shift toward
            <b> inhibition</b> in the excitation/inhibition balance, and the exponent flattens with <b>age</b> and changes with
            <b> arousal, anaesthesia and task state</b>. Two recordings can have identical alpha-band <i>power</i> while differing only
            in their background tilt — no oscillation changed at all. Parameterization is what lets you tell that story correctly.
          </p>
        </>
      ),
    },
    {
      heading: 'Where it goes wrong',
      body: (
        <>
          <ul>
            <li><b>Fitting range.</b> Include too low a frequency and you may need a knee; too high and line noise / filter roll-off corrupts the slope.</li>
            <li><b>Knee or no knee.</b> Broadband (intracranial) data often need the knee term; scalp EEG over a narrow band usually does not.</li>
            <li><b>Overlapping peaks.</b> Two close rhythms can be fit as one wide Gaussian or split spuriously; bandwidth and peak-count limits guard against this.</li>
            <li><b>Wrong scale.</b> The model lives in <i>log</i> power vs <i>log</i> frequency; fitting in linear units gives the wrong exponent.</li>
            <li><b>Calling a peak an oscillation.</b> A statistically fit Gaussian is necessary but not sufficient — a brief, non-rhythmic transient can also leave a bump.</li>
          </ul>
        </>
      ),
    },
  ],

  schema: (
    <svg viewBox="0 0 560 200" width="100%" style={{ maxWidth: 520 }}>
      <text x="14" y="20" fill="#9aa3c0" fontFamily="monospace" fontSize="11">measured  log P(f)</text>
      <path d="M20,40 L120,70 Q150,40 180,68 L260,95 L520,150" fill="none" stroke="#22e1ff" strokeWidth="2" />
      <text x="300" y="36" fill="#9b8cff" fontFamily="monospace" fontSize="11">= aperiodic  b − log₁₀(k+f^χ)</text>
      <path d="M20,52 L520,156" fill="none" stroke="#9b8cff" strokeWidth="1.6" strokeDasharray="5 3" />
      <text x="300" y="184" fill="#54e6a0" fontFamily="monospace" fontSize="11">+ Σ Gaussian peaks (CF, PW, BW)</text>
      <path d="M120,176 Q150,150 180,176" fill="none" stroke="#54e6a0" strokeWidth="1.8" />
      <text x="14" y="196" fill="#9aa3c0" fontFamily="monospace" fontSize="10">log frequency →</text>
    </svg>
  ),

  numerics: (
    <>
      <p>
        The spectrum is sampled on a <b>log-spaced</b> frequency grid (1–95 Hz in the demo). The aperiodic line is a closed-form
        weighted least-squares fit of <T>{r`\log_{10}P`}</T> on <T>{r`\log_{10}f`}</T> with three robust iterations that drop points
        more than a small margin above the current line. Peaks are extracted by repeated maximum-finding on the residual, each fit
        with a Gaussian whose width comes from its half-maximum crossings, then subtracted before the next. The reconstructed model is
        scored by <T>{r`R^2`}</T> against the data. (The reference implementation, FOOOF, instead uses non-linear
        <T>{r`\texttt{curve\_fit}`}</T> for the aperiodic term and a final simultaneous refit of all Gaussians; the model is identical.)
      </p>
    </>
  ),

  pseudocode: `# specparam / FOOOF on a log-spaced spectrum P(f)
y = log10(P);  x = log10(f)

# 1. robust aperiodic fit  L = b − χ·x   (drop peak points, refit)
keep = all(True)
repeat 3×:
    b, slope = wls(x[keep], y[keep]);  χ = −slope
    keep = (y − (b + slope·x)) < margin      # exclude bumps (oscillations)

# 2. flatten and peel off Gaussian peaks
R = y − (b − log10(k + f**χ))
peaks = []
repeat up to N times:
    i = argmax(R);  if R[i] < thresh: break
    cf, pw = f[i], R[i];  bw = half_max_width(R, i)
    R −= pw · exp(−(f − cf)² / (2·(bw/2.35)²))
    peaks.append((cf, pw, bw))

# 3. reconstruct + score
model = L + Σ gaussians;   R² = 1 − SS_res / SS_tot`,

  params: [
    { name: 'spectrum', range: 'alpha · beta · none · knee · two peaks', role: 'a synthetic ground-truth spectrum (known aperiodic + peaks + noise) to recover.' },
    { name: 'exponent χ', range: '0 – 3.5', role: 'slope of the aperiodic background in log–log; steeper = more low-frequency dominated.' },
    { name: 'offset b', range: '−1 – 3', role: 'vertical position of the background (broadband power).' },
    { name: 'knee freq', range: '0 (none) – 20 Hz', role: 'frequency where the background bends from flat into its 1/f slope.' },
    { name: 'auto-fit', range: 'button', role: 'robust least-squares fit of the aperiodic background; the peaks then emerge from the residual.' },
  ],

  refs: (
    <>
      Donoghue et al. (2020) <i>Parameterizing neural power spectra into periodic and aperiodic components</i>, Nature Neuroscience
      (the FOOOF / specparam model); Gao, Peterson &amp; Voytek (2017) on the 1/f exponent and E/I balance; He (2014) on scale-free
      brain activity; Voytek et al. (2015) on the exponent and aging.
    </>
  ),
}
