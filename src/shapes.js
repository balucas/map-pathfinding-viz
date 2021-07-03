const colors = require("./theme").default;

module.exports = function (gl) {
  return {
    target: {
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
      color: colors.targetPin,
      scale: 5,
      drawType: gl.TRIANGLE_FAN
    },
    start: {
      verts: [0, 0,
              0, -3.0,
              1.04, -2.814,
              2.1213, -2.1213,
              2.814, -1.04,
              3.0, 0,
              2.814, 1.04, 
              2.1213, 2.1213,
              1.04, 2.814, 
              0, 3.0,
              -1.04, 2.814,
              -2.1213, 2.1213,
              -2.814, 1.04,
              -3.0, -0,
              -2.814, -1.04, 
              -2.1213, -2.1213,
              -1.04, -2.814],
      indices: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,1],
      color: colors.startPin,
      scale: 4,
      drawType: gl.TRIANGLE_FAN 
    }
  }
}