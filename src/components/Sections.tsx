import { useMemo, useState } from 'react'
import Reveal from './Reveal'
import PillarGlyph from './PillarGlyph'
import SignalArt from './SignalArt'
import CitationTracker from './CitationTracker'
import {
  Mail, LinkedIn, GitHub, Scholar, Orcid, ResearchGate, ArrowRight, External, Pdf, Doi,
} from './Icons'
import {
  profile, aboutParagraphs, education, pillars, featured,
  publications, awards, talks, media, categoryLabels, type Pub, type Category,
} from '../data/content'

function Socials() {
  const L = profile.links
  const items = [
    { href: `mailto:${profile.email}`, Icon: Mail, label: 'Email' },
    { href: L.scholar, Icon: Scholar, label: 'Google Scholar' },
    { href: L.orcid, Icon: Orcid, label: 'ORCID' },
    { href: L.linkedin, Icon: LinkedIn, label: 'LinkedIn' },
    { href: L.github, Icon: GitHub, label: 'GitHub' },
    { href: L.researchgate, Icon: ResearchGate, label: 'ResearchGate' },
  ]
  return (
    <div className="about-socials">
      {items.map(({ href, Icon, label }) => (
        <a key={label} className="icon-link" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
          <Icon />
        </a>
      ))}
    </div>
  )
}

