import katex from 'katex'
import 'katex/dist/katex.min.css'

// Inline and block math, rendered with KaTeX. throwOnError:false so a typo
// degrades to red source text instead of crashing the panel.
export function T({ children }: { children: string }) {
  return <span className="tex-inline" dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: false }) }} />
}

export function TB({ children }: { children: string }) {
  return <div className="tex-block" dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { displayMode: true, throwOnError: false }) }} />
}
