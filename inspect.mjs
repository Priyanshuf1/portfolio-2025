// Inspect the GLB file to understand its material types
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const loader = new GLTFLoader()
const filePath = path.join(process.cwd(), 'public/stronghold.glb')
const arrayBuffer = fs.readFileSync(filePath).buffer

loader.parse(arrayBuffer, '', (gltf) => {
  console.log('=== ANIMATIONS ===')
  console.log('Count:', gltf.animations.length)
  gltf.animations.forEach((a, i) => console.log(`  [${i}] name="${a.name}" duration=${a.duration.toFixed(2)}s`))

  console.log('\n=== MATERIALS ===')
  const seen = new Set()
  gltf.scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach(mat => {
        if (seen.has(mat.uuid)) return
        seen.add(mat.uuid)
        console.log(`  name="${mat.name}" type=${mat.type}`)
        console.log(`    color: r=${mat.color?.r?.toFixed(3)} g=${mat.color?.g?.toFixed(3)} b=${mat.color?.b?.toFixed(3)}`)
        console.log(`    metalness=${mat.metalness?.toFixed(3)} roughness=${mat.roughness?.toFixed(3)}`)
        console.log(`    emissive: r=${mat.emissive?.r?.toFixed(3)} g=${mat.emissive?.g?.toFixed(3)} b=${mat.emissive?.b?.toFixed(3)}`)
        console.log(`    emissiveIntensity=${mat.emissiveIntensity}`)
        console.log(`    map=${mat.map ? 'YES' : 'NO'} emissiveMap=${mat.emissiveMap ? 'YES' : 'NO'}`)
        console.log(`    transparent=${mat.transparent} opacity=${mat.opacity}`)
      })
    }
  })
  
  console.log('\n=== SCENE CHILDREN ===')
  gltf.scene.children.forEach((c, i) => {
    console.log(`  [${i}] name="${c.name}" type=${c.type}`)
  })
}, (err) => {
  console.error('Error:', err)
})
