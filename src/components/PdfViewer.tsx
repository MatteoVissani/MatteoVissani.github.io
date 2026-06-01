import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Client-side PDF page viewer, renders each page to a canvas with
// prev/next navigation, a counter, and arrow keys (clean, on-brand).
export default function PdfViewer({ url }: { url: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskRef = useRef<any>(null)

  const [num, setNum] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr(false)
    const task = pdfjsLib.getDocument(url)
    task.promise
      .then((pdf) => { if (!cancelled) { docRef.current = pdf; setNum(pdf.numPages); setPage(1) } })
      .catch(() => { if (!cancelled) setErr(true) })
    return () => { cancelled = true }
  }, [url])

  useEffect(() => {
    const pdf = docRef.current
    if (!pdf || !num) return
    let cancelled = false
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf.getPage(page).then((pg: any) => {
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const containerW = Math.min(wrapRef.current?.clientWidth || 820, 900)
      const base = pg.getViewport({ scale: 1 })
      const scale = (containerW / base.width) * dpr
      const viewport = pg.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      try { taskRef.current?.cancel?.() } catch { /* noop */ }
      const t = pg.render({ canvasContext: ctx, viewport })
      taskRef.current = t
      t.promise.then(() => { if (!cancelled) setLoading(false) }).catch(() => { /* cancelled */ })
    })
    return () => { cancelled = true }
  }, [page, num])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setPage((p) => Math.min(num, p + 1))
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(1, p - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [num])

  if (err) {
    return (
      <div className="pdfv-err panel">
        Couldn’t load the inline viewer.{' '}
        <a href={url} target="_blank" rel="noreferrer">Open the PDF ↗</a>
      </div>
    )
  }

  const prev = () => setPage((p) => Math.max(1, p - 1))
  const next = () => setPage((p) => Math.min(num, p + 1))

  return (
    <div className="pdfv panel" ref={wrapRef}>
      <div className="pdfv-stage">
        <canvas ref={canvasRef} />
        {loading && <div className="pdfv-loading">rendering…</div>}
        {num > 1 && <>
          <button className="pdfv-nav prev" disabled={page <= 1} onClick={prev} aria-label="Previous page">‹</button>
          <button className="pdfv-nav next" disabled={page >= num} onClick={next} aria-label="Next page">›</button>
        </>}
      </div>
      <div className="pdfv-bar">
        <button className="pdfv-step" disabled={page <= 1} onClick={prev}>‹ Prev</button>
        <span className="pdfv-count">Page {page} / {num || '…'}</span>
        <button className="pdfv-step" disabled={num > 0 && page >= num} onClick={next}>Next ›</button>
      </div>
    </div>
  )
}
