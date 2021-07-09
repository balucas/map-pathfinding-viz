"use strict";

const loadMap = require("./loadMap");
const mat3 = require("gl-matrix/mat3");
const createDrawing = require("./renderer");
const initShapes = require("./shapes");
const initVizCtrl = require("./pathviz");
const twgl = require("twgl.js");

const colors = require("./theme").default;

const canvas = document.createElement("canvas");
const progressText = document.getElementById("progress");
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl");
const shapes = initShapes(gl);

const scene = createDrawing(gl);
scene.draw();

let cityName, algoName;

// WebGL map data
let nodes;
let edges;

// Pathfinding 
let graph;
let controller;

let handlers;

const cityDropdown = document.getElementById("city");
const algoDropdown = document.getElementById("algo");

cityDropdown.onchange = (e) => {
  reset();
  init();
}

algoDropdown.onchange = (e) => {
  algoName = algoDropdown.value;
  controller = initVizCtrl(gl, graph, nodes, scene, shapes, algoName);
  scene.clearLayer("mid");
  scene.clearLayer("top");
  scene.draw();
  handlers.reset();
  handlers = attachHandlers();
}

init();

function init(){
  // map
  cityName = cityDropdown.value;
  algoName = algoDropdown.value;

  document.getElementById("overlay").style.display = "";
  document.getElementById("panel").style.display = "none";
  loadMap(cityName, updateLoadingText)
    .then((res) => {
      nodes = res.nodes;
      edges = res.edges;
      graph = res.mapGraph;
    })
    .then( () => {
      controller = initVizCtrl(gl, graph, nodes, scene, shapes, algoName);
      document.getElementById("overlay").style.display = "none";
      document.getElementById("panel").style.display = "block";
      // draw map
      scene.addObject(nodes, edges, {
         color: colors.baseMap, 
         type: gl.LINES, 
         layer: "base",
        });
      
      handlers = attachHandlers();
      scene.draw();
    })
}

function reset() {
  handlers.reset();
  handlers = {};
  controller = {};
  scene.clearLayer("base"); 
  scene.clearLayer("mid"); 
  scene.clearLayer("top"); 
  scene.camera.x = -10000;
  scene.camera.y = -5000;
  scene.camera.zoom = 0.10;
  document.getElementById("message").textContent = "";
}

function updateLoadingText(progress) {
  let msg = progress.message;
  let pct = progress.completed;
  progressText.textContent = `${msg}: ${pct}%`;
}

function attachHandlers() {
  window.addEventListener('resize', handleResize);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('wheel', handleMouseWheel);

  // handle window resize
  function handleResize(e) {
    scene.draw();
  }
  
  let camera = scene.camera;
  let viewProjectionMat = scene.viewProjectionMat;
  let updateViewProjection = scene.updateViewProjection;
  let startInvViewProjMat = mat3.create();
  let startCamera;
  let startPos;
  let startClipPos;
  
  let moved = false;
  
  function handleMouseDown(e) {
    e.preventDefault();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  
    mat3.invert(startInvViewProjMat, viewProjectionMat);
    
    startCamera = Object.assign({}, camera);
    startClipPos = getClipSpaceMousePosition(e);
    startPos = transformPoint(
        startInvViewProjMat,
        startClipPos);
    scene.draw();
  };

  function handleMouseWheel(e) {
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
  
  var name = "start";
  function handleClick(e) {
    debugger;
    const pos = transformPoint(
        startInvViewProjMat,
        getClipSpaceMousePosition(e));
    
    if (controller.setNode(pos, name))
      name = name == "start" ? "target" : "start";
  }
  
  function moveCamera(e) {
    const pos = transformPoint(
        startInvViewProjMat,
        getClipSpaceMousePosition(e));
    
    camera.x = startCamera.x + startPos[0] - pos[0];
    camera.y = startCamera.y + startPos[1] - pos[1];
    scene.draw();
  }
  
  function transformPoint(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];
    return [
      (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
      (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
    ];
  }
  
  return {
    reset() {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('wheel', handleMouseWheel);
    },
    name
  };
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
