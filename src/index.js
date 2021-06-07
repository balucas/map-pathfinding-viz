"use strict";

const glsl = require("glslify");
const twgl = require("twgl.js");
const createDrawing = require("./renderer");
const toronto = require("../static/toronto.json");

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const gl = canvas.getContext("webgl");

const test = createDrawing(gl);

function render(time) {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  test.draw();
}

let nodes = toronto.nodes;
let edges = toronto.edges;
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
//test.addObject(verts, indices.slice(202, 702), [1.0,0.0,0,1]);

// debug axes 
//test.addObject([0,1,0,-1,-1,0,1,0], [0,1,2,3], [0.5,0.5,0.8,1]);
requestAnimationFrame(render);

document.addEventListener("click", e => {
  console.log("clicked!");
})