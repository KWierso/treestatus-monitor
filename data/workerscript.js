var closures = document.getElementById("tableWrapper").getElementsByTagName("tbody")[0].children;
var text = "";

var statusChanges = [];
var previousStatus = "";
var firstClosed = "";

for (i=99;i>=0;i--) {
  let thisStatus = closures[i].children[2].textContent.trim();
  
  if(thisStatus == "closed" && firstClosed == "") {
    firstClosed = i;
  }
  
  if(thisStatus != previousStatus && previousStatus == "closed") {
    statusChanges.push(i);
  }
  
  previousStatus = thisStatus;
}

var closedTime = 0;

closedTime = closedTime + computeTime(closures[statusChanges[0]], closures[firstClosed]);
for(i in statusChanges) {
  try {
    closedTime = closedTime + computeTime(closures[statusChanges[parseInt(i)+1]], closures[statusChanges[i]-1]);
  } catch(e) {
  }
}

closedTime = closedTime / 1000 / 60 / 60 / 24;
closedTime = closedTime.toFixed(2);

var totalTime = computeTime(new Date(), closures[99]) / 1000 / 60 / 60 / 24;
totalTime = totalTime.toFixed(2);

self.port.emit("message", { "closure": closedTime, "total": totalTime, "currentStatus": closures[0].children[2].textContent.trim() });

function computeTime(date1, date2) {
  if(date1.tagName == "TR") {
    date1 = new Date(date1.children[1].textContent.trim());
  }
  if(date2.tagName == "TR") {
    date2 = new Date(date2.children[1].textContent.trim());
  }
  
  return date1 - date2;
}
