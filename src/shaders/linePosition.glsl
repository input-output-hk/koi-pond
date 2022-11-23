#pragma glslify: applyQuaternionToVector = require('./applyQuaternionToVector')
#pragma glslify: getRotationQuaternion = require('./getRotationQuaternion')

vec3 linePosition(float positionUVS, float positionUVT, sampler2D positionTexture, sampler2D prevPositionTexture, inout vec3 transformed) {

    vec2 positionUV = vec2( positionUVS, positionUVT );

	vec4 positionData = texture2D(positionTexture, positionUV);
	vec4 prevPositionData = texture2D(prevPositionTexture, positionUV);

	float posLength = length(positionData.xyz);

	// scale
	transformed.xyz *= 0.01;
	// transformed.xyz *= min(posLength, 1.0);
	// transformed.xyz *= 1.0 - min(posLength * 0.1, 1.0);

	// rotation
	vec3 direction = normalize(positionData.xyz - prevPositionData.xyz);
	vec4 quaternion = getRotationQuaternion(direction, vec3(0.0, 1.0, 0.0));
	transformed.xyz = applyQuaternionToVector( quaternion, transformed.xyz );

	// position
	transformed.xyz += positionData.xyz;

    // vColor = vec4(0.0);
	// vColor.a = 1.0 - (posLength / 15.0);

    return transformed;

}

#pragma glslify: export(linePosition)