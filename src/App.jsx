import { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Html, Float, Sparkles, ContactShadows, Environment, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import './index.css'

// ─── PREMIUM UI COMPONENTS (Loader, Cursor, Sounds) ───────────────────────────

// Synthetic Sound Manager
const SoundManager = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
  },
  playHover() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.1)
  },
  playClick() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.2)
  }
}

function GlobalLoader() {
  const { progress } = useProgress()
  const [hidden, setHidden] = useState(false)
  
  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => setHidden(true), 800) // slight delay before fading out
    }
  }, [progress])

  return (
    <div className={`global-loader ${hidden ? 'hidden' : ''}`}>
      <div className="loader-logo">PA.</div>
      <div className="loader-bar-container">
        <div className="loader-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="loader-text">INITIALIZING {Math.round(progress)}%</div>
    </div>
  )
}

function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
    }
    
    // Add event listeners for hover states and sounds
    const onMouseOver = (e) => {
      const target = e.target.closest('a, button, .project-card, .modal-close')
      if (target) {
        setIsHovering(true)
        SoundManager.init()
        SoundManager.playHover()
      }
    }
    
    const onMouseOut = (e) => {
      if (e.target.closest('a, button, .project-card, .modal-close')) {
        setIsHovering(false)
      }
    }

    const onClick = (e) => {
      if (e.target.closest('a, button, .project-card, .modal-close')) {
        SoundManager.init()
        SoundManager.playClick()
      }
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('click', onClick)
    
    // Init audio context on first click anywhere
    const initAudio = () => {
      SoundManager.init()
      document.removeEventListener('click', initAudio)
    }
    document.addEventListener('click', initAudio)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <>
      <div 
        className={`custom-cursor-dot ${isHovering ? 'hovering' : ''}`} 
        style={{ left: pos.x, top: pos.y }}
      />
      <div 
        className={`custom-cursor-ring ${isHovering ? 'hovering' : ''}`}
        style={{ left: pos.x, top: pos.y }}
      />
    </>
  )
}

// ─── RENDERER SETUP ───────────────────────────────────────────────────────────
function SetRenderer({ exposure, toneMapping }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = toneMapping
    gl.toneMappingExposure = exposure
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFShadowMap
  }, [gl, exposure, toneMapping])
  return null
}

// ─── AUTO-NORMALIZE MODEL ─────────────────────────────────────────────────────
// Fits any model into a target world-space size so it always fills the screen
function normalizeModel(scene, targetSize = 4, groundIt = true) {
  const box = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)

  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim === 0) return

  const scale = targetSize / maxDim
  scene.scale.setScalar(scale)

  box.setFromObject(scene)
  box.getCenter(center)

  scene.position.x -= center.x
  scene.position.z -= center.z
  if (groundIt) {
    const minY = box.min.y
    scene.position.y -= minY
  } else {
    scene.position.y -= center.y
  }
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 1 — RED SUNSET & CYBER SAMURAI
// ═══════════════════════════════════════════════════════════════════

function UserCyberSamuraiModel() {
  const group = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const { scene, animations } = useGLTF('/cyber_samurai.glb')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    // Scaled down to 20.0
    normalizeModel(scene, 20.0, false)
    
    // Play baked animations if they exist
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions).forEach(a => {
        a.reset().setLoop(THREE.LoopRepeat, Infinity)
        a.timeScale = 0.85 // Slowed down slightly for a smoother, heavier feel
        a.play()
      })
    }

    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [actions, scene])

  useFrame((state) => {
    if (group.current) {
      // Micro-adjusted very very little up for the absolute perfect framing
      group.current.position.y = -4.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15
      
      // Cursor reaction with heavy, cinematic physics
      const targetRotY = mouse.current.x * 0.4
      const targetRotX = mouse.current.y * -0.15
      const targetRotZ = mouse.current.x * -0.15 // Samurai leans/banks smoothly as you move

      // Extremely smooth lerp (0.025 instead of 0.05)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.025)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotX, 0.025)
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetRotZ, 0.025)
    }
  })

  return (
    // Micro-adjusted very very little up (-4.2)
    <group ref={group} position={[0, -4.2, -6.5]}>
      <primitive object={scene} />
    </group>
  )
}

