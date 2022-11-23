vec4 getRotationQuaternion(vec3 direction, vec3 up) {
	vec3 z = normalize(direction);
	vec3 x = cross(up, z);
	vec3 y = cross(z, x);
	return normalize(
		vec4(
			y.z - z.y,
			z.x - x.z,
			x.y - y.x,
			x.x + y.y + z.z + 1.0
		)
	);
}

#pragma glslify: export(getRotationQuaternion)