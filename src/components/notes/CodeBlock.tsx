import { useState } from 'react'

// Minimal pseudocode highlighter: comments, control keywords, builtins, numbers.
const KW = ['for', 'if', 'else', 'elif', 'while', 'loop', 'each', 'in', 'return', 'emit', 'append', 'to', 'step', 'of', 'and', 'or', 'not', 'add', 'remove', 'keep', 'assign', 'integrate', 'settle', 'plot', 'record']
const FN = ['argmin', 'argmax', 'sum', 'max', 'min', 'round', 'exp', 'log10', 'log2', 'log', 'sin', 'cos', 'sqrt', 'angle', 'mean', 'Poisson', 'gaussian', 'rand', 'hilbert', 'percentile', 'len', 'logspace', 'atan2', 'field', 'PPC']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const reKW = new RegExp('\\b(' + KW.join('|') + ')\\b', 'g')
const reFN = new RegExp('\\b(' + FN.join('|') + ')\\b', 'g')

function highlight(line: string): string {
  const h = line.indexOf('#')
  const codePart = h >= 0 ? line.slice(0, h) : line
  const comment = h >= 0 ? line.slice(h) : ''
  let out = esc(codePart)
    .replace(reFN, '<span class="c-fn">$1</span>')
    .replace(reKW, '<span class="c-kw">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="c-num">$1</span>')
  if (comment) out += '<span class="c-cmt">' + esc(comment) + '</span>'
  return out || '​'
}

export default function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const text = code.replace(/^\n+/, '').replace(/\n+$/, '')
  const lines = text.split('\n')
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1300) })
  }
  return (
    <div className="cb">
      <div className="cb-head">
        <span className="cb-dots"><i /><i /><i /></span>
        <span className="cb-lang">pseudocode</span>
        <button className="cb-copy" onClick={copy}>{copied ? '✓ copied' : '⧉ copy'}</button>
      </div>
      <div className="cb-body">
        <pre className="cb-gutter" aria-hidden="true">{lines.map((_, i) => i + 1).join('\n')}</pre>
        <pre className="cb-code"><code dangerouslySetInnerHTML={{ __html: lines.map(highlight).join('\n') }} /></pre>
      </div>
    </div>
  )
}
