#pragma glslify: snoise = require(glsl-noise/classic/3d)

uniform float opacity;
uniform float uTime;

varying vec4 vColor;
varying vec3 vDiffuse;
varying vec3 vTransformed;
varying float vPositionUVT;
varying float vIsHovered;
varying float fogDepth;
varying float vHoverTime;

void main() {

	vec3 diffuse = vDiffuse;
	vec3 koiColor = vec3(1.0, 0.0, 0.0);
	vec3 noisePos = vTransformed;
	noisePos.x += vPositionUVT;
	noisePos.x += vHoverTime;
		
	noisePos *= 16.0;
	float noise = smoothstep(snoise(noisePos), 0.0, 1.0);

	vec3 finalColor = mix(diffuse, koiColor, noise);

	gl_FragColor = vec4( finalColor, min(vColor.a, 1.0));

	// vec3 fogColor = vec3(112.0/255.0, 43.0/255.0, 237.0/255.0);
	vec3 fogColor = vec3(0.0);
	float fogDensity = 0.25;
	float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

}
