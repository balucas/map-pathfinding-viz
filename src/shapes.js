module.exports = function (gl) {
  return {
    marker: {
      verts: [0, -7,
              -2.6, -6.0,
              -2.6, -7,
              -2.0, -8.5,
              -0.7, -9.4,
              0.7, -9.4,
              2.0, -8.5,
              2.6, -7,
              2.6, -6.0,
              0, 0],
      indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1],
      drawType: gl.TRIANGLE_FAN
    },
  }
}