import { useEffect, useRef, useState } from 'react'
import { useStore } from './useStore'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function Overlay() {
  const { currentScene, setScene } = useStore()
  
  const overlayRef1 = useRef()
  const overlayRef2 = useRef()
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(timer)
  }, [])

  useGSAP(() => {
    if (currentScene === 'cat') {
      gsap.to(overlayRef2.current, { opacity: 0, duration: 0.5, pointerEvents: 'none' })
      gsap.to(overlayRef1.current, { opacity: 1, duration: 1, pointerEvents: 'auto', delay: 0.2 })
    } else {
      gsap.to(overlayRef1.current, { opacity: 0, duration: 0.5, pointerEvents: 'none' })
      gsap.to(overlayRef2.current, { opacity: 1, duration: 1, pointerEvents: 'auto', delay: 0.2 })
    }
  }, [currentScene])

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {/* Global Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '2.5rem', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.1em' }}>YOUR NAME</h1>
          <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>CREATIVE DEVELOPER</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            {time} TOKYO
          </div>
          <button 
            className="mono"
            onClick={() => setScene(currentScene === 'cat' ? 'car' : 'cat')}
            style={{ 
              marginTop: '1rem', 
              background: 'none', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: '#F0EDE8',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            SWITCH SCENE (SHIFT+TAB)
          </button>
        </div>
      </div>

      {/* Page 1 (Stronghold) Overlay */}
      <div 
        ref={overlayRef1}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          padding: '4rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          opacity: currentScene === 'cat' ? 1 : 0
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            BUILDING DIGITAL<br/>EXPERIENCES.
          </h2>
          <p className="mono" style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.7, marginBottom: '2rem' }}>
            I am a creative developer specializing in WebGL, React, and interactive 3D experiences. 
            Welcome to my portfolio stronghold.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', pointerEvents: 'auto' }} className="mono">
            <a href="#" style={{ color: '#30b8ff', textDecoration: 'none', borderBottom: '1px solid #30b8ff', paddingBottom: '4px', letterSpacing: '0.1em' }}>ABOUT ME</a>
            <a href="#" style={{ color: '#F0EDE8', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px', letterSpacing: '0.1em' }}>CONTACT</a>
          </div>
        </div>
      </div>
      
      {/* Page 2 (Car) Overlay */}
      <div 
        ref={overlayRef2}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          padding: '4rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          opacity: currentScene === 'car' ? 1 : 0
        }}
      >
        <div style={{ maxWidth: '600px', marginLeft: 'auto', textAlign: 'right' }}>
          <h2 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, marginBottom: '1.5rem', letterSpacing: '-0.02em', color: '#ff0044' }}>
            PUSHING SPEED<br/>& PERFORMANCE.
          </h2>
          <p className="mono" style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.7, marginBottom: '2rem', textAlign: 'right' }}>
            Optimized, high-frame-rate web applications. 
            I build fast, responsive, and visually stunning digital products.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', pointerEvents: 'auto' }} className="mono">
            <a href="#" style={{ color: '#0066ff', textDecoration: 'none', borderBottom: '1px solid #0066ff', paddingBottom: '4px', letterSpacing: '0.1em' }}>VIEW PROJECTS</a>
            <a href="#" style={{ color: '#F0EDE8', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px', letterSpacing: '0.1em' }}>GITHUB</a>
          </div>
        </div>
      </div>
    </div>
  )
}
