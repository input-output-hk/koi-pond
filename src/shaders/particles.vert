#pragma glslify: linePosition = require('./linePosition')

attribute float positionUVS;
attribute float positionUVT;

uniform sampler2D positionTexture;
uniform sampler2D prevPositionTexture;

void main() {

	#include <begin_vertex>

	linePosition(positionUVS, positionUVT, positionTexture, prevPositionTexture, transformed);

	#include <project_vertex>

}
