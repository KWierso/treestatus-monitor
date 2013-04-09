let closedTime, openTime, totalTime;

let select = document.getElementById("tableSelect");
select.addEventListener("change", function(evt) { 
  let value = evt.target[evt.target.selectedIndex].value; 
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  if(value == "ALL") {
    for(row of rows) {
      row.removeAttribute("hidden");
    }
  } else {
    for(row of rows) {
      if(row.rowIndex < value) {
        row.removeAttribute("hidden");
      } else {
        row.setAttribute("hidden", true);
      }
    }
  }
  
  updateTimes();
  change();
}, false);


self.port.on("treestatus", function(status) {
  let statusChanges = [];
  let previousStatus;
  let firstClosed = "";
  let previousStatusAction;

  populateSelect(Math.floor(status.length/100));
  
  d3.select("#statusTable").select("tbody").selectAll("tr").data(status).enter().append("tr")
    .attr("reason", function(d) { return d.reason; })
    .attr("tags", function(d) { return d.tags; })
    .attr("action", function(d) { return d.action; })
    .attr("tree", function(d) { return d.tree; })
    .attr("who", function(d) { return d.who; })
    .attr("when", function(d) { return d.when; });

  let rows = document.getElementsByTagName("tr");
  let rowcount = 0;

  for(i of rows) {
    try {
      let whenCell = document.createElement("td");
      whenCell.textContent = i.getAttribute("when");
      i.appendChild(whenCell);
      
      let whoCell = document.createElement("td");
      whoCell.textContent = i.getAttribute("who");
      i.appendChild(whoCell);
      
      let actionCell = document.createElement("td");
      actionCell.textContent = i.getAttribute("action");
      i.appendChild(actionCell);
      
      let reasonCell = document.createElement("td");
      reasonCell.textContent = i.getAttribute("reason");
      i.appendChild(reasonCell);
      
      rowcount = rowcount + 1;
    } catch(e) {
      console.log(e)
    }
  }

  for( i=rowcount-1;i>0;i--) {
    let thisStatus = rows[i];
    let thisStatusAction = thisStatus.getElementsByTagName("td")[2].textContent
    if(previousStatus)
      previousStatusAction = previousStatus.getElementsByTagName("td")[2].textContent;
    
    if(thisStatusAction == "closed" && firstClosed == "") {
      firstClosed = i;
    }
    
    if(thisStatusAction != previousStatusAction && previousStatusAction == "closed" && thisStatusAction == "open") {
      statusChanges.push(i);
    }
    
    if(thisStatusAction != "added" && thisStatusAction != "approval require")
      previousStatus = thisStatus;
  }

  closedTime = 0;
  
  closedTime = closedTime + computeTime(rows[statusChanges[0]], rows[firstClosed]);
  for(i in statusChanges) {
    try {
      closedTime = closedTime + computeTime(rows[statusChanges[parseInt(i)+1]], rows[statusChanges[i]-1]);
    } catch(e) {}
  }
  closedTime = closedTime / 1000 / 60 / 60 / 24;
  closedTime = closedTime.toFixed(2);
  
  totalTime = computeTime(new Date(), rows[rows.length-1]) / 1000 / 60 / 60 / 24;
  totalTime = totalTime.toFixed(2);
  
  openTime = totalTime - closedTime;
  openTime = openTime.toFixed(2);
  
  
  change();
});

self.port.emit("message", "blah");


