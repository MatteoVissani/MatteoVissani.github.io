// Fixed synthwave backdrop: gradient sky, neon sun, perspective grid, vignette.
export default function Background() {
  return (
    <>
      <div className="bg-scene" aria-hidden>
        <div className="bg-sun" />
        <div className="bg-grid" />
        <div className="bg-vignette" />
      </div>
      <div className="scanlines" aria-hidden />
    </>
  )
}
