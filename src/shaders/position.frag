#pragma glslify: curlNoise = require('./curlNoise');

varying vec2 vUv;

uniform sampler2D positionTexture;
uniform sampler2D defaultPositionTexture;
uniform float uTime;
uniform float uDTime;
uniform float uKernelSize;
uniform float uNoiseSpeed;
uniform float uTubeSegments;

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

    //vec3 direction = normalize(currentPosition.xyz - prevPosition);
    // vec3 reflectionVec = reflect(direction, vec3(0.0, 1.0, 0.0));
    vec3 reflectionVec = vec3(0.0, -1.0, 0.0);
    if (currentPosition.y >= 0.0) {
      currentPosition.xyz += reflectionVec * (currentPosition.y * 0.001);
    };

    // gradually move to center
    //currentPosition.xyz *= 0.5;

    float distFromCenter = length(currentPosition.xyz);
    float moveLimit = 5.0;

    //currentPosition.a = moveLimit - distFromCenter;

    currentPosition.a += uDTime * 0.5;

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