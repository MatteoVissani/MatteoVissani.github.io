// Brand mark + wordmark. An "MV" monogram whose angular strokes also read as a
// neural spike train; a glowing synapse node links the M and V. Echoed in the
// favicon for a consistent identity.
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 44" aria-hidden>
      <defs>
        <linearGradient id="lg-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22e1ff" />
          <stop offset="1" stopColor="#ff2d8f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="42" height="40" rx="11"
        fill="rgba(34,225,255,0.05)" stroke="url(#lg-stroke)" strokeWidth="1.5" />
      <g fill="none" stroke="url(#lg-stroke)" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 3px rgba(34,225,255,0.7))' }}>
        <path d="M9 31 L9 13 L16 23 L23 13 L23 31" />
        <path d="M24 13 L30 31 L37 13" />
      </g>
      {/* synapse node at the M↔V junction */}
      <circle cx="23.5" cy="13" r="2.4" fill="#fff" style={{ filter: 'drop-shadow(0 0 5px #ff2d8f)' }} />
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
