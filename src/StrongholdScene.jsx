import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

export default function StrongholdScene() {
  const group = useRef()
  const tiltGroup = useRef()
  const { scene, animations } = useGLTF('/stronghold.glb')
  const { actions } = useAnimations(animations, group)

  // Play any animations the model might have
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        action.play()
      })
    }
  }, [actions])

  useFrame((state, delta) => {
    // 1. Continuous slow rotation around Y axis
    if (group.current) {
      group.current.rotation.y -= delta * 0.2
    }

    // 2. Cursor parallax effect (tilt)
    if (tiltGroup.current) {
      const targetRotationX = state.pointer.y * 0.15
      const targetRotationY = state.pointer.x * 0.15

      // Smoothly interpolate current tilt towards target
      tiltGroup.current.rotation.x = THREE.MathUtils.lerp(tiltGroup.current.rotation.x, targetRotationX, 0.05)
      tiltGroup.current.rotation.y = THREE.MathUtils.lerp(tiltGroup.current.rotation.y, targetRotationY, 0.05)
    }
  })

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2.5} color="#30b8ff" />
      <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#ff3377" />
      <directionalLight position={[0, 20, 0]} intensity={2} color="#ffffff" />
      
      {/* Group that tilts with mouse */}
      <group ref={tiltGroup}>
        {/* Group that continuously rotates */}
        <group ref={group} position={[0, -2, 0]} scale={0.5}>
          <primitive object={scene} />
        </group>
      </group>
      
      {/* Abstract Background Element for extra depth */}
      <Sphere args={[25, 64, 64]} position={[0, 0, -25]}>
        <MeshDistortMaterial color="#050505" speed={2} distort={0.1} radius={1} />
      </Sphere>
    </>
  )
}

useGLTF.preload('/stronghold.glb')
