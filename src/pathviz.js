const d3 = require("d3-quadtree");
const getNormals = require("polyline-normals");
const ngraphpath = require("ngraph.path");
const colors = require("./lib/theme").default;

module.exports = function(gl, graph, verts, scene, shapes) {
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

  var pathfinder, searchDrawing;
  var isSearching = false;
  
  function initPathfinder(algo) {
    pathfinder = ngraphpath[algo](graph, {
      distance: pythagoreanDist,
      heuristic: pythagoreanDist
    });
  }
  
  function reset() {
    delete(STNodes.start); 
    delete(STNodes.target); 
    scene.clearLayer("mid");
    scene.clearLayer("top");
  }
  function setNode(pos, name) {
    document.getElementById("message").textContent = ""
    if (isSearching) return false;
    if (name == "start") reset();

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
    return true;
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
    isSearching = true;
    if (!STNodes.start || !STNodes.target) {
      console.error("Missing start/target node");
      isSearching = false;
      return;
    }
    
    disableOptions(true);

    let a = STNodes.start;
    let b = STNodes.target;
    const searchData = pathfinder.find(a.node.id, b.node.id);
    if (searchData instanceof Array) {
      // No path found!
      document.getElementById("message").textContent = "No path found!"
      isSearching = false;
      disableOptions(false);
      return;
    }

    const animData = new Uint32Array(searchData.visited.reverse());
    const pathData = new Uint32Array(searchData.path.map(node => node.id))
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
      
      if (offset != 0) {
        offset -= 100 * 4;
        requestAnimationFrame(animateSearch);
      } else {
        drawPath();
        isSearching = false;
      }
    }
    
    function disableOptions(disabled) {
      document.getElementById("city").disabled = disabled;
      document.getElementById("algo").disabled = disabled;
    }
    
    function drawPath() {
      let pathNodes = []
      pathData.forEach(el => pathNodes.push([verts[el*2], verts[el*2 + 1]]));
      
      scene.add2DLine(pathNodes, colors.path);
      scene.draw();
      disableOptions(false);
    }
  }
  
  
  return {
    setNode,
    startFind,
    initPathfinder
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