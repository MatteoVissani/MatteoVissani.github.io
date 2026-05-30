type Glyph = 'pulse' | 'spike' | 'network' | 'wave' | 'code' | 'cross'

export default function PillarGlyph({ glyph, color }: { glyph: Glyph; color: string }) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg className="glyph" viewBox="0 0 48 48" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
      {glyph === 'pulse' && (
        <path {...common} d="M2 24h8l4-14 8 28 5-18 4 8h10" />
      )}
      {glyph === 'spike' && (
        <g {...common}>
          <line x1="6" y1="10" x2="6" y2="38" />
          <line x1="14" y1="16" x2="14" y2="38" />
          <line x1="22" y1="6" x2="22" y2="38" />
          <line x1="30" y1="20" x2="30" y2="38" />
          <line x1="38" y1="12" x2="38" y2="38" />
        </g>
      )}
      {glyph === 'network' && (
        <g {...common}>
          <circle cx="10" cy="12" r="3" />
          <circle cx="38" cy="14" r="3" />
          <circle cx="24" cy="34" r="3" />
          <circle cx="14" cy="30" r="3" />
          <path d="M10 12 24 34M38 14 24 34M14 30 38 14M10 12 38 14" />
        </g>
      )}
      {glyph === 'wave' && (
        <g {...common}>
          <path d="M2 24q6-16 11 0t11 0 11 0 11 0" />
          <path d="M2 32q6-10 11 0t11 0 11 0 11 0" opacity="0.5" />
        </g>
      )}
      {glyph === 'code' && (
        <g {...common}>
          <path d="M16 14 8 24l8 10" />
          <path d="M32 14l8 10-8 10" />
          <line x1="26" y1="10" x2="22" y2="38" />
        </g>
      )}
      {glyph === 'cross' && (
        <g {...common}>
          <path d="M2 24h9l4-10 6 22 4-12 3 6h12" />
          <circle cx="24" cy="24" r="20" opacity="0.35" />
        </g>
      )}
    </svg>
  )
}
