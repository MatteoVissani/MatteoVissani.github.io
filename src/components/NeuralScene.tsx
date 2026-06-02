import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Brain-ish ellipsoid, wider front-to-back than tall.
const SX = 2.6
const SY = 1.95
const SZ = 3.1

// Map a unit-sphere direction to a brain-shaped point (gyri lumps + fissure).
function shapeBrain(nx: number, ny: number, nz: number): [number, number, number] {
  const lumps =
    1 +
    0.06 * Math.sin(4.0 * nx) * Math.sin(5.0 * ny) * Math.sin(4.0 * nz) +
    0.035 * Math.sin(8.0 * nz + 1.5) * Math.sin(6.0 * ny)
  let x = nx * SX * lumps
  let y = ny * SY * lumps
  let z = nz * SZ * lumps
  z *= 1 + 0.12 * nz // frontal lobe fuller
  const up = Math.max(0, ny)
  y -= 0.7 * Math.exp(-(x * x) / 0.22) * up // sagittal fissure groove
  x += Math.sign(x || 1) * 0.16 * Math.exp(-(x * x) / 0.3) * up
  if (ny < 0) y *= 0.88
  return [x, y, z]
}

function buildNetwork(count: number) {
  const positions = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  const sizes = new Float32Array(count)
  const pts: THREE.Vector3[] = []

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const vv = Math.random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * vv - 1)
    const nx = Math.sin(phi) * Math.cos(theta)
    const ny = Math.cos(phi)
    const nz = Math.sin(phi) * Math.sin(theta)
    const [sx, sy, sz] = shapeBrain(nx, ny, nz)
    const fill = 0.72 + Math.random() * 0.28 // mostly near the surface
    const x = sx * fill
    const y = sy * fill
    const z = sz * fill
    pts.push(new THREE.Vector3(x, y, z))
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    phases[i] = Math.random()
    sizes[i] = 11 + Math.random() * 20
  }

  const segs: number[] = []
  const maxDist = 1.05
  for (let i = 0; i < count; i++) {
    let links = 0
    for (let j = i + 1; j < count && links < 4; j++) {
      if (pts[i].distanceTo(pts[j]) < maxDist) {
        segs.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
        links++
      }
    }
  }
  return { positions, phases, sizes, segs: new Float32Array(segs) }
}

const CYAN = new THREE.Color('#22e1ff')

