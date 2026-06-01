import type { Variant } from '../data/content'

// Clean, flat graphical abstracts on a dark card. One tailored scene per paper.
const TXT = '#e9ebfb', SUB = '#9aa0c0', LINE = 'rgba(255,255,255,0.14)'
const TEAL = '#2fe6c7', MAG = '#ff4d8d', VIO = '#9b8cff', AMB = '#ffc24d', RED = '#ff6b6b', GRN = '#54e6a0'
const F = 'Space Grotesk, system-ui, sans-serif'
const M = 'Share Tech Mono, monospace'

type Motif = 'bursting' | 'irregular' | 'phaselock' | 'betaburst' | 'closedloop' | 'fanout' | 'network' | 'spectro' | 'denoise' | 'signal' | 'scan' | 'speech' | 'challenges'
type Spec = { title: string; motif: Motif }

const SPEC: Record<string, Spec> = {
  'tourette-dbs-target': { title: 'STN FIRING-PATTERN STRUCTURE IDENTIFIES THE DBS TARGET', motif: 'bursting' },
  'juvenile-hd-stn-dbs': { title: 'STN DBS IN A JUVENILE HUNTINGTON’S CASE', motif: 'bursting' },
  'impulsivity-single-unit': { title: 'IMPULSIVITY MARKERS IN STN SINGLE-UNIT ACTIVITY', motif: 'irregular' },
  'impulsivity-firing-regularity': { title: 'IMPULSIVITY LINKED TO VENTRAL-STN FIRING REGULARITY', motif: 'irregular' },
  'spike-phase-speech': { title: 'STN SPIKE-PHASE COUPLING PREDICTS SPEECH ACCURACY', motif: 'speech' },
  'speech-artifact-denoising': { title: 'A DATA-DRIVEN FILTER REMOVES SPEECH ARTIFACTS', motif: 'denoise' },
  'reach-grasp-beta-bursts': { title: 'REACHING IMPAIRMENT RELATES TO DOPAMINE-DEPENDENT STN β-BURSTS', motif: 'betaburst' },
  'closed-loop-ocd': { title: 'TOWARD CLOSED-LOOP DBS FOR OCD', motif: 'closedloop' },
  'frontal-cortex-atlas': { title: 'DBS SEGREGATES THE FRONTAL CORTEX INTO CIRCUITS', motif: 'fanout' },
  'nature-pd-scan': { title: 'PARKINSON’S AS A SOMATO-COGNITIVE ACTION-NETWORK DISORDER', motif: 'scan' },
  'lead-dbs-v3': { title: 'LEAD-DBS v3: DBS EFFECTS → ANATOMY & NETWORKS', motif: 'network' },
  'peripersonal-space-stroke': { title: 'ALTERED BODY & PERIPERSONAL SPACE AFTER STROKE', motif: 'network' },
  'meta-rl-cognitive-control': { title: 'A META-RL MODEL OF COGNITIVE CONTROL', motif: 'network' },
  'dbs-biophysical-modeling': { title: 'BIOPHYSICAL & COMPUTATIONAL MODELING OF DBS', motif: 'network' },
  'sensing-dbs-epilepsy': { title: 'A SENSING-DBS OSCILLATORY BIOMARKER IN EPILEPSY', motif: 'spectro' },
  'focal-epilepsy-layers': { title: 'FOCAL EPILEPSY DISRUPTS LAYER-SPECIFIC VISUAL PROCESSING', motif: 'spectro' },
  'gait-initiation-pd': { title: 'DOPAMINE & STANCE AFFECT GAIT INITIATION IN PD', motif: 'signal' },
  'stroke-motor-recovery': { title: 'NEUROPHYSIOLOGY OF UPPER-LIMB STROKE RECOVERY', motif: 'signal' },
  'tms-hand-perception': { title: 'SINGLE-PULSE M1 TMS ALTERS HAND PERCEPTION', motif: 'signal' },
  'dbs-open-challenges': { title: 'OPEN NEURAL-ENGINEERING CHALLENGES IN DBS', motif: 'challenges' },
}
const FB: Record<Variant, Spec> = {
  spikephase: { title: 'NEURAL CODE → BEHAVIOUR', motif: 'phaselock' },
  biomarker: { title: 'SENSE → ADAPT: CLOSED-LOOP DBS', motif: 'closedloop' },
  network: { title: 'STIMULATION ACROSS BRAIN NETWORKS', motif: 'network' },
  burst: { title: 'STN β-BURSTS TRACK MOVEMENT', motif: 'betaburst' },
  epilepsy: { title: 'SENSING DBS → OSCILLATORY BIOMARKER', motif: 'spectro' },
  sweetspot: { title: 'SINGLE-UNIT MAP → OPTIMAL TARGET', motif: 'bursting' },
}

