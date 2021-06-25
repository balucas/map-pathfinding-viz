module.exports = function (gl) {
  return {
    marker: {
      verts: [0, -10,
              -2.6, -9.0,
              -2.6, -10,
              -2.0, -11.5,
              -0.7, -12.4,
              0.7, -12.4,
              2.0, -11.5,
              2.6, -10,
              2.6, -9.0,
              0, 0],
      indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1],
      drawType: gl.TRIANGLE_FAN
    },
  }
}