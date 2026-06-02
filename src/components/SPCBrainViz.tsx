import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

// 3D research showcase for the spike-phase coupling (SPC) project (Vissani et al.
// 2025). Per-band SPC density spheres (cortex + STN) plus per-cluster connection
// tubes drawn between the real STN spike-source and cortical-site coordinates,
// with TUBE WIDTH = PPCz (coupling strength) and COLOUR = frequency band.
// STN is small/deep: drawn through the cortex + magnified ×6 in the inset.

type Sites = { bands: string[]; max: number; points: number[][] }   // [x,y,z,band,value]
type Edges = { max: number; edges: number[][] }                     // [sx,sy,sz,ex,ey,ez,band,ppcz]

const BANDS = ['theta', 'alpha', 'beta', 'low gamma', 'high gamma']
const BAND_HEX = ['#d7191c', '#fdae61', '#f5d742', '#7fc97f', '#3a9fd6']
const BAND_RGB = BAND_HEX.map((h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b] as [number, number, number] })
const ALL = -1
const STN_MAG_MAIN = 1   // true anatomical scale (no geometry magnification)
const UP = new THREE.Vector3(0, 1, 0)
// DISTAL atlas structures (left hemisphere) shown as translucent surfaces.
const STRUCTS: { url: string; color: string; label: string; c: [number, number, number] }[] = [
  { url: '/data/spc/stn_distal.bin', color: '#7fd8ff', label: 'STN', c: [-11.5, -14, -7.5] },
  { url: '/data/spc/gpi.bin', color: '#ff9f45', label: 'GPi', c: [-17.7, -5.6, -4.1] },
  { url: '/data/spc/gpe.bin', color: '#ffd24d', label: 'GPe', c: [-20.2, -4.4, -0.8] },
  { url: '/data/spc/rn.bin', color: '#ff7a7a', label: 'RN', c: [-5.3, -19.1, -9.1] },
]
const CENTER: [number, number, number] = [-50, -8, 22]
const SCALE = 0.075
function toScene(x: number, y: number, z: number): [number, number, number] {
  return [(x - CENTER[0]) * SCALE, (z - CENTER[2]) * SCALE, -(y - CENTER[1]) * SCALE]
}

function CortexMesh({ opacity = 0.1 }: { opacity?: number }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/data/spc/cortex_mesh.bin').then((r) => r.arrayBuffer()).then((buf) => {
      const dv = new DataView(buf); const nv = dv.getUint32(0, true), nf = dv.getUint32(4, true)
      const pos = new Float32Array(buf, 8, nv * 3)
      const idx = new Uint32Array(buf, 8 + nv * 12, nf * 3)
      const sp = new Float32Array(nv * 3)
      for (let i = 0; i < nv; i++) { const s = toScene(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); sp[i * 3] = s[0]; sp[i * 3 + 1] = s[1]; sp[i * 3 + 2] = s[2] }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(sp, 3))
      g.setIndex(new THREE.BufferAttribute(idx.slice(), 1)); g.computeVertexNormals()
      if (alive) setGeo(g); else g.dispose()
    }).catch(() => {})
    return () => { alive = false }
  }, [])
  if (!geo) return null
  return (<mesh geometry={geo} renderOrder={-1}><meshStandardMaterial color="#9aa6cc" transparent opacity={opacity} roughness={0.72} metalness={0} side={THREE.FrontSide} depthWrite={false} /></mesh>)
}

// translucent surface from a .bin (header nv,nf; float positions in MNI; uint32
// indices). Optionally magnified about `center` to match the magnified clouds.
function SurfaceMesh({ url, color, opacity, mag = 1, center, onTop = false }:
  { url: string; color: string; opacity: number; mag?: number; center?: [number, number, number]; onTop?: boolean }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null)
  useEffect(() => {
    let alive = true
    fetch(url).then((r) => r.arrayBuffer()).then((buf) => {
      const dv = new DataView(buf); const nv = dv.getUint32(0, true), nf = dv.getUint32(4, true)
      const pos = new Float32Array(buf, 8, nv * 3); const idx = new Uint32Array(buf, 8 + nv * 3 * 4, nf * 3)
      const sp = new Float32Array(nv * 3)
      for (let i = 0; i < nv; i++) {
        let s = toScene(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
        if (mag !== 1 && center) s = [center[0] + (s[0] - center[0]) * mag, center[1] + (s[1] - center[1]) * mag, center[2] + (s[2] - center[2]) * mag]
        sp[i * 3] = s[0]; sp[i * 3 + 1] = s[1]; sp[i * 3 + 2] = s[2]
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals()
      if (alive) setGeo(g); else g.dispose()
    }).catch(() => {})
    return () => { alive = false }
  }, [url, mag, center])
  if (!geo) return null
  return (<mesh geometry={geo} renderOrder={onTop ? 10 : 1}><meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.5} metalness={0} side={THREE.DoubleSide} depthTest={!onTop} depthWrite={false} /></mesh>)
}