function Scene() {
  const brain = useRef<THREE.Group>(null)
  const electrode = useRef<THREE.Group>(null)
  const ptMat = useRef<THREE.ShaderMaterial>(null)
  const lineMat = useRef<THREE.ShaderMaterial>(null)
  const rings = useRef<THREE.Mesh[]>([])
  const { camera, pointer } = useThree()

  const { positions, phases, sizes, segs } = useMemo(() => buildNetwork(360), [])

  const pointsGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return g
  }, [positions, phases, sizes])

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(segs, 3))
    return g
  }, [segs])

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uElectrode: { value: new THREE.Vector3(0, 9, 1.4) },
        },
        vertexShader: /* glsl */ `
          attribute float aPhase;
          attribute float aSize;
          varying float vPhase;
          varying float vStim;
          uniform float uTime;
          uniform float uPixelRatio;
          uniform vec3 uElectrode;
          void main() {
            vPhase = aPhase;
            float ed = distance(position, uElectrode);
            float stim = exp(-ed * ed / 1.1);
            vStim = stim;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float pulse = 0.55 + 0.45 * sin(uTime * 2.2 + aPhase * 6.2831);
            float boost = 1.0 + stim * 2.6 * (0.5 + 0.5 * sin(uTime * 14.0 - ed * 3.2));
            gl_PointSize = aSize * pulse * boost * uPixelRatio * (12.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vPhase;
          varying float vStim;
          uniform float uTime;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = smoothstep(0.5, 0.0, d);
            vec3 cyan = vec3(0.13, 0.88, 1.0);
            vec3 pink = vec3(1.0, 0.17, 0.6);
            vec3 col = mix(cyan, pink, vPhase);
            col = mix(col, vec3(1.0), clamp(vStim * 1.4, 0.0, 1.0));
            float fire = 0.5 + 0.5 * sin(uTime * 2.2 + vPhase * 6.2831);
            gl_FragColor = vec4(col * (0.5 + fire * 0.9 + vStim * 2.2), glow * 0.9);
          }
        `,
      }),
    [],
  )

  // Synapse pathways: dim at rest, light up + ripple outward from the electrode.
  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uElectrode: { value: new THREE.Vector3(0, 9, 1.4) },
        },
        vertexShader: /* glsl */ `
          uniform vec3 uElectrode;
          uniform float uTime;
          varying float vAct;
          void main() {
            float ed = distance(position, uElectrode);
            float near = exp(-ed * ed / 2.6);
            float wave = 0.5 + 0.5 * sin(uTime * 9.0 - ed * 2.4);
            vAct = near * wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vAct;
          void main() {
            vec3 base = vec3(0.42, 0.30, 0.9);
            vec3 hot = vec3(0.35, 0.95, 1.0);
            vec3 col = mix(base * 0.45, hot, clamp(vAct * 1.6, 0.0, 1.0));
            float a = 0.12 + vAct * 0.95;
            gl_FragColor = vec4(col, a);
          }
        `,
      }),
    [],
  )

  const electrodeWorld = useMemo(() => new THREE.Vector3(0, 9, 1.4), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(0, 9, 1.4), [])
  const activated = useRef(false)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // Park the electrode off-screen (no stimulation) until the mouse moves.
    if (!activated.current && (pointer.x !== 0 || pointer.y !== 0)) activated.current = true
    if (activated.current) {
      tmp.set(pointer.x, pointer.y, 0.5).unproject(camera)
      tmp.sub(camera.position).normalize()
      const targetZ = 1.4
      const dist = (targetZ - camera.position.z) / tmp.z
      target.set(camera.position.x + tmp.x * dist, camera.position.y + tmp.y * dist, targetZ)
    } else {
      target.set(0, 9, 1.4)
    }
    electrodeWorld.lerp(target, 0.12)
    if (electrode.current) {
      electrode.current.position.copy(electrodeWorld)
      electrode.current.visible = activated.current
    }

    if (brain.current) {
      brain.current.rotation.y += delta * 0.1
      brain.current.rotation.x += (pointer.y * 0.22 - brain.current.rotation.x) * 0.03
      brain.current.updateWorldMatrix(true, false)
      const local = brain.current.worldToLocal(electrodeWorld.clone())
      if (ptMat.current) {
        ptMat.current.uniforms.uTime.value = t
        ptMat.current.uniforms.uElectrode.value.copy(local)
      }
      if (lineMat.current) {
        lineMat.current.uniforms.uTime.value = t
        lineMat.current.uniforms.uElectrode.value.copy(local)
      }
    }

    rings.current.forEach((ring, i) => {
      if (!ring) return
      const cycle = (t * 0.8 + i / rings.current.length) % 1
      const s = 0.2 + cycle * 2.2
      ring.scale.set(s, s, s)
      ;(ring.material as THREE.Material & { opacity: number }).opacity = (1 - cycle) * 0.5
      ring.lookAt(camera.position)
    })
  })

  return (
    <>
      <group ref={brain} position={[0, 2.4, 0]} scale={0.92} rotation={[0.12, 0.5, 0]}>
        <points geometry={pointsGeom}>
          <primitive object={pointsMat} ref={ptMat} attach="material" />
        </points>
        <lineSegments geometry={lineGeom}>
          <primitive object={linesMat} ref={lineMat} attach="material" />
        </lineSegments>
      </group>

      {/* Cursor electrode (DBS lead) */}
      <group ref={electrode}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={'#ffffff'} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 3, 8]} />
          <meshBasicMaterial color={'#bfefff'} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => { if (el) rings.current[i] = el }}>
            <ringGeometry args={[0.42, 0.5, 48]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}

export default function NeuralScene() {
  const wrap = useRef<HTMLDivElement>(null)
  const inView = useRef(true)
  const visible = useRef(true)
  const [active, setActive] = useState(true)
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Only run the render loop while the hero is on screen and the tab is
  // focused; this keeps scrolling and reading the rest of the page smooth.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const sync = () => setActive(inView.current && visible.current)
    const io = new IntersectionObserver(([e]) => { inView.current = e.isIntersecting; sync() }, { threshold: 0 })
    io.observe(el)
    const onVis = () => { visible.current = document.visibilityState === 'visible'; sync() }
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        className="hero-canvas"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 9], fov: 55 }}
        dpr={[1, 1.5]}
        frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene />
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.16} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
