"use strict";

const loadMap = require("./loadMap");
const twgl = require("twgl.js");
const mat3 = require("gl-matrix/mat3");
const createDrawing = require("./renderer");
const canvas = document.createElement("canvas");

document.body.appendChild(canvas);

const gl = canvas.getContext("webgl");

const scene = createDrawing(gl);

// GET MAP DATA
let progress = {
  message: "",
  completed: 0
}
let nodes;
let edges;
loadMap("toronto", progress)
  .then((res) => {
    nodes = res.nodes;
    edges = res.edges;
    main();
  })

function render(time) {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  scene.draw(); 
}

function main(){
  let color = [1.0, 1.0, 1.0, 1.0];

  scene.addObject(nodes, edges, color, gl.LINES);

  attachHandlers();

  requestAnimationFrame(render);
}

function attachHandlers() {
  
  // handle window resize
  function handleResize(e) {
    scene.draw();
  }
  
  window.addEventListener('resize', handleResize);
  
  let camera = scene.camera;
  let viewProjectionMat = scene.viewProjectionMat;
  let updateViewProjection = scene.updateViewProjection;
  let startInvViewProjMat = mat3.create();
  let startCamera;
  let startPos;
  let startClipPos;
  let startMousePos;
  
  let moved = false;
  
  function moveCamera(e) {
    const pos = transformPoint(
        startInvViewProjMat,
        getClipSpaceMousePosition(e));
    
    camera.x = startCamera.x + startPos[0] - pos[0];
    camera.y = startCamera.y + startPos[1] - pos[1];
    scene.draw();
  }
  
  function handleMouseMove(e) {
    moved = true;
    moveCamera(e);
  }
  
  function handleMouseUp(e) {
    scene.draw();
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    // check if mouse click (not drag)
    if (!moved) {
      console.log("mouse tap!");
      handleClick(e);
    }
    moved = false;
  }
  
  function handleClick(e) {
    const pos = transformPoint(
        startInvViewProjMat,
        getClipSpaceMousePosition(e));
    let mark = [0, 0,
                -5, -25,
                5, -25,
                0, -30];
    let indices = [0,1,2,2,3,1];
    
    let transforms = {
      x: pos[0],
      y: pos[1],
      scale: 2,
      zoom: false
    }
    
    scene.addObject(mark, indices, [0.8117,1,0.0157,1], gl.TRIANGLES, transforms);
    scene.draw();
  }
  
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  
    mat3.invert(startInvViewProjMat, viewProjectionMat);
    
    startCamera = Object.assign({}, camera);
    startClipPos = getClipSpaceMousePosition(e);
    startPos = transformPoint(
        startInvViewProjMat,
        startClipPos);
    startMousePos = [e.clientX, e.clientY];
    scene.draw();
  });
  
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();  
    const [clipX, clipY] = getClipSpaceMousePosition(e);
    // position before zooming
    let temp = mat3.create();
    mat3.invert(temp, viewProjectionMat); 
    const [preZoomX, preZoomY] = transformPoint(
        temp,
        [clipX, clipY]);
      
    // multiply the wheel movement by the current zoom level
    // so we zoom less when zoomed in and more when zoomed out
    const newZoom = camera.zoom * Math.pow(2, e.deltaY * -0.01);
    camera.zoom = Math.max(0.02, Math.min(100, newZoom));
    
    updateViewProjection();
    
    // position after zooming
    mat3.invert(temp, viewProjectionMat); 
    const [postZoomX, postZoomY] = transformPoint(
        temp,
        [clipX, clipY]);
  
    // camera needs to be moved the difference of before and after
    camera.x += preZoomX - postZoomX;
    camera.y += preZoomY - postZoomY;  
    
    scene.draw();
  });
  
  function transformPoint(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];
    return [
      (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
      (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
    ];
  }
}

function getClipSpaceMousePosition(e) {
  // get canvas relative css position
  const rect = canvas.getBoundingClientRect();
  const cssX = e.clientX - rect.left;
  const cssY = e.clientY - rect.top;
  
  // get normalized 0 to 1 position across and down canvas
  const normalizedX = cssX / canvas.clientWidth;
  const normalizedY = cssY / canvas.clientHeight;

  // convert to clip space
  const clipX = normalizedX *  2 - 1;
  const clipY = normalizedY * -2 + 1;
  
  return [clipX, clipY];
}
