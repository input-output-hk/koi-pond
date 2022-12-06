import React, { useEffect, useRef } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import {
  Color,
  Mesh,
  BufferGeometry,
  BufferAttribute,
  OrthographicCamera,
  Scene,
  WebGLRenderTarget,
  RGBAFormat,
  Vector2,
  Vector3,
  RawShaderMaterial,
  FloatType,
  LinearFilter,
  NoBlending,
  DataTexture,
  RepeatWrapping
} from 'three'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import UnrealBloomPass from './UnrealBloomPass'

import { isMobile } from 'react-device-detect'

import random from 'random'
import seedrandom from 'seedrandom'

/**
 * Shaders
 */
import PassThroughVert from './shaders/passThroughRaw.vert'
import EmptyFrag from './shaders/empty.frag'
import FluidFrag from './shaders/fluid.frag'
import LightFrag from './shaders/light.frag'

export default function Water ({ fluidScene, quadCamera }) {
  random.use(seedrandom(Date.now()))

  const skyTexture = useLoader(TextureLoader, 'textures/galaxy.jpg')

  const { gl, size, scene, camera } = useThree()

  const downscaleFactor = useRef(1) // 1 = no downscale
  const width = useRef(size.width * downscaleFactor.current)
  const height = useRef(size.height * downscaleFactor.current)
  const cameraRT = useRef()
  const rt1 = useRef()
  const rt2 = useRef()
  const copyMaterial = useRef()
  const fluidMaterial = useRef()
  const lightsMaterial = useRef()
  // const quadCamera = useRef()
  const quadMesh = useRef()
  // const fluidScene = useRef()
  const mousePos = useRef(new Vector3())
  const prevMousePos = useRef(new Vector3())
  const NDCMousePos = useRef(new Vector3())
  const mouseDown = useRef(false)
  const aspect = useRef(1)
  const pointStarsTexture = useRef()
  const noiseTexture = useRef()

  const composer = useRef()
  const bloomPass = useRef()
  const bloomWriteRT = useRef()

  function initRenderTargets () {
    composer.current = new EffectComposer(gl)

    // resolution, strength, radius, threshold
    bloomPass.current = new UnrealBloomPass(new Vector2(size.width, size.height), 1.6, 1.0, 0.0)

    bloomWriteRT.current = new WebGLRenderTarget(
      width.current,
      height.current,
      {
        stencilBuffer: false
      }
    )

    cameraRT.current = new WebGLRenderTarget(
      width.current,
      height.current,
      {
        stencilBuffer: false
      }
    )

    rt1.current = new WebGLRenderTarget(
      width.current,
      height.current,
      {
        format: RGBAFormat,
        type: FloatType,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: LinearFilter,
        magFilter: LinearFilter
      }
    )
    rt2.current = rt1.current.clone()
  }

  function initMaterials () {
    copyMaterial.current = new RawShaderMaterial({
      vertexShader: PassThroughVert,
      fragmentShader: EmptyFrag,
      blending: NoBlending,
      transparent: false,
      fog: false,
      lights: false,
      depthWrite: false,
      depthTest: false
    })

    fluidMaterial.current = new RawShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uMousePos: { value: new Vector2() },
        uDecay: { value: 0.985 },
        uPrevMousePos: { value: new Vector2() },
        uMouseDown: { value: 0 },
        uViscosity: { value: 0.01 },
        uElasticity: { value: 0.01 },
        uDownscaleFactor: { value: downscaleFactor.current },
        uResolution: {
          value: new Vector2(width.current, height.current)
        },
        uTexture: { },
        uCameraTexture: { },
        uIsMobile: { }
      },
      vertexShader: PassThroughVert,
      fragmentShader: FluidFrag,
      blending: NoBlending,
      transparent: false,
      fog: false,
      lights: false,
      depthWrite: false,
      depthTest: false
    })

    lightsMaterial.current = new RawShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uLightPos: { value: new Vector3(-4, 4, 7) },
        uMousePos: { value: new Vector2() },
        uPrevMousePos: { value: new Vector2() },
        uMouseDown: { value: 0 },
        uIridescence: { value: 0.1 },
        uEnvironment: { value: skyTexture },
        uDownscaleFactor: { value: downscaleFactor.current },
        uResolution: {
          value: new Vector2(width.current, height.current)
        },
        uTexture: { },
        uCameraTexture: { },
        uStarsTexture: { },
        uNoiseTexture: { },
        uNoiseTextureSize: { },
        uStarPositions: {
          value: [
            new Vector2(Math.random(), Math.random()),
            new Vector2(Math.random(), Math.random()),
            new Vector2(Math.random(), Math.random()),
            new Vector2(Math.random(), Math.random()),
            new Vector2(Math.random(), Math.random()),
            new Vector2(Math.random(), Math.random())
          ]
        }

      },
      vertexShader: PassThroughVert,
      fragmentShader: LightFrag,
      blending: NoBlending,
      transparent: false,
      fog: false,
      lights: false,
      depthWrite: false,
      depthTest: false
    })
  }

  function initFluidScene () {
    const geometry = new BufferGeometry()

    // full screen triangle
    const vertices = new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0
    ])

    geometry.setAttribute('position', new BufferAttribute(vertices, 2))

    quadMesh.current = new Mesh(geometry, copyMaterial.current)
    quadMesh.current.frustumCulled = false

    fluidScene.current = new Scene()
    fluidScene.current.background = new Color(0xffffff)
    fluidScene.current.add(quadMesh.current)

    quadMesh.current.material = fluidMaterial.current

    quadCamera.current = new OrthographicCamera()
    quadCamera.current.position.z = 1
  }

  //   function resizeDepth () {
  //     if (depthCamera.current) {
  //       aspect.current = size.width / size.height
  //       depthCamera.current.left = -depthCameraFrustrumSize.current * aspect.current / 2
  //       depthCamera.current.right = depthCameraFrustrumSize.current * aspect.current / 2
  //       depthCamera.current.top = depthCameraFrustrumSize.current / 2
  //       depthCamera.current.bottom = -depthCameraFrustrumSize.current / 2
  //       depthCamera.current.updateProjectionMatrix()
  //     }
  //   }

  function initMouse () {
    function setMousePos (e) {
      prevMousePos.current = mousePos.current.clone()

      const x = e.clientX - gl.domElement.offsetLeft
      const y = e.clientY - gl.domElement.offsetTop

      NDCMousePos.current.x = (x / gl.domElement.width) * 2 - 1
      NDCMousePos.current.y = (1 - y / gl.domElement.height) * 2 - 1

      mousePos.current.x = x
      mousePos.current.y = gl.domElement.height - y
    }

    document.addEventListener('mousemove', (e) => {
      setMousePos(e)
    }, false)

    document.addEventListener('mousedown', (e) => {
      mouseDown.current = true
    }, false)

    document.addEventListener('mouseup', (e) => {
      mouseDown.current = false
    }, false)

    document.addEventListener('touchmove', (e) => {
      if (typeof e.touches[0] === 'undefined' && typeof e.changedTouches[0] === 'undefined') {
        return
      } else {
        e = e.touches[0] || e.changedTouches[0]
      }
      setMousePos(e)
    }, false)

    document.addEventListener('touchstart', (e) => {
      mouseDown.current = true
      if (typeof e.touches[0] === 'undefined' && typeof e.changedTouches[0] === 'undefined') {
        return
      } else {
        e = e.touches[0] || e.changedTouches[0]
      }
      setMousePos(e)
    }, false)

    document.addEventListener('touchend', (e) => {
      mouseDown.current = false
      if (typeof e.touches[0] === 'undefined' && typeof e.changedTouches[0] === 'undefined') {
        return
      } else {
        e = e.touches[0] || e.changedTouches[0]
      }
      setMousePos(e)
    }, false)

    document.addEventListener('touchcancel', (e) => {
      mouseDown.current = false
      if (typeof e.touches[0] === 'undefined' && typeof e.changedTouches[0] === 'undefined') {
        return
      } else {
        e = e.touches[0] || e.changedTouches[0]
      }
      setMousePos(e)
    }, false)
  }

  function generateNoiseTexture (noiseSize = 256) {
    const l = noiseSize * noiseSize * 4
    const data = new Float32Array(l)
    for (let i = 0; i < l; i++) {
      const r = new Vector2(random.float(), random.float())
      data[i * 4 + 0] = r.x
      data[i * 4 + 1] = r.x
      data[i * 4 + 2] = r.x
      data[i * 4 + 3] = r.y
    }

    noiseTexture.current = new DataTexture(
      data,
      noiseSize,
      noiseSize,
      RGBAFormat,
      FloatType
    )
    // noiseTexture.current.generateMipmaps = false
    noiseTexture.current.needsUpdate = true
    noiseTexture.current.wrapS = RepeatWrapping
    noiseTexture.current.wrapT = RepeatWrapping

    lightsMaterial.current.uniforms.uNoiseTexture.value = noiseTexture.current
    lightsMaterial.current.uniforms.uNoiseTextureSize.value = noiseSize
  }

  function generatePointStars (density = 0.005, brightness = 0.8) {
    const count = Math.round(size.width * size.height * density)
    const data = new Uint8Array(size.width * size.height * 4)
    for (let i = 0; i < count; i++) {
      const r = Math.floor(random.float() * size.width * size.height)
      const c = Math.round(255 * Math.log(1 - random.float()) * -brightness)
      data[r * 4 + 0] = c
      data[r * 4 + 1] = c
      data[r * 4 + 2] = c
      data[r * 4 + 3] = 0
    }

    pointStarsTexture.current = new DataTexture(
      data,
      size.width,
      size.height,
      RGBAFormat
    )
    pointStarsTexture.current.needsUpdate = true

    lightsMaterial.current.uniforms.uStarsTexture.value = pointStarsTexture.current
  }

  // resize
  useEffect(() => {
    if (cameraRT.current) {
      size.width *= downscaleFactor.current
      size.height *= downscaleFactor.current

      cameraRT.current.setSize(size.width, size.height)
      rt1.current.setSize(size.width, size.height)
      rt2.current.setSize(size.width, size.height)

      fluidMaterial.current.uniforms.uResolution.value = new Vector2(size.width, size.height)
      lightsMaterial.current.uniforms.uResolution.value = new Vector2(size.width, size.height)
    }

    aspect.current = size.width / size.height

    // resizeDepth()
  }, [size])

  // constructor
  useEffect(() => {
    initRenderTargets()
    initMaterials()
    initFluidScene()
    initMouse()

    generateNoiseTexture()
    generatePointStars()
  }, [])

  useFrame((state, delta) => {
    if (!skyTexture) {
      return
    }

    const tmp = rt1.current
    rt1.current = rt2.current
    rt2.current = tmp

    gl.setRenderTarget(cameraRT.current)
    gl.render(scene, camera)

    bloomPass.current.render(gl, null, cameraRT.current)

    quadMesh.current.material = fluidMaterial.current
    quadMesh.current.material.uniforms.uTime.value += delta * 8
    quadMesh.current.material.uniforms.uTexture.value = rt2.current.texture
    quadMesh.current.material.uniforms.uCameraTexture.value = cameraRT.current.texture

    gl.setRenderTarget(rt1.current)
    gl.render(fluidScene.current, quadCamera.current)

    quadMesh.current.material = lightsMaterial.current
    quadMesh.current.material.uniforms.uTexture.value = rt1.current.texture
    quadMesh.current.material.uniforms.uCameraTexture.value = cameraRT.current.texture

    gl.setRenderTarget(null)
    gl.render(fluidScene.current, quadCamera.current)

    fluidMaterial.current.uniforms.uMousePos.value = mousePos.current
    fluidMaterial.current.uniforms.uPrevMousePos.value = prevMousePos.current
    fluidMaterial.current.uniforms.uIsMobile.value = isMobile

    lightsMaterial.current.uniforms.uTime.value += delta
    lightsMaterial.current.uniforms.uMousePos.value = mousePos.current
    lightsMaterial.current.uniforms.uPrevMousePos.value = prevMousePos.current

    // lightsMaterial.current.uniforms.uLightPos.value.x = mouse.x * aspect.current
    // lightsMaterial.current.uniforms.uLightPos.value.y = mouse.y

    fluidMaterial.current.uniforms.uMouseDown.value = mouseDown.current
    lightsMaterial.current.uniforms.uMouseDown.value = mouseDown.current
  }, 2)

  return (
    <></>
  )
}
