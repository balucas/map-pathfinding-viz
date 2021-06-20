precision mediump float;

attribute vec2 position;

uniform mat3 u_matrix;
uniform vec2 u_resolution;

void main() {
  gl_Position = vec4((u_matrix * vec3(position, 1)).xy, 0, 1);
}