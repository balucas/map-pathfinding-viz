"use strict";

const glsl = require("glslify");
const twgl = require("twgl.js");
const mat3 = require("gl-matrix/mat3");

const vertexShader = glsl.file("./shader/vertex.glsl");
const vertexShader2D = glsl.file("./shader/vertex2D.glsl");
const fragmentShader = glsl.file("./shader/fragment.glsl");
const getNormals = require("polyline-normals");

const colors = require("./theme").default;

module.exports = function(gl) {
  const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  const programInfo2D = twgl.createProgramInfo(gl, [vertexShader2D, fragmentShader]);
  const resolution = [gl.canvas.width, gl.canvas.height]; 
  const viewProjectionMat = mat3.create();
  const sceneLayers = { base: [], mid: [], top: [] };

  const camera = {
    x: -10000,
    y: -5000,
    zoom: 0.10
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
    props.offset = props.offset ? props.offset : 0;

    const bufferData = {
      position: { numComponents: 2, data: new Float32Array(verts) },
      indices:  { numComponents: 2, data: new Uint32Array(inds) }
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, bufferData);
    const obj = {
      bufferInfo: bufferInfo,
      programInfo: programInfo,
      color: props.color,
      drawType: props.type,
      transforms: props.transforms,
      offset: props.offset
    };
    
    if (typeof props.layerIndex !== "undefined") {
      sceneLayers[props.layer] = obj;
    } else {
      sceneLayers[props.layer].push(obj);
    }
    return obj;
  }
  
  function add2DLine(path, color) {
    let tags = getNormals(path, false);
    let normals = dup(tags.map(x => x[0]));
    let miters = dup(tags.map(x => x[1]), true);
    let positions = dup(path);
    let indices = createIndices(path.length - 1);
    
    const bufferData = {
      position: { numComponents: 2, data: new Float32Array(pack(positions)) },
      normal:   { numComponents: 2, data: new Float32Array(pack(normals)) },
      miter:    { numComponents: 1, data: new Float32Array(pack(miters)) },
      indices:  { data: new Uint32Array(indices) }
    }
    
    debugger;
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, bufferData);
    const obj = {
      bufferInfo: bufferInfo,
      programInfo: programInfo2D,
      color: color,
      drawType: gl.TRIANGLES,
      transforms: { x: 0, y: 0, scale: 1, zoom: true },
      offset: 0
    };
    
    sceneLayers.mid.push(obj);
    return obj;
    
    function dup(nestedArr, mirror) {
      var out = [];
      nestedArr.forEach(x => {
        let x1 = mirror ? -x : x;
        out.push(x1,x);
      })
      return out;
    }

    function createIndices(length) {
      let indices = new Uint32Array(length * 6)
      let c = 0, index = 0
      for (let j=0; j<length; j++) {
        let i = index
        indices[c++] = i + 0 
        indices[c++] = i + 1 
        indices[c++] = i + 2 
        indices[c++] = i + 2 
        indices[c++] = i + 1 
        indices[c++] = i + 3 
        index += 2
      }
      return indices
    }

    function pack(arr, type) {
      type = type || 'float32'

      if (!arr[0] || !arr[0].length) {
        return arr
      }

      var dim = arr[0].length
      var out = new Float32Array(arr.length * dim)
      var k = 0

      for (var i = 0; i < arr.length; i++)
      for (var j = 0; j < dim; j++) {
        out[k++] = arr[i][j]
      }

      return out
    }
  }
  
  function updateIndexOffset(inds, offset, obj) {
    const bufferData = {
      indices:  { numComponents: 2, data: new Uint32Array(inds.buffer, offset) }
    };
    obj.bufferInfo = twgl.createBufferInfoFromArrays(gl, bufferData, obj.bufferInfo);
  }
  
  function drawObject(obj) {
    const uniforms = {
      u_color: obj.color,
      u_matrix: computeMatrixUniform(obj.transforms),
      u_thickness: 3/camera.zoom
    }
    gl.useProgram(obj.programInfo.program);
    twgl.setBuffersAndAttributes(gl, obj.programInfo, obj.bufferInfo);
    twgl.setUniforms(obj.programInfo, uniforms);
    twgl.drawBufferInfo(gl, obj.bufferInfo, obj.drawType, obj.bufferInfo.numElements, obj.offset);
  }
  
  function clearLayer(layer) {
    sceneLayers[layer].length = 0;
  }
  
  return {
    addObject,
    add2DLine,
    updateIndexOffset,
    updateViewProjection,
    clearLayer,
    camera,
    viewProjectionMat,

    draw() {
      resolution[0] = gl.canvas.width; 
      resolution[1] = gl.canvas.height; 
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(...colors.background);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      updateViewProjection();
      
      sceneLayers.base.forEach(drawObject);
      sceneLayers.mid.forEach(drawObject);
      sceneLayers.top.forEach(drawObject);
    }
  }
}