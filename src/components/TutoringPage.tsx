import { useEffect, useState } from 'react'
import { LogoMark } from './Logo'
import { Mail, External, ArrowRight } from './Icons'
import { tutoring, profile, type TutContent } from '../data/content'

// Standalone, crawlable landing page at /tutoring. The link to share on
// Preply/Superprof bios, LinkedIn, forums, etc. Fully bilingual via an EN/IT
// tab; both languages stay in the DOM so crawlers index "maths tutor" and
// "ripetizioni" alike. Rendered plainly (no scroll-reveal) so content is
// instantly visible to visitors and crawlers.

function TitleWithAccent({ title, accent }: { title: string; accent: string }) {
  const i = title.indexOf(accent)
  if (i < 0) return <>{title}</>
  return (
    <>{title.slice(0, i)}<span className="accent">{accent}</span>{title.slice(i + accent.length)}</>
  )
}

function Ctas({ emailBtn, primaryEmail = false }: { emailBtn: string; primaryEmail?: boolean }) {
  return (
    <div className="tutoring-cta">
      {tutoring.links.map((l) => (
        <a key={l.name} className="btn" href={l.href} target="_blank" rel="noreferrer">
          {l.name} <External style={{ width: 14, height: 14, verticalAlign: 'middle' }} />
        </a>
      ))}
      <a className={primaryEmail ? 'btn' : 'btn ghost'} href={`mailto:${tutoring.email}`}>
        <Mail style={{ width: 15, height: 15, verticalAlign: 'middle' }} /> {emailBtn}
      </a>
    </div>
  )
}

function LangContent({ c }: { c: TutContent }) {
  return (
    <>
      {/* Hero */}
      <div className="tut-hero">
        <div className="tut-hero-main">
          <p className="eyebrow">{c.eyebrow} · EN / IT</p>
          <h1 className="paper-title"><TitleWithAccent title={c.title} accent={c.accent} /></h1>
          <p className="paper-lead">{c.pitch}</p>
          <Ctas emailBtn={c.labels.emailBtn} />
          <div className="tut-trust">
            {c.credentials.map((cr) => <span key={cr} className="tut-trust-item">{cr}</span>)}
          </div>
        </div>
        <a className="tut-hero-qr" href={tutoring.links[0].href} target="_blank" rel="noreferrer" aria-label={c.labels.scanCap}>
          <img src={tutoring.qr} alt={c.labels.scanCap} loading="lazy" />
          <span className="tut-hero-qr-cap">{c.labels.scanCap}</span>
        </a>
      </div>

      {/* Philosophy */}
      <p className="tut-blurb">{c.blurb}</p>

      {/* What I teach */}
      <h2 className="paper-h2">{c.labels.whatITeach}</h2>
      <div className="tut-grid">
        {c.subjectAreas.map((s) => (
          <div key={s.name} className="tut-subject panel">
            <h3>{s.name}</h3>
            <ul>{s.topics.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        ))}
        <div className="tut-subject panel tut-subject-exam">
          <h3>{c.labels.admissionCard}</h3>
          <p className="tut-subject-note">{c.labels.admissionNote}</p>
          <div className="tutoring-tags">
            {tutoring.exams.map((e) => <span key={e} className="tutoring-tag exam">{e}</span>)}
          </div>
        </div>
      </div>

      {/* How we work */}
      <h2 className="paper-h2">{c.labels.howWeWork}</h2>
      <div className="tut-steps">
        {c.approach.map((a) => (
          <div key={a.step} className="tut-step">
            <span className="tut-step-n">{a.step}</span>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
          </div>
        ))}
      </div>

      {/* Admission prep */}
      <h2 className="paper-h2">{c.labels.admissionPrep}</h2>
      <p className="tut-blurb">{c.examsBlurb}</p>
      <p className="tutoring-meta">{c.metaLabel}</p>

      {/* FAQ */}
      <h2 className="paper-h2">{c.labels.goodToKnow}</h2>
      <div className="tut-faq">
        {c.faqs.map((f) => (
          <div key={f.q} className="tut-faq-item">
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div className="tut-cta-final panel">
        <h2>{c.labels.bookTitle}</h2>
        <p>{c.labels.bookText}</p>
        <Ctas emailBtn={c.labels.emailBtn} primaryEmail />
      </div>
    </>
  )
}

export default function TutoringPage() {
  const [lang, setLang] = useState<'en' | 'it'>('en')

  useEffect(() => {
    document.title = tutoring.seo.title
  }, [])

  return (
    <main className="paper-wrap">
      <div className="paper-topbar">
        <a className="paper-home" href="/" aria-label="Home"><LogoMark size={26} /><span>MATTEO<i>//</i>VISSANI</span></a>
        <a className="paper-back" href="/">← Portfolio</a>
      </div>

      <article className="wrap paper tutoring-page">
        <div className="tut-tabs" role="tablist" aria-label="Language">
          {(['en', 'it'] as const).map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={lang === l}
              className={`tut-tab ${lang === l ? 'active' : ''}`}
              onClick={() => setLang(l)}
            >
              {tutoring[l].langName}
            </button>
          ))}
        </div>

        <div hidden={lang !== 'en'}><LangContent c={tutoring.en} /></div>
        <div hidden={lang !== 'it'} lang="it"><LangContent c={tutoring.it} /></div>

        <div className="paper-footer">
          <a className="btn ghost" href="/">← Back to {profile.shortName}’s portfolio <ArrowRight style={{ width: 14, height: 14, verticalAlign: 'middle' }} /></a>
        </div>
      </article>
    </main>
  )
}
