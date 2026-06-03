import type { ReactNode } from 'react'

// One step of a worked derivation (all steps are shown at once on the page).
export type DerivStep = {
  title: string          // short heading, e.g. "Discretize"
  tex?: string           // the headline equation for this step (KaTeX block)
  note: ReactNode        // the reasoning, with inline math allowed
}

export type NoteParam = { name: string; range: string; role: string }

// An extra long-form section (textbook material beyond the core derivation):
// limiting cases, worked examples, connections, pitfalls, etc.
export type NoteSection = { heading: string; body: ReactNode }

export type DemoNote = {
  title: string
  theme: string            // group label, matches the sidebar grouping
  tagline: string
  foundations: ReactNode   // from first principles (can be several paragraphs)
  derivation: DerivStep[]  // the core derivation, built up step by step
  deep?: NoteSection[]      // additional textbook sections (intuition, cases, examples)
  schema: ReactNode        // an SVG schematic
  numerics: ReactNode      // the exact scheme as implemented
  pseudocode?: string      // implementation as pseudocode (monospace block)
  params: NoteParam[]
  refs: ReactNode
}
