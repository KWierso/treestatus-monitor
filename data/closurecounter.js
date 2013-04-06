document.getElementById("tree").textContent = self.options.tree;


self.port.on("data", function(data) {
  document.getElementById("closuretime").textContent = data.closure;
  document.getElementById("totaltime").textContent = data.total;
  document.getElementById("tree").className = data.currentStatus;
});