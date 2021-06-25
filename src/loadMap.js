const request = require("./request");
const graph = require("./graph");
const endpoint = "./data/";

module.exports = function(name, progress) {
  let nodes;
  let edges;
  let mapGraph = graph();
  
  return loadNodes()
          .then((res) => {
            setNodeCoordinates(res);
            return loadEdges();
          })
          .then((res) => {
            setEdgeLinks(res);
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
    for (let i = 0; i < nodes.length / 2; ++i) {
      mapGraph.addNode(nodes[i*2], nodes[i*2 + 1]);
    }
    console.log(mapGraph.nodes.length);
  }
  
  function setEdgeLinks(buffer) {
    edges = new Int32Array(buffer);
    for (let i = 0; i < edges.length / 2; ++i) {
      edges[i*2] -= 1;
      edges[i*2 + 1] -= 1;
      mapGraph.addLink([edges[i*2], edges[i*2 + 1]]);
    }
  }

  function reportProgress(msg) {
    return function(e) {
      progress.message = msg;
      progress.completed = Math.round(e.percent * 100)
      console.log(progress.message + " " + progress.completed);
    } 
  }
}