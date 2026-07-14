import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

export default function CatScene() {
  const catRef = useRef()

  useFrame((state) => {
    // Make the cat placeholder look at the mouse cursor
    // state.pointer is normalized (-1 to +1)
    if (catRef.current) {
      // Smooth interpolation for looking at the cursor
      const target = new THREE.Vector3(state.pointer.x * 5, state.pointer.y * 5, 5)
      catRef.current.position.y = THREE.MathUtils.lerp(catRef.current.position.y, state.pointer.y * 0.5, 0.05)
      catRef.current.position.x = THREE.MathUtils.lerp(catRef.current.position.x, state.pointer.x * 0.5, 0.05)
      catRef.current.lookAt(target)
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#30b8ff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ff3377" />
      
      {/* Placeholder for the Cat Model */}
      <group ref={catRef} position={[0, 0, 0]}>
        {/* Head */}
        <Box args={[1.5, 1.2, 1.5]} position={[0, 0.6, 0]}>
          <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
        </Box>
        {/* Ears */}
        <Box args={[0.4, 0.6, 0.4]} position={[-0.5, 1.5, 0.2]} rotation={[0, 0, 0.2]}>
          <meshStandardMaterial color="#222" />
        </Box>
        <Box args={[0.4, 0.6, 0.4]} position={[0.5, 1.5, 0.2]} rotation={[0, 0, -0.2]}>
          <meshStandardMaterial color="#222" />
        </Box>
        {/* Glowing Eyes */}
        <Sphere args={[0.15, 16, 16]} position={[-0.4, 0.8, 0.76]}>
          <meshBasicMaterial color="#30b8ff" />
        </Sphere>
        <Sphere args={[0.15, 16, 16]} position={[0.4, 0.8, 0.76]}>
          <meshBasicMaterial color="#30b8ff" />
        </Sphere>
      </group>
      
      {/* Abstract Background Element */}
      <Sphere args={[15, 64, 64]} position={[0, 0, -15]}>
        <MeshDistortMaterial color="#080808" speed={2} distort={0.2} radius={1} />
      </Sphere>
    </>
  )
}
