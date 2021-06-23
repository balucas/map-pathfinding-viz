const request = require("./request");
const endpoint = "./data/";

module.exports = function(name, progress) {
  let nodes;
  let edges;
  
  return loadNodes()
          .then((res) => {
            setNodeCoordinates(res);
            return loadEdges();
          })
          .then((res) => {
            setEdgeLinks(res);
            return {
              nodes, edges
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
    // TODO: add to graph structure
  }
  
  function setEdgeLinks(buffer) {
    edges = new Int32Array(buffer);
    edges.forEach((v,i) => {
      edges[i] -= 1;
    });
  }

  function reportProgress(msg) {
    return function(e) {
      progress.message = msg;
      progress.completed = Math.round(e.percent * 100)
      console.log(progress.message + " " + progress.completed);
    } 
  }
}