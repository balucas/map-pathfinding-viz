precision mediump float;

varying vec4 v_color;
attribute vec2 position;
attribute vec4 color;
uniform vec4 u_defaultColor;

void main() {
  gl_Position = vec4(position, 0, 1);
  v_color = u_defaultColor;
  //v_color = vec4(0, 1, 0, 1);
}