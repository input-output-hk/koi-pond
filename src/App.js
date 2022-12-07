import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useDetectGPU } from '@react-three/drei'

import Water from './Water'
import Koi from './Koi'
function App () {
  const fluidScene = useRef()
  const quadCamera = useRef()

  const GPUTier = useDetectGPU()

  return (
    <>
      <Canvas
        // onCreated={({ gl }) => { gl.toneMapping = NoToneMapping }}
        // linear
            // gl={canvas => new WebGL1Renderer({ canvas })}
        gl={{ antialias: GPUTier.tier > 1 }}
        style={{ position: 'fixed', left: 0, top: 0 }}
        dpr={[1, 1]}
        camera={{ fov: 30, position: [0, 0, 1.5], near: 0.1, far: 100 }}
      >
        <Suspense fallback={null}>
          <color attach='background' args={[0x000000]} />
          {/* <ambientLight intensity={1.671} color={0xffffff} /> */}
          <Koi />
          <Water fluidScene={fluidScene} quadCamera={quadCamera} />
        </Suspense>
      </Canvas>
    </>
  )
}

export default App
