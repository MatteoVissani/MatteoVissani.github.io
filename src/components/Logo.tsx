// Brand mark + wordmark. The glyph is a neural action-potential spike
// inside a rounded frame — echoed in the favicon for a consistent identity.
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lg-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22e1ff" />
          <stop offset="1" stopColor="#ff2d8f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="9"
        fill="rgba(34,225,255,0.05)" stroke="url(#lg-stroke)" strokeWidth="1.6" />
      <path d="M6 24 H13 L16 24 L19 11 L23 29 L26 18 L28 24 H34"
        fill="none" stroke="url(#lg-stroke)" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 3px rgba(34,225,255,0.8))' }} />
      <circle cx="23" cy="29" r="2.2" fill="#fff" style={{ filter: 'drop-shadow(0 0 4px #ff2d8f)' }} />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-word">
        MATTEO<span className="logo-sep">//</span>VISSANI
      </span>
    </span>
  )
}
