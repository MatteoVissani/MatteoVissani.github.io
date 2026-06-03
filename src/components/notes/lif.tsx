import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const lif: DemoNote = {
  title: 'The (adaptive) integrate-and-fire neuron',
  theme: 'Neuronal dynamics',
  tagline: 'From the membrane as an RC circuit to a spiking model with adaptation.',

  foundations: (
    <>
      <p>
        The cell membrane is a thin lipid bilayer separating two conducting solutions; it therefore behaves as a
        parallel-plate <b>capacitor</b> of capacitance <T>{r`C`}</T>, holding a charge <T>{r`Q = C\,V`}</T> for a
        transmembrane voltage <T>{r`V`}</T>. Embedded ion channels provide conducting pores through which charge
        leaks; collectively they act as a <b>resistor</b> <T>{r`R`}</T> in parallel with the capacitor, with the
        current vanishing not at <T>{r`V=0`}</T> but at the resting (Nernst-weighted) reversal potential <T>{r`E_L`}</T>.
        The leak current is therefore <T>{r`I_{\text{leak}} = (V-E_L)/R`}</T> by Ohm's law, and the charging current
        is <T>{r`I_C = C\,dV/dt`}</T> by differentiating <T>{r`Q=CV`}</T>.
      </p>
      <p>
        Conservation of charge at the membrane node states that the externally injected current <T>{r`I`}</T> must
        equal the sum of the currents flowing onto the capacitor and through the leak. This single statement is the
        entire physical content of the model:
      </p>
      <TB>{r`C\,\frac{dV}{dt} \;+\; \frac{V-E_L}{R} \;=\; I.`}</TB>
      <p>
        Numerically, with <T>{r`C`}</T> in nF, <T>{r`R`}</T> in M&Omega; and currents in nA, voltages come out in mV;
        the product <T>{r`\tau_m = RC`}</T> has units of milliseconds and is the <b>membrane time constant</b>, the
        timescale over which the membrane forgets its initial condition. Typical cortical values are
        <T>{r`\tau_m \approx 10\text{–}30`}</T> ms, an input resistance of tens to hundreds of M&Omega;, and a leak
        reversal near <T>{r`-70`}</T> mV.
      </p>
      <p>
        The action potential itself is deliberately <i>not</i> modelled. Once the membrane depolarizes past a
        threshold, voltage-gated sodium channels produce a spike whose shape is stereotyped and largely independent
        of the input; what carries information is the <i>time</i> at which threshold is crossed. The integrate-and-fire
        model therefore replaces the spike with an instantaneous event and a <b>reset</b>: when <T>{r`V`}</T> reaches
        <T>{r`V_{\text{th}}`}</T> a spike is emitted and <T>{r`V`}</T> is set back to <T>{r`V_r`}</T>. All of the dynamics
        live in the subthreshold relaxation between resets.
      </p>
      <p>
        Cortical and subcortical neurons exhibit <b>spike-frequency adaptation</b>: under a constant supra-threshold
        current the instantaneous rate decays over the first few interspike intervals to a lower steady value.
        The mechanism is a set of slow, spike-activated hyperpolarizing currents — principally the
        Ca<T>{r`^{2+}`}</T>-activated K<T>{r`^+`}</T> current <T>{r`I_{\text{AHP}}`}</T> and the muscarinic
        M-current — that accumulate with each action potential and relax over tens to hundreds of milliseconds.
        The minimal model lumps them into one variable <T>{r`w`}</T> (expressed in mV, as the voltage-equivalent
        <T>{r`R`}</T> times the adaptation current) with first-order decay <T>{r`\tau_w\,dw/dt = -w`}</T> and a
        spike-triggered increment <T>{r`w \to w + b`}</T>. Because <T>{r`w`}</T> enters the voltage equation with a
        negative sign it is a self-inhibition that lowers the effective drive to <T>{r`RI - w`}</T>; the timescale
        separation <T>{r`\tau_w \gg \tau_m`}</T> is precisely what lets it integrate across spikes instead of
        resetting each cycle. This is the current-based reduction of the adaptive-exponential (AdEx) neuron.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Current balance',
      tex: r`C\,\frac{dV}{dt} = I - \frac{V - E_L}{R}`,
      note: <p>Start from Kirchhoff's current law at the membrane node: injected current <T>{r`I`}</T> either charges the capacitor (<T>{r`C\,dV/dt`}</T>) or leaks through the resistance (<T>{r`(V-E_L)/R`}</T>).</p>,
    },
    {
      title: 'Time-constant form',
      tex: r`\tau_m\,\frac{dV}{dt} = -(V - E_L) + R\,I,\qquad \tau_m = RC`,
      note: <p>Multiply through by <T>{r`R`}</T>. The drive now appears as the voltage-scaled term <T>{r`RI`}</T> (the demo's <b>drive</b> slider), and the membrane relaxes toward <T>{r`E_L + RI`}</T> with time constant <T>{r`\tau_m`}</T>.</p>,
    },
    {
      title: 'Threshold + reset = LIF',
      tex: r`V \ge V_{\text{th}}\ \Rightarrow\ \text{spike},\quad V \leftarrow V_r`,
      note: <p>Integration alone never produces a spike. Add the rule: when <T>{r`V`}</T> reaches threshold <T>{r`V_{\text{th}}=-50`}</T> mV, record a spike and reset to <T>{r`V_r=-65`}</T> mV. With <T>{r`E_L=-70`}</T> mV this is the leaky integrate-and-fire neuron.</p>,
    },
    {
      title: 'Solve the linear ODE between spikes',
      tex: r`V(t) = V_\infty + \big(V(0)-V_\infty\big)\,e^{-t/\tau_m},\qquad V_\infty = E_L + RI`,
      note: <p>With <T>{r`w=0`}</T> and no noise the equation is linear with constant coefficients. Its general solution is the particular (steady-state) solution <T>{r`V_\infty=E_L+RI`}</T> plus the homogeneous solution <T>{r`Ae^{-t/\tau_m}`}</T>; fixing the constant <T>{r`A`}</T> by the initial value <T>{r`V(0)`}</T> gives the expression above. The membrane thus approaches <T>{r`V_\infty`}</T> exponentially with time constant <T>{r`\tau_m`}</T>, covering a fraction <T>{r`1-e^{-1}\approx 63\%`}</T> of the remaining gap each <T>{r`\tau_m`}</T>. Threshold can be reached at all only if the asymptote lies above it, <T>{r`V_\infty \ge V_{\text{th}}`}</T>.</p>,
    },
    {
      title: 'The rheobase is exactly 20 mV',
      tex: r`R\,I \;\ge\; V_{\text{th}} - E_L \;=\; -50-(-70) \;=\; 20\ \text{mV}`,
      note: <p>So below <T>{r`RI=20`}</T> mV the deterministic neuron is silent (only noise can fire it); above it the neuron fires periodically. This is the corner you see in the <b>f–I curve</b>.</p>,
    },
    {
      title: 'Interspike interval and the f–I curve',
      tex: r`T_{\text{isi}} = \tau_m \ln\!\frac{RI - (V_r-E_L)}{RI - (V_{\text{th}}-E_L)},\qquad f = \frac{1}{T_{\text{isi}}}`,
      note: <>
        <p>For periodic firing the trajectory starts each cycle at the reset <T>{r`V(0)=V_r`}</T> and the next spike occurs at the time <T>{r`T_{\text{isi}}`}</T> for which <T>{r`V(T_{\text{isi}})=V_{\text{th}}`}</T>. Substituting into the solution above,</p>
        <TB>{r`V_{\text{th}} = V_\infty + (V_r - V_\infty)\,e^{-T_{\text{isi}}/\tau_m} \;\Longrightarrow\; e^{-T_{\text{isi}}/\tau_m} = \frac{V_\infty - V_{\text{th}}}{V_\infty - V_r}.`}</TB>
        <p>Taking logarithms and writing <T>{r`V_\infty - V_{\text{th}} = RI-(V_{\text{th}}-E_L)`}</T>, <T>{r`V_\infty - V_r = RI-(V_r-E_L)`}</T> gives the closed form in the heading. The rate <T>{r`f=1/T_{\text{isi}}`}</T> is zero at the rheobase (the denominator's argument <T>{r`\to 0`}</T>, so <T>{r`T_{\text{isi}}\to\infty`}</T>), then rises steeply and saturates as <T>{r`RI`}</T> grows. The demo measures the same curve empirically by sweeping the drive and counting spikes, which also captures the noise-induced smoothing near the foot.</p>
      </>,
    },
    {
      title: 'Adaptation and the adapted firing rate',
      tex: r`\langle w\rangle^\ast = b\,f\,\tau_w,\qquad f_{\text{adapted}} = \Phi\!\big(RI - \langle w\rangle^\ast\big)`,
      note: <>
        <p>During steady firing at rate <T>{r`f`}</T>, the variable <T>{r`w`}</T> receives an increment <T>{r`b`}</T> once per interval and decays continuously, so its spike-averaged value obeys <T>{r`d\langle w\rangle/dt = b f - \langle w\rangle/\tau_w`}</T> and settles at <T>{r`\langle w\rangle^\ast = b f \tau_w`}</T>. The cell then behaves like an unadapted neuron driven by the reduced current <T>{r`RI - \langle w\rangle^\ast`}</T>, where <T>{r`\Phi`}</T> is the LIF f–I function derived above.</p>
        <p>This is a self-consistent (implicit) equation for <T>{r`f`}</T>: substituting <T>{r`\langle w\rangle^\ast = bf\tau_w`}</T> and linearizing about the operating point shows the adapted gain is divisively reduced,</p>
        <TB>{r`\frac{df}{d(RI)}\Big|_{\text{adapted}} = \frac{\Phi'}{1 + b\,\tau_w\,\Phi'},`}</TB>
        <p>so a larger increment <T>{r`b`}</T> or slower <T>{r`\tau_w`}</T> flattens the f–I curve more strongly. With <T>{r`b=0`}</T> we have <T>{r`w\equiv 0`}</T> and the pure LIF neuron is recovered exactly.</p>
      </>,
    },
  ],

  deep: [
    {
      heading: 'The membrane as a low-pass filter',
      body: (
        <>
          <p>For a time-varying subthreshold input <T>{r`I(t)`}</T> the membrane equation <T>{r`\tau_m\dot V = -(V-E_L) + R\,I(t)`}</T> is a linear filter. Driving it with a sinusoid <T>{r`I(t)=I_0\,e^{i\omega t}`}</T> and seeking the steady response <T>{r`V-E_L \propto e^{i\omega t}`}</T> gives the membrane impedance</p>
          <TB>{r`Z(\omega) = \frac{V(\omega)-E_L}{I(\omega)} = \frac{R}{1 + i\,\omega\tau_m},`}</TB>
          <p>a first-order low-pass with gain <T>{r`|Z| = R/\sqrt{1+(\omega\tau_m)^2}`}</T> and cutoff frequency</p>
          <TB>{r`f_c = \frac{1}{2\pi\tau_m} \approx 8\ \text{Hz}\quad(\tau_m = 20\ \text{ms}).`}</TB>
          <p>Input components above <T>{r`f_c`}</T> are attenuated at <T>{r`-20`}</T> dB/decade and phase-lagged toward <T>{r`-90^\circ`}</T>. This is the precise sense in which the neuron is a <b>leaky integrator</b>: it averages its input over a window of order <T>{r`\tau_m`}</T> and cannot follow fluctuations faster than <T>{r`f_c`}</T>. The cutoff therefore sets the bandwidth over which the cell can transmit a rate-coded signal.</p>
        </>
      ),
    },
    {
      heading: 'Three operating regimes',
      body: (
        <>
          <p><b>Mean-driven (<T>{r`RI>20`}</T> mV, <T>{r`b=0`}</T>, no noise).</b> The trajectory is a limit cycle: relax toward <T>{r`V_\infty`}</T>, cross <T>{r`V_{\text{th}}`}</T>, reset. Firing is exactly periodic at <T>{r`f=1/T_{\text{isi}}`}</T> with interspike-interval coefficient of variation <T>{r`\mathrm{CV}=0`}</T>.</p>
          <p><b>Fluctuation-driven (<T>{r`RI<20`}</T> mV, <T>{r`\sigma>0`}</T>).</b> The deterministic asymptote <T>{r`V_\infty`}</T> lies below threshold, so spikes are <b>first-passage</b> events of the Ornstein–Uhlenbeck process defined by the stochastic membrane equation. The stationary rate is the Siegert first-passage formula,</p>
          <TB>{r`f^{-1} = \tau_m\sqrt{\pi}\int_{(V_r-\mu)/\sigma_V}^{(V_{\text{th}}-\mu)/\sigma_V} e^{u^2}\big[1+\operatorname{erf}(u)\big]\,du,`}</TB>
          <p>with <T>{r`\mu = E_L+RI`}</T> and <T>{r`\sigma_V`}</T> the stationary voltage standard deviation. The train is irregular with coefficient of variation <T>{r`\mathrm{CV}\to 1`}</T> (Poisson-like), and the rheobase corner of the f–I curve is smoothed into a sigmoid — the effect of the noise slider.</p>
          <p><b>Adapted (<T>{r`b>0`}</T>, <T>{r`\tau_w\gg\tau_m`}</T>).</b> From the previous section the steady gain is reduced by the factor <T>{r`(1+b\tau_w\Phi')^{-1}`}</T>, while the response to an input <i>step</i> overshoots before relaxing on the timescale <T>{r`\tau_w`}</T>. The cell therefore attenuates sustained input relative to changes — a high-pass (adapting) transfer function in the rate domain.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: the firing rate at the default settings',
      body: (
        <>
          <p>Take the defaults <T>{r`\tau_m=20`}</T> ms, <T>{r`RI=28`}</T> mV, <T>{r`b=0`}</T>, with <T>{r`E_L=-70,\ V_{\text{th}}=-50,\ V_r=-65`}</T> mV. Then <T>{r`RI-(V_r-E_L)=28-5=23`}</T> and <T>{r`RI-(V_{\text{th}}-E_L)=28-20=8`}</T>, so</p>
          <TB>{r`T_{\text{isi}} = 20\,\ln\!\frac{23}{8}\ \text{ms} = 20\times 1.056 \approx 21.1\ \text{ms},\qquad f \approx 47\ \text{Hz}.`}</TB>
          <p>Drop the drive to <T>{r`RI=21`}</T> mV (just above rheobase) and <T>{r`T_{\text{isi}}=20\ln(16/1)\approx 55`}</T> ms (<T>{r`f\approx 18`}</T> Hz): near the rheobase the rate is extremely sensitive to the drive — the steep foot of the f–I curve.</p>
        </>
      ),
    },
    {
      heading: 'Where it sits among neuron models',
      body: (
        <>
          <p>The LIF neuron is the linear core of a model hierarchy. Adding an exponential spike-initiation term, so that the voltage equation reads <T>{r`\tau_m\dot V = -(V-E_L) + \Delta_T\,e^{(V-V_T)/\Delta_T} + RI - Rw`}</T>, together with the adaptation variable <T>{r`w`}</T>, yields the <b>adaptive exponential (AdEx)</b> model of Brette and Gerstner; its four extra parameters reproduce the principal cortical firing classes (regular-spiking with adaptation, intrinsic bursting, initial bursting). In the opposite direction, replacing the threshold-reset rule with the full set of voltage-gated <T>{r`\mathrm{Na}^+`}</T> and <T>{r`\mathrm{K}^+`}</T> conductances recovers the biophysical <b>Hodgkin–Huxley</b> equations; the LIF model is their reduction once the stereotyped spike is removed and the spike-generating currents are replaced by the reset. This reduction is why it is the standard unit in large-scale network simulations: it preserves spike timing, which carries the neural code, at a small fraction of the integration cost.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 220" role="img" aria-label="Membrane RC circuit with threshold and reset">
      <defs>
        <marker id="lifarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker>
      </defs>
      {/* current source */}
      <circle cx="46" cy="110" r="22" fill="none" stroke="#9b8cff" strokeWidth="2" />
      <text x="46" y="115" textAnchor="middle" fill="#9b8cff" fontSize="14" fontFamily="monospace">I</text>
      <line x1="68" y1="110" x2="150" y2="110" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#lifarr)" />
      {/* node */}
      <circle cx="160" cy="110" r="3.5" fill="#fff" />
      <text x="150" y="96" fill="#e9ebfb" fontSize="12" fontFamily="monospace">V</text>
      {/* capacitor branch */}
      <line x1="160" y1="110" x2="160" y2="150" stroke="#e9ebfb" strokeWidth="1.6" />
      <line x1="146" y1="150" x2="174" y2="150" stroke="#e9ebfb" strokeWidth="2.4" />
      <line x1="146" y1="160" x2="174" y2="160" stroke="#e9ebfb" strokeWidth="2.4" />
      <text x="182" y="160" fill="#e9ebfb" fontSize="12" fontFamily="monospace">C</text>
      <line x1="160" y1="160" x2="160" y2="195" stroke="#e9ebfb" strokeWidth="1.6" />
      {/* resistor branch */}
      <line x1="230" y1="110" x2="230" y2="135" stroke="#e9ebfb" strokeWidth="1.6" />
      <path d="M230,135 l-8,6 l16,8 l-16,8 l16,8 l-8,6" fill="none" stroke="#ff2d8f" strokeWidth="1.8" />
      <text x="244" y="160" fill="#ff2d8f" fontSize="12" fontFamily="monospace">R</text>
      <line x1="230" y1="183" x2="230" y2="195" stroke="#e9ebfb" strokeWidth="1.6" />
      <line x1="160" y1="110" x2="230" y2="110" stroke="#e9ebfb" strokeWidth="1.6" />
      {/* ground / E_L */}
      <line x1="120" y1="195" x2="270" y2="195" stroke="#e9ebfb" strokeWidth="1.6" />
      <text x="276" y="199" fill="#e9ebfb" fontSize="12" fontFamily="monospace">E<tspan dy="3" fontSize="9">L</tspan></text>
      {/* comparator → spike */}
      <line x1="160" y1="110" x2="330" y2="110" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#lifarr)" />
      <polygon points="340,86 340,134 392,110" fill="none" stroke="#ffc24d" strokeWidth="2" />
      <text x="350" y="114" fill="#ffc24d" fontSize="11" fontFamily="monospace">≥ V<tspan dy="3" fontSize="8">th</tspan></text>
      <line x1="392" y1="110" x2="430" y2="110" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#lifarr)" />
      {/* spike */}
      <path d="M440,140 L452,140 L456,70 L460,140 L500,140" fill="none" stroke="#ff2d8f" strokeWidth="2" />
      <text x="448" y="60" fill="#ff2d8f" fontSize="11" fontFamily="monospace">spike</text>
      {/* reset arrow */}
      <path d="M366,134 C366,180 200,182 168,150" fill="none" stroke="#5b4bc4" strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#lifarr)" />
      <text x="250" y="178" fill="#9b8cff" fontSize="10" fontFamily="monospace">reset V→V<tspan dy="3" fontSize="8">r</tspan><tspan dy="-3">, w→w+b</tspan></text>
    </svg>
  ),

  numerics: (
    <>
      <p>Integrated by Euler–Maruyama (stochastic Euler) with step <T>{r`\Delta t = 0.5`}</T> ms, 8 substeps per frame, on an 800 ms ring buffer:</p>
      <TB>{r`V \mathrel{+}= \frac{-(V-E_L)+RI-w}{\tau_m}\,\Delta t + \sigma\sqrt{\tfrac{\Delta t}{\tau_m}}\,\xi,\quad w \mathrel{+}= \frac{-w}{\tau_w}\,\Delta t,\quad \xi\sim\mathcal N(0,1).`}</TB>
      <p>
        The noise scales as <T>{r`\sqrt{\Delta t}`}</T> (not <T>{r`\Delta t`}</T>) so its accumulated variance grows
        linearly in time, as Brownian motion requires; <T>{r`\xi`}</T> is a Box–Muller normal deviate. The
        <b> f–I curve</b> is re-measured (debounced 150 ms) by sweeping <T>{r`RI\in[0,45]`}</T> mV in 1.5 mV steps,
        each point a 400 ms burn-in plus a 1400 ms count window. The displayed rate counts spikes in the last
        1000 ms, refreshed every 400 ms.
      </p>
    </>
  ),

  pseudocode: `
# Adaptive LIF, integrated by Euler–Maruyama with dt = 0.5 ms
V ← E_L ;  w ← 0
for each step:
    xi ← gaussian()                                  # N(0,1), Box–Muller
    V  ← V + (dt/tau_m)·(−(V − E_L) + R·I − w)
            + sigma·sqrt(dt/tau_m)·xi                # stochastic term
    w  ← w + (dt/tau_w)·(−w)                          # adaptation decays
    if V ≥ V_th:                                      # threshold crossing
        emit spike
        V ← V_r                                       # reset
        w ← w + b                                     # spike-triggered jump

# f–I curve: sweep drive, count spikes after a burn-in
for RI in 0 .. 45 step 1.5:
    integrate 400 ms (discard), then 1400 ms counting spikes
    f(RI) ← 1000 · n_spikes / 1400                    # Hz
`,
  params: [
    { name: 'drive RI', range: '0–45 mV (1, 28)', role: 'constant input current ×R; silent below the 20 mV rheobase' },
    { name: 'noise σ', range: '0–8 mV (0.5, 1.5)', role: 'amplitude of the white-noise term' },
    { name: 'adaptation b', range: '0–10 mV (0.5, 4)', role: 'per-spike increment of w; 0 gives the pure LIF neuron' },
    { name: 'τ_w', range: '40–300 ms (10, 150)', role: 'decay time constant of the adaptation current' },
    { name: 'τ_m', range: '5–40 ms (1, 20)', role: 'membrane time constant RC' },
  ],

  refs: <>Gerstner &amp; Kistler, <i>Spiking Neuron Models</i> (2002), ch. 4; Brette &amp; Gerstner, <i>J. Neurophysiol.</i> 94 (2005) 3637; Dayan &amp; Abbott, <i>Theoretical Neuroscience</i> (2001), ch. 5.</>,
}
