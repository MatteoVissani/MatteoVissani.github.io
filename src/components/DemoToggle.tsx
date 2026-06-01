import { useState, type ReactNode } from 'react'

// Collapsible launcher: keeps heavy interactive demos hidden (and unmounted, so
// they don't run) until the user opens them.
export default function DemoToggle({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`demo-toggle${open ? ' open' : ''}`}>
      <button className="demo-launch" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="demo-launch-icon">{open ? '▾' : '▸'}</span>
        <span className="demo-launch-text">
          <span className="demo-launch-title">{title}</span>
          {subtitle && <span className="demo-launch-sub">{subtitle}</span>}
        </span>
        <span className="demo-launch-cta">{open ? 'Hide' : 'Launch ▸'}</span>
      </button>
      {open && <div className="demo-body">{children}</div>}
    </div>
  )
}
