"use strict";

const glsl = require("glslify");
const twgl = require("twgl.js");

const vertexShader = glsl.file("./shader/vertex.glsl");
const fragmentShader = glsl.file("./shader/fragment.glsl");

module.exports = function(gl) {
  const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  const objects = [];
  
  twgl.addExtensionsToContext(gl);

  function addObject(verts, inds, color) {
    const bufferData = {
      position: { numComponents: 2, data: new Float32Array(verts) },
      indices:  { numComponents: 2, data: new Uint32Array(inds) }
    };
    const uniforms = {
      u_defaultColor: color
    }

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, bufferData);
    
    const obj = {
      bufferInfo: bufferInfo,
      uniforms: uniforms
    };
    
    objects.push(obj);
  }
  
  // Init/Re-init BufferInfo and set
  function updateData() {
    bufferInfo = twgl.createBufferInfoFromArrays(gl, bufferData);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  }
  
  return {
    updateData,
    addObject,

    draw() {
      if (!objects.length) {
        console.error("no objects to draw!");
        return;
      }

      gl.clearColor(0.0, 0.06, 0.21, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      objects.forEach(obj => {
        console.log(obj);
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo);
        twgl.setUniforms(programInfo, obj.uniforms);
        twgl.drawBufferInfo(gl, obj.bufferInfo, gl.LINES);
      })

    }
  }
}