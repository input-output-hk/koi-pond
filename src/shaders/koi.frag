#pragma glslify: snoise = require(glsl-noise/classic/3d)

uniform float opacity;

varying vec4 vColor;
varying vec3 vTransformed;
varying float vPositionUVT;
varying float fogDepth;

void main() {

	vec3 diffuse = vec3(1.0);
	vec3 koiColor = vec3(255.0/255.0, 96.0/255.0, 38.0/255.0);
	vec3 noisePos = vTransformed;
	noisePos.x += vPositionUVT;
	noisePos *= 16.0;
	float noise = smoothstep(snoise(noisePos), 0.0, 1.0);

	vec3 finalColor = mix(diffuse, koiColor, noise);

	gl_FragColor = vec4( finalColor, min(vColor.a, 1.0));

	vec3 fogColor = vec3(112.0/255.0, 43.0/255.0, 237.0/255.0);
	float fogDensity = 0.15;
	float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

}
