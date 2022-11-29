import {
  DataTexture,
  RGBAFormat,
  FloatType,
  Vector3,
  LinearFilter
} from 'three'

export default class TextureHelper {
  constructor (args) {
    this.setTextureSize(args.itemCount, args.width, args.height)
  }

  setTextureSize (itemCount, width, height) {
    this.itemCount = itemCount
    this.textureHeight = height
    this.textureWidth = width
  }

  createPositionTexture () {
    const textureArray = new Float32Array(this.textureWidth * this.textureHeight * 4)

    let ii = 0
    const range = 2

    for (let i = 0; i < this.itemCount; i++) {
      const position = new Vector3(
        Math.random() * range - (range / 2),
        -Math.random() * range,
        Math.random() * range - (range / 2)
      )

      for (let j = 0; j < this.textureWidth; j++) {
        textureArray[(ii + j) * 4 + 0] = position.x
        textureArray[(ii + j) * 4 + 1] = position.y
        textureArray[(ii + j) * 4 + 2] = position.z
        textureArray[(ii + j) * 4 + 3] = i === 1 ? 1 : 0
      }

      ii += this.textureWidth
    }

    const positionTexture = new DataTexture(
      textureArray,
      this.textureWidth,
      this.textureHeight,
      RGBAFormat,
      FloatType
    )
    positionTexture.minFilter = LinearFilter
    positionTexture.magFilter = LinearFilter
    positionTexture.generateMipmaps = false
    positionTexture.needsUpdate = true

    return {
      positionTexture
    }
  }
}
