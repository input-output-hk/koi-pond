import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'

import Water from './Water'
import Koi from './Koi'
import { NoToneMapping } from 'three'
function App () {
  const fluidScene = useRef()
  const quadCamera = useRef()

  return (
    <>
      <Canvas
        onCreated={({ gl }) => { gl.toneMapping = NoToneMapping }}
        linear
        gl={{ antialias: false }}
        style={{ position: 'fixed', left: 0, top: 0 }}
        dpr={[1, 1]}
        camera={{ fov: 30, position: [0, 0, 1.5], near: 0.1, far: 100 }}
      >
        <Suspense fallback={null}>
          <color attach='background' args={[0x000000]} />
          <Koi />
          <Water fluidScene={fluidScene} quadCamera={quadCamera} />
        </Suspense>
      </Canvas>
    </>
  )
}

export default App
