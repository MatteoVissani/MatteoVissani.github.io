// Procedural neon "data-viz" artwork for featured-work cards.
// Each variant is a self-contained animated SVG — no external images.

type Variant =
  | 'spikephase'
  | 'biomarker'
  | 'network'
  | 'burst'
  | 'epilepsy'
  | 'sweetspot'

const PINK = '#ff2e88'
const CYAN = '#18e0ff'
const VIOLET = '#b15bff'

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={PINK} />
        <stop offset="1" stopColor={CYAN} />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="60%">
        <stop offset="0" stopColor={VIOLET} stopOpacity="0.5" />
        <stop offset="1" stopColor={VIOLET} stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

// deterministic pseudo-random so SVGs are stable
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function SpikePhase({ id }: { id: string }) {
  const r = rng(7)
  const cols = 5
  const rows = 4
  const ticks: JSX.Element[] = []
  for (let row = 0; row < rows; row++) {
    const y = 30 + row * 38
    for (let i = 0; i < 26; i++) {
      if (r() > 0.55) {
        const x = 20 + i * 14 + r() * 6
        ticks.push(
          <line key={`${row}-${i}`} x1={x} y1={y - 9} x2={x} y2={y + 9} stroke={CYAN} strokeWidth="2">
            <animate attributeName="opacity" values="0.25;1;0.25" dur={`${1.5 + r() * 2}s`} repeatCount="indefinite" begin={`${r() * 2}s`} />
          </line>,
        )
      }
    }
  }
  // sinusoidal phase reference
  let d = 'M0 100'
  for (let x = 0; x <= 400; x += 8) d += ` L${x} ${100 + Math.sin(x / 26) * 70}`
  void cols
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none">
      <Defs id={id} />
      <rect width="400" height="200" fill="#0c0524" />
      <rect width="400" height="200" fill={`url(#${id}-glow)`} />
      <path d={d} fill="none" stroke={PINK} strokeWidth="2" opacity="0.6" />
      {ticks}
    </svg>
  )
}

function Biomarker({ id }: { id: string }) {
  // alpha-band oscillation building into a burst (power ramp)
  let d = 'M0 100'
  for (let x = 0; x <= 400; x += 4) {
    const env = 14 + 60 * Math.exp(-Math.pow((x - 250) / 90, 2))
    d += ` L${x} ${100 + Math.sin(x / 7) * env}`
  }
  const bars = Array.from({ length: 24 }, (_, i) => {
    const h = 8 + 70 * Math.exp(-Math.pow((i - 15) / 5, 2)) + (i % 3) * 4
    return (
      <rect key={i} x={8 + i * 16} y={196 - h} width="9" height={h} fill={`url(#${id}-g)`} opacity="0.55">
        <animate attributeName="height" values={`${h};${h * 0.5};${h}`} dur={`${1.6 + (i % 4) * 0.3}s`} repeatCount="indefinite" />
        <animate attributeName="y" values={`${196 - h};${196 - h * 0.5};${196 - h}`} dur={`${1.6 + (i % 4) * 0.3}s`} repeatCount="indefinite" />
      </rect>
    )
  })
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none">
      <Defs id={id} />
      <rect width="400" height="200" fill="#0c0524" />
      <rect width="400" height="200" fill={`url(#${id}-glow)`} />
      {bars}
      <path d={d} fill="none" stroke={CYAN} strokeWidth="2.4" />
    </svg>
  )
}

function Network({ id }: { id: string }) {
  const r = rng(21)
  const nodes = Array.from({ length: 16 }, () => ({ x: 30 + r() * 340, y: 25 + r() * 150 }))
  const edges: JSX.Element[] = []
  nodes.forEach((n, i) => {
    nodes.forEach((m, j) => {
      if (j > i && Math.hypot(n.x - m.x, n.y - m.y) < 120 && r() > 0.45) {
        edges.push(<line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke={VIOLET} strokeWidth="1" opacity="0.45" />)
      }
    })
  })
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none">
      <Defs id={id} />
      <rect width="400" height="200" fill="#0c0524" />
      <rect width="400" height="200" fill={`url(#${id}-glow)`} />
      {edges}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={3 + (i % 3)} fill={i % 2 ? CYAN : PINK}>
          <animate attributeName="r" values={`${3 + (i % 3)};${5 + (i % 3)};${3 + (i % 3)}`} dur={`${2 + (i % 5) * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  )
}

function Burst({ id }: { id: string }) {
  // beta bursts: baseline with intermittent high-amplitude packets
  let d = 'M0 100'
  const r = rng(13)
  for (let x = 0; x <= 400; x += 3) {
    const inBurst = (x > 90 && x < 150) || (x > 250 && x < 300)
    const amp = inBurst ? 55 : 10
    d += ` L${x} ${100 + Math.sin(x / 3.5) * amp * (0.6 + r() * 0.4)}`
  }
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none">
      <Defs id={id} />
      <rect width="400" height="200" fill="#0c0524" />
      <rect width="400" height="200" fill={`url(#${id}-glow)`} />
      <rect x="90" y="20" width="60" height="160" fill={PINK} opacity="0.12" />
      <rect x="250" y="20" width="50" height="160" fill={PINK} opacity="0.12" />
      <path d={d} fill="none" stroke={`url(#${id}-g)`} strokeWidth="2.2" />
    </svg>
  )
}

function Epilepsy({ id }: { id: string }) {
  // spectrogram-like heat columns
  const r = rng(31)
  const cells: JSX.Element[] = []
  for (let c = 0; c < 32; c++) {
    for (let row = 0; row < 10; row++) {
      const v = Math.max(0, Math.sin(c / 4) * 0.5 + 0.5 - row / 12 + r() * 0.3)
      cells.push(
        <rect key={`${c}-${row}`} x={6 + c * 12} y={6 + row * 18} width="11" height="17" fill={row < 4 ? PINK : CYAN} opacity={v * 0.8} />,
      )
    }
  }
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none">
      <Defs id={id} />
      <rect width="400" height="200" fill="#0c0524" />
      {cells}
    </svg>
  )
}

function SweetSpot({ id }: { id: string }) {
  const rings = [70, 54, 38, 22]
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none">
      <Defs id={id} />
      <rect width="400" height="200" fill="#0c0524" />
      <rect width="400" height="200" fill={`url(#${id}-glow)`} />
      <g transform="translate(200 100)">
        {rings.map((rr, i) => (
          <circle key={i} r={rr} fill="none" stroke={i % 2 ? CYAN : PINK} strokeWidth="1.5" opacity={0.3 + i * 0.18}>
            <animate attributeName="r" values={`${rr};${rr + 6};${rr}`} dur={`${2.4 + i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        ))}
        <circle r="9" fill="#fff" />
        <circle r="9" fill={PINK} opacity="0.7">
          <animate attributeName="r" values="9;15;9" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* microelectrode track */}
      <line x1="200" y1="-0" x2="200" y2="100" stroke={CYAN} strokeWidth="1.5" opacity="0.5" strokeDasharray="4 4" transform="translate(0 0)" />
    </svg>
  )
}

export default function SignalArt({ variant, id }: { variant: Variant; id: string }) {
  switch (variant) {
    case 'spikephase': return <SpikePhase id={id} />
    case 'biomarker': return <Biomarker id={id} />
    case 'network': return <Network id={id} />
    case 'burst': return <Burst id={id} />
    case 'epilepsy': return <Epilepsy id={id} />
    case 'sweetspot': return <SweetSpot id={id} />
  }
}
