// In-demo connector to the full theory chapter on the Notes page.
export default function DemoNotes({ demo }: { demo: string }) {
  return (
    <a className="demo-notes-link" href={`/notes#${demo}`}>
      <span className="demo-notes-ico">∑</span>
      <span className="demo-notes-label">Read the full notes — foundations, derivation &amp; schematic</span>
      <span className="demo-notes-cta">Open ↗</span>
    </a>
  )
}
