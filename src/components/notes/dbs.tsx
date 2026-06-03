import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const dbs: DemoNote = {
  title: 'DBS waveform & charge-safety designer',
  theme: 'Neurotechnology',
  tagline: 'From charge per phase to charge density and the Shannon tissue-damage line.',

  foundations: (
    <>
      <p>
        Deep brain stimulation injects charge into tissue through a metal contact. Two physical limits govern whether
        a pulse is safe. First, neurons are damaged when the injected <b>charge per phase</b> <T>{r`Q`}</T> and the
        <b> charge density</b> <T>{r`D=Q/A`}</T> (charge per unit electrode area) are both large; empirically the damage
        threshold is a straight line in log–log space — the <b>Shannon criterion</b>:
      </p>
      <TB>{r`\log_{10} D + \log_{10} Q = k.`}</TB>
      <p>
        Second, charge must be <b>balanced</b>: any net DC current drives Faradaic reactions that corrode the electrode
        and injure tissue. A single cathodic (monophasic) pulse leaves a net charge <T>{r`Q`}</T>; a <b>biphasic</b> pulse
        adds an equal-and-opposite recharge phase so the net is zero. The demo computes <T>{r`Q`}</T>, <T>{r`D`}</T>, the mean
        current, the net DC, and the Shannon verdict as you shape the pulse.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Charge per phase',
      tex: r`Q = \frac{I\cdot \text{PW}}{1000}\quad[\mu\text{C}]`,
      note: <p>Charge is current × time. With <T>{r`I`}</T> in mA and PW in <T>{r`\mu`}</T>s, <T>{r`I\cdot\text{PW}`}</T> is in nC; dividing by 1000 gives <T>{r`\mu`}</T>C per phase.</p>,
    },
    {
      title: 'Charge density',
      tex: r`D = \frac{Q}{A/100}\quad[\mu\text{C/cm}^2]`,
      note: <p>Damage depends on charge per unit area at the contact, not total charge. With <T>{r`A`}</T> in mm², dividing by 100 converts to cm².</p>,
    },
    {
      title: 'Mean delivered current',
      tex: r`\bar I = Q\cdot f\quad[\mu\text{A}]`,
      note: <p>Cathodic charge per second: charge per pulse times the repetition rate <T>{r`f`}</T>.</p>,
    },
    {
      title: 'Shannon parameter',
      tex: r`k = \log_{10} D + \log_{10} Q`,
      note: <p>Combine the two charge measures. Empirical damage data from many electrode sizes collapse onto lines of constant <T>{r`k`}</T>.</p>,
    },
    {
      title: 'The verdict',
      tex: r`k<1.5\ \text{SAFE};\ \ 1.5\le k<2.0\ \text{CAUTION};\ \ k\ge2.0\ \text{UNSAFE}`,
      note: <p>The plot draws the iso-<T>{r`k`}</T> lines <T>{r`\log_{10}D=k-\log_{10}Q`}</T> at 1.5 (green, conservative bound) and 2.0 (red, damage), with your operating point at <T>{r`(\log_{10}Q,\log_{10}D)`}</T>.</p>,
    },
    {
      title: 'Charge balance',
      tex: r`\text{net DC} = \begin{cases}Q & \text{monophasic}\\ 0 & \text{biphasic}\end{cases}`,
      note: <p>The biphasic recharge phase (symmetric, or asymmetric: <T>{r`4\times`}</T> longer at <T>{r`\tfrac14`}</T> amplitude) returns the net charge to zero, which is why implantable stimulators are charge-balanced.</p>,
    },
  ],

  deep: [
    {
      heading: 'Why charge, and why charge density',
      body: (
        <>
          <p>Neural activation depends on the charge injected per phase, <T>{r`Q=\int I\,dt = I\cdot\text{PW}`}</T>, because it is the integral of current that moves the membrane potential. Tissue damage, however, scales with the <i>local</i> charge density at the electrode surface, <T>{r`D = Q/A`}</T>, since a small contact concentrates the same charge into a higher density. Shannon (1992) fitted histological damage data across many electrode sizes and found the threshold separating safe from damaging stimulation follows a straight line in the log–log plane,</p>
          <TB>{r`\log_{10} D = k - \log_{10} Q,`}</TB>
          <p>equivalently <T>{r`\log_{10}D + \log_{10}Q = k`}</T>. The constant <T>{r`k`}</T> increases with the severity threshold; <T>{r`k\approx 1.5`}</T> is a conservative safe bound and <T>{r`k\approx 2.0`}</T> the damage line plotted in the demo.</p>
        </>
      ),
    },
    {
      heading: 'Charge balance and electrode electrochemistry',
      body: (
        <>
          <p>At the metal–tissue interface, current is carried by reversible capacitive charging and (if pushed too far) by irreversible <b>Faradaic</b> reactions that inject or consume electrons via chemical species. A monophasic pulse leaves a net charge <T>{r`Q`}</T> per cycle that accumulates as a DC bias, driving Faradaic reactions that corrode the electrode and generate toxic products. A charge-balanced <b>biphasic</b> pulse adds an opposite recharge phase so the net charge per cycle is zero, keeping the interface within its reversible (capacitive) window. The asymmetric variant uses a long, low-amplitude recharge (<T>{r`4\,\text{PW}`}</T> at <T>{r`I/4`}</T>) so the recharge current stays below the activation threshold and does not itself excite tissue.</p>
        </>
      ),
    },
    {
      heading: 'Worked numbers: clinical vs. unsafe',
      body: (
        <>
          <p>A typical setting is <T>{r`I=3`}</T> mA, <T>{r`\text{PW}=90\ \mu`}</T>s, on a <T>{r`A=6`}</T> mm² contact. Then <T>{r`Q = 3\times 90/1000 = 0.27\ \mu`}</T>C and <T>{r`D = 0.27/(6/100) = 4.5\ \mu`}</T>C/cm², so <T>{r`k = \log_{10}4.5 + \log_{10}0.27 = 0.65 - 0.57 = 0.08`}</T> — comfortably below 1.5 (SAFE). Now raise to <T>{r`I=6`}</T> mA, <T>{r`\text{PW}=450\ \mu`}</T>s on a <T>{r`A=1`}</T> mm² contact: <T>{r`Q = 2.7\ \mu`}</T>C, <T>{r`D = 270\ \mu`}</T>C/cm², and <T>{r`k = 2.43 + 0.43 = 2.86`}</T> — past the 2.0 damage line (UNSAFE). The same calculation is what sets programming limits in practice.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 200" role="img" aria-label="Biphasic pulse and Shannon safety plot">
      {/* pulse */}
      <line x1="20" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.25)" />
      <path d="M40,80 L70,80 L70,140 L110,140 L110,80 L130,80 L130,55 L210,55 L210,80 L250,80" fill="none" stroke="#22e1ff" strokeWidth="2.2" />
      <text x="72" y="156" fill="#22e1ff" fontSize="10" fontFamily="monospace">cathodic (I, PW)</text>
      <text x="138" y="48" fill="#22e1ff" fontSize="10" fontFamily="monospace">recharge</text>
      <text x="40" y="30" fill="#e9ebfb" fontSize="11" fontFamily="monospace">Q = I·PW</text>
      {/* shannon plot */}
      <rect x="300" y="30" width="190" height="150" fill="none" stroke="rgba(255,255,255,0.3)" />
      <line x1="300" y1="60" x2="490" y2="160" stroke="#ff6b6b" strokeWidth="1.6" strokeDasharray="5 4" />
      <line x1="300" y1="95" x2="490" y2="180" stroke="#54e6a0" strokeWidth="1.6" strokeDasharray="5 4" />
      <circle cx="360" cy="150" r="5" fill="#54e6a0" />
      <text x="430" y="58" fill="#ff6b6b" fontSize="10" fontFamily="monospace">k=2.0</text>
      <text x="430" y="120" fill="#54e6a0" fontSize="10" fontFamily="monospace">k=1.5</text>
      <text x="300" y="196" fill="#e9ebfb" fontSize="9" fontFamily="monospace">log Q →</text>
      <text x="296" y="40" textAnchor="end" fill="#e9ebfb" fontSize="9" fontFamily="monospace">log D</text>
    </svg>
  ),

  numerics: (
    <p>
      All quantities are closed-form from the sliders (no time integration). The pulse-shape panel draws the chosen
      waveform with a 60 <T>{r`\mu`}</T>s interphase gap; the asymmetric recharge is <T>{r`4\,\text{PW}`}</T> long at <T>{r`I/4`}</T>. The train panel
      shows three periods at the set frequency. The Shannon panel plots the iso-<T>{r`k`}</T> lines and the live operating point.
    </p>
  ),

  pseudocode: `
Q  ← I·PW / 1000                                       # charge/phase, µC  (mA·µs = nC)
D  ← Q / (area / 100)                                  # charge density, µC/cm²
k  ← log10(D) + log10(Q)                               # Shannon parameter

verdict ← SAFE     if k < 1.5
          CAUTION  if 1.5 ≤ k < 2.0
          UNSAFE   if k ≥ 2.0

mean_current ← Q · freq                                # µA
net_DC       ← Q   if waveform = monophasic  else  0   # uncompensated charge/pulse
`,
  params: [
    { name: 'amplitude I', range: '0.1–6 mA (0.1, 3)', role: 'cathodic current' },
    { name: 'pulse width PW', range: '20–450 µs (10, 90)', role: 'duration of the cathodic phase' },
    { name: 'frequency', range: '2–250 Hz (1, 130)', role: 'pulse repetition rate' },
    { name: 'area', range: '1–12 mm² (0.5, 6)', role: 'electrode contact area' },
    { name: 'waveform', range: 'mono / bi-sym / bi-asym', role: 'sets charge balance and recharge shape' },
  ],

  refs: <>Shannon, <i>IEEE Trans. Biomed. Eng.</i> 39 (1992) 424; Merrill, Bikson &amp; Jefferys, <i>J. Neurosci. Methods</i> 141 (2005) 171; Kuncel &amp; Grill, <i>Clin. Neurophysiol.</i> 115 (2004) 2431.</>,
}
