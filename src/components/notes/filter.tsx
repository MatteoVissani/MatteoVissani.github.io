import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const filter: DemoNote = {
  title: 'Digital filter designer (windowed-sinc FIR)',
  theme: 'Signals & time–frequency',
  tagline: 'From the ideal brick-wall response to a windowed, truncated, linear-phase FIR kernel.',

  foundations: (
    <>
      <p>
        A finite-impulse-response (FIR) filter computes each output as a weighted sum of recent inputs,
        <T>{r`y[n]=\sum_k h[k]\,x[n-k]`}</T>; the weights <T>{r`h[k]`}</T> are the <b>impulse response</b>. In the frequency
        domain this convolution becomes multiplication by <T>{r`H(f)=\sum_k h[k]e^{-i2\pi fk/F_s}`}</T>. To design a
        band-pass we ask: what <T>{r`h`}</T> gives the ideal response that is 1 inside <T>{r`[f_L,f_H]`}</T> and 0 outside? The
        inverse transform of a rectangle is a <b>sinc</b>, so the ideal kernel is a difference of two sincs:
      </p>
      <TB>{r`h_{\text{ideal}}[n] = \frac{\sin(\omega_H n)-\sin(\omega_L n)}{\pi n},\qquad \omega = 2\pi f/F_s.`}</TB>
      <p>
        That kernel is infinitely long. Truncating it to <T>{r`M`}</T> taps creates ripple (Gibbs); multiplying by a smooth
        <b> window</b> (here Hamming) tames it. Keeping the kernel symmetric makes the phase exactly linear —
        a constant group delay of <T>{r`(M-1)/2`}</T> samples, with no waveform distortion.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Convolution ⇄ multiplication',
      tex: r`y[n]=\sum_k h[k]\,x[n-k]\ \Longleftrightarrow\ Y(f)=H(f)X(f)`,
      note: <p>Filtering in time is multiplication in frequency. So shaping <T>{r`H(f)`}</T> is the whole design problem.</p>,
    },
    {
      title: 'Ideal band-pass',
      tex: r`H_{\text{ideal}}(f) = \mathbb{1}[\,f_L \le |f| \le f_H\,]`,
      note: <p>The target is a rectangle in frequency: pass the band, reject everything else.</p>,
    },
    {
      title: 'Inverse-transform to a sinc',
      tex: r`h_{\text{ideal}}[n] = \frac{\sin(\omega_H n)-\sin(\omega_L n)}{\pi n},\quad h_{\text{ideal}}[0]=\frac{\omega_H-\omega_L}{\pi}`,
      note: <p>The inverse DTFT of the rectangle is a difference of sincs (with the <T>{r`n=0`}</T> value taken as the limit).</p>,
    },
    {
      title: 'Truncate + window',
      tex: r`h[k] = h_{\text{ideal}}[k-\tfrac{M-1}{2}]\cdot\Big(0.54 - 0.46\cos\tfrac{2\pi k}{M-1}\Big)`,
      note: <p>Keep <T>{r`M`}</T> (odd) taps centred at <T>{r`(M-1)/2`}</T> and multiply by the Hamming window, which fixes the stop-band attenuation near <T>{r`-43`}</T> dB.</p>,
    },
    {
      title: 'Verify the response',
      tex: r`|H(f)| = \Big|\sum_{k=0}^{M-1} h[k]\,e^{-i2\pi fk/F_s}\Big|`,
      note: <p>Evaluated at 240 frequencies on <T>{r`[0,F_s/2]`}</T> and normalized to its peak — the top panel.</p>,
    },
    {
      title: 'Apply by convolution',
      tex: r`y[i] = \sum_k h[k]\,x[i-k+\tfrac{M-1}{2}]`,
      note: <p>Centred convolution (the <T>{r`(M-1)/2`}</T> shift compensates the group delay). More taps ⇒ sharper transition band but longer impulse response and delay — the length-vs-selectivity trade-off.</p>,
    },
  ],

  deep: [
    {
      heading: 'Why the ideal kernel is a sinc',
      body: (
        <>
          <p>The impulse response is the inverse discrete-time Fourier transform of the desired frequency response. For an ideal low-pass with cutoff <T>{r`\omega_c`}</T>,</p>
          <TB>{r`h_{\text{lp}}[n] = \frac{1}{2\pi}\int_{-\omega_c}^{\omega_c} e^{i\omega n}\,d\omega = \frac{\sin(\omega_c n)}{\pi n}.`}</TB>
          <p>A band-pass with edges <T>{r`\omega_L,\omega_H`}</T> is the difference of two low-pass responses, giving the difference of sincs used in the design. The <T>{r`n=0`}</T> value is the limit <T>{r`(\omega_H-\omega_L)/\pi`}</T>, equal to the integral of the passband — i.e. the DC gain of the kernel.</p>
        </>
      ),
    },
    {
      heading: 'Truncation, windows and spectral leakage',
      body: (
        <>
          <p>The ideal sinc is infinite. Truncating it to <T>{r`M`}</T> taps multiplies it by a rectangular window, which in frequency <i>convolves</i> the ideal brick wall with the window’s transform. A rectangular window has a narrow main lobe but high side lobes (<T>{r`\approx -13`}</T> dB), producing large passband ripple and poor stop-band rejection (the Gibbs overshoot again). A smooth taper trades main-lobe width for side-lobe suppression. The <b>Hamming</b> window <T>{r`w[k]=0.54-0.46\cos\frac{2\pi k}{M-1}`}</T> pushes side lobes to about <T>{r`-43`}</T> dB, at the cost of roughly doubling the transition width for a given <T>{r`M`}</T>.</p>
        </>
      ),
    },
    {
      heading: 'Linear phase and group delay',
      body: (
        <>
          <p>Because the windowed kernel is symmetric, <T>{r`h[k] = h[M-1-k]`}</T>, its frequency response has the form <T>{r`H(f) = A(f)\,e^{-i\omega (M-1)/2}`}</T> with real amplitude <T>{r`A(f)`}</T> and a phase that is exactly linear in <T>{r`f`}</T>. A linear phase means a constant <b>group delay</b> of <T>{r`(M-1)/2`}</T> samples for all frequencies, so the filtered waveform is delayed but not dispersed — different spectral components are not shifted relative to one another. This is why FIR filters are preferred when waveform shape (e.g. an evoked potential) must be preserved, and why longer (sharper) filters cost more latency.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: group delay and selectivity',
      body: (
        <>
          <p>At <T>{r`F_s=250`}</T> Hz the default <T>{r`M=101`}</T>-tap filter has group delay</p>
          <TB>{r`\tau_g = \frac{M-1}{2}\ \text{samples} = \frac{100}{2}\times\frac{1}{250}\ \text{s} = 200\ \text{ms}.`}</TB>
          <p>The transition bandwidth of a Hamming-windowed sinc is approximately <T>{r`\Delta f \approx 3.3\,F_s/M = 3.3\times 250/101 \approx 8.2`}</T> Hz. Doubling the length to <T>{r`M=201`}</T> halves the transition band to <T>{r`\approx 4.1`}</T> Hz (sharper) but doubles the delay to <T>{r`400`}</T> ms — the explicit length–selectivity–latency trade-off.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 190" role="img" aria-label="Signal through an FIR filter, frequency view">
      <defs><marker id="flarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker></defs>
      <text x="20" y="24" fill="#9b8cff" fontSize="11" fontFamily="monospace">input spectrum</text>
      {[[40, 60], [120, 35], [180, 70]].map(([x, h], i) => <line key={i} x1={x} y1="120" x2={x} y2={120 - h} stroke="#9b8cff" strokeWidth="3" />)}
      <line x1="30" y1="120" x2="210" y2="120" stroke="rgba(255,255,255,0.3)" />
      <text x="40" y="135" fill="#9b8cff" fontSize="9" fontFamily="monospace">8</text><text x="116" y="135" fill="#9b8cff" fontSize="9" fontFamily="monospace">40</text><text x="174" y="135" fill="#9b8cff" fontSize="9" fontFamily="monospace">60</text>
      <line x1="220" y1="90" x2="262" y2="90" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#flarr)" />
      <rect x="266" y="66" width="58" height="48" rx="6" fill="none" stroke="#22e1ff" strokeWidth="2" />
      <text x="295" y="86" textAnchor="middle" fill="#22e1ff" fontSize="10" fontFamily="monospace">|H(f)|</text>
      <text x="295" y="100" textAnchor="middle" fill="#22e1ff" fontSize="10" fontFamily="monospace">band-pass</text>
      <line x1="332" y1="90" x2="372" y2="90" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#flarr)" />
      <text x="380" y="24" fill="#22e1ff" fontSize="11" fontFamily="monospace">output spectrum</text>
      <line x1="478" y1="120" x2="478" y2="50" stroke="#22e1ff" strokeWidth="3" />
      <line x1="386" y1="120" x2="512" y2="120" stroke="rgba(255,255,255,0.3)" />
      <text x="470" y="135" fill="#22e1ff" fontSize="9" fontFamily="monospace">40</text>
    </svg>
  ),

  numerics: (
    <p>
      <T>{r`F_s=250`}</T> Hz, 3 s (<T>{r`N=750`}</T>). Test signal <T>{r`\sin(2\pi8t)+\sin(2\pi40t)+0.6\sin(2\pi60t)+0.5\,\eta`}</T>,
      with <T>{r`\eta`}</T> a <T>{r`1/f`}</T>-like AR(1) process (<T>{r`\eta_i=0.92\eta_{i-1}+0.5u_i`}</T>). Band edges are clamped to keep
      <T>{r`f_H-f_L\ge2`}</T> Hz; taps forced odd; recompute debounced 110 ms. Input/output spectra by direct DFT at 160 points.
      Nyquist <T>{r`=125`}</T> Hz.
    </p>
  ),

  pseudocode: `
M   ← taps (forced odd) ;  mid ← (M−1)/2
wL  ← 2*pi*fL/Fs ;  wH ← 2*pi*fH/Fs

# windowed-sinc band-pass kernel
for k in 0 .. M−1:
    n        ← k − mid
    ideal    ← (wH − wL)/pi  if n = 0
               else (sin(wH·n) − sin(wL·n)) / (pi·n)
    win      ← 0.54 − 0.46·cos(2*pi*k/(M−1))         # Hamming
    h[k]     ← ideal · win

# apply by centred convolution
for i in 0 .. N−1:
    y[i] ← sum_k h[k]·x[i − k + mid]

# magnitude response
|H(f)| ← | sum_k h[k]·exp(−i·2*pi*f·k/Fs) |
`,
  params: [
    { name: 'low edge', range: '1–120 Hz (1, 30)', role: 'lower cutoff f_L (clamped to f_H−2)' },
    { name: 'high edge', range: '3–124 Hz (1, 50)', role: 'upper cutoff f_H (clamped to f_L+2)' },
    { name: 'taps', range: '11–201 (2, 101)', role: 'filter length M (forced odd); steepness' },
  ],

  refs: <>Oppenheim &amp; Schafer, <i>Discrete-Time Signal Processing</i> (2009), ch. 7; Smith, <i>The Scientist and Engineer's Guide to DSP</i> (1997), ch. 16.</>,
}
