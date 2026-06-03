import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const wavelet: DemoNote = {
  title: 'Wavelet time–frequency decomposition',
  theme: 'Signals & time–frequency',
  tagline: 'From windowed Fourier to the Morlet wavelet and the time–frequency uncertainty relation.',

  foundations: (
    <>
      <p>
        The Fourier transform says <i>which</i> frequencies are present, but integrates over all time, so it cannot
        say <i>when</i>. To localize both, correlate the signal with a short, oscillating, <b>localized</b> probe and
        slide it. The probe is the <b>complex Morlet wavelet</b> — a complex sinusoid under a Gaussian envelope:
      </p>
      <TB>{r`\psi_f(\tau) = e^{i2\pi f\tau}\,e^{-\tau^2/2\sigma^2},\qquad \text{CWT}(f,t)=\sum_\tau x(t+\tau)\,\psi_f^{*}(\tau).`}</TB>
      <p>
        The complex carrier makes <T>{r`|\text{CWT}|^2`}</T> a smooth power estimate (insensitive to the carrier's phase),
        and the Gaussian envelope of width <T>{r`\sigma`}</T> sets the resolution. Because a Gaussian and its Fourier
        transform are both Gaussian, narrowing the probe in time necessarily widens it in frequency — the
        <b> time–frequency uncertainty principle</b>, which the demo makes you confront with a single slider.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'A localized probe',
      tex: r`\psi_f(\tau) = e^{i2\pi f\tau}\,e^{-\tau^2/2\sigma^2}`,
      note: <p>A sinusoid at frequency <T>{r`f`}</T> multiplied by a Gaussian window of standard deviation <T>{r`\sigma`}</T> (seconds): oscillation to read frequency, envelope to read time.</p>,
    },
    {
      title: 'Gaussian std → FWHM',
      tex: r`\text{FWHM} = K\sigma,\qquad K = 2\sqrt{2\ln 2}\approx 2.355`,
      note: <p>Resolution is usually quoted as the full width at half maximum. <T>{r`K`}</T> converts a Gaussian's std to its FWHM, used everywhere below.</p>,
    },
    {
      title: 'Three ways to set the width',
      tex: r`\sigma = \frac{n_{\text{cyc}}}{2\pi f}\ \big|\ \frac{\text{FWHM}_t}{K}\ \big|\ \frac{1}{2\pi(\text{FWHM}_f/K)}`,
      note: <p>(1) <b>constant-Q</b>: fix the number of cycles <T>{r`n_{\text{cyc}}`}</T>, so <T>{r`\sigma\propto 1/f`}</T> (wider in time at low <T>{r`f`}</T>). (2) fix the temporal FWHM at every frequency. (3) fix the spectral FWHM at every frequency.</p>,
    },
    {
      title: 'Spectral width of the envelope',
      tex: r`\text{FWHM}_f = \frac{K}{2\pi\sigma}`,
      note: <p>The Fourier transform of a Gaussian of std <T>{r`\sigma`}</T> (in time) is a Gaussian of std <T>{r`1/(2\pi\sigma)`}</T> (in frequency); multiply by <T>{r`K`}</T> for its FWHM.</p>,
    },
    {
      title: 'The uncertainty relation',
      tex: r`\text{FWHM}_t\cdot\text{FWHM}_f = \frac{K^2}{2\pi} \approx 0.88`,
      note: <p>A hard constant. The two read-out chips always satisfy it: sharpen one resolution and the other must blur. There is no way to be precise in both time and frequency at once.</p>,
    },
    {
      title: 'Power and the scalogram',
      tex: r`P(f,t) = \log_{10}\frac{|\text{CWT}(f,t)|^2}{\sigma_{\text{samp}}+1}`,
      note: <p>The squared magnitude, normalized for the wavelet's energy growth with width, then log-scaled and colour-mapped across 46 log-spaced frequencies (2–50 Hz) — the scalogram.</p>,
    },
  ],

  deep: [
    {
      heading: 'Deriving the time–frequency uncertainty product',
      body: (
        <>
          <p>The wavelet’s time envelope is a Gaussian of standard deviation <T>{r`\sigma`}</T>, <T>{r`g(\tau)=e^{-\tau^2/2\sigma^2}`}</T>. Its Fourier transform is again Gaussian, with standard deviation <T>{r`\sigma_f = 1/(2\pi\sigma)`}</T> in frequency. The full widths at half maximum are <T>{r`\text{FWHM}_t = K\sigma`}</T> and <T>{r`\text{FWHM}_f = K\sigma_f`}</T> with <T>{r`K = 2\sqrt{2\ln 2}`}</T>, so their product is independent of <T>{r`\sigma`}</T>:</p>
          <TB>{r`\text{FWHM}_t\cdot\text{FWHM}_f = K^2\,\sigma\,\sigma_f = \frac{K^2}{2\pi} \approx 0.88.`}</TB>
          <p>This is the Gaussian case of the general uncertainty inequality <T>{r`\sigma_t\,\sigma_f \ge 1/(4\pi)`}</T>; the Gaussian attains the bound, so the Morlet wavelet is optimally localized. No choice of width escapes the product — sharper time means coarser frequency and vice versa.</p>
        </>
      ),
    },
    {
      heading: 'Constant-Q versus fixed resolution',
      body: (
        <>
          <p>In the <T>{r`n_{\text{cyc}}`}</T> definition, <T>{r`\sigma = n_{\text{cyc}}/(2\pi f)`}</T>, so the wavelet always contains the same number of cycles. Then <T>{r`\text{FWHM}_f \propto f`}</T> and the relative bandwidth <T>{r`\text{FWHM}_f/f`}</T> is constant — a <b>constant-Q</b> filter bank, matching the logarithmic frequency axis of the scalogram and the roughly constant-Q tuning of biological frequency analysis. Fixing <T>{r`\text{FWHM}_t`}</T> or <T>{r`\text{FWHM}_f`}</T> instead gives a uniform (constant-bandwidth) analysis, better when a feature lives at one known scale. The trade-off is unavoidable in every case by the product above.</p>
        </>
      ),
    },
    {
      heading: 'Admissibility and the complex carrier',
      body: (
        <>
          <p>A strict wavelet must have zero mean (the admissibility condition) so that the transform is invertible and insensitive to a DC offset. The Morlet wavelet <T>{r`e^{i2\pi f\tau}g(\tau)`}</T> has a small non-zero mean that is negligible for <T>{r`n_{\text{cyc}}\gtrsim 5`}</T>; for very few cycles a correction term is formally required. The <b>complex</b> carrier (rather than a cosine) is what lets <T>{r`|\text{CWT}|^2`}</T> read instantaneous power independent of the carrier’s phase: real and imaginary parts are in quadrature, so their squared sum removes the oscillation, leaving a smooth envelope — exactly what the scalogram displays.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: resolutions at 10 Hz',
      body: (
        <>
          <p>In constant-<T>{r`Q`}</T> mode with <T>{r`n_{\text{cyc}}=7`}</T> at <T>{r`f=10`}</T> Hz, the Gaussian width is <T>{r`\sigma = 7/(2\pi\cdot 10) = 0.111`}</T> s. The two FWHM resolutions are</p>
          <TB>{r`\text{FWHM}_t = K\sigma = 2.355\times 0.111 = 0.262\ \text{s},\qquad \text{FWHM}_f = \frac{K}{2\pi\sigma} = 3.37\ \text{Hz},`}</TB>
          <p>and their product <T>{r`0.262\times 3.37 = 0.88`}</T> matches the uncertainty bound. Halving the wavelet to <T>{r`n_{\text{cyc}}=3.5`}</T> halves the temporal width to <T>{r`131`}</T> ms but doubles the spectral width to <T>{r`6.7`}</T> Hz — the two read-out chips display exactly these reciprocal values.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Morlet wavelet and time-frequency tiling">
      {/* wavelet */}
      <path d="M20,100 C40,100 50,40 60,100 C70,160 80,40 90,100 C100,160 110,60 120,100 C130,130 140,100 160,100" fill="none" stroke="#22e1ff" strokeWidth="1.8" />
      <path d="M20,100 C50,100 70,60 90,60 C110,60 130,100 160,100" fill="none" stroke="#ffc24d" strokeWidth="1.2" strokeDasharray="3 3" />
      <path d="M20,100 C50,100 70,140 90,140 C110,140 130,100 160,100" fill="none" stroke="#ffc24d" strokeWidth="1.2" strokeDasharray="3 3" />
      <text x="20" y="184" fill="#22e1ff" fontSize="11" fontFamily="monospace">Morlet ψ (Gaussian-windowed)</text>
      {/* tiling */}
      <text x="300" y="24" fill="#e9ebfb" fontSize="11" fontFamily="monospace">time–freq tiling</text>
      <rect x="300" y="34" width="200" height="150" fill="none" stroke="rgba(255,255,255,0.3)" />
      {/* low freq: wide time, short height */}
      <rect x="300" y="150" width="100" height="34" fill="rgba(155,140,255,0.18)" stroke="#9b8cff" />
      <rect x="400" y="150" width="100" height="34" fill="rgba(155,140,255,0.18)" stroke="#9b8cff" />
      {/* mid */}
      {[300, 350, 400, 450].map((x) => <rect key={x} x={x} y="100" width="50" height="50" fill="rgba(34,225,255,0.15)" stroke="#22e1ff" />)}
      {/* high freq: narrow time, tall */}
      {[300, 325, 350, 375, 400, 425, 450, 475].map((x) => <rect key={x} x={x} y="34" width="25" height="66" fill="rgba(255,45,143,0.12)" stroke="#ff2d8f" />)}
      <text x="300" y="198" fill="#9b8cff" fontSize="9" fontFamily="monospace">low f</text>
      <text x="466" y="198" fill="#ff2d8f" fontSize="9" fontFamily="monospace">high f</text>
    </svg>
  ),

  numerics: (
    <p>
      <T>{r`F_s=200`}</T> Hz, 3 s (<T>{r`N=600`}</T>). Each scalogram column convolves the signal with the wavelet truncated at
      <T>{r`\pm3\sigma`}</T>, over <T>{r`\lfloor N/\text{step}\rfloor`}</T> time points. Test signal: a <T>{r`\theta`}</T> rhythm + a Gaussian-windowed
      <T>{r`\beta`}</T> burst (centre 1.5 s, <T>{r`\sigma_{\text{win}}=0.28`}</T> s) + <T>{r`1/f`}</T> AR(1) noise. The inset draws the actual wavelet
      (cyan = real, pink = imaginary, amber = envelope). Recompute debounced 120 ms.
    </p>
  ),

  pseudocode: `
freqs ← logspace(2, 50, 46)                           # Hz
for f in freqs:
    sigma_s ← sigma(f) · Fs                            # std in samples (see modes)
    hw      ← round(3 · sigma_s)
    for c in time_centers:
        re ← 0 ;  im ← 0
        for tau in −hw .. hw:
            g  ← exp(−tau² / (2·sigma_s²))             # Gaussian envelope
            ph ← 2*pi*f*tau / Fs
            re += x[c+tau]·cos(ph)·g                   # convolve with Morlet
            im += x[c+tau]·sin(ph)·g
        power[f, c] ← log10( (re² + im²) / (sigma_s + 1) )
# sigma(f) = n_cyc/(2*pi*f)  |  FWHMt/K  |  1/(2*pi*(FWHMf/K)),  K = 2·sqrt(2·ln2)
`,
  params: [
    { name: 'width mode', range: 'n_cyc / FWHM-t / FWHM-f', role: 'which definition of σ is active' },
    { name: 'n_cyc', range: '2–15 (1, 7)', role: 'cycles per wavelet (constant-Q)' },
    { name: 'FWHM time', range: '40–800 ms (10, 300)', role: 'fixed temporal width at every f' },
    { name: 'FWHM freq', range: '1–15 Hz (0.5, 4)', role: 'fixed spectral width at every f' },
    { name: 'θ, β freq/amp', range: 'θ 3–12, β 14–40 Hz', role: 'component frequencies and amplitudes' },
    { name: '1/f noise', range: '0–1 (0.05, 0.35)', role: 'background noise level' },
  ],

  refs: <>Cohen, <i>Analyzing Neural Time Series Data</i> (2014); Cohen, “A better way to define and describe Morlet wavelets,” <i>NeuroImage</i> 199 (2019) 81.</>,
}