const tx = (x: number, y: number, t: string, c = TXT, a: 'start' | 'middle' | 'end' = 'start', s = 12, w = 500, fam = F) =>
  <text x={x} y={y} fill={c} textAnchor={a} style={{ fontFamily: fam, fontSize: s, fontWeight: w }}>{t}</text>
const ticks = (x: number, y: number, xs: number[], c: string, h = 11) =>
  <g stroke={c} strokeWidth="2.6" strokeLinecap="round">{xs.map((t, i) => <line key={i} x1={x + t} y1={y - h} x2={x + t} y2={y + h} />)}</g>
const arrow = (x1: number, y1: number, x2: number, y2: number, c = SUB) =>
  <g stroke={c} strokeWidth="2" fill={c}><line x1={x1} y1={y1} x2={x2 - 7} y2={y2} /><path d={`M${x2},${y2} l-8,-4 l0,8 z`} /></g>
const box = (x: number, y: number, w: number, h: number, c: string, fill = 'rgba(255,255,255,0.035)') =>
  <rect x={x} y={y} width={w} height={h} rx="12" fill={fill} stroke={c} strokeWidth="1.6" />
const scaleBar = (x: number, y: number, w: number, label: string) => (
  <g stroke={SUB} strokeWidth="1.5">
    <line x1={x} y1={y} x2={x + w} y2={y} /><line x1={x} y1={y - 3} x2={x} y2={y + 3} /><line x1={x + w} y1={y - 3} x2={x + w} y2={y + 3} />
    <text x={x + w / 2} y={y + 13} textAnchor="middle" fill={SUB} stroke="none" style={{ fontFamily: M, fontSize: 9 }}>{label}</text>
  </g>
)
function sine(x: number, y: number, w: number, amp: number, k: number) { let d = `M${x} ${y}`; for (let i = 0; i <= w; i += 3) d += ` L${x + i} ${y + Math.sin(i * 0.05 * k) * amp}`; return d }
const flow = (path: string, n = 4, dur = 2.4) =>
  Array.from({ length: n }, (_, k) => (
    <circle key={k} r="3.4" fill="#fff" filter="url(#ga-glow)">
      <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${(k * dur) / n}s`} path={path} />
      <animate attributeName="opacity" values="0;1;1;0" dur={`${dur}s`} repeatCount="indefinite" begin={`${(k * dur) / n}s`} />
    </circle>
  ))

/* ---- scenes ---- */
function Bursting() {
  const burst: number[] = []; [4, 42, 96, 138, 192].forEach((b) => [0, 8].forEach((o) => burst.push(b + o)))
  const tonic = Array.from({ length: 6 }, (_, i) => i * 42 + 8)
  return (<g>
    {box(40, 78, 150, 116, LINE)}
    {tx(115, 214, 'STN', SUB, 'middle', 12, 600)}
    {([[78, 112], [122, 102], [158, 120], [96, 150]] as const).map(([x, y], k) => <circle key={k} cx={x} cy={y} r="6" fill={TEAL} />)}
    <circle cx="122" cy="166" r="32" fill="none" stroke={MAG} strokeWidth="1.5" strokeDasharray="4 4"><animate attributeName="r" values="30;37;30" dur="2.2s" repeatCount="indefinite" /></circle>
    {([[112, 163], [134, 171]] as const).map(([x, y], k) => <circle key={k} cx={x} cy={y} r="7" fill={MAG}><animate attributeName="opacity" values="1;0.4;1" dur="0.5s" begin={`${k * 0.12}s`} repeatCount="indefinite" /></circle>)}
    {arrow(196, 130, 238, 130)}
    {tx(252, 96, 'tonic firing', SUB, 'start', 12, 600)}{ticks(254, 116, tonic, TEAL)}{tx(516, 120, 'regular', SUB, 'end', 11, 400, M)}
    {box(244, 152, 290, 56, MAG, 'rgba(255,77,141,0.08)')}
    {tx(252, 174, 'burst firing', MAG, 'start', 12, 700)}<g><animate attributeName="opacity" values="0.45;1;0.45" dur="0.6s" repeatCount="indefinite" />{ticks(254, 192, burst, MAG)}</g>
    {tx(524, 146, '→ optimal DBS target', MAG, 'end', 11.5, 600)}
    {scaleBar(454, 202, 60, '200 ms')}
  </g>)
}
function Irregular() {
  const reg = Array.from({ length: 9 }, (_, i) => i * 34 + 10)
  const irr = [8, 26, 34, 86, 150, 168, 178, 238, 286]
  return (<g>
    {tx(40, 96, 'regular firing', TEAL, 'start', 12, 600)}{ticks(120, 116, reg, TEAL)}
    {tx(40, 168, 'irregular firing', MAG, 'start', 12, 600)}<g><animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />{ticks(120, 168, irr, MAG)}</g>
    {arrow(438, 142, 468, 142, AMB)}
    {tx(478, 138, 'impulse', AMB, 'start', 11.5, 600)}{tx(478, 154, 'control', AMB, 'start', 11.5, 600)}
    {scaleBar(120, 196, 60, '200 ms')}
  </g>)
}
function PhaseLock() {
  const peaks = Array.from({ length: 7 }, (_, i) => 36 + i * 70)
  return (<g>
    {tx(40, 80, 'cortical θ–α oscillation', SUB, 'start', 12, 600)}
    <path d={sine(20, 130, 500, 24, 1.1)} fill="none" stroke={VIO} strokeWidth="2.6" />
    {flow(sine(20, 130, 500, 24, 1.1), 3, 2.6)}
    <g><animate attributeName="opacity" values="0.5;1;0.5" dur="0.7s" repeatCount="indefinite" />{ticks(0, 130, peaks, MAG, 30)}</g>
    {tx(40, 210, 'STN spikes fire at the wave’s phase → accurate speech', TXT, 'start', 12, 500)}
  </g>)
}
function BetaBurst() {
  let d = `M40 120`; for (let i = 0; i <= 470; i += 3) { const e = (i > 120 && i < 185) || (i > 320 && i < 380) ? 32 : 8; d += ` L${40 + i} ${120 + Math.sin(i * 0.7) * e}` }
  return (<g>
    {tx(40, 70, 'subthalamic LFP · β (13–30 Hz)', SUB, 'start', 12, 600)}
    {[160, 360].map((x, k) => <rect key={k} x={x} y="78" width="62" height="96" rx="8" fill="rgba(255,77,141,0.08)" stroke={MAG} strokeWidth="1.3"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" begin={`${k * 0.5}s`} repeatCount="indefinite" /></rect>)}
    <path d={d} fill="none" stroke={TEAL} strokeWidth="2.4" />
    {flow(d, 2, 3.2)}
    {tx(191, 196, 'β-burst', MAG, 'middle', 11, 600)}{tx(391, 196, 'β-burst', MAG, 'middle', 11, 600)}
    {tx(525, 70, 'dopamine-dependent → reaching', AMB, 'end', 11, 500)}
    {scaleBar(458, 196, 56, '500 ms')}
  </g>)
}
function ClosedLoop() {
  let d = `M40 110`; for (let i = 0; i <= 380; i += 3) d += ` L${40 + i} ${110 + Math.sin(i * 0.16) * 30}`
  return (<g>
    {tx(40, 70, 'neural read-out', SUB, 'start', 12, 600)}
    <line x1="40" y1="86" x2="420" y2="86" stroke={VIO} strokeDasharray="4 5" strokeWidth="1.4" />{tx(424, 90, 'threshold', VIO, 'start', 10, 400, M)}
    <path d={d} fill="none" stroke={TEAL} strokeWidth="2.4" />
    {flow(d, 2, 3)}
    {[120, 250].map((x, k) => <line key={k} x1={40 + x} y1="150" x2={40 + x} y2="92" stroke={AMB} strokeWidth="3" strokeLinecap="round"><animate attributeName="opacity" values="0.25;1;0.25" dur="1.1s" begin={`${k * 0.4}s`} repeatCount="indefinite" /></line>)}
    {tx(280, 200, 'state crosses threshold → stimulate (adaptive)', TXT, 'middle', 12, 500)}
  </g>)
}
function Fanout() {
  const tg: [string, string][] = [['premotor · SMA', AMB], ['dorsolateral PFC', TEAL], ['ventromedial PFC', VIO], ['orbitofrontal', MAG]]
  return (<g>
    {box(40, 92, 130, 56, LINE)}{tx(105, 124, 'DBS site', TXT, 'middle', 12, 600)}
    {tg.map(([t, c], k) => { const y = 56 + k * 40; const d = `M170,120 C250,120 ${360 - 80},${y} 360,${y}` ; return (<g key={k}><path d={d} fill="none" stroke={c} strokeWidth="2.4" />{flow(d, 2, 2.6 + k * 0.2)}<circle cx="368" cy={y} r="6" fill={c}><animate attributeName="r" values="5;7.5;5" dur={`${2 + k * 0.3}s`} repeatCount="indefinite" /></circle>{tx(384, y + 4, t, TXT, 'start', 12, 500)}</g>) })}
    {tx(105, 168, 'fiber tracts', SUB, 'middle', 10, 400, M)}
  </g>)
}
function Network() {
  const n = [[110, 80], [80, 120], [140, 150], [205, 96], [195, 158], [270, 120], [255, 72], [340, 104], [395, 150], [430, 82]]
  const e: [number, number][] = [[0, 3], [1, 2], [2, 4], [3, 4], [3, 5], [3, 6], [5, 7], [7, 8], [7, 9], [0, 6], [5, 8]]
  return (<g>
    {e.map(([a, b], k) => <line key={k} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} stroke={k % 2 ? TEAL : VIO} strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="3 9"><animate attributeName="stroke-dashoffset" values="12;0" dur={`${1.4 + (k % 3) * 0.4}s`} repeatCount="indefinite" /></line>)}
    {n.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 7 : 5} fill={[TEAL, VIO, MAG][k % 3]}><animate attributeName="opacity" values="0.55;1;0.55" dur={`${2 + k * 0.25}s`} repeatCount="indefinite" /></circle>)}
    {tx(40, 210, 'stimulation engages a distributed brain network', SUB, 'start', 11, 500)}
  </g>)
}
function Spectro() {
  return (<g>
    {Array.from({ length: 22 }, (_, c) => Array.from({ length: 6 }, (_, r) => { const v = Math.max(0, Math.sin(c / 3) * 0.5 + 0.5 - r / 8); const o = 0.22 + v * 0.72; return <rect key={`${c}-${r}`} x={62 + c * 13} y={54 + r * 17} width="11.5" height="15" rx="2" fill={r < 3 ? MAG : TEAL} opacity={o}><animate attributeName="opacity" values={`${o};${o * 0.3};${o}`} dur={`${1.2 + (c % 5) * 0.35}s`} repeatCount="indefinite" /></rect> }))}
    <line x1="54" y1="54" x2="54" y2="156" stroke={LINE} strokeWidth="1.4" />
    {tx(50, 74, 'β', MAG, 'end', 11, 700, M)}{tx(50, 112, 'α', TEAL, 'end', 11, 700, M)}{tx(50, 148, 'θ', TEAL, 'end', 11, 700, M)}
    {tx(62, 210, 'α / β biomarker', SUB, 'start', 11, 500, M)}
    {tx(348, 174, 'time →', SUB, 'end', 9, 400, M)}
    <g transform="translate(360 158)">{[42, 32, 20, 10].map((h, k) => <rect key={k} x={k * 34} y={-h} width="22" height={h} rx="3" fill={k < 2 ? MAG : GRN}><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" begin={`${k * 0.2}s`} repeatCount="indefinite" /></rect>)}</g>
    {tx(420, 196, 'seizures ↓', GRN, 'middle', 12, 600)}
  </g>)
}
function Denoise() {
  let noisy = `M44 96`; for (let i = 0; i <= 180; i += 2) noisy += ` L${44 + i} ${96 + Math.sin(i * 1.5) * 14 + ((i % 7) - 3) * 5}`
  return (<g>
    {tx(54, 70, 'raw recording', MAG, 'start', 12, 600)}
    <path d={noisy} fill="none" stroke={MAG} strokeWidth="2" />
    {arrow(248, 116, 300, 116, SUB)}{tx(274, 106, 'spatial filter', SUB, 'middle', 10, 400, M)}
    {tx(330, 70, 'clean signal', TEAL, 'start', 12, 600)}
    <path d={sine(316, 116, 184, 16, 1.0)} fill="none" stroke={TEAL} strokeWidth="2.4" />
    {flow(sine(316, 116, 184, 16, 1.0), 2, 2.6)}
  </g>)
}
function Signal() {
  return (<g>
    <path d={sine(44, 120, 300, 24, 1.0)} fill="none" stroke={TEAL} strokeWidth="2.4" />
    {flow(sine(44, 120, 300, 24, 1.0), 2, 2.6)}
    {tx(44, 80, 'neural / behavioural measure', SUB, 'start', 12, 500)}
    {arrow(356, 120, 408, 120, AMB)}
    <circle cx="475" cy="120" r="30" fill="none" stroke={AMB} strokeWidth="1.4" opacity="0.5"><animate attributeName="r" values="26;34;26" dur="2.4s" repeatCount="indefinite" /></circle>
    {box(420, 96, 110, 48, AMB)}{tx(475, 124, 'outcome', AMB, 'middle', 12, 600)}
  </g>)
}

function Scan() {
  const dom: [string, string][] = [['somatomotor · action', TEAL], ['arousal · physiology', AMB], ['cognition', VIO]]
  const hub: [number, number] = [322, 134]
  return (<g>
    {dom.map(([t, c], k) => { const y = 70 + k * 50; const p = `M212,${y} L${hub[0] - 32},${hub[1]}`; return (<g key={k}>
      {box(40, y - 18, 168, 36, c)}{tx(124, y + 4, t, TXT, 'middle', 11.5, 500)}
      {arrow(212, y, hub[0] - 32, hub[1], LINE)}{flow(p, 1, 2.4)}
    </g>) })}
    <circle cx={hub[0]} cy={hub[1]} r="30" fill="rgba(255,77,141,0.10)" stroke={MAG} strokeWidth="1.8" />
    <circle cx={hub[0]} cy={hub[1]} r="40" fill="none" stroke={RED} strokeWidth="1.4" strokeDasharray="4 5" opacity="0.8"><animate attributeName="r" values="38;46;38" dur="2.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.2s" repeatCount="indefinite" /></circle>
    {tx(hub[0], hub[1] + 4, 'SCAN', MAG, 'middle', 14, 700, M)}
    {tx(hub[0], 206, 'network disruption', RED, 'middle', 11, 500)}
    {arrow(hub[0] + 42, hub[1], 440, hub[1], LINE)}{flow(`M${hub[0] + 42},${hub[1]} L440,${hub[1]}`, 1, 2.2)}
    {box(444, hub[1] - 24, 104, 48, AMB)}
    {tx(496, hub[1], 'Parkinson’s', TXT, 'middle', 12, 600)}
    {tx(496, hub[1] + 15, 'disease', TXT, 'middle', 12, 600)}
  </g>)
}

function Speech() {
  const path = 'M122,150 C220,150 322,92 416,92'
  return (<g>
    <path d={sine(36, 132, 488, 18, 1.15)} fill="none" stroke={VIO} strokeWidth="2" opacity="0.4" />
    <path d={path} fill="none" stroke="url(#ga-st)" strokeWidth="2.5" strokeDasharray="2 7" filter="url(#ga-glow)"><animate attributeName="stroke-dashoffset" values="18;0" dur="0.9s" repeatCount="indefinite" /></path>
    {flow(path, 4, 2.4)}
    {/* STN node */}
    <circle cx="122" cy="150" r="26" fill="url(#ga-core)" />
    {[0, 1].map((k) => <circle key={k} cx="122" cy="150" r="14" fill="none" stroke={MAG} strokeWidth="1.6" opacity="0.7"><animate attributeName="r" values="14;30" dur="2.4s" begin={`${k * 1.2}s`} repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0" dur="2.4s" begin={`${k * 1.2}s`} repeatCount="indefinite" /></circle>)}
    <circle cx="122" cy="150" r="9" fill={MAG} filter="url(#ga-glow)" />
    {/* cortex node */}
    <circle cx="416" cy="92" r="22" fill="url(#ga-core)" opacity="0.7" />
    <circle cx="416" cy="92" r="9" fill={TEAL} filter="url(#ga-glow)" />
    {tx(122, 188, 'STN single-unit', SUB, 'middle', 11, 600)}
    {tx(416, 128, 'perisylvian cortex (SMG / pSTG)', SUB, 'middle', 10.5, 600)}
    {tx(280, 214, 'spikes phase-lock to θ–α → speech accuracy', TXT, 'middle', 12, 500)}
  </g>)
}

function Challenges() {
  const cards: [number, number, string, string, string][] = [
    [34, 50, 'WHERE to stimulate', 'targeting · connectomics', TEAL],
    [354, 50, 'WHAT to sense', 'biomarkers', MAG],
    [34, 150, 'WHEN to adapt', 'closed-loop timing', AMB],
    [354, 150, 'HOW to personalize', 'patient-specific', VIO],
  ]
  const hx = 282, hy = 120
  return (<g>
    {cards.map(([x, y, t, sub, c], k) => {
      const left = x < 280
      const ex = left ? x + 172 : x
      const ey = y + 20
      const d = `M${ex},${ey} L${hx + (left ? -26 : 26)},${hy}`
      return (<g key={k}>
        <path d={d} fill="none" stroke={c} strokeWidth="1.8" strokeOpacity="0.55" strokeDasharray="3 7"><animate attributeName="stroke-dashoffset" values="10;0" dur={`${1.6 + k * 0.3}s`} repeatCount="indefinite" /></path>
        {flow(d, 1, 2.4 + k * 0.25)}
        {box(x, y, 172, 40, c)}
        {tx(x + 14, y + 18, t, TXT, 'start', 11.5, 700)}
        {tx(x + 14, y + 32, sub, SUB, 'start', 9.5, 400, M)}
      </g>)
    })}
    {/* stimulating DBS lead at the hub */}
    <circle cx={hx} cy={hy} r="30" fill="none" stroke={MAG} strokeWidth="1.3" strokeDasharray="4 5" opacity="0.7"><animate attributeName="r" values="28;39;28" dur="2.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.15;0.7" dur="2.4s" repeatCount="indefinite" /></circle>
    <rect x={hx - 6} y={hy - 30} width="12" height="60" rx="6" fill="rgba(255,255,255,0.08)" stroke={LINE} strokeWidth="1.4" />
    {[-20, -6, 8, 22].map((dy, i) => <rect key={i} x={hx - 6} y={hy + dy} width="12" height="9" rx="2" fill={i === 1 ? MAG : 'rgba(255,255,255,0.28)'} filter={i === 1 ? 'url(#ga-glow)' : undefined}>{i === 1 && <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />}</rect>)}
    {tx(hx, hy + 52, 'DBS lead', SUB, 'middle', 10, 400, M)}
  </g>)
}

const MOTIF: Record<Motif, () => JSX.Element> = {
  bursting: Bursting, irregular: Irregular, phaselock: PhaseLock, betaburst: BetaBurst,
  closedloop: ClosedLoop, fanout: Fanout, network: Network, spectro: Spectro, denoise: Denoise, signal: Signal, scan: Scan, speech: Speech, challenges: Challenges,
}

export default function GraphicalAbstract({ slug, variant }: { slug: string; variant: Variant; id?: string }) {
  const sp = SPEC[slug] || FB[variant]
  return (
    <svg viewBox="0 0 560 240" className="ga-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="ga-card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#181a38" /><stop offset="1" stopColor="#0e1024" /></linearGradient>
        <linearGradient id="ga-st" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={TEAL} /><stop offset="1" stopColor={MAG} /></linearGradient>
        <radialGradient id="ga-core" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff" /><stop offset="0.35" stopColor={MAG} /><stop offset="1" stopColor={MAG} stopOpacity="0" /></radialGradient>
        <filter id="ga-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="560" height="240" fill="url(#ga-card)" />
      <rect x="24" y="22" width="14" height="3" rx="1.5" fill={MAG} />
      <text x="44" y="29" fill={TXT} style={{ fontFamily: M, fontSize: 12.5, letterSpacing: 1.2, fontWeight: 700 }}>{sp.title}</text>
      {MOTIF[sp.motif]()}
    </svg>
  )
}
