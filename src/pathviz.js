const d3 = require("d3-quadtree");
const aStar = require("ngraph.path").aStar;
const colors = require("./theme").default;

module.exports = function(gl, graph, verts, scene, shapes) {
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
  var searchDrawing;
  
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
    
    if (name == "target") startFind();
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
  
  function startFind() {
    if (!STNodes.start || !STNodes.target) {
      console.error("Missing start/target node");
      return;
    }
    
    let a = STNodes.start;
    let b = STNodes.target;
    const searchData = pathfinder.find(a.node.id, b.node.id);
    const animData = new Uint32Array(searchData.visited.reverse());
    searchDrawing = scene.addObject(verts, animData, {
      color: colors.searchPath,
      type: gl.LINES,
      layer: "mid",
    });

    var offset = animData.length *  4;
    animateSearch();

    function animateSearch() {
      offset = offset < 0 ? 0 : offset;
      scene.updateIndexOffset(animData, offset, searchDrawing);
      scene.draw();
      
      offset -= 100 * 4;
      if (offset != 0) {
        requestAnimationFrame(animateSearch);
      } else {
        drawPath();
      }
    }
    
    function drawPath() {
       
    }
  }
  
  
  return {
    setNode,
    startFind
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