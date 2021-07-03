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
    const [x, y] = [node.data.x, node.data.y];

    if (!STNodes[name]) {
      STNodes[name] = {
        node: node,
        sceneObjs: initPin(x, y, name) 
      }
    } 
    
    STNodes[name].node = node;
    updatePin(x, y, name);
    scene.draw();
  }
  
  function initPin(x, y, name) {
    const elements = shapes[name].elements;
    const sceneObjs = [];
    
    elements.forEach(el => {
      let transforms = {
        x: x,
        y: y,
        scale: el.scale,
        zoom: false 
      }
      
      sceneObjs.push(
        scene.addObject(el.verts, el.indices, {
          color: el.color,
          type: el.drawType,
          layer: "top",
          transforms: transforms
        })
      )
    });

    return sceneObjs;
  }
  
  function updatePin(x, y, name) {
    STNodes[name].sceneObjs.forEach(obj => {
      obj.transforms.x = x;
      obj.transforms.y = y;
    });
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