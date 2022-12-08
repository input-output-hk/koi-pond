varying vec3 vPickerColor;
varying vec4 vColor;

void main() {
   gl_FragColor = vec4( vPickerColor, min(vColor.a, 1.0));
}
