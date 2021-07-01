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
    nodes[a].links.push(b);
    nodes[b].links.push(a);
  }
  
  return {
    nodes,
    addNode,
    addLink,
  }
}