/* ---------------- ABOUT ---------------- */
export function About() {
  return (
    <section id="about" className="section">
      <div className="wrap">
        <div className="about-grid">
          <Reveal>
            <div className="about-photo-wrap">
              <div className="about-photo">
                <img src={profile.photo} alt="Matteo Vissani" loading="lazy" />
                <div className="duotone" />
                <span className="frame-corner tl" /><span className="frame-corner tr" />
                <span className="frame-corner bl" /><span className="frame-corner br" />
              </div>
              <Socials />
              <div className="edu-list">
                {education.map((e) => (
                  <div className="edu-item" key={e.degree}>
                    <span className="yr">{e.period}</span>
                    <div>
                      <div className="deg">{e.degree}</div>
                      <div className="pl">{e.place}{e.detail ? ` · ${e.detail}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="eyebrow">01 — About</p>
            <h2 className="section-title">Who <span className="accent">I am</span></h2>
            <div className="about-body">
              {aboutParagraphs.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
            <a className="btn ghost" href={profile.cv} target="_blank" rel="noreferrer" style={{ marginTop: '0.6rem', display: 'inline-block' }}>
              Download full CV
            </a>
          </Reveal>
        </div>

        <Reveal>
          <CitationTracker />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- RESEARCH ---------------- */
export function Research() {
  return (
    <section id="research" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">02 — Research</p>
          <h2 className="section-title">Lines of <span className="accent">research</span></h2>
          <p className="section-lead">
            Six areas I work across at the Brain Modulation Lab (MGH / Harvard) — from intraoperative recordings
            and adaptive stimulation to connectomics, analysis methods and computational models of the
            cortico-basal-ganglia circuit.
          </p>
        </Reveal>
        <div className="pillar-grid">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={0.06 * i}>
              <div className="pillar panel">
                <PillarGlyph glyph={p.glyph} color={p.accent} />
                <h3>{p.title}</h3>
                <p>{p.blurb}</p>
                <div className="pillar-tag" style={{ color: p.accent }}>{p.tag}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- FEATURED WORK ---------------- */
export function Featured() {
  return (
    <section id="work" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">03 — Featured</p>
          <h2 className="section-title">Selected <span className="accent">work</span></h2>
          <p className="section-lead">
            Flagship studies spanning my research lines — from single-neuron discoveries in the human basal ganglia
            published in <em>Nature</em> and <em>Nature&nbsp;Communications</em>, to sensing-enabled DBS and large
            multi-site connectomic atlases. Each card opens a full project page.
          </p>
        </Reveal>
        <div className="work-grid">
          {featured.map((f, i) => (
            <Reveal key={f.title} delay={0.05 * (i % 3)}>
              <a className="work-card panel" href={`#/paper/${f.slug}`}>
                <div className="work-art">
                  <SignalArt variant={f.variant} id={`art-${i}`} />
                </div>
                <div className="work-body">
                  <div className="work-tag">{f.tag}</div>
                  <h3>{f.title}</h3>
                  <div className="work-meta">{f.venue} <span className="yr">· {f.year} · {f.role}</span></div>
                  <p>{f.blurb}</p>
                  <span className="work-link">View project <ArrowRight /></span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- PUBLICATIONS ---------------- */
const FILTERS: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'adaptive', label: categoryLabels.adaptive },
  { id: 'decoding', label: categoryLabels.decoding },
  { id: 'connectomics', label: categoryLabels.connectomics },
  { id: 'methods', label: categoryLabels.methods },
  { id: 'modeling', label: categoryLabels.modeling },
  { id: 'clinical', label: categoryLabels.clinical },
]

function authorHTML(a: string) {
  return a.replace(/Vissani M/g, '<b>Vissani M</b>')
}

export function Publications() {
  const [filter, setFilter] = useState<Pub['category'] | 'all'>('all')
  const list = useMemo(
    () =>
      [...publications]
        .filter((p) => filter === 'all' || p.category === filter)
        .sort((a, b) => b.year - a.year),
    [filter],
  )

  return (
    <section id="publications" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">04 — Publications</p>
          <h2 className="section-title">Peer-reviewed <span className="accent">papers</span></h2>
          <p className="section-lead">
            {publications.length} selected peer-reviewed articles. Filter by research area, or open any title for its
            project page — abstract, links, code and BibTeX. Full list on{' '}
            <a href={profile.links.scholar} target="_blank" rel="noreferrer" style={{ color: 'var(--neon-cyan)' }}>Google Scholar</a>.
          </p>
        </Reveal>

        <div className="pub-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`pub-filter ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="pub-list">
          {list.map((p) => (
            <div className="pub-row" key={p.title}>
              <span className="pub-year">{p.year}</span>
              <span className="pub-main">
                <a className="pt" href={`#/paper/${p.slug}`}>
                  {p.title}
                  {p.flagship && <span className="flag">Flagship</span>}
                </a>
                <span className="pa" dangerouslySetInnerHTML={{ __html: authorHTML(p.authors) }} />
                <span className="pub-venue">{p.venue}</span>
              </span>
              <span className="pub-actions">
                <a className="pub-act" href={p.link} target="_blank" rel="noreferrer" title="Publisher / DOI" aria-label="DOI"><Doi /></a>
                {p.pdf && <a className="pub-act pdf" href={p.pdf} target="_blank" rel="noreferrer" title="Download PDF" aria-label="PDF"><Pdf /></a>}
                {p.code && <a className="pub-act" href={p.code} target="_blank" rel="noreferrer" title="Code repository" aria-label="Code"><GitHub /></a>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- AWARDS ---------------- */
export function Awards() {
  return (
    <section id="awards" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">05 — Recognition</p>
          <h2 className="section-title">Awards &amp; <span className="accent">honors</span></h2>
        </Reveal>
        <div className="awards-wrap">
          {awards.map((a, i) => (
            <Reveal key={a.title} delay={0.05 * i}>
              <div className="award">
                <div className="ay">{a.year}</div>
                <div className="at">{a.title}</div>
                <div className="ao">{a.org}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- TALKS & MEDIA ---------------- */
export function Talks() {
  return (
    <section id="talks" className="section">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">06 — Talks &amp; Media</p>
          <h2 className="section-title">On stage &amp; <span className="accent">in the field</span></h2>
          <p className="section-lead">
            Recent invited talks and conference presentations — and where the work has been recognized.
          </p>
        </Reveal>

        <div className="talks-grid">
          <div className="talks-list">
            {talks.map((t, i) => (
              <Reveal key={t.title} delay={0.04 * i}>
                <div className={`talk ${t.highlight ? 'hot' : ''}`}>
                  <div className="talk-year">{t.year}</div>
                  <div className="talk-body">
                    <div className="talk-kind">{t.kind}</div>
                    <div className="talk-title">{t.title}</div>
                    <div className="talk-venue">{t.venue} · {t.place}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <aside className="media-card panel">
              <div className="media-eyebrow">Recognition &amp; media</div>
              {media.map((m) => (
                <a key={m.label} className="media-item" href={m.href} target="_blank" rel="noreferrer">
                  <div className="media-label">{m.label} <External /></div>
                  <div className="media-org">{m.org}</div>
                </a>
              ))}
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------------- CONTACT / FOOTER ---------------- */
export function Contact() {
  return (
    <section id="contact" className="section contact">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow" style={{ justifyContent: 'center' }}>07 — Contact</p>
          <h2 className="section-title">Let’s build the <span className="accent">future of neuromodulation</span></h2>
          <p className="big">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <p className="section-lead" style={{ margin: '0 auto' }}>{profile.location}</p>
          <div className="contact-socials">
            <a className="icon-link" href={`mailto:${profile.email}`} aria-label="Email"><Mail /></a>
            <a className="icon-link" href={profile.links.scholar} target="_blank" rel="noreferrer" aria-label="Scholar"><Scholar /></a>
            <a className="icon-link" href={profile.links.orcid} target="_blank" rel="noreferrer" aria-label="ORCID"><Orcid /></a>
            <a className="icon-link" href={profile.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkedIn /></a>
            <a className="icon-link" href={profile.links.github} target="_blank" rel="noreferrer" aria-label="GitHub"><GitHub /></a>
          </div>
          <div style={{ marginTop: '2.4rem' }}>
            <a className="btn" href={profile.links.lab} target="_blank" rel="noreferrer">
              Visit the Brain Modulation Lab <ArrowRight style={{ width: 16, height: 16, verticalAlign: 'middle' }} />
            </a>
          </div>
        </Reveal>
      </div>
      <footer className="footer">
        © {new Date().getFullYear()} Matteo Vissani · Built with React + Three.js ·{' '}
        <span className="heart">synthwave</span> mode engaged
      </footer>
    </section>
  )
}
