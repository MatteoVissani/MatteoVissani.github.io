import { useState, type ReactNode } from 'react'

// Collapsible launcher: keeps heavy interactive demos hidden (and unmounted, so
// they don't run) until the user opens them. When `notes` is given, a small
// always-visible link points to that demo's theory chapter.
export default function DemoToggle({ title, subtitle, notes, children }: { title: string; subtitle?: string; notes?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`demo-toggle${open ? ' open' : ''}`}>
      <div className="demo-launch-row">
        <button className="demo-launch" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="demo-launch-icon">{open ? '▾' : '▸'}</span>
          <span className="demo-launch-text">
            <span className="demo-launch-title">{title}</span>
            {subtitle && <span className="demo-launch-sub">{subtitle}</span>}
          </span>
          <span className="demo-launch-cta">{open ? 'Hide' : 'Launch ▸'}</span>
        </button>
        {notes && (
          <a className="demo-notes-tag" href={`/notes#${notes}`} title="Read the theory: derivation, pseudocode & references for this method">
            <span className="demo-notes-tag-sum">∑</span> notes
          </a>
        )}
      </div>
      {open && <div className="demo-body">{children}</div>}
    </div>
  )
}