function updateTimes() {
  let statusChanges = [];
  let previousStatus;
  let firstClosed = "";
  let previousStatusAction;
  let rows = document.getElementsByTagName("tr");
  let rowcount = 0;
  
  for(row of rows) {
    if(!row.hasAttribute("hidden")) {
      rowcount = rowcount + 1;
    }
  }
  
  for( i=rowcount-1;i>0;i--) {
    let thisStatus = rows[i];
    let thisStatusAction = thisStatus.getElementsByTagName("td")[2].textContent
    if(previousStatus)
      previousStatusAction = previousStatus.getElementsByTagName("td")[2].textContent;
    
    if(thisStatusAction == "closed" && firstClosed == "") {
      firstClosed = i;
    }
    
    if(thisStatusAction != previousStatusAction && previousStatusAction == "closed" && thisStatusAction == "open") {
      statusChanges.push(i);
    }
    
    if(thisStatusAction != "added" && thisStatusAction != "approval require")
      previousStatus = thisStatus;
  }

  closedTime = 0;
  openTime = 0;
  totalTime = 0;
  
  closedTime = closedTime + computeTime(rows[statusChanges[0]], rows[firstClosed]);
  for(i in statusChanges) {
    try {
      closedTime = closedTime + computeTime(rows[statusChanges[parseInt(i)+1]], rows[statusChanges[i]-1]);
    } catch(e) {}
  }
  closedTime = closedTime / 1000 / 60 / 60 / 24;
  closedTime = closedTime.toFixed(2);
  
  totalTime = computeTime(new Date(), rows[rowcount-1]) / 1000 / 60 / 60 / 24;
  totalTime = totalTime.toFixed(2);
  
  openTime = totalTime - closedTime;
  openTime = openTime.toFixed(2);
  

}

function computeTime(date1, date2) {
  if(date1.tagName == "TR") {
    date1 = new Date(date1.children[0].textContent.trim());
  }
  if(date2.tagName == "TR") {
    date2 = new Date(date2.children[0].textContent.trim());
  }
  
  return date1 - date2;
}
/*
function drawPie(closedTime, openTime, totalTime) {
  var w = 500, 
  h = 500,
  r = 250,
   
  data = [{"label":"open", "value":openTime},
          {"label":"closed", "value":closedTime}];

  var vis = d3.select("#pie")
              .append("svg:svg") 
              .data([data])
              .attr("width", w)
              .attr("height", h)
              .append("svg:g")
              .attr("transform", "translate(" + r + "," + r + ")") 
  
  var arc = d3.svg.arc() 
              .outerRadius(r);

  var pie = d3.layout.pie() 
              .value(function(d) { return d.value; });
  var arcs = vis.selectAll("g.slice")
                .data(pie) 
                .enter()
                .append("svg:g")
                .attr("class", "slice");
                 
                arcs.append("svg:path")
                .attr("fill", function(d, i) { return d.data.label == "open" ? d3.rgb("green") : d3.rgb("red") } )
                .attr("d", arc);
                 
                arcs.append("svg:text")
                .attr("transform", function(d) { 
                
                d.innerRadius = 0;
                d.outerRadius = r;
                return "translate(" + arc.centroid(d) + ")";
                })
                .attr("text-anchor", "middle")
                .text(function(d, i) { return data[i].label + "\n" + data[i].value; });
}
*/

var dataset = [{"label":"open", "value":0}, {"label":"closed", "value":0}]

var width = 500,
    height = 500,
    radius = Math.min(width, height) / 2;

var pie = d3.layout.pie()
    .sort(null).value(function(d) { return d.value; });

var arc = d3.svg.arc()
    .innerRadius(radius - 150)
    .outerRadius(radius - 20);

var svg = d3.select("#pie").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var path = svg.selectAll("path")
    .data(pie(dataset))
  .enter().append("path")
    .attr("fill", function(d, i) { return d.data.label == "open" ? d3.rgb("green") : d3.rgb("red") })
    .attr("d", arc)
    .attr("title", function(d, i) { return d.data.value; });

function change() {
  path = path.data(pie([{"label":"open", "value":openTime}, {"label":"closed", "value":closedTime}])); // update the data
  path.attr("d", arc)
      .attr("title", function(d, i) { return (d.data.value / totalTime).toFixed(2) * 100 + " %"; });
  path.append("svg:text").attr("text-anchor", "middle").text(function(d,i) { return d.data.value + " DAYS";});
  
  var timeTableCells = document.getElementById("timeTable").getElementsByTagName("tbody")[0].getElementsByTagName("td");
  timeTableCells[0].textContent = closedTime;
  timeTableCells[1].textContent = openTime;
  timeTableCells[2].textContent = totalTime;
  timeTableCells[3].textContent = (closedTime / totalTime).toFixed(2) * 100 + "%";
}

function populateSelect(count) {
  let select = document.getElementById("tableSelect");
  for(i=count;i>0;i--) {
    let option = document.createElement("option");
    option.value = i*100;
    option.textContent = i*100 + " MOST RECENT CHANGES";
    select.add(option)
  }
}