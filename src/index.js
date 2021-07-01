"use strict";

const loadMap = require("./loadMap");
const twgl = require("twgl.js");
const mat3 = require("gl-matrix/mat3");
const quadtree = require("d3-quadtree").quadtree;
const createDrawing = require("./renderer");
const canvas = document.createElement("canvas");

document.body.appendChild(canvas);

const gl = canvas.getContext("webgl");
const shapes = require("./shapes")(gl);

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

function main(){
  // TODO: this, but properly (async for-loop?)
  updateLoadingText({message: "Creating Quadtree", completed: 14});

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
  scene.addObject(nodes, edges, color, gl.LINES);

  attachHandlers();

  //testRender();
  requestAnimationFrame(scene.draw);
}

function testRender() {
  ind = scene.addObject(nodes, edges.slice(sliceNum), [0.2235, 1, 0.0784, 1], gl.LINES);
  scene.draw();
  sliceNum -= 1000;
  if (sliceNum > 0) {
    scene.removeObject(ind);
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
    const closest = graph.qt.find(pos[0], pos[1]);
    let marker = shapes.marker;
    let transforms = {
      x: closest.data.x,
      y: closest.data.y,
      scale: 5,
      zoom: false
    }
    scene.addObject(marker.verts, marker.indices, [0.85,0,0,1], marker.drawType, transforms);
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
