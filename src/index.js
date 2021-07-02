"use strict";

const loadMap = require("./loadMap");
const twgl = require("twgl.js");
const mat3 = require("gl-matrix/mat3");
const createDrawing = require("./renderer");
const initShapes = require("./shapes");
const initVizCtrl = require("./pathviz");

const quadtree = require("d3-quadtree").quadtree;
const aStar = require("ngraph.path").aStar;

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl");
const shapes = initShapes(gl);

const scene = createDrawing(gl);
scene.draw();

// GET MAP DATA
let nodes;
let edges;
let graph;
loadMap("toronto", updateLoadingText)
  .then((res) => {
    nodes = res.nodes;
    edges = res.edges;
    graph = res.mapGraph;
    main();
  })

let sliceNum = 605000;
let ind = 0;
let controller;

function main(){
  // TODO: this, but properly (async for-loop?)
  updateLoadingText({message: "Creating Quadtree", completed: 14});
  
  // **TEST**
  controller = initVizCtrl(graph, scene, shapes);

  // initialize quadtree
  graph.qt = quadtree()
    .x(n => {
      return n.data.x; 
    })
    .y(n => {
      return n.data.y; 
    });

  graph.forEachNode(function(node) {
    graph.qt.add(node);
  });

  // TODO: this, but properly (async for-loop?)
  updateLoadingText({message: "Creating Quadtree", completed: 100});
  
  document.getElementById("overlay").style.display = "none";
  // draw map
  let color = [0.8, 0.8, 0.8, 1.0];
  scene.addObject(nodes, edges, { color: color, type: gl.LINES, layer: "base" });

  attachHandlers();

  //testRender();
  requestAnimationFrame(scene.draw);
}

function testRender() {
  //scene.updateObject(nodes, edges.slice(sliceNum), ind); // not supported
  scene.draw();
  sliceNum -= 1000;
  if (sliceNum > 0) {
    requestAnimationFrame(testRender);
  } else {
    return;
  }
}

function updateLoadingText(progress) {
  let msg = progress.message;
  let pct = progress.completed;
  console.log(pct);
  document.getElementById("progress").innerHTML = `${msg}: ${pct}%`;
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
    const pos = transformPoint(
        startInvViewProjMat,
        getClipSpaceMousePosition(e));
    
    controller.setNode(pos, name);
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
