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
  Raycaster,
  Vector2,
  Vector3,
  RawShaderMaterial,
  FloatType,
  LinearFilter,
  NoBlending,
  Plane
} from 'three'
import { TextureLoader } from 'three/src/loaders/TextureLoader'

/**
 * Shaders
 */
import PassThroughVert from './shaders/passThroughRaw.vert'
import EmptyFrag from './shaders/empty.frag'
import FluidFrag from './shaders/fluid.frag'
import LightFrag from './shaders/light.frag'

export default function Water () {
  const skyTexture = useLoader(TextureLoader, 'textures/sky.jpg')

  const { gl, size, mouse, scene, camera } = useThree()

  const downscaleFactor = useRef(1) // 1 = no downscale
  const width = useRef(size.width * downscaleFactor.current)
  const height = useRef(size.height * downscaleFactor.current)
  const cameraRT = useRef()
  const rt1 = useRef()
  const rt2 = useRef()
  const copyMaterial = useRef()
  const fluidMaterial = useRef()
  const lightsMaterial = useRef()
  const quadCamera = useRef()
  const quadMesh = useRef()
  const fluidScene = useRef()
  const planeRef = useRef()
  const aspect = useRef(1)
  const mousePos = useRef(new Vector3())
  const prevMousePos = useRef(new Vector3())
  const NDCMousePos = useRef(new Vector3())
  const raycaster = useRef(new Raycaster())
  const intersectPlane = useRef(new Plane(new Vector3(0, 0, 1)))
  const mouseDown = useRef(false)

  function initRenderTargets () {
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
        uTime: { type: 'f', value: 0.0 },
        uMousePos: { type: 'v2', value: new Vector2() },
        uDecay: { type: 'f', value: 0.98 },
        uPrevMousePos: { type: 'v2', value: new Vector2() },
        uMouseDown: { type: 'f', value: 0 },
        uViscosity: { type: 'f', value: 0.01 },
        uElasticity: { type: 'f', value: 0.01 },
        uDownscaleFactor: { type: 'f', value: downscaleFactor.current },
        uResolution: {
          type: 'v2',
          value: new Vector2(width.current, height.current)
        },
        uTexture: { type: 't' },
        uCameraTexture: { type: 't' }
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
        uTime: { type: 'f', value: 0.0 },
        uLightPos: { type: 'v3', value: new Vector3(-4, 4, 7) },
        uMousePos: { type: 'v2', value: new Vector2() },
        uPrevMousePos: { type: 'v2', value: new Vector2() },
        uMouseDown: { type: 'f', value: 0 },
        uIridescence: { type: 'f', value: 0.1 },
        uEnvironment: { type: 't', value: skyTexture },
        uDownscaleFactor: { type: 'f', value: downscaleFactor.current },
        uResolution: {
          type: 'v2',
          value: new Vector2(width.current, height.current)
        },
        uTexture: { type: 't' },
        uCameraTexture: { type: 't' }
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
      if (typeof e.touches[0] === 'undefined' && typeof e.changedTouches[0] === 'undefined') {
        return
      } else {
        e = e.touches[0] || e.changedTouches[0]
      }
      setMousePos(e)
    }, false)
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

    // resizeDepth()
  }, [size])

  // constructor
  useEffect(() => {
    initRenderTargets()
    initMaterials()
    initFluidScene()
    initMouse()
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

    lightsMaterial.current.uniforms.uMousePos.value = mousePos.current
    lightsMaterial.current.uniforms.uPrevMousePos.value = prevMousePos.current

    fluidMaterial.current.uniforms.uMouseDown.value = mouseDown.current
    lightsMaterial.current.uniforms.uMouseDown.value = mouseDown.current
  }, 2)

  return (
    <></>
  )
}