function JapaneseSunsetBackground() {
  return (
    <>
      {/* Giant Red Sun */}
      <mesh position={[0, 4, -30]}>
        <circleGeometry args={[20, 64]} />
        <meshBasicMaterial color="#ff1100" />
      </mesh>
      
      {/* Intense Sun glow */}
      <pointLight position={[0, 4, -28]} intensity={50} color="#ff3300" distance={60} />

      {/* Floating Embers / Birds */}
      <Sparkles count={300} scale={[35, 15, 20]} size={4} speed={2} color="#ffaa00" position={[0, 4, -10]} opacity={0.8} />
      <Sparkles count={150} scale={[25, 10, 10]} size={3} speed={3} color="#ff0000" position={[0, 2, -5]} opacity={1} />
    </>
  )
}

function Page1Scene() {
  return (
    <>
      <SetRenderer exposure={1.2} toneMapping={THREE.ACESFilmicToneMapping} />
      
      {/* Red Sunset Atmosphere - Fog pushed back so sun is fully visible */}
      <color attach="background" args={['#1a0000']} />
      <fog attach="fog" args={['#1a0000', 10, 60]} />

      {/* Environment map ensures the model reflects natural colors, not just the red background */}
      <Environment preset="city" />

      {/* Lighting adjusted to show the Samurai's true colors */}
      <ambientLight intensity={0.8} color="#ffffff" /> 
      {/* Pure white front light so texture colors are perfectly visible */}
      <directionalLight position={[0, 5, 10]} intensity={2.5} color="#ffffff" />
      
      {/* Strong orange rim light from behind to blend with the sunset */}
      <directionalLight position={[0, 2, -5]} intensity={5} color="#ffaa00" />

      {/* Background Elements */}
      <JapaneseSunsetBackground />

      {/* User's 3D Samurai Model */}
      <Suspense fallback={<Html center><div style={{ color: '#ff2200', fontFamily: 'monospace' }}>LOADING CYBER SAMURAI...</div></Html>}>
        <UserCyberSamuraiModel />
      </Suspense>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════
// PAGE 2 — JSAR-STYLE CYBERPUNK CAR (User's GLB)
// ═══════════════════════════════════════════════════════════════════
function UserCarModel() {
  const group = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const { scene } = useGLTF('/car.glb')

  useEffect(() => {
    normalizeModel(scene, 3.5, true)
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [scene])

  useFrame((state) => {
    if (group.current) {
      // Super smooth banking and steering based on cursor
      const targetBankZ = mouse.current.x * -0.25 // Lean left/right
      const targetTurnY = mouse.current.x * -0.15  // Steer left/right
      const targetPitchX = mouse.current.y * 0.08  // Pitch up/down slightly

      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetBankZ, 0.05)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetTurnY, 0.05)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetPitchX, 0.05)

      // High-frequency engine vibration added to smooth vertical movement
      const vibY = Math.sin(state.clock.elapsedTime * 40) * 0.005
      const targetY = (mouse.current.y * -0.2) + vibY
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY, 0.1)
    }
  })

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  )
}

// Cursor-reactive camera rig for Page 2
function Page2CameraRig() {
  const mouse = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0.5, y: 0 }) // start at front-3/4 angle

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((state) => {
    // Smoother, tighter camera tracking
    target.current.x = THREE.MathUtils.lerp(target.current.x, mouse.current.x * 0.8, 0.03)
    target.current.y = THREE.MathUtils.lerp(target.current.y, mouse.current.y * 0.8, 0.03)

    const angle = target.current.x * 0.5 + 0.3 // Default slightly offset
    const camRadius = 5.5 // Closer to the car for better speed sensation
    state.camera.position.x = Math.sin(angle) * camRadius
    state.camera.position.z = Math.cos(angle) * camRadius
    state.camera.position.y = 1.6 + target.current.y * 0.8
    state.camera.lookAt(0, 0.5, 0)
  })
  return null
}

