const request = require("./request");
const createGraph = require("ngraph.graph");
const endpoint = "./data/";
const asyncFor = require("rafor");

module.exports = function(name, progress) {
  let nodes;
  let edges;
  let mapGraph = createGraph();

  return loadNodes()
          .then(setNodeCoordinates)
          .then(loadEdges)
          .then(setEdgeLinks)
          .then(() => {
            return {
              nodes, edges, mapGraph
            }
          })

  function loadNodes() {
    return request(endpoint + `${name}.co.bin`, {
      responseType: "arraybuffer",
      progress: reportProgress("Loading map nodes")
    })
  }
  
  function loadEdges() {
    return request(endpoint + `${name}.gr.bin`, {
      responseType: "arraybuffer",
      progress: reportProgress("Loading map edges")
    })
  }
  
  function setNodeCoordinates(buffer) {
    nodes = new Int32Array(buffer);   
    // add to graph structure
    return new Promise((resolve) => {
      asyncFor(nodes, addNode, () => {
        resolve();
      }, {
        step: 2,
        probeElements: 1000
      })
    })
  }
  
  function addNode(el, index, array) {
    mapGraph.addNode(Math.floor(index / 2), {
      x: array[index], 
      y: array[index + 1]
    });
    progress({ 
      message: "Processing nodes", 
      completed: Math.round(100 * index / (array.length - 1))
    })
  }
  
  function setEdgeLinks(buffer) {
    edges = new Int32Array(buffer);
    // add to graph structure
    return new Promise((resolve) => {
      asyncFor(edges, addLink, () => {
        resolve();
      }, {
        step: 2,
        probeElements: 1000
      })
    })
  }
  
  function addLink(el, index, array) {
    array[index] -= 1;
    array[index + 1] -= 1;
    mapGraph.addLink(array[index], array[index + 1]);
    progress({ 
      message: "Processing edges", 
      completed: Math.round(100 * index / (array.length - 1))
    })
  }

  function reportProgress(msg) {
    return function(e) {
      let prog = {}
      prog.message = msg;
      prog.completed = Math.round(e.percent * 100);
      progress(prog);
    } 
  }
}