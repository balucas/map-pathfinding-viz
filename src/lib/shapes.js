const colors = require("./theme").default;

module.exports = function (gl) {
  return {
    target: {
      elements: [
        {
          verts: primitives.pin.verts,
          indices: primitives.pin.indices,
          color: colors.targetPin,
          scale: 5,
          drawType: gl.TRIANGLE_FAN
        },
        {
          verts: primitives.pin1.verts,
          indices: primitives.pin1.indices,
          color: colors.targetPin1,
          scale: 4.3,
          drawType: gl.TRIANGLE_FAN
        },
      ],
    },
    start: {
      elements: [
        {
          verts: primitives.circle.verts,
          indices: primitives.circle.indices,
          color: colors.startPin,
          scale: 5,
          drawType: gl.TRIANGLE_FAN 
        },
        {
          verts: primitives.circle.verts,
          indices: primitives.circle.indices,
          color: colors.startPin1,
          scale: 4.5,
          drawType: gl.TRIANGLE_FAN 
        },
        {
          verts: primitives.circle.verts,
          indices: primitives.circle.indices,
          color: colors.startPin2,
          scale: 2,
          drawType: gl.TRIANGLE_FAN 
        },
      ],
    }
  }
}

const primitives = {
  circle: {
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
  },
  pin: {
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
  },
  pin1: {
    verts: [0, -8,
            -2.6, -7.0,
            -2.6, -8,
            -2.0, -9.5,
            -0.7, -10.4,
            0.7, -10.4,
            2.0, -9.5,
            2.6, -8,
            2.6, -7.0,
            0, -1],
    indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1],
  }
}