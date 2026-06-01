import { useState } from 'react'

const log2 = (x: number) => Math.log(x) / Math.LN2
const h2 = (p: number) => (p <= 0 || p >= 1 ? 0 : -p * log2(p) - (1 - p) * log2(1 - p))
const fmt = (x: number) => x.toFixed(2)

type Node = { p: number; sym?: number; l?: Node; r?: Node }
function huffman(probs: number[]) {
  const out = probs.map(() => ({ code: '', len: 0 }))
  const live = probs.map((p, i) => ({ p, i })).filter((o) => o.p > 0)
  if (live.length === 0) return out
  if (live.length === 1) { out[live[0].i] = { code: '0', len: 1 }; return out }
  let nodes: Node[] = live.map((o) => ({ p: o.p, sym: o.i }))
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.p - b.p)
    const a = nodes.shift() as Node, b = nodes.shift() as Node
    nodes.push({ p: a.p + b.p, l: a, r: b })
  }
  const walk = (n: Node, pre: string) => {
    if (n.sym !== undefined) { out[n.sym] = { code: pre || '0', len: (pre || '0').length }; return }
    walk(n.l as Node, pre + '0'); walk(n.r as Node, pre + '1')
  }
  walk(nodes[0], '')
  return out
}

export default function InfoLab() {
  // ---- mutual information through a binary symmetric channel ----
  const [px, setPx] = useState(0.5) // P(X=1)
  const [f, setF] = useState(0.1)   // crossover probability
  const HX = h2(px)
  const HYgX = h2(f)
  const pY = px * (1 - f) + (1 - px) * f
  const HY = h2(pY)
  const I = Math.max(0, HY - HYgX)
  const C = 1 - h2(f)
  const HXgY = Math.max(0, HX - I)
  const HXY = HXgY + I + HYgX || 1

  // ---- source coding: entropy & Huffman ----
  const syms = ['A', 'B', 'C', 'D', 'E']
  const [w, setW] = useState([5, 3, 2, 1, 1])
  const tot = w.reduce((a, b) => a + b, 0) || 1
  const probs = w.map((x) => x / tot)
  const H = probs.reduce((a, p) => a + (p > 0 ? -p * log2(p) : 0), 0)
  const codes = huffman(probs)
  const L = probs.reduce((a, p, i) => a + p * codes[i].len, 0)
  const eff = L > 0 ? H / L : 0

  return (
    <div className="lifsim panel">
      {/* ================= mutual information ================= */}
      <div className="lifsim-title">Part 1 — Mutual information through a noisy channel</div>
      <div className="lifsim-sub">
        Send a bit <i>X</i> (with <i>P(X=1)=p</i>) through a binary symmetric channel that flips it with probability <i>f</i>, giving <i>Y</i>.
        Watch how much the output tells you about the input: <i>I(X;Y)=H(Y)−H(Y|X)</i>.
      </div>
      <div className="ilab-chips">
        <span className="ilab-chip"><b>{fmt(HX)}</b> H(X)</span>
        <span className="ilab-chip"><b>{fmt(HYgX)}</b> H(Y|X)</span>
        <span className="ilab-chip cy"><b>{fmt(I)}</b> I(X;Y)</span>
        <span className="ilab-chip mag"><b>{fmt(C)}</b> capacity</span>
      </div>
      <div className="ilab-bar" title="decomposition of the joint entropy H(X,Y)">
        <div className="ilab-seg s-cond" style={{ flexGrow: HXgY / HXY }}>H(X|Y)</div>
        <div className="ilab-seg s-mi" style={{ flexGrow: I / HXY }}>I(X;Y)</div>
        <div className="ilab-seg s-noise" style={{ flexGrow: HYgX / HXY }}>H(Y|X)</div>
      </div>
      <div className="ilab-barcap">joint entropy H(X,Y) = H(X|Y) + I(X;Y) + H(Y|X) = {fmt(HXY)} bits</div>
      <div className="lifsim-controls">
        <label><span>source bias <i>p = P(X=1)</i> = {fmt(px)}</span>
          <input type="range" min={0} max={1} step={0.02} value={px} onChange={(e) => setPx(+e.target.value)} /></label>
        <label><span>channel noise <i>f</i> = {fmt(f)} {f >= 0.5 ? '· useless channel' : ''}</span>
          <input type="range" min={0} max={0.5} step={0.01} value={f} onChange={(e) => setF(+e.target.value)} /></label>
      </div>
      <div className="lifsim-explain">
        <p>Set <i>f</i>=0: a noiseless channel, so <i>Y</i>=<i>X</i> and <i>I(X;Y)=H(X)</i> (the pink mutual-information band fills the whole bar). Push <i>f</i> toward 0.5 and the channel becomes useless: <i>I→0</i> and the capacity <i>C=1−H₂(f)→0</i>. The mutual information peaks when the source is unbiased (<i>p</i>=0.5), where it equals the capacity.</p>
      </div>

      <div className="ilab-divider" />

      {/* ================= source coding ================= */}
      <div className="lifsim-title">Part 2 — Source coding: entropy &amp; Huffman</div>
      <div className="lifsim-sub">
        Choose how often each symbol occurs. The entropy <i>H</i> is the compression limit (bits/symbol); the optimal prefix code is <b>Huffman</b>, with average length <i>L</i>. Shannon’s theorem guarantees <i>H ≤ L &lt; H+1</i>.
      </div>
      <div className="ilab-chips">
        <span className="ilab-chip cy"><b>{fmt(H)}</b> entropy H</span>
        <span className="ilab-chip"><b>{fmt(L)}</b> Huffman L</span>
        <span className="ilab-chip mag"><b>{(eff * 100).toFixed(0)}%</b> efficiency H/L</span>
      </div>
      <table className="ilab-table">
        <thead><tr><th>symbol</th><th>probability</th><th>Huffman code</th><th>length</th></tr></thead>
        <tbody>
          {syms.map((s, i) => (
            <tr key={s}>
              <td>{s}</td>
              <td><div className="ilab-pbar"><span style={{ width: `${probs[i] * 100}%` }} />{(probs[i] * 100).toFixed(0)}%</div></td>
              <td className="mono">{probs[i] > 0 ? codes[i].code : '-'}</td>
              <td className="mono">{probs[i] > 0 ? codes[i].len : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lifsim-controls ilab-weights">
        {syms.map((s, i) => (
          <label key={s}><span>{s} weight = {w[i]}</span>
            <input type="range" min={0} max={8} step={1} value={w[i]}
              onChange={(e) => setW((arr) => arr.map((x, j) => (j === i ? +e.target.value : x)))} /></label>
        ))}
      </div>
      <div className="lifsim-explain">
        <p>Make the distribution very <b>uneven</b> (e.g. one big symbol): the entropy drops and Huffman gives the frequent symbol a 1-bit code, so <i>L</i> shrinks. Make it <b>uniform</b>: entropy is maximal (log₂ of the number of symbols) and all codewords have nearly equal length. The efficiency <i>H/L</i> is highest when the probabilities are (negative) powers of two, where Huffman is exactly optimal.</p>
      </div>
    </div>
  )
}
