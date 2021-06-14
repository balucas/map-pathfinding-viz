"use strict";

const glsl = require("glslify");
const twgl = require("twgl.js");
const createDrawing = require("./renderer");
const canvas = document.createElement("canvas");

document.body.appendChild(canvas);

const gl = canvas.getContext("webgl");

const test = createDrawing(gl);

const request = require("./request");
let toronto;
request("/data/toronto.json", {
  responseType: 'json',
  progress: (x) => {console.log(x.percent)} 
})
  .then((res) => {
    toronto = res;
  });

function render(time) {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  test.draw(); 
}

let mapData = {
  nodes: [
    { x: 0.0, y:0.0},
    { x: 100.0, y: 50.0},
    { x: 50.0, y: 100.0}
  ],
  edges: [[0,1],[1,2],[2,0]]
}

mapData = toronto;

let nodes = mapData.nodes;
let edges = mapData.edges;
let verts = [];
let indices = [];

nodes.forEach(el => {
  verts.push(el.x);
  verts.push(el.y);
});

edges.forEach(el => {
  indices.push(el[0]);
  indices.push(el[1]);
  
});

let color = [1.0, 1.0, 1.0, 1];

test.addObject(verts, indices, color);

requestAnimationFrame(render);

document.addEventListener("click", e => {
  console.log("clicked!");
})