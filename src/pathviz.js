const d3 = require("d3-quadtree");
const aStar = require("ngraph.path").aStar;

module.exports = function(graph, scene, shapes) {
  // init pathfinder
  const pathfinder = aStar(graph, {
    distance: pythagoreanDist,
    heuristic: pythagoreanDist
  });
  
  // init quadtree
  const quadtree = d3.quadtree()
    .x(n => {
      return n.data.x; 
    })
    .y(n => {
      return n.data.y; 
    });

  graph.forEachNode(function(node) {
    quadtree.add(node);
  });
  
  const STNodes = {};
  
  function setNode(pos, name) {
    const node = quadtree.find(pos[0], pos[1]); 
    const transforms = {
      x: node.data.x,
      y: node.data.y,
      scale: shapes[name].scale,
      zoom: false
    };

    if (!STNodes[name]) {
      STNodes[name] = {
        node: node,
        sceneObj: scene.addObject(shapes[name].verts, shapes[name].indices, {
          color: shapes[name].color,
          type: shapes[name].drawType,
          layer: "top",
        })
      }
    } 
    
    STNodes[name].node = node;
    STNodes[name].sceneObj.transforms = transforms;
    scene.draw();
  }
  
  return {
    setNode
  }
}

const manhattanDist = (a, b) => {
  let dx = a.data.x - b.data.x;
  let dy = a.data.y - b.data.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const pythagoreanDist = (a, b) => {
  let dx = a.data.x - b.data.x;
  let dy = a.data.y - b.data.y;
  return Math.sqrt(dx * dx + dy * dy);
}