// Neon infinite grid rushing toward camera
function NeonGrid() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.z += 40 * delta // Faster grid rush for more speed
      if (ref.current.position.z > 8) ref.current.position.z = 0
    }
  })

  const gridGeom = useMemo(() => {
    const size = 300
    const div = 60
    const geom = new THREE.BufferGeometry()
    const vertices = []
    for (let i = -div; i <= div; i++) {
      const x = (i / div) * size / 2
      vertices.push(x, 0, -size / 2, x, 0, size / 2)
      const z = (i / div) * size / 2
      vertices.push(-size / 2, 0, z, size / 2, 0, z)
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geom
  }, [])

  return (
    <group ref={ref} position={[0, -0.01, 0]}>
      <lineSegments geometry={gridGeom}>
        <lineBasicMaterial color="#0044ff" transparent opacity={0.55} />
      </lineSegments>
      {/* Accent cross lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-150, 0, 0, 150, 0, 0, 0, 0, -150, 0, 0, 150]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff0044" transparent opacity={0.9} />
      </lineSegments>
    </group>
  )
}

// Speed streak particles on the sides
function SpeedStreaks() {
  const streaksRef = useRef([])
  const streaks = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      x: (Math.random() - 0.5) * 10,
      y: Math.random() * 2.5,
      z: -Math.random() * 80,
      speed: 60 + Math.random() * 60, // Faster streaks
      length: 3 + Math.random() * 5, // Longer streaks for speed lines
      color: Math.random() > 0.5 ? '#00eaff' : '#ff0044',
    })), [])

  useFrame((_, delta) => {
    streaksRef.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.z += streaks[i].speed * delta
      if (mesh.position.z > 8) {
        mesh.position.z = -80
        mesh.position.x = (Math.random() - 0.5) * 10
        mesh.position.y = Math.random() * 2.5
      }
    })
  })

  return (
    <>
      {streaks.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => (streaksRef.current[i] = el)}
          position={[s.x, s.y, s.z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.015, 0.015, s.length, 4]} />
          <meshBasicMaterial color={s.color} transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  )
}

// Stars in the sky
function StarField() {
  const stars = useMemo(() => {
    const positions = new Float32Array(1500 * 3)
    for (let i = 0; i < 1500; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300
      positions[i * 3 + 1] = Math.random() * 50 + 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300
    }
    return positions
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[stars, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.25} transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

function Page2Scene() {
  return (
    <>
      <SetRenderer exposure={1.2} toneMapping={THREE.ACESFilmicToneMapping} />
      <color attach="background" args={['#00000e']} />
      <fog attach="fog" args={['#00000e', 18, 70]} />

      <ambientLight intensity={1.5} color="#112233" />
      <directionalLight position={[0, 12, 2]} intensity={8} color="#ffffff" castShadow />
      <directionalLight position={[4, 5, 4]} intensity={5} color="#c0d8ff" />
      <directionalLight position={[-4, 5, 4]} intensity={4} color="#c0d8ff" />
      
      {/* City environment for realistic reflections on the car body */}
      <Environment preset="city" />

      <Page2CameraRig />

      {/* User's uploaded Car */}
      <Suspense fallback={<Html center><div style={{ color: '#ff0044', fontFamily: 'monospace' }}>LOADING CAR...</div></Html>}>
        <UserCarModel />
      </Suspense>

      {/* VFX */}
      <NeonGrid />
      <SpeedStreaks />
      <StarField />

      {/* Horizon glow */}
      <mesh position={[0, 0.02, -80]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 12]} />
        <meshBasicMaterial color="#00eaff" transparent opacity={0.04} />
      </mesh>

      <Sparkles count={300} scale={[8, 4, 60]} size={4} speed={6} color="#00eaff" position={[0, 1, -25]} />
      <Sparkles count={200} scale={[8, 3, 60]} size={3} speed={5} color="#ff0044" position={[0, 0.5, -25]} />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.9} scale={18} blur={4} color="#00eaff" />
    </>
  )
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }))
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000)
    return () => clearInterval(id)
  }, [])
  const [h, m, s] = t.split(':')
  return <span>{h}<span className="blink">:</span>{m}<span className="blink">:</span>{s}</span>
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — COSMIC ARCHIVE (Galaxy + Projects)
// ═══════════════════════════════════════════════════════════════════

