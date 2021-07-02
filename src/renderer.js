"use strict";

const glsl = require("glslify");
const twgl = require("twgl.js");
const mat3 = require("gl-matrix/mat3");

const vertexShader = glsl.file("./shader/vertex.glsl");
const fragmentShader = glsl.file("./shader/fragment.glsl");

module.exports = function(gl) {
  const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  const resolution = [gl.canvas.width, gl.canvas.height]; 
  const viewProjectionMat = mat3.create();
  const sceneLayers = { base: [], mid: [], top: [] };

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
    mat3.translate(cameraMat, cameraMat, [camera.x, camera.y]);
    mat3.scale(cameraMat, cameraMat, [zoomScale, zoomScale]);
    
    let viewMat = mat3.create();
    mat3.invert(viewMat, cameraMat);
    mat3.multiply(viewProjectionMat, viewProjectionMat, viewMat);
  }
  
  function computeMatrixUniform(transforms) {
    let mat = mat3.create();
    mat3.identity(mat);
    mat3.translate(mat, mat, [transforms.x, transforms.y]);
    mat3.scale(mat, mat, [transforms.scale, transforms.scale]);
    
    if (!transforms.zoom) {
      mat3.scale(mat, mat, [1/camera.zoom, 1/camera.zoom]);
    }
    
    mat3.multiply(mat, viewProjectionMat, mat);
    return mat;
  }

  function addObject(verts, inds, props) {
    props.transforms = props.transforms ? props.transforms : { x: 0, y: 0, scale: 1, zoom: true };
    props.layer = props.layer ? props.layer : "mid";

    const bufferData = {
      position: { numComponents: 2, data: new Float32Array(verts) },
      indices:  { numComponents: 2, data: new Uint32Array(inds) }
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, bufferData);
    const obj = {
      bufferInfo: bufferInfo,
      color: props.color,
      drawType: props.type,
      transforms: props.transforms
    };
    
    if (typeof props.layerIndex !== "undefined") {
      sceneLayers[props.layer] = obj;
    } else {
      sceneLayers[props.layer].push(obj);
    }
    return obj;
  }
  
  function drawObject(obj) {
    const uniforms = {
      u_color: obj.color,
      u_matrix: computeMatrixUniform(obj.transforms)
    }
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, obj.bufferInfo, obj.drawType);
  }
  
  return {
    addObject,
    updateViewProjection,
    camera,
    viewProjectionMat,

    draw() {
      resolution[0] = gl.canvas.width; 
      resolution[1] = gl.canvas.height; 
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0.0, 0.06, 0.21, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      updateViewProjection();
      
      sceneLayers.base.forEach(drawObject);
      sceneLayers.mid.forEach(drawObject);
      sceneLayers.top.forEach(drawObject);
    }
  }
}