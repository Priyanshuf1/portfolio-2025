import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, Sparkles, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function CarScene() {
  const gridRef = useRef()
  const carGroup = useRef()
  const { scene } = useGLTF('/car.glb')
  
  useFrame((state, delta) => {
    // 1. Infinite scrolling grid to simulate speed
    if (gridRef.current) {
      gridRef.current.position.z += 80 * delta
      if (gridRef.current.position.z > 20) {
        gridRef.current.position.z = 0
      }
    }

    // 2. Add subtle vibration to the car to simulate driving
    if (carGroup.current) {
      carGroup.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.02
    }
  })

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[0, 10, -10]} intensity={2} color="#ff0044" />
      <directionalLight position={[-10, 5, 10]} intensity={2.5} color="#0066ff" />
      <directionalLight position={[0, 5, 0]} intensity={2} color="#ffffff" />
      
      {/* 3D Car Model */}
      <group position={[0, -0.5, 3]}>
        <group ref={carGroup} scale={0.6}>
          <primitive object={scene} />
        </group>
        
        {/* Exhaust / Speed Particles */}
        <Sparkles count={300} scale={[4, 2, 30]} size={10} speed={2} color="#00ffff" position={[0, 1, -15]} />
        <Sparkles count={300} scale={[4, 2, 30]} size={10} speed={2} color="#ff0044" position={[0, 1, -15]} />
        
        {/* Neon Underglow */}
        <pointLight position={[0, 0.5, 0]} intensity={3} color="#00ffff" distance={10} />
      </group>
      
      {/* Infinite Grid */}
      <group ref={gridRef}>
        <Grid 
          position={[0, -0.51, 0]} 
          args={[200, 200]} 
          cellColor="#ff0044" 
          sectionColor="#0066ff" 
          sectionThickness={1.5} 
          cellThickness={0.6} 
          fadeDistance={100} 
        />
      </group>
    </>
  )
}

useGLTF.preload('/car.glb')