function GalaxyModel() {
  const group = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const { scene, animations } = useGLTF('/galaxy.glb')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    // Keep original materials — just scale it up and enable vertex colors
    normalizeModel(scene, 22.0, false)

    // Enable vertex colors on every material so baked colors display correctly
    scene.traverse((child) => {
      if (child.isMesh || child.isPoints || child.isLine) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach(mat => {
          if (mat) {
            mat.vertexColors = true
            mat.needsUpdate = true
          }
        })
      }
    })
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions).forEach(a => {
        a.reset().setLoop(THREE.LoopRepeat, Infinity)
        a.timeScale = 0.3
        a.play()
      })
    }
    const onMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX
      const cy = e.touches ? e.touches[0].clientY : e.clientY
      mouse.current.x = (cx / window.innerWidth) * 2 - 1
      mouse.current.y = -(cy / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, [actions, scene])

  useFrame((state) => {
    if (group.current) {
      // Slow constant rotation
      group.current.rotation.y += 0.002
      // Subtle cursor tilt
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, mouse.current.y * 0.15, 0.03)
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, mouse.current.x * -0.08, 0.03)
      // Gentle breathing float
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.2
    }
  })

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  )
}

function Page3Scene() {
  return (
    <>
      <SetRenderer exposure={1.4} toneMapping={THREE.ACESFilmicToneMapping} />
      <color attach="background" args={['#050008']} />
      <fog attach="fog" args={['#050008', 20, 80]} />

      {/* Bright neutral lighting so original model colors show accurately */}
      <ambientLight intensity={2.5} color="#ffffff" />
      <directionalLight position={[0, 5, 5]} intensity={3} color="#ffffff" />
      <directionalLight position={[0, -5, -5]} intensity={2} color="#ffffff" />
      {/* Environment for PBR material reflections */}
      <Environment preset="studio" />

      {/* Galaxy model */}
      <Suspense fallback={null}>
        <GalaxyModel />
      </Suspense>

      {/* Deep space background stars */}
      <Sparkles count={600} scale={[50, 30, 50]} size={2} speed={0.3} color="#ffffff" opacity={0.6} />
      <Sparkles count={200} scale={[30, 20, 30]} size={3} speed={0.5} color="#a78bfa" opacity={0.5} />
      <Sparkles count={100} scale={[20, 10, 20]} size={4} speed={0.8} color="#60a5fa" opacity={0.4} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 4 — CYBERNETIC CORE (About Me)
// ═══════════════════════════════════════════════════════════════════
function CyberCore() {
  const coreRef = useRef()
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX
      const cy = e.touches ? e.touches[0].clientY : e.clientY
      mouse.current.x = (cx / window.innerWidth) * 2 - 1
      mouse.current.y = -(cy / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, [])

  useFrame((state) => {
    if (coreRef.current) {
      const t = state.clock.elapsedTime
      coreRef.current.rotation.y += 0.005
      coreRef.current.rotation.z += 0.002
      
      // Mouse interaction
      coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, mouse.current.y * 0.5, 0.05)
      coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, mouse.current.x * 0.5, 0.05)
      
      // Pulse effect
      const scale = 1 + Math.sin(t * 2) * 0.05
      coreRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group ref={coreRef} position={[2, 0, 0]}>
      {/* Central Brain/Core */}
      <mesh>
        <icosahedronGeometry args={[2.5, 2]} />
        <meshBasicMaterial color="#a78bfa" wireframe transparent opacity={0.3} />
      </mesh>
      
      <mesh>
        <icosahedronGeometry args={[2.3, 1]} />
        <meshBasicMaterial color="#30b8ff" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Orbiting Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ff0044" transparent opacity={0.5} />
      </mesh>
      
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[3.8, 0.01, 16, 100]} />
        <meshBasicMaterial color="#30b8ff" transparent opacity={0.3} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[4.5, 0.03, 16, 100]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

function Page4Scene() {
  return (
    <>
      <SetRenderer exposure={1.2} toneMapping={THREE.ACESFilmicToneMapping} />
      <color attach="background" args={['#050008']} />
      <fog attach="fog" args={['#050008', 5, 20]} />

      <ambientLight intensity={0.5} color="#30b8ff" />
      <pointLight position={[2, 0, 0]} intensity={10} color="#a78bfa" distance={15} />
      <pointLight position={[-2, 2, 2]} intensity={5} color="#ff0044" distance={10} />

      <CyberCore />

      {/* Data stream particles */}
      <Sparkles count={400} scale={[15, 15, 15]} size={2} speed={0.5} color="#30b8ff" opacity={0.4} />
      <Sparkles count={200} scale={[10, 10, 10]} size={3} speed={1} color="#a78bfa" opacity={0.6} />
      <Sparkles count={100} scale={[5, 15, 5]} size={4} speed={2} color="#ff0044" opacity={0.5} />
      
      {/* Floor Grid */}
      <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.05} />
      </mesh>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — ZEN CYBER DOJO (Torii Gate + Katana)
// ═══════════════════════════════════════════════════════════════════

function ToriiGateModel() {
  const { scene } = useGLTF('/torii_gate.glb')
  useEffect(() => {
    normalizeModel(scene, 10.0, true)
  }, [scene])
  return (
    // Pulled up 50% from -9.0 to -4.5
    <group position={[0, -4.5, -1]}>
      <primitive object={scene} />
    </group>
  )
}

function KatanaModel() {
  const group = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const { scene } = useGLTF('/katana.glb')

  useEffect(() => {
    normalizeModel(scene, 3.5, false)
    const onMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX
      const cy = e.touches ? e.touches[0].clientY : e.clientY
      mouse.current.x = (cx / window.innerWidth) * 2 - 1
      mouse.current.y = -(cy / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, [scene])

  useFrame((state) => {
    if (group.current) {
      // Clockwise rotation
      group.current.rotation.y += 0.012
      // Cursor tilt response
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, mouse.current.y * -0.3, 0.04)
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, mouse.current.x * 0.2, 0.04)
      // Float up and down
      group.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.12
    }
  })

  return (
    <group ref={group} position={[0, 0.5, 1.5]}>
      <primitive object={scene} />
    </group>
  )
}

function Page5Scene() {
  return (
    <>
      <SetRenderer exposure={1.1} toneMapping={THREE.ACESFilmicToneMapping} />
      <color attach="background" args={['#080400']} />
      <fog attach="fog" args={['#080400', 8, 40]} />

      <ambientLight intensity={0.4} color="#ff6b35" />
      <directionalLight position={[0, 8, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 3, 2]} intensity={10} color="#ff6b35" distance={15} />
      <pointLight position={[0, 2, 0]} intensity={5} color="#ffcc44" distance={10} />
      {/* Backlight through torii */}
      <pointLight position={[0, 5, -3]} intensity={8} color="#ff4400" distance={20} />

      <Environment preset="sunset" />

      {/* Torii gate — fully fixed, fills the screen */}
      <Suspense fallback={null}>
        <ToriiGateModel />
      </Suspense>

      {/* Katana floating in the centre of the gate */}
      <Suspense fallback={null}>
        <KatanaModel />
      </Suspense>

      {/* Falling sakura / ember particles */}
      <Sparkles count={400} scale={[20, 15, 10]} size={3} speed={1.5} color="#ff6b35" position={[0, 5, 0]} opacity={0.7} />
      <Sparkles count={200} scale={[15, 10, 8]} size={2} speed={2} color="#ffcc44" position={[0, 3, 2]} opacity={0.5} />
      <Sparkles count={150} scale={[10, 8, 6]} size={4} speed={1} color="#ff9944" position={[0, 6, -2]} opacity={0.4} />

      {/* Ground mist */}
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#200800" transparent opacity={0.6} />
      </mesh>

      <ContactShadows position={[0, -1.0, 0]} opacity={0.6} scale={20} blur={3} color="#ff4400" />
    </>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeProject, setActiveProject] = useState(null)

  const projectsData = {
    striver: {
      title: 'STRIVER SHEET APP',
      tech: 'REACT · NODE.JS · VERCEL',
      desc: 'A comprehensive DSA progress tracker built to help developers master data structures. Features include real-time progress syncing, custom dashboards, and performance analytics built with modern web tools.',
      link: 'https://striver-sheet-app.vercel.app/'
    },
    partners: {
      title: 'PARTNERS IN PROPERTY',
      tech: 'REACT · NEXT.JS · CLOUD',
      desc: 'A premium real estate platform built for high-end property listings. Features immersive visuals, responsive design, and robust cloud infrastructure to handle dynamic property data.',
      link: 'https://partners-in-property.vercel.app/'
    },
    agencyTwo: {
      title: 'PREMIUM AGENCY V2',
      tech: 'REACT · THREE.JS · VERCEL',
      desc: 'The next evolution of the agency website. Designed with aggressive cyberpunk aesthetics, pushing the limits of 3D WebGL integration and hardware acceleration.',
      link: 'https://premium-agency-website-two.vercel.app/'
    }
  }

  return (
    <div>
      <GlobalLoader />
      <CustomCursor />

      {/* Project Modal Overlay */}
      <div className={`modal-overlay ${activeProject ? 'active' : ''}`}>
        {activeProject && (
          <div className="modal-content">
            <button className="modal-close" onClick={() => setActiveProject(null)}>×</button>
            <h3 className="modal-title">{projectsData[activeProject].title}</h3>
            <div className="modal-tech">{projectsData[activeProject].tech}</div>
            <p className="modal-desc">{projectsData[activeProject].desc}</p>
            <a href={projectsData[activeProject].link} target="_blank" rel="noreferrer" className="btn-red">
              VISIT LIVE SITE
            </a>
          </div>
        )}
      </div>

      {/* ═══ PAGE 1 — SAMURAI ═══ */}
      <section className="section">
        <Canvas
          className="scene-canvas"
          camera={{ position: [0, 1, 9], fov: 55 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          <Page1Scene />
        </Canvas>

        <div className="hud">
          <div className="header">
            <div className="header-logo">PA.</div>
            <nav className="header-nav">
              <a href="#page2">PROJECTS</a>
              <a href="#">ABOUT</a>
              <a href="#">CONTACT</a>
            </nav>
          </div>

          <div className="page1-sidebar">
            <div className="sidebar-item">
              <span className="sidebar-label">CLOCK</span>
              <Clock />
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">STATUS</span>
              <span>BLADE SHARPENED</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">BASED IN</span>
              <span>INDIA</span>
            </div>
          </div>

          <div className="page1-content">
            <p className="page1-tag">// CLOUD & AGENTIC AI SPECIALIST — PORTFOLIO 2025</p>
            <h1 className="page1-title">
              FORGING<br /><span>DIGITAL</span><br />KATA.
            </h1>
            <p className="page1-desc">
              Mastering the blade of Cloud infrastructure and Agentic AI to craft sharp, intelligent, high-performance digital ecosystems.
            </p>
            <div className="page1-links">
              <a href="#page3" className="btn-primary">VIEW WORK</a>
              <a href="mailto:apriyanshu540@gmail.com" className="btn-outline">CONTACT ME →</a>
            </div>
          </div>

          <div className="scroll-hint">
            <div className="scroll-line" />
            <span>SCROLL</span>
          </div>
        </div>
      </section>

      {/* ═══ PAGE 2 — CYBERPUNK CAR ═══ */}
      <section id="page2" className="section">
        <Canvas
          className="scene-canvas"
          camera={{ position: [0, 1.4, 6.5], fov: 55 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true }}
        >
          <Page2Scene />
        </Canvas>

        <div className="hud">
          <div className="header">
            <div className="header-logo">PA.</div>
            <nav className="header-nav">
              <a href="#">HOME</a>
              <a href="#">ABOUT</a>
              <a href="#">CONTACT</a>
            </nav>
          </div>

          <div className="tempo">
            <Clock /><br />OVERCLOCKING
          </div>

          <div className="page2-content">
            <p className="page2-tag">// NETRUNNER ARCHITECT — 2024/25</p>
            <h2 className="page2-title">
              NEON.<br />STEEL.<br /><span>VELOCITY.</span>
            </h2>
            <p className="page2-desc">
              Pushing the absolute limits of hardware acceleration and rendering to deliver blistering fast web experiences.
            </p>
            <div className="page2-links">
              <a href="#page3" className="btn-red">SEE PROJECTS</a>
              <a href="https://github.com/Priyanshuf1" target="_blank" rel="noreferrer" className="btn-outline">GITHUB →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAGE 3 — COSMIC ARCHIVE ═══ */}
      <section id="page3" className="section">
        <Canvas
          className="scene-canvas"
          camera={{ position: [0, 1, 10], fov: 55 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          <Page3Scene />
        </Canvas>

        <div className="hud">
          <div className="header">
            <div className="header-logo">PA.</div>
            <nav className="header-nav">
              <a href="#page2">← PREV</a>
              <a href="#page4">NEXT →</a>
            </nav>
          </div>

          <div className="page3-sidebar">
            <div>
              <span className="sidebar-label">SECTION</span>
              <span>03 / 04</span>
            </div>
            <div>
              <span className="sidebar-label">CATEGORY</span>
              <span>PROJECTS</span>
            </div>
            <div>
              <span className="sidebar-label">STATUS</span>
              <span>TRANSMITTING</span>
            </div>
          </div>

          <div className="page3-content">
            <p className="page3-tag">// WORKS ACROSS THE VOID — 2024/25</p>
            <h2 className="page3-title">
              ACROSS<br /><span>THE COSMOS.</span>
            </h2>
            <p className="page3-desc">
              Every project is a mission into the unknown — built with precision, launched with intent,
              and designed to leave a permanent mark in the digital universe.
            </p>

            {/* Project Cards */}
            <div className="page3-projects">
              <button onClick={() => setActiveProject('striver')} className="project-card" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', cursor: 'none' }}>
                <div className="project-card-num">01 — VIEW CASE STUDY</div>
                <div className="project-card-name">STRIVER SHEET APP</div>
                <div className="project-card-desc">DSA Progress Tracker · React</div>
              </button>
              <button onClick={() => setActiveProject('partners')} className="project-card" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', cursor: 'none' }}>
                <div className="project-card-num">02 — VIEW CASE STUDY</div>
                <div className="project-card-name">PARTNERS IN PROPERTY</div>
                <div className="project-card-desc">Real Estate Platform</div>
              </button>
              <button onClick={() => setActiveProject('agencyTwo')} className="project-card" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', cursor: 'none' }}>
                <div className="project-card-num">03 — VIEW CASE STUDY</div>
                <div className="project-card-name">PREMIUM AGENCY V2</div>
                <div className="project-card-desc">Digital Agency Experience</div>
              </button>
              <a href="https://github.com/Priyanshuf1" target="_blank" rel="noreferrer" className="project-card">
                <div className="project-card-num">04 — MORE PROJECTS</div>
                <div className="project-card-name">GITHUB ARCHIVE</div>
                <div className="project-card-desc">Explore my full repositories</div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAGE 4 — ABOUT ME ═══ */}
      <section id="page4" className="section" style={{ background: '#050008' }}>
        <Canvas className="scene-canvas" camera={{ position: [0, 0, 8], fov: 55 }}>
          <Page4Scene />
        </Canvas>

        <div className="hud">
          <div className="header">
            <div className="header-logo">PA.</div>
            <nav className="header-nav">
              <a href="#page3">← PROJECTS</a>
              <a href="#page5">CONTACT →</a>
            </nav>
          </div>

          <div className="page5-content">
            <h2 className="page5-title">
              THE <span>MIND</span> BEHIND<br />THE MACHINE.
            </h2>
            <div className="about-grid">
              <div className="about-text">
                <p style={{ marginBottom: '1.5rem' }}>
                  I specialize in the intersection of Cloud Infrastructure and Agentic AI. 
                  My goal isn't just to build websites—it's to architect intelligent ecosystems 
                  that solve complex problems with minimal human intervention.
                </p>
                <p>
                  Every line of code I write is driven by a philosophy of high performance, 
                  scalability, and breathtaking visual design. I build for the future.
                </p>
              </div>
              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-num">AI</div>
                  <div className="stat-label">CORE SPECIALTY</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">CLOUD</div>
                  <div className="stat-label">INFRASTRUCTURE</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">WEB3</div>
                  <div className="stat-label">AESTHETICS</div>
                </div>
              </div>
            </div>
            <a href="/Priyanshu_Awasthi_Resume.html" target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: '3rem', display: 'inline-block' }}>
              VIEW / DOWNLOAD CV
            </a>
          </div>
        </div>

        {/* Tech Stack Marquee */}
        <div className="tech-marquee-container">
          <div className="tech-marquee">
            <span>AWS / VERCEL / REACT / NEXT.JS / THREE.JS / WEBGL / LANGCHAIN / NODE.JS / AGENTIC AI / DOCKER / </span>
            <span>AWS / VERCEL / REACT / NEXT.JS / THREE.JS / WEBGL / LANGCHAIN / NODE.JS / AGENTIC AI / DOCKER / </span>
          </div>
        </div>
      </section>

      {/* ═══ PAGE 5 — ZEN CYBER DOJO ═══ */}
      <section id="page5" className="section">
        <Canvas
          className="scene-canvas"
          camera={{ position: [0, 1.5, 7], fov: 55 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true }}
        >
          <Page5Scene />
        </Canvas>

        <div className="hud">
          <div className="header">
            <div className="header-logo">PA.</div>
            <nav className="header-nav">
              <a href="#page4">← ABOUT</a>
              <a href="#">TOP ↑</a>
            </nav>
          </div>

          <div className="page4-katana-label">
            ⟵ DRAG CURSOR TO TILT THE BLADE ⟶
          </div>

          <div className="page4-content">
            <p className="page4-tag">// ESTABLISH CONNECTION — CYBER DOJO</p>
            <h2 className="page4-title">
              STEP INTO<br />THE <span>DOJO.</span>
            </h2>
            <p className="page4-desc">
              The blade is sharpened. The gate is open. Let's build something that will outlive every trend —
              drop a message and let's begin.
            </p>
            <div className="page4-links">
              <a href="mailto:apriyanshu540@gmail.com" className="btn-orange">SEND MESSAGE</a>
              <a href="https://www.linkedin.com/in/priyanshu-awasthi-6a8945381?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer" className="btn-outline">LINKEDIN →</a>
              <a href="https://instagram.com/priyanshu._8x_" target="_blank" rel="noreferrer" className="btn-outline">INSTAGRAM →</a>
              <a href="https://wa.me/priyanshu._8x_" target="_blank" rel="noreferrer" className="btn-outline">WHATSAPP →</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
