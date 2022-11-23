varying vec2 vUv;

uniform sampler2D uMousePosTexture;
uniform vec2 uMousePos;
uniform vec2 uPrevMousePos;
uniform float uAspect;

float distToSegment( vec2 x1, vec2 x2, vec2 p ) {

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

    vec4 color = texture2D(uMousePosTexture, vUv) * 0.93;

    float mouseRadius = 0.30;

    float dist = distToSegment(uPrevMousePos* vec2(uAspect, 1.0), uMousePos* vec2(uAspect, 1.0), vUv * vec2(uAspect, 1.0));

    if (dist < mouseRadius) {
        color.z += pow(1.0-dist, 60.0) * 0.8;

        vec2 dir = uMousePos - uPrevMousePos;
        color.xy += dir;
    }

    gl_FragColor = clamp(color, -1.0, 1.0);
}