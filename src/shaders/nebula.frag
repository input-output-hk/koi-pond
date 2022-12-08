precision highp float;

#pragma glslify: blend_glow = require(glsl-blend/glow)
#pragma glslify: blend_screen = require(glsl-blend/screen)

uniform vec3 uLightPos;
uniform vec2 uMousePos;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uEnvironment;
uniform float uIridescence;
uniform sampler2D uCameraTexture;
uniform sampler2D uStarsTexture;
uniform sampler2D uNoiseTexture;
uniform float uNoiseTextureSize;
uniform float uTime;
uniform vec2 uStarPositions[6];

float smootherstep(float a, float b, float r) {
    r = clamp(r, 0.0, 1.0);
    r = r * r * r * (r * (6.0 * r - 15.0) + 10.0);
    return mix(a, b, r);
}

float perlin_2d(vec2 p) {
    vec2 p0 = floor(p);
    vec2 p1 = p0 + vec2(1, 0);
    vec2 p2 = p0 + vec2(1, 1);
    vec2 p3 = p0 + vec2(0, 1);
    vec2 d0 = texture2D(uNoiseTexture, p0/uNoiseTextureSize).ba;
    vec2 d1 = texture2D(uNoiseTexture, p1/uNoiseTextureSize).ba;
    vec2 d2 = texture2D(uNoiseTexture, p2/uNoiseTextureSize).ba;
    vec2 d3 = texture2D(uNoiseTexture, p3/uNoiseTextureSize).ba;
    d0 = 2.0 * d0 - 1.0;
    d1 = 2.0 * d1 - 1.0;
    d2 = 2.0 * d2 - 1.0;
    d3 = 2.0 * d3 - 1.0;
    vec2 p0p = p - p0;
    vec2 p1p = p - p1;
    vec2 p2p = p - p2;
    vec2 p3p = p - p3;
    float dp0 = dot(d0, p0p);
    float dp1 = dot(d1, p1p);
    float dp2 = dot(d2, p2p);
    float dp3 = dot(d3, p3p);
    float fx = p.x - p0.x;
    float fy = p.y - p0.y;
    float m01 = smootherstep(dp0, dp1, fx);
    float m32 = smootherstep(dp3, dp2, fx);
    float m01m32 = smootherstep(m01, m32, fy);
    return m01m32;
}

float normalnoise(vec2 p) {
    return perlin_2d(p) * 0.5 + 0.5;
}

float noise(vec2 p, vec2 offset) {
    p += offset;
    const int steps = 5;
    float scale = pow(2.0, float(steps));
    float displace = 0.0;
    for (int i = 0; i < steps; i++) {
        displace = normalnoise(p * scale + displace);
        scale *= 0.5;
    }
    return normalnoise(p + displace);
}

vec3 star (
        vec2 center,
        float scale,
        float coreRadius,
        vec3 coreColor,
        vec3 starColor,
        float haloFalloff,
        vec3 haloColor,
        vec2 fragCoord
    ) {
    float d = length((fragCoord * uResolution) - center * uResolution) / scale;
    if (d <= coreRadius) {
        starColor = coreColor;
    } else {
        float e = 1.0 - exp(-(d - coreRadius) * haloFalloff);
        vec3 rgb = mix(coreColor, haloColor, e);
        starColor = mix(rgb, vec3(0.0, 0.0, 0.0), e);
    }

    return starColor;
}

void main() {

    vec2 uv = gl_FragCoord.xy / uResolution.xy;

    vec3 reflection = vec3(0.0);

    float scale = 1.8;
    float density = 0.15;
    float falloff = 4.0;
    float n = noise(uv * scale * 1.0, vec2(100.0, 100.0));
    n = pow(n + density, falloff);
    vec3 nebula = blend_screen(reflection, vec3(190.0/255.0, 49.0/255.0, 99.0/255.0), n);
    reflection = nebula;

    scale = 3.1;
    density = 0.05;
    falloff = 2.0;
    n = noise(uv * scale * 1.0, vec2(1.0, 1.0));
    n = pow(n + density, falloff);
    nebula = blend_screen(reflection, vec3(40.0/255.0, 67.0/255.0, 113.0/255.0), n);
    reflection = nebula;

    scale = 6.1;
    density = 0.15;
    falloff = 10.0;
    n = noise(uv * scale * 1.0, vec2(1.0, 1.0));
    n = pow(n + density, falloff);
    n *= 0.5;
    nebula = blend_screen(reflection, vec3(10.0/255.0, 67.0/255.0, 40.0/255.0), n);
    reflection = nebula;

    vec3 bigStars = vec3(0.0);

    bigStars = star(
        uStarPositions[0], 
        120.0,
        0.01,
        vec3(1.0, 1.0, 1.0),
        vec3(0.0, 0.5, 0.6),
        15.0,
        vec3(0.1, 0.9, 0.6),
        uv
    );

    bigStars += star(
        uStarPositions[1],
        80.0,
        0.01,
        vec3(1.0, 1.0, 1.0),
        vec3(0.0, 0.5, 0.6),
        15.0,
        vec3(0.1, 0.9, 0.6),
        uv
    );

    bigStars += star(
        uStarPositions[2],
        120.0,
        0.01,
        vec3(1.0, 1.0, 1.0),
        vec3(0.8, 0.5, 0.6),
        15.0,
        vec3(1.0, 0.0, 0.6),
        uv
    );

    bigStars += star(
        uStarPositions[3],
        80.0,
        0.01,
        vec3(1.0, 1.0, 1.0),
        vec3(0.0, 0.5, 0.6),
        15.0,
        vec3(0.1, 0.9, 0.6),
        uv
    );

    bigStars += star(
        uStarPositions[4],
        80.0,
        0.01,
        vec3(1.0, 1.0, 1.0),
        vec3(0.0, 0.0, 1.0),
        15.0,
        vec3(0.0, 0.0, 1.0),
        uv
    );

    bigStars += star(
        uStarPositions[4],
        80.0,
        0.01,
        vec3(1.0, 0.0, 0.1),
        vec3(1.0, 0.0, 0.5),
        15.0,
        vec3(1.0, 0.0, 0.5),
        uv
    );

    reflection = blend_screen(reflection, bigStars);
    
    gl_FragColor = vec4( reflection, 1.0 );

}