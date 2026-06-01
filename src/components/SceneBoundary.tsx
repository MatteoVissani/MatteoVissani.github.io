import { Component, type ReactNode } from 'react'

// If WebGL is unavailable or the 3D scene throws, fall back silently to the
// CSS synthwave background instead of crashing the whole page.
export default class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    /* swallow, the page is fully usable without the 3D hero */
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
