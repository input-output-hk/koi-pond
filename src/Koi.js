import React, { useEffect, useRef } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import {
  ShaderMaterial,
  Mesh,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  OrthographicCamera,
  Scene,
  WebGLRenderTarget,
  ClampToEdgeWrapping,
  LinearFilter,
  RGBAFormat,
  ShaderLib,
  BufferAttribute,
  Matrix4,
  MeshBasicMaterial,
  FloatType,
  PlaneGeometry,
  Vector2
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// helpers
import TextureHelper from './helpers/TextureHelper'
import { map } from './helpers/math'

// shaders
import vertexShader from './shaders/particles.vert'
import fragmentShader from './shaders/particles.frag'
import PassThroughVert from './shaders/passThrough.vert'
import PassThroughFrag from './shaders/passThrough.frag'
import PositionFrag from './shaders/position.frag'
import koiVert from './shaders/koi.vert'
import koiFrag from './shaders/koi.frag'

import { isIOS, isMobile } from 'react-device-detect'

// config
const INSTANCE_COUNT = 50
const TUBE_SEGMENTS = 10
// const SEGMENT_SCALE = 1
const RADIUS_SEGMENTS = 1

class ParticlesMaterial extends MeshBasicMaterial {
  constructor (config) {
    super(config)

    this.type = 'ShaderMaterial'

    this.uniforms = ShaderLib.basic.uniforms

    this.uniforms.positionTexture = {
      type: 't',
      value: null
    }

    this.uniforms.prevPositionTexture = {
      type: 't',
      value: null
    }

    this.uniforms.defaultPositionTexture = {
      type: 't',
      value: null
    }

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader
  }
}

class KoiMaterial extends MeshBasicMaterial {
  constructor (config) {
    super(config)

    this.type = 'ShaderMaterial'

    this.uniforms = ShaderLib.basic.uniforms

    this.uniforms.positionTexture = {
      type: 't',
      value: null
    }

    this.uniforms.prevPositionTexture = {
      type: 't',
      value: null
    }

    this.uniforms.defaultPositionTexture = {
      type: 't',
      value: null
    }

    this.uniforms.uTubeSegments = {
      type: 'f',
      value: null
    }

    this.vertexShader = koiVert
    this.fragmentShader = koiFrag
  }
}

export default function Koi () {
  const { gl, mouse, size } = useThree()

  // load model
  const { scene } = useLoader(GLTFLoader, 'models/koi.glb')

  // refs
  const textureHelper = useRef(new TextureHelper({
    itemCount: INSTANCE_COUNT,
    width: TUBE_SEGMENTS,
    height: INSTANCE_COUNT
  }))
  const frame = useRef(0)
  const tubeMesh = useRef()
  const tubeGeometry = useRef()
  const tubeMaterial = useRef()
  const koiMaterial = useRef()
  const quadCamera = useRef()
  const passThroughScene = useRef()
  const passThroughMaterial = useRef()
  const positionRenderTarget1 = useRef()
  const positionRenderTarget2 = useRef()
  const outputPositionRenderTarget = useRef()
  const positionMaterial = useRef()
  const positionData = useRef()
  const defaultPositionTexture = useRef()
  const positionScene = useRef()
  const positionMesh = useRef()
  const koiMesh = useRef()

  function initMaterials () {
    tubeMaterial.current = new ParticlesMaterial({
      color: 0xffffff,
      opacity: 1.0,
      wireframe: true
    })

    koiMaterial.current = new KoiMaterial()
  }

  function initCamera () {
    quadCamera.current = new OrthographicCamera()
    quadCamera.current.position.z = 1
  }

  function initPassThrough () {
    passThroughScene.current = new Scene()
    passThroughMaterial.current = new ShaderMaterial({
      uniforms: {
        uTexture: {
          type: 't',
          value: null
        }
      },
      vertexShader: PassThroughVert,
      fragmentShader: PassThroughFrag
    })
    const mesh = new Mesh(new PlaneGeometry(2, 2), passThroughMaterial.current)
    mesh.frustumCulled = false
    passThroughScene.current.add(mesh)
  }

  function initRenderTargets () {
    positionRenderTarget1.current = new WebGLRenderTarget(textureHelper.current.textureWidth, textureHelper.current.textureHeight, {
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: FloatType,
      depthBuffer: false,
      stencilBuffer: false
    })

    positionRenderTarget2.current = positionRenderTarget1.current.clone()

    outputPositionRenderTarget.current = positionRenderTarget1.current
  }

  function initPositions () {
    positionMaterial.current = new ShaderMaterial({
      uniforms: {
        positionTexture: {
          type: 't',
          value: null
        },
        defaultPositionTexture: {
          type: 't',
          value: null
        },
        uNoiseSpeed: {
          type: 'f',
          value: 0.005
        },
        uTime: {
          type: 'f',
          value: 0.0
        },
        uFrame: {
          type: 'f',
          value: 0.0
        },
        uDTime: {
          type: 'f',
          value: 0.0
        },
        uKernelSize: {
          type: 'f',
          value: 0.3
        },
        uTubeSegments: {
          type: 'f',
          value: TUBE_SEGMENTS
        },
        uMousePos: {
          type: 'v2',
          value: null
        },
        uAspect: {
          type: 'f',
          value: null
        }
      },
      vertexShader: PassThroughVert,
      fragmentShader: PositionFrag
    })

    positionData.current = textureHelper.current.createPositionTexture()
    defaultPositionTexture.current = positionData.current.positionTexture

    passThroughTexture(positionData.current.positionTexture, positionRenderTarget1.current)
    passThroughTexture(positionRenderTarget1.current.texture, positionRenderTarget2.current)

    positionMaterial.current.uniforms.defaultPositionTexture.value = defaultPositionTexture.current

    initPositionScene()

    tubeMaterial.current.uniforms.defaultPositionTexture.value = defaultPositionTexture.current
  }

  function initPositionScene () {
    positionScene.current = new Scene()
    positionMesh.current = new Mesh(new PlaneGeometry(2, 2), positionMaterial.current)
    positionMesh.current.frustumCulled = false
    positionScene.current.add(positionMesh.current)
  }

  function updatePositions () {
    let inputPositionRenderTarget = positionRenderTarget1.current

    outputPositionRenderTarget.current = positionRenderTarget2.current
    if (frame.current % 2 === 0) {
      inputPositionRenderTarget = positionRenderTarget2.current
      outputPositionRenderTarget.current = positionRenderTarget1.current
    }
    positionMaterial.current.uniforms.positionTexture.value = inputPositionRenderTarget.texture
    koiMaterial.current.uniforms.prevPositionTexture.value = inputPositionRenderTarget.texture
    tubeMaterial.current.uniforms.prevPositionTexture.value = inputPositionRenderTarget.texture

    gl.setRenderTarget(outputPositionRenderTarget.current)
    gl.render(positionScene.current, quadCamera.current)

    koiMaterial.current.uniforms.positionTexture.value = outputPositionRenderTarget.current.texture
    tubeMaterial.current.uniforms.positionTexture.value = outputPositionRenderTarget.current.texture
  }

  function passThroughTexture (input, output) {
    passThroughMaterial.current.uniforms.uTexture.value = input

    gl.setRenderTarget(output)
    gl.render(passThroughScene.current, quadCamera.current)
  }

  function buildGeometry () {
    const positions = new Float32Array(TUBE_SEGMENTS * RADIUS_SEGMENTS * 3)
    const positionUVS = new Float32Array(TUBE_SEGMENTS * RADIUS_SEGMENTS)
    const positionUVT = new Float32Array(INSTANCE_COUNT)

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      positionUVT[i] = (i + 0.5) / INSTANCE_COUNT
    }

    for (let segmentIndex = 0, i = 0, i3 = 0; segmentIndex < TUBE_SEGMENTS; segmentIndex++) {
      let radiusScale = 1
      if (segmentIndex === 0 || segmentIndex === (TUBE_SEGMENTS - 1)) {
        radiusScale = 0
      }

      for (let j = 0; j < RADIUS_SEGMENTS; j++) {
        const angle = j * (Math.PI * 2 / RADIUS_SEGMENTS)

        // positions[ii3 + 0] = segmentIndex * segmentScale
        positions[i3 + 0] = 0
        positions[i3 + 1] = Math.sin(angle) * radiusScale
        positions[i3 + 2] = Math.cos(angle) * radiusScale

        positionUVS[i] = (segmentIndex + 0.5) / TUBE_SEGMENTS

        i++
        i3 += 3
      }
    }

    const indices = new Uint16Array((TUBE_SEGMENTS - 1) * RADIUS_SEGMENTS * 6)

    let i6 = 0
    let v0 = 0
    let v1 = 1
    let v2 = RADIUS_SEGMENTS
    let v3 = RADIUS_SEGMENTS + 1
    let offset

    for (let i = 0; i < (TUBE_SEGMENTS - 1); i++) {
      for (let j = 0; j < RADIUS_SEGMENTS; j++) {
        offset = j === RADIUS_SEGMENTS - 1 ? -RADIUS_SEGMENTS : 0

        indices[i6 + 0] = v0
        indices[i6 + 1] = v1 + offset
        indices[i6 + 2] = v2

        indices[i6 + 3] = v1 + offset
        indices[i6 + 4] = v3 + offset
        indices[i6 + 5] = v2

        v0++
        v1++
        v2++
        v3++

        i6 += 6
      }
    }

    tubeGeometry.current = new InstancedBufferGeometry()
    tubeGeometry.current.setAttribute('position', new BufferAttribute(positions, 3))
    tubeGeometry.current.setAttribute('positionUVS', new BufferAttribute(positionUVS, 1))
    tubeGeometry.current.setAttribute('positionUVT', new InstancedBufferAttribute(positionUVT, 1, false))
    tubeGeometry.current.setIndex(new BufferAttribute(indices, 1))
    tubeGeometry.current.rotateY(Math.PI / 2)
  }

  function buildMesh () {
    tubeMesh.current = new Mesh(tubeGeometry.current, tubeMaterial.current)
    tubeMesh.current.frustumCulled = false
  }

  // constructor
  useEffect(() => {
    initMaterials()
    initCamera()
    initPassThrough()
    initRenderTargets()
    initPositions()
    buildGeometry()
    buildMesh()
  }, [])

  // load model and setup geo to track spline positions
  useEffect(() => {
    let mesh
    scene.traverse(function (child) {
      if (child.name === 'koi') {
        mesh = child
      }
    })

    const vertices = mesh.geometry.attributes.position.array
    const positionTrackUVS = new Float32Array(Math.floor(vertices.length) / 3)

    // map model vertex positions on y axis to position in spline texture
    let minUV = tubeGeometry.current.attributes.positionUVS.array[0]
    let maxUV = tubeGeometry.current.attributes.positionUVS.array[tubeGeometry.current.attributes.positionUVS.array.length - 1]

    let smallestY = 0
    let largestY = 0
    for (let index = 0; index < vertices.length; index += 3) {
      const y = vertices[index + 1]
      smallestY = Math.min(smallestY, y)
      largestY = Math.max(largestY, y)
    }

    // safari on ios 15.4.1 seems to ignore linearFilter flag so use the same UVs value for each vertex
    if (isIOS && isMobile) {
      minUV = 0.0
      maxUV = 0.0
    }

    for (let index = 0; index < vertices.length; index++) {
      positionTrackUVS[index] = map(vertices[index * 3 + 1], smallestY, largestY, minUV, maxUV)
    }

    mesh.geometry.setAttribute('positionUVS', new BufferAttribute(positionTrackUVS, 1))
    mesh.geometry.setAttribute('positionUVT', tubeGeometry.current.attributes.positionUVT)

    koiMaterial.current.transparent = true
    koiMaterial.current.uniforms.uTubeSegments.value = TUBE_SEGMENTS

    koiMesh.current.geometry = mesh.geometry
    koiMesh.current.material = koiMaterial.current

    koiMesh.current.frustumCulled = false

    const matrix = new Matrix4()
    for (let index = 0; index < INSTANCE_COUNT; index++) {
      koiMesh.current.setMatrixAt(index, matrix)
    }

    koiMesh.current.rotateX(Math.PI / 2)
    koiMesh.current.translateY(-1.1)
  }, [scene])

  useFrame((state, delta) => {
    frame.current++

    positionMaterial.current.uniforms.uDTime.value = delta
    positionMaterial.current.uniforms.uTime.value += delta
    positionMaterial.current.uniforms.uFrame.value = frame.current

    positionMaterial.current.uniforms.uAspect.value = size.width / size.height
    positionMaterial.current.uniforms.uMousePos.value = mouse

    updatePositions(state)

    // gl.setRenderTarget(null)
  }, 1)

  return (
    <>
      <instancedMesh ref={koiMesh} args={[null, null, INSTANCE_COUNT]} />
    </>
  )
}
