import React, { Suspense, useRef, useState } from 'react'
import { NoToneMapping, WebGL1Renderer } from 'three'
import { Canvas } from '@react-three/fiber'

import Water from './Water'
import Koi from './Koi'
function App () {
  return (
    <>
      <Canvas
        onCreated={({ gl }) => { gl.toneMapping = NoToneMapping }}
        linear
            // gl={canvas => new WebGL1Renderer({ canvas })}
        gl={{ antialias: false }}
        style={{ position: 'fixed', left: 0, top: 0 }}
        dpr={[1, 1]}
        camera={{ fov: 30, position: [0, 0, 1.5], near: 0.1, far: 100 }}
      >
        <Suspense fallback={null}>
          <color attach='background' args={[0x702bed]} />
          <ambientLight intensity={1.671} color={0xffffff} />
          <Koi />
          <Water />
        </Suspense>
      </Canvas>
    </>
  )
}

export default App
