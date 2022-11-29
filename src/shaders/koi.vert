#pragma glslify: applyQuaternionToVector = require('./applyQuaternionToVector')
#pragma glslify: getRotationQuaternion = require('./getRotationQuaternion')

uniform float uTubeSegments;
uniform sampler2D positionTexture;
uniform sampler2D prevPositionTexture;

attribute float positionUVS;
attribute float positionUVT;

varying vec4 vColor;
varying vec3 vTransformed;
varying float vPositionUVT;
varying float fogDepth;

void main() {

	vPositionUVT = positionUVT;

	float UVDiv = 1.0 / uTubeSegments;

    vec2 positionUV = vec2( positionUVS, positionUVT );
    vec2 positionUVPrev = vec2( positionUVS + (UVDiv), positionUVT );

	vec4 positionData = texture2D(positionTexture, positionUV);
	vec4 prevPositionData = texture2D(prevPositionTexture, positionUV);
	vec4 prevPositionDataDelay = texture2D(prevPositionTexture, positionUVPrev);

	#include <begin_vertex>

	vColor.a = positionData.a;
	transformed *= min(vColor.a, 1.0);

	transformed *= 0.03;
	transformed.x *= 1.3;
	transformed.z *= 1.1;
	vTransformed = transformed.xyz;
	vec4 quaternion = getRotationQuaternion(vec3(0.0, 1.0, 0.0), vec3(0.0, -1.0, 0.0));
	transformed.xyz = applyQuaternionToVector( quaternion, transformed.xyz );

	// rotation
	vec3 direction = normalize(positionData.xyz - prevPositionData.xyz);
	vec3 directionDelay = normalize(prevPositionData.xyz - prevPositionDataDelay.xyz);
	vec3 normal = cross(direction.xyz, directionDelay.xyz);
	vec4 rotQuaternion = getRotationQuaternion(direction, normal);

	// position
	transformed.xyz = applyQuaternionToVector( rotQuaternion, transformed.xyz );
	transformed.xyz += positionData.xyz;

	#include <project_vertex>

	fogDepth = -mvPosition.z;

}

