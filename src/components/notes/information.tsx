import { T, TB } from './Tex'
import type { DemoNote } from './types'
const r = String.raw

export const information: DemoNote = {
  title: 'Entropy & mutual information',
  theme: 'Neural coding & information',
  tagline: 'From Shannon entropy to channel capacity and the Huffman source-coding bound.',

  foundations: (
    <>
      <p>
        <b>Entropy</b> measures uncertainty. If a symbol <T>{r`x`}</T> occurs with probability <T>{r`p(x)`}</T>, its
        surprise is <T>{r`-\log_2 p(x)`}</T> bits, and the average surprise is the entropy
        <T>{r`H(X)=-\sum_x p(x)\log_2 p(x)`}</T>. Two consequences bracket all of communication. <b>Source coding</b>:
        you cannot compress a source below <T>{r`H`}</T> bits/symbol on average. <b>Channel coding</b>: a noisy
        channel can carry at most <T>{r`C`}</T> bits reliably, where the <b>mutual information</b>
      </p>
      <TB>{r`I(X;Y) = H(Y) - H(Y\mid X) = \sum_{x,y} p(x,y)\,\log_2\frac{p(x,y)}{p(x)p(y)}`}</TB>
      <p>
        is how much observing the output <T>{r`Y`}</T> reduces uncertainty about the input <T>{r`X`}</T>, and
        <T>{r`C=\max_{p(x)}I(X;Y)`}</T>. The demo realizes both on a binary alphabet: a binary symmetric channel for
        capacity, and an explicit Huffman code for source coding.
      </p>
    </>
  ),

  derivation: [
    {
      title: 'Binary entropy',
      tex: r`H_2(q) = -q\log_2 q - (1-q)\log_2(1-q)`,
      note: <p>The entropy of a single biased bit. It is 0 at <T>{r`q=0,1`}</T> (certain) and maximal (1 bit) at <T>{r`q=0.5`}</T>.</p>,
    },
    {
      title: 'The channel',
      tex: r`X\xrightarrow{\ \text{flip w.p. } f\ }Y,\qquad H(Y\mid X) = H_2(f)`,
      note: <p>A binary symmetric channel flips the bit with crossover probability <T>{r`f`}</T>. Given the input, the only remaining uncertainty is whether it flipped — entropy <T>{r`H_2(f)`}</T>.</p>,
    },
    {
      title: 'Output distribution',
      tex: r`p_Y = p(1-f) + (1-p)f,\qquad H(Y) = H_2(p_Y)`,
      note: <p>With <T>{r`P(X{=}1)=p`}</T>, the output is 1 either if the input was 1 and didn't flip, or 0 and did.</p>,
    },
    {
      title: 'Mutual information',
      tex: r`I(X;Y) = H(Y) - H(Y\mid X) = H_2(p_Y) - H_2(f)`,
      note: <p>The reduction in output uncertainty once the input is known. The stacked bar shows the identity <T>{r`H(X,Y)=H(X\mid Y)+I(X;Y)+H(Y\mid X)`}</T>.</p>,
    },
    {
      title: 'Capacity',
      tex: r`C = \max_p I(X;Y) = 1 - H_2(f)`,
      note: <p>Maximized at <T>{r`p=0.5`}</T>. As <T>{r`f\to0.5`}</T>, <T>{r`C\to0`}</T> — a maximally noisy channel carries nothing.</p>,
    },
    {
      title: 'Source coding limit',
      tex: r`H = -\sum_i p_i\log_2 p_i \;\le\; L \;<\; H+1`,
      note: <p>Switching to compression: the entropy <T>{r`H`}</T> of a symbol distribution is the floor on the average code length <T>{r`L`}</T> of any uniquely decodable code (Shannon).</p>,
    },
    {
      title: 'Huffman achieves it',
      tex: r`\text{merge two least-probable nodes, repeat}`,
      note: <p>The greedy Huffman algorithm builds the optimal prefix code by repeatedly combining the two rarest symbols. Its length <T>{r`L=\sum_i p_i\ell_i`}</T> meets the bound, with equality <T>{r`L=H`}</T> exactly when every <T>{r`p_i`}</T> is a negative power of two; efficiency <T>{r`H/L`}</T> is reported.</p>,
    },
  ],

  deep: [
    {
      heading: 'Capacity of the binary symmetric channel, derived',
      body: (
        <>
          <p>The capacity is the mutual information maximized over the input distribution, <T>{r`C = \max_{p} I(X;Y)`}</T>. Using <T>{r`I(X;Y) = H(Y) - H(Y\mid X)`}</T> and noting that <T>{r`H(Y\mid X) = H_2(f)`}</T> does not depend on <T>{r`p`}</T>, only <T>{r`H(Y)`}</T> must be maximized. The output entropy <T>{r`H(Y) = H_2(p_Y)`}</T> is largest when <T>{r`p_Y = \tfrac12`}</T>, which occurs at <T>{r`p = \tfrac12`}</T> (by symmetry of the channel). Then <T>{r`H(Y) = 1`}</T> bit and</p>
          <TB>{r`C = 1 - H_2(f)\ \text{ bits per use}.`}</TB>
          <p>At <T>{r`f=0`}</T> the channel is noiseless and <T>{r`C=1`}</T>; at <T>{r`f=\tfrac12`}</T> the output is independent of the input and <T>{r`C=0`}</T>. The capacity is symmetric about <T>{r`f=\tfrac12`}</T> because a channel that always flips (<T>{r`f=1`}</T>) is as good as a noiseless one after relabelling.</p>
        </>
      ),
    },
    {
      heading: 'The Kraft inequality and the entropy bound',
      body: (
        <>
          <p>Any uniquely decodable code with codeword lengths <T>{r`\ell_i`}</T> over a binary alphabet must satisfy the <b>Kraft inequality</b> <T>{r`\sum_i 2^{-\ell_i} \le 1`}</T>. Minimizing the expected length <T>{r`L = \sum_i p_i\ell_i`}</T> subject to this constraint (treating <T>{r`\ell_i`}</T> as continuous, via Lagrange multipliers) gives the ideal lengths <T>{r`\ell_i = -\log_2 p_i`}</T> and the minimum expected length</p>
          <TB>{r`L_{\min} = -\sum_i p_i \log_2 p_i = H.`}</TB>
          <p>Integer codeword lengths cannot generally hit <T>{r`-\log_2 p_i`}</T> exactly, which is why real codes obey <T>{r`H \le L < H+1`}</T>. Equality <T>{r`L=H`}</T> holds precisely when every <T>{r`p_i`}</T> is a power of two, so that <T>{r`-\log_2 p_i`}</T> is already an integer.</p>
        </>
      ),
    },
    {
      heading: 'Why Huffman is optimal',
      body: (
        <>
          <p>Huffman’s greedy merge is provably optimal among prefix codes. Two facts drive the proof. First, in an optimal code the two least-probable symbols have the longest, equal-length codewords and differ only in the last bit (otherwise one could shorten or swap to do better). Second, merging those two symbols into one of combined probability yields a strictly smaller problem whose optimal code extends to an optimal code of the original. Induction on the alphabet size completes the argument. The demo builds exactly this tree by repeated merging; the efficiency <T>{r`H/L`}</T> it reports is therefore the best any prefix code can achieve for the chosen probabilities.</p>
        </>
      ),
    },
    {
      heading: 'Worked example: capacity at f = 0.1',
      body: (
        <>
          <p>For a crossover probability <T>{r`f=0.1`}</T>, the conditional entropy is</p>
          <TB>{r`H_2(0.1) = -0.1\log_2 0.1 - 0.9\log_2 0.9 = 0.332 + 0.137 = 0.469\ \text{bits}.`}</TB>
          <p>With an unbiased source (<T>{r`p=0.5`}</T>) the output is also unbiased, <T>{r`H(Y)=1`}</T> bit, so the mutual information equals the capacity</p>
          <TB>{r`C = 1 - H_2(0.1) = 0.531\ \text{bits per channel use}.`}</TB>
          <p>A biased source, say <T>{r`p=0.9`}</T>, gives <T>{r`H(Y)=H_2(0.9\cdot0.9+0.1\cdot0.1)=H_2(0.82)=0.68`}</T> and <T>{r`I=0.68-0.469=0.21`}</T> bits — well below capacity, confirming that the optimum is the unbiased input.</p>
        </>
      ),
    },
  ],

  schema: (
    <svg className="dn-svg" viewBox="0 0 520 180" role="img" aria-label="Binary symmetric channel">
      <defs><marker id="inarr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#22e1ff" /></marker></defs>
      <text x="60" y="40" textAnchor="middle" fill="#e9ebfb" fontSize="13" fontFamily="monospace">X=0</text>
      <text x="60" y="140" textAnchor="middle" fill="#e9ebfb" fontSize="13" fontFamily="monospace">X=1</text>
      <text x="430" y="40" textAnchor="middle" fill="#e9ebfb" fontSize="13" fontFamily="monospace">Y=0</text>
      <text x="430" y="140" textAnchor="middle" fill="#e9ebfb" fontSize="13" fontFamily="monospace">Y=1</text>
      <line x1="90" y1="36" x2="400" y2="36" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#inarr)" />
      <line x1="90" y1="136" x2="400" y2="136" stroke="#22e1ff" strokeWidth="2" markerEnd="url(#inarr)" />
      <line x1="90" y1="44" x2="400" y2="128" stroke="#ff2d8f" strokeWidth="1.8" markerEnd="url(#inarr)" />
      <line x1="90" y1="128" x2="400" y2="44" stroke="#ff2d8f" strokeWidth="1.8" markerEnd="url(#inarr)" />
      <text x="250" y="28" textAnchor="middle" fill="#22e1ff" fontSize="11" fontFamily="monospace">1−f</text>
      <text x="250" y="96" textAnchor="middle" fill="#ff2d8f" fontSize="11" fontFamily="monospace">f (flip)</text>
    </svg>
  ),

  numerics: (
    <p>
      All quantities are closed-form (no simulation): <T>{r`H_2`}</T> from the formula above, the BSC values from
      <T>{r`p`}</T> and <T>{r`f`}</T>. The Huffman tree is built with a priority-queue greedy merge over the five symbol
      probabilities (weights normalized to sum 1); codes are read off by labelling tree edges 0/1.
    </p>
  ),

  pseudocode: `
H2(q) = −q·log2(q) − (1−q)·log2(1−q)

# binary symmetric channel
pY  ← p·(1−f) + (1−p)·f
I   ← H2(pY) − H2(f)
C   ← 1 − H2(f)

# source entropy and Huffman code
H ← −sum_i p_i·log2(p_i)
nodes ← { leaf(symbol i, prob p_i) }
while len(nodes) > 1:
    a, b ← two nodes of smallest probability
    remove a, b ;  add node(prob = a.p + b.p, children = {a, b})
assign bit 0/1 down each edge ;  len_i ← depth of leaf i
L   ← sum_i p_i·len_i                                 #  H ≤ L < H + 1
`,
  params: [
    { name: 'p', range: '0–1 (0.02, 0.5)', role: 'source bias P(X=1)' },
    { name: 'f', range: '0–0.5 (0.01, 0.1)', role: 'channel crossover probability' },
    { name: '5 weights', range: '0–8 each (1; 5,3,2,1,1)', role: 'relative frequencies of symbols A–E' },
  ],

  refs: <>Shannon, <i>Bell Syst. Tech. J.</i> 27 (1948) 379; Cover &amp; Thomas, <i>Elements of Information Theory</i> (2006); Huffman, <i>Proc. IRE</i> 40 (1952) 1098.</>,
}
