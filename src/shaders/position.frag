#pragma glslify: curlNoise = require('./curlNoise');

varying vec2 vUv;

uniform sampler2D positionTexture;
uniform sampler2D defaultPositionTexture;
uniform float uTime;
uniform float uDTime;
uniform float uKernelSize;
uniform float uNoiseSpeed;
uniform float uTubeSegments;
uniform vec2 uMousePos;
uniform float uAspect;

void main() {

  vec4 currentPosition;

  float UVDiv = 1.0 / uTubeSegments;

  vec4 defaultPosition = texture2D(defaultPositionTexture, vUv);

  vec4 headPosition = texture2D(positionTexture, vec2( UVDiv, vUv.y ));

  if (vUv.x <= UVDiv) {
    currentPosition = texture2D(positionTexture, vUv);
    vec3 prevPosition = currentPosition.xyz;

    vec3 scaledPosition = vec3(currentPosition.x, currentPosition.y, currentPosition.z + (uTime * 0.5)) * uKernelSize;

    currentPosition.xyz -= (curlNoise(scaledPosition) * uNoiseSpeed) * (0.4);

    if (defaultPosition.a == 1.0) {
      vec2 newMouse = vec2(uMousePos.x, -uMousePos.y) * vec2(uAspect, 1.0);
      newMouse *= 0.7;
      vec3 toMouse = normalize(vec3(newMouse.x, 0.0, newMouse.y) - currentPosition.xyz);
      currentPosition.xyz += toMouse * 0.0015;
    }

    vec3 reflectionVec = vec3(0.0, -1.0, 0.0);
    if (currentPosition.y >= 0.0) {
      currentPosition.xyz += reflectionVec * (currentPosition.y * 0.001);
    };

    float distFromCenter = length(currentPosition.xyz);
    float moveLimit = 4.0;

    //currentPosition.a = moveLimit - distFromCenter;

    // alpha channel used in koi.frag
    currentPosition.a += uDTime * 0.5;

    // reset alpha when moving back to starting position
    if (distFromCenter > (moveLimit * 0.99)) {
      currentPosition.a = 0.0;
    }

    if (distFromCenter > moveLimit) {
      currentPosition = defaultPosition;
    }

    gl_FragColor = currentPosition;

  } else {
    vec4 prevPosition = texture2D(positionTexture, vec2(vUv.x, vUv.y));
    
    currentPosition = texture2D(positionTexture, vec2(vUv.x - (UVDiv), vUv.y));

    if ( currentPosition.xyz == defaultPosition.xyz ) {
      gl_FragColor = defaultPosition;
    } else {
      gl_FragColor = mix(prevPosition, currentPosition, 0.3);
    }

    gl_FragColor.a = headPosition.a;

  }

}