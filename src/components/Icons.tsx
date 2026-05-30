// Minimal inline SVG icon set (stroke = currentColor)
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

export const Mail = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

export const LinkedIn = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.32-1.96 2.69V21H9z" />
  </svg>
)

export const GitHub = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
)

export const Scholar = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2 1 8.5l11 6.5 9-5.32V16h2V8.5zM6 13.2v3.2c0 1.77 2.69 3.6 6 3.6s6-1.83 6-3.6v-3.2l-6 3.55z" />
  </svg>
)

export const Orcid = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.2 7.1a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-.9 3.1h1.8v7.1H7.3zm3.7 0h3.3c2.6 0 3.9 1.7 3.9 3.55 0 2.02-1.55 3.55-3.95 3.55h-3.25Zm1.8 1.55v4h1.35c1.55 0 2.3-.92 2.3-2s-.7-2-2.25-2z" />
  </svg>
)

export const ResearchGate = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M15.2 3.6c-1.9 0-3 1.3-3 3v3.1h2v-3c0-.7.4-1.2 1.1-1.2.8 0 1.1.6 1.1 1.3 0 .8-.4 1.3-1.2 1.3h-.4v1.7h.5c1.9 0 3.1-1.2 3.1-3.1s-1.2-3.1-3.2-3.4ZM7.6 9.3c-2 0-3.6 1.7-3.6 4.3s1.5 4.3 3.6 4.3c1 0 1.8-.4 2.3-1v.8H12v-4.4H8.3v1.6h1.6c-.1 1-.8 1.6-1.9 1.6-1.3 0-2.1-1.1-2.1-2.9s.8-2.9 2-2.9c.9 0 1.5.4 1.8 1.2l1.7-.7c-.6-1.4-1.9-2.3-3.8-2.3Z" />
  </svg>
)

export const ArrowRight = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const External = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M7 7h10v10M7 17 17 7" />
  </svg>
)

export const Pdf = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h1.5a1.2 1.2 0 0 1 0 2.4H9zm0 0v4M14 13v4m0-4h2m-2 2h1.6" />
  </svg>
)

export const Doi = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
  </svg>
)
