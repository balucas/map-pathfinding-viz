"use strict";

const glsl = require("glslify");
const twgl = require("twgl.js");
const mat3 = require("gl-matrix/mat3");

const vertexShader = glsl.file("./shader/vertex.glsl");
const fragmentShader = glsl.file("./shader/fragment.glsl");

module.exports = function(gl) {
  const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  const objects = [];
  const resolution = [gl.canvas.width, gl.canvas.height]; 
  const viewProjectionMat = mat3.create();
  const camera = {
    x: -33948,
    y: -17689,
    zoom: 0.0271311
   }

  twgl.addExtensionsToContext(gl);
  
  function updateViewProjection() {
    mat3.projection(viewProjectionMat, gl.canvas.width, gl.canvas.height);
    
    // make camera matrix
    const zoomScale = 1 / camera.zoom;
    let cameraMat = mat3.create(); 
    mat3.identity(cameraMat);
    mat3.translate(cameraMat, cameraMat, [camera.x, camera.y]);
    mat3.scale(cameraMat, cameraMat, [zoomScale, zoomScale]);
    
    let viewMat = mat3.create();
    mat3.invert(viewMat, cameraMat);
    mat3.multiply(viewProjectionMat, viewProjectionMat, viewMat);
  }

  function addObject(verts, inds, color) {
    const bufferData = {
      position: { numComponents: 2, data: new Float32Array(verts) },
      indices:  { numComponents: 2, data: new Uint32Array(inds) }
    };

    const uniforms = {
      u_defaultColor: color,
      u_matrix: viewProjectionMat,
      u_resolution: resolution
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
    updateViewProjection,
    addObject,
    camera,
    viewProjectionMat,

    draw() {
      if (!objects.length) {
        console.error("no objects to draw!");
        return;
      }
      resolution[0] = gl.canvas.width; 
      resolution[1] = gl.canvas.height; 

      gl.clearColor(0.0, 0.06, 0.21, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      updateViewProjection();
      
      objects.forEach(obj => {
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo);
        twgl.setUniforms(programInfo, obj.uniforms);
        twgl.drawBufferInfo(gl, obj.bufferInfo, gl.LINES);
      })

    }
  }
}