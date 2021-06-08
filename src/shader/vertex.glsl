precision mediump float;

attribute vec2 position;

uniform mat3 u_matrix;
uniform vec2 u_resolution;

void main() {
  vec2 newPos = (u_matrix * vec3(position, 1)).xy;

  vec2 zeroToOne = position.xy / u_resolution;

  vec2 zeroToTwo = zeroToOne * 2.0;

  vec2 clipSpace = zeroToTwo - 1.0;
  
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}