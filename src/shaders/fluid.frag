precision highp float;

uniform vec2 uMousePos;
uniform vec2 uPrevMousePos;
uniform float uMouseDown;
uniform vec2 uResolution;
uniform float uDownscaleFactor;
uniform sampler2D uTexture;
uniform sampler2D uCameraTexture;

uniform float uViscosity;
uniform float uElasticity;
uniform float uDecay;
uniform float uTime;

vec3 calculateNormal(vec4 prevNormal, vec2 uv) {
    
  vec3 right = texture2D(uTexture, uv + vec2(1., 0.) / uResolution).xyz;
  vec3 left = texture2D(uTexture, uv + vec2(-1., 0.) / uResolution).xyz;
  vec3 up = texture2D(uTexture, uv + vec2(0., 1.) / uResolution).xyz;
  vec3 down = texture2D(uTexture, uv + vec2(0., -1.) / uResolution).xyz;

  vec4 height = vec4(prevNormal.z);
  height -= vec4(right.z, left.z, up.z, down.z);

  vec2 xy = vec2(height.x - height.y, height.z - height.w);
  xy += right.xy + left.xy + up.xy + down.xy;

  xy *= uDecay;

  // float z = length( xy ) * 0.05;
  // float z = pow(length( xy ), 2.0) * 1.0;

  float z = 0.0;
  z += dot(right.xy, vec2(-1., 0.));
  z += dot(left.xy, vec2(1., 0.));
  z += dot(up.xy, vec2(0., -1.));
  z += dot(down.xy, vec2(0., 1.));

  //return vec3( xy, z ) * 0.25236;
  return vec3( xy, z ) * 0.25;

}

float distToSegment(vec2 x1, vec2 x2, vec2 p) {

  vec2 v = x2 - x1;
  vec2 w = p - x1;

  float c1 = dot(w,v);
  float c2 = dot(v,v);

  float div = mix( c2, c1, step( c2, c1 ) );

  float mult = step( 0.0, c1 );

  float b = c1 * mult / div;
  vec2 pb = x1 + b*v;

  return distance( p, pb );

}

void main() {

  vec2 uv = gl_FragCoord.xy / uResolution;

  vec4 prevNormal = texture2D( uTexture, uv );
  vec4 cameraTexture = texture2D( uCameraTexture, uv );

  float velocity = prevNormal.w;
  float elasticity = uElasticity;
  float viscosity = uViscosity;

  float velocityDecay = (prevNormal.z - 0.6);
  velocity -= velocityDecay * elasticity + velocity * viscosity;

  vec3 normal = calculateNormal( prevNormal, uv );
  normal.z += prevNormal.z + velocity;

  float fragToMouse = distToSegment(uPrevMousePos.xy * uDownscaleFactor, uMousePos.xy * uDownscaleFactor, gl_FragCoord.xy);

  float mouseRadius = 10.0 * uMouseDown;
  float maxHeight = 1.0;

  if (fragToMouse < mouseRadius) {
    float distanceFromRadius = ( mouseRadius - fragToMouse ) / mouseRadius;
    normal.z +=  distanceFromRadius;
  }

  if (cameraTexture.r >= 1.0) {
    normal.z += pow(cameraTexture.r, 1.0) * 0.01;
  }

  gl_FragColor = vec4( normal, velocity );

}