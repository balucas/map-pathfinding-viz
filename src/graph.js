module.exports = function() {
  const nodes = [];
  
  function addNode(x, y) {
    const node = {
      x: x,
      y: y,
      links: []
    }
    nodes.push(node);
  }
  
  function addLink(link) {
    const [a, b] = link;
    nodes[a].links.push(nodes[b]);
    nodes[b].links.push(nodes[a]);
  }
  
  return {
    nodes,
    addNode,
    addLink,
  }
}