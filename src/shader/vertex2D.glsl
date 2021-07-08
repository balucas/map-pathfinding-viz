precision mediump float;

attribute vec2 position;
attribute vec2 normal;
attribute float miter; 
uniform mat3 u_matrix;
uniform float u_thickness;
varying float edge;

void main() {
  edge = sign(miter);
  vec2 pointPos = position.xy + vec2(normal * u_thickness * miter);
  gl_Position = vec4((u_matrix * vec3(pointPos, 1)).xy, 0.0, 1.0);
  //vec2 pointPos = (u_matrix * vec3(position, 1)).xy;
  //gl_Position = vec4(pointPos.xy + vec2(normal * 0.02 * miter), 0.0, 1.0);
}