type Region = { label: string; color: string; segs: number[][] }

// glowing outline of selected cortical atlas regions + a readable label.
function RegionBorders({ regions, on }: { regions: Region[]; on: boolean[] }) {
  const items = useMemo(() => regions.map((r) => {
    const pos = new Float32Array(r.segs.length * 6)
    let cx = 0, cy = 0, cz = 0
    r.segs.forEach((s, j) => { const a = toScene(s[0], s[1], s[2]), b = toScene(s[3], s[4], s[5]); pos.set(a, j * 6); pos.set(b, j * 6 + 3); cx += a[0] + b[0]; cy += a[1] + b[1]; cz += a[2] + b[2] })
    const n = r.segs.length * 2 || 1
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const ls = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: r.color, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); ls.renderOrder = 14
    return { ls, centroid: [cx / n, cy / n, cz / n] as [number, number, number], color: r.color, label: r.label }
  }), [regions])
  return (<>{items.map((it, i) => (on[i] ? (
    <group key={i}>
      <primitive object={it.ls} />
      <Html position={it.centroid} center zIndexRange={[20, 0]}><span className="spcviz-tag" style={{ borderColor: it.color, color: it.color }}>{it.label}</span></Html>
    </group>
  ) : null))}</>)
}

function Cloud({ data, rscale, minR, sel, mag = 1, center, onTop = false, dmax }:
  { data: Sites; rscale: number; minR: number; sel: number; mag?: number; center?: [number, number, number]; onTop?: boolean; dmax?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  useEffect(() => {
    const m = ref.current; if (!m) return
    data.points.forEach((p, i) => {
      let [x, y, z] = toScene(p[0], p[1], p[2])
      if (mag !== 1 && center) { x = center[0] + (x - center[0]) * mag; y = center[1] + (y - center[1]) * mag; z = center[2] + (z - center[2]) * mag }
      const band = p[3]
      // dmax -> sqrt scaling (for the heavily-skewed STN values); else linear
      const r = sel === ALL || sel === band ? (dmax ? minR + rscale * Math.sqrt(Math.max(0, p[4]) / dmax) : Math.max(minR, p[4] * rscale)) : 0
      dummy.position.set(x, y, z); dummy.scale.setScalar(r); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix)
      const c = BAND_RGB[band]; col.setRGB(c[0], c[1], c[2]); m.setColorAt(i, col)
    })
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [data, rscale, minR, sel, mag, center, dmax, dummy, col])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.points.length]} renderOrder={onTop ? 12 : 0}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial toneMapped={false} roughness={0.4} metalness={0} depthTest={!onTop} depthWrite={!onTop} />
    </instancedMesh>
  )
}

// connection tubes (radius ∝ nearest cortical SPC density, e[8]) with travelling
// dots. STN endpoints magnified about the STN centroid so they align with the
// magnified STN spheres.
function Flows({ edges, sel, center, mag }: { edges: number[][]; sel: number; center: [number, number, number]; mag: number }) {
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const va = useMemo(() => new THREE.Vector3(), [])
  const vb = useMemo(() => new THREE.Vector3(), [])
  const vd = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const tubeRef = useRef<THREE.InstancedMesh>(null)
  const pulseRef = useRef<THREE.InstancedMesh>(null)
  const seg = useMemo(() => edges.map((e) => {
    let s = toScene(e[0], e[1], e[2])
    s = [center[0] + (s[0] - center[0]) * mag, center[1] + (s[1] - center[1]) * mag, center[2] + (s[2] - center[2]) * mag]
    return { s, e: toScene(e[3], e[4], e[5]), band: e[6], dens: e[8] ?? 0 }
  }), [edges, center, mag])

  // tubes: radius encodes nearest cortical density
  useEffect(() => {
    const m = tubeRef.current; if (!m) return
    seg.forEach((e, i) => {
      va.set(e.s[0], e.s[1], e.s[2]); vb.set(e.e[0], e.e[1], e.e[2]); vd.subVectors(vb, va)
      const len = vd.length() || 1e-3; vd.normalize(); q.setFromUnitVectors(UP, vd)
      const show = sel === ALL || sel === e.band
      const r = show ? 0.004 + 0.06 * e.dens : 0
      dummy.position.set((e.s[0] + e.e[0]) / 2, (e.s[1] + e.e[1]) / 2, (e.s[2] + e.e[2]) / 2)
      dummy.quaternion.copy(q); dummy.scale.set(r, len, r); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix)
      const c = BAND_RGB[e.band]; col.setRGB(c[0], c[1], c[2]); m.setColorAt(i, col)
    })
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [seg, sel, dummy, col, va, vb, vd, q])

  // travelling dots
  useFrame((st) => {
    const m = pulseRef.current; if (!m) return
    const t = st.clock.elapsedTime
    seg.forEach((e, i) => {
      const on = sel === ALL || sel === e.band
      const ph = (t * 0.3 + i * 0.137) % 1
      dummy.position.set(e.s[0] + (e.e[0] - e.s[0]) * ph, e.s[1] + (e.e[1] - e.s[1]) * ph, e.s[2] + (e.e[2] - e.s[2]) * ph)
      dummy.scale.setScalar(on ? 0.02 + 0.06 * e.dens : 0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix)
      const c = BAND_RGB[e.band]; col.setRGB(c[0], c[1], c[2]); m.setColorAt(i, col)
    })
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (<>
    <instancedMesh ref={tubeRef} args={[undefined, undefined, seg.length]} renderOrder={11}>
      <cylinderGeometry args={[1, 1, 1, 6, 1]} />
      <meshStandardMaterial toneMapped={false} transparent opacity={0.85} roughness={0.5} metalness={0} depthTest={false} depthWrite={false} />
    </instancedMesh>
    <instancedMesh ref={pulseRef} args={[undefined, undefined, seg.length]} renderOrder={12}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  </>)
}

export default function SPCBrainViz() {
  const [cortex, setCortex] = useState<Sites | null>(null)
  const [stn, setStn] = useState<Sites | null>(null)
  const [conn, setConn] = useState<Edges | null>(null)
  const [sel, setSel] = useState(ALL)
  const [showEdges, setShowEdges] = useState(true)
  const [regions, setRegions] = useState<Region[]>([])
  const [regOn, setRegOn] = useState<boolean[]>([])
  const [err, setErr] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/data/spc/cortex.json').then((r) => r.json()),
      fetch('/data/spc/stn.json').then((r) => r.json()),
      fetch('/data/spc/connections.json').then((r) => r.json()),
    ]).then(([c, s, e]) => { setCortex(c); setStn(s); setConn(e) }).catch(() => setErr(true))
    fetch('/data/spc/cortex_regions.json').then((r) => r.json()).then((d) => {
      setRegions(d.regions); setRegOn(d.regions.map((_: Region, i: number) => i < 2)) // Supramarginal + STG on by default
    }).catch(() => {})
  }, [])
  useEffect(() => {
    const el = wrap.current; if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el); return () => io.disconnect()
  }, [])

  const stnCentroid = useMemo(() => {
    if (!conn) return [2.8, -2.2, 0.5] as [number, number, number]
    let sx = 0, sy = 0, sz = 0
    conn.edges.forEach((e) => { const s = toScene(e[0], e[1], e[2]); sx += s[0]; sy += s[1]; sz += s[2] })
    const n = conn.edges.length || 1
    return [sx / n, sy / n, sz / n] as [number, number, number]
  }, [conn])

  const ready = cortex && stn && conn

  return (
    <div className="spcviz panel">
      <div className="lifsim-head">
        <div>
          <div className="lifsim-title">Research showcase — cortical–subthalamic spike-phase coupling</div>
          <div className="lifsim-sub">
            Real published data in MNI space. Spheres are per-band SPC density (radius ∝ density, colour = band) on the
            cortex and STN. Each tube is one coupling cluster joining an STN spike source to a cortical site at their true
            coordinates; <b>tube width ∝ the nearest cortical SPC density</b>. The STN is small and deep — drawn through the cortex
            and magnified ×3 in the inset. Drag to rotate; click a band to isolate it.
          </div>
        </div>
      </div>

      <div className="spcviz-bands">
        <button className={`pub-filter ${sel === ALL ? 'active' : ''}`} onClick={() => setSel(ALL)}>all bands</button>
        <span className="spcviz-sep" />
        {BANDS.map((b, i) => (
          <button key={b} className={`pub-filter ${sel === i ? 'active' : ''}`} style={sel === i ? { borderColor: BAND_HEX[i], color: BAND_HEX[i] } : undefined} onClick={() => setSel(i)}>
            <i className="spcviz-swatch" style={{ background: BAND_HEX[i] }} />{b}
          </button>
        ))}
        <span className="spcviz-sep" />
        <button className={`pub-filter ${showEdges ? 'active' : ''}`} onClick={() => setShowEdges((v) => !v)}>connections</button>
      </div>

      {regions.length > 0 && (
        <div className="spcviz-bands">
          <span className="spcviz-bandlabel">highlight cortex regions:</span>
          {regions.map((r, i) => (
            <button key={r.label} className={`pub-filter ${regOn[i] ? 'active' : ''}`} style={regOn[i] ? { borderColor: r.color, color: r.color } : undefined} onClick={() => setRegOn((o) => o.map((v, j) => (j === i ? !v : v)))}>
              <i className="spcviz-swatch" style={{ background: r.color }} />{r.label}
            </button>
          ))}
        </div>
      )}

      <div ref={wrap} className="spcviz-stage">
        {err && <div className="spcviz-msg">Could not load SPC data.</div>}
        {!err && !ready && <div className="spcviz-msg">Loading SPC data…</div>}
        {ready && (
          <Canvas camera={{ position: [-7, 2.5, 6.5], fov: 50 }} dpr={[1, 1.5]} frameloop={active ? 'always' : 'never'} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 8, 6]} intensity={0.7} />
            <directionalLight position={[-6, -2, -4]} intensity={0.3} />
            <CortexMesh opacity={0.42} />
            {regions.length > 0 && <RegionBorders regions={regions} on={regOn} />}
            <Cloud data={cortex!} rscale={1.4} minR={0.012} sel={sel} />
            <Cloud data={stn!} rscale={0.05} minR={0.015} dmax={stn!.max} sel={sel} mag={STN_MAG_MAIN} center={stnCentroid} onTop />
            {showEdges && <Flows edges={conn!.edges} sel={sel} center={stnCentroid} mag={STN_MAG_MAIN} />}
            {/* translucent DISTAL atlas structures at true scale + labels */}
            {STRUCTS.map((s) => <SurfaceMesh key={s.label} url={s.url} color={s.color} opacity={0.32} onTop />)}
            {STRUCTS.map((s) => <Html key={s.label} position={toScene(s.c[0], s.c[1], s.c[2])} center zIndexRange={[20, 0]}><span className="spcviz-tag" style={{ borderColor: s.color, color: s.color }}>{s.label}</span></Html>)}
            <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} minDistance={4} maxDistance={16} />
          </Canvas>
        )}

        {ready && (
          <div className="spcviz-inset">
            <div className="spcviz-inset-lab">STN closeup — DISTAL (×3)</div>
            <Canvas camera={{ position: [stnCentroid[0] + 1.4, stnCentroid[1] + 0.9, stnCentroid[2] + 1.8], fov: 40 }} dpr={[1, 1.5]} frameloop={active ? 'always' : 'never'} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.85} />
              <directionalLight position={[2, 3, 4]} intensity={0.5} />
              {STRUCTS.map((s) => <SurfaceMesh key={s.label} url={s.url} color={s.color} opacity={0.3} mag={3} center={stnCentroid} />)}
              <Cloud data={stn!} rscale={0.12} minR={0.04} dmax={stn!.max} sel={sel} mag={3} center={stnCentroid} />
              <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1} target={stnCentroid} minDistance={1} maxDistance={8} />
            </Canvas>
          </div>
        )}

        <div className="spcviz-key">
          {BANDS.map((b, i) => (<span key={b} style={{ opacity: sel === ALL || sel === i ? 1 : 0.35 }}><i style={{ background: BAND_HEX[i] }} />{b}</span>))}
        </div>
        <div className="spcviz-orient">density spheres · tube width ∝ nearest density</div>
      </div>

      <div className="lifsim-explain">
        <p>
          <b>How to read it.</b> Spheres show the per-band SPC density on the cortex and STN (radius ∝ density, colour =
          band). Each tube is one spike-phase-coupling cluster connecting an STN spike source to a cortical site at their
          real MNI coordinates; the <b>tube's width is proportional to the nearest cortical SPC density</b> and its colour is the band. Isolate a
          band to see that rhythm's coupling. The subthalamic nucleus is only millimetres wide, so it is drawn through the
          translucent cortex and magnified ×3 in the inset.
        </p>
      </div>
    </div>
  )
}
