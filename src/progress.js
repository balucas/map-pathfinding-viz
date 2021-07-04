module.exports = progress;

function progress(element, data) {
  this.data = data;
  this.element = element;
  element.innerHTML = `${data.message} ${data.completed}%`;
}

progress.prototype.change = function(value) {
  this.data = value;
  this.element.innerHTML = `${data.message} ${data.completed}%`;
}