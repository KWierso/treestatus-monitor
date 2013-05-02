let closedTime, openTime, totalTime, monthsChanged, allStatuses;

let monthMap = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December"  
}

let reverseMonthMap = {
  "January": 0,
  "February": 1,
  "March": 2,
  "April": 3,
  "May": 4,
  "June": 5,
  "July": 6,
  "August": 7,
  "September": 8,
  "October": 9,
  "November": 10,
  "December": 11
}


self.port.on("treetitle", function(title) {
  document.title = title;
});

self.port.on("treestatus", function(status) {
  // Blow away the table of statuses, we're going to re-create it
  let statusTable = document.getElementById("statusTable");
  while(statusTable.tBodies[0].children.length > 0) {
    statusTable.deleteRow(-1);
  }
  
  allStatuses = status;

  let statusChanges = [];
  let previousStatus;
  let firstClosed = "";
  let previousStatusAction;

  monthsChanged = [];
  
  
  d3.select("#statusTable").select("tbody").selectAll("tr").data(status).enter().append("tr")
    .attr("reason", function(d) { return d.reason; })
    .attr("tags", function(d) { return d.tags; })
    .attr("action", function(d) { return d.action; })
    .attr("tree", function(d) { return d.tree; })
    .attr("who", function(d) { return d.who; })
    .attr("when", function(d) { return d.when; });

  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  let rowcount = 0;

  for(let i of rows) {
    if(i.getElementsByTagName("th").length == 0) {
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
    }
  }

  // Delete the first two months of treestatus history since they were skewing results
  let table = document.getElementById("statusTable");
  for(let i=rows.length-1;i>0;i--) {
    let testdate = new Date(rows[i].getAttribute("when"));
    let monthyear = [testdate.getFullYear(), testdate.getMonth()];
    if(monthyear[0] == "2012" && (monthyear[1] == "4" || monthyear[1] == "5")) {
      table.deleteRow(i);
    } else {
      addToMonthsChanged(new Date(rows[i].getAttribute("when")));
      rowcount = rowcount + 1;
    }
  }

  populateMonthsSelect();

  for(let i=rowcount-1;i>0;i--) {
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


function computeTime(date1, date2) {
  if(date1.tagName == "TR") {
    date1 = new Date(date1.children[0].textContent.trim());
  }
  if(date2.tagName == "TR") {
    date2 = new Date(date2.children[0].textContent.trim());
  }
  return date1 - date2;
}



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
  timeTableCells[3].textContent = ((closedTime / totalTime) * 100).toFixed(2) + "%";
}

// When a month is selected from the select box, scan this list of all changes for changes this month
let monthsSelect = document.getElementById("monthsSelect");
monthsSelect.addEventListener("change", function(evt) {
  let value = evt.target[evt.target.selectedIndex].value;
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  
  let thisMonthsChanges = [];
  let previousMonthEndStatus;
  if(value == "ALL") {
    self.port.emit("message", "blah");
  } else {
    for(let i=0;i<allStatuses.length;i++) {
      let thisDate = new Date(allStatuses[i].when);
      let thisDateString = monthMap[thisDate.getMonth()] + " " + thisDate.getFullYear()
      if(thisDateString == value) {
        thisMonthsChanges.push(allStatuses[i]);
        if(!previousMonthEndStatus && monthMap[new Date(allStatuses[i+1].when).getMonth()] + " " + new Date(allStatuses[i+1].when).getFullYear() != value) {
          previousMonthEndStatus = allStatuses[i+1].action;
        }
      } else {
      }
    }
    
    updateMonthsTimes(previousMonthEndStatus, thisMonthsChanges, value, evt.target.selectedIndex);
    change();
  }
}, false);

function updateMonthsTimes(startStatus, thisMonthsChanges, thisMonth, index) {
  let statusChanges = [];
  let previousStatus;
  let firstClosed = "";
  let previousStatusAction;

  // Blow away the table of statuses, we're going to re-create it
  let statusTable = document.getElementById("statusTable");
  while(statusTable.tBodies[0].children.length > 0) {
    statusTable.deleteRow(-1);
  }
  
  // Repopulate the table with rows for this month's changes
  d3.select("#statusTable").select("tbody").selectAll("tr").data(thisMonthsChanges).enter().append("tr")
    .attr("reason", function(d) { return d.reason; })
    .attr("tags", function(d) { return d.tags; })
    .attr("action", function(d) { return d.action; })
    .attr("tree", function(d) { return d.tree; })
    .attr("who", function(d) { return d.who; })
    .attr("when", function(d) { return d.when; });
  
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  let rowcount = 0;

  // For each row's information, populate the table cells
  for(let i of rows) {
    if(i.getElementsByTagName("th").length == 0) {
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
    }
  }
  
  // Delete the first two months of treestatus history since they were skewing results
  let table = document.getElementById("statusTable");
  for(let i=rows.length-1;i>0;i--) {
    let testdate = new Date(rows[i].getAttribute("when"));
    let monthyear = [testdate.getFullYear(), testdate.getMonth()];
    if(monthyear[0] == "2012" && (monthyear[1] == "4" || monthyear[1] == "5")) {
      table.deleteRow(i);
    } else {
      rowcount = rowcount + 1;
    }
  }
  
  let currentlyClosed = false;
  let lastClosedIndex;
  closedTime = 0;
  
  for(let i=rowcount;i>0;i--) {
    let thisRow = rows[i];
    let thisStatus = thisRow.getElementsByTagName("td")[2].textContent;
    
    // We need to record the unique tree closures, not a consecutive closure (to change the message, etc)
    if(!currentlyClosed && thisStatus == "closed") {
      lastClosedIndex = i;
      currentlyClosed = true;
    }
    
    // If we were in a closure and this row opens us back up, add the computed time between then and now
    if(currentlyClosed && thisStatus == "open") {
      currentlyClosed = false;
      closedTime = closedTime + computeTime(thisRow, rows[lastClosedIndex]);
    } 
  }
  
  // Need to count closure times up to the end of a month if the month ended while closed
  if(currentlyClosed) {
    if(index != 1) {
      let lastClosedTime = rows[lastClosedIndex];
      let endOfMonth = new Date(monthMap[reverseMonthMap[thisMonth.split(" ")[0]] + 1] + " 01, " + thisMonth.split(" ")[1]);
      closedTime = closedTime + computeTime(endOfMonth, lastClosedTime);
    } else {
      let lastClosedTime = rows[lastClosedIndex];
      closedTime = closedTime + computeTime(new Date(), lastClosedTime);
    }
  }

  // Convert times to days instead of milliseconds
  
  closedTime = closedTime / 1000 / 60 / 60 / 24;
  closedTime = closedTime.toFixed(3);
  
  if(index != 1) {
    totalTime = daysInMonth(reverseMonthMap[thisMonth.split(" ")[0]], thisMonth.split(" ")[1]);
  } else {
    // This is the current month, we shouldn't count the future as total time...
    let startOfMonth = thisMonth.split(" ")[0] + " 1, " + thisMonth.split(" ")[1] + " 00:00:01 -0700";
    startOfMonth = new Date(startOfMonth);
    totalTime = computeTime(new Date(), startOfMonth) / 1000 / 60 / 60 / 24;
    totalTime = totalTime.toFixed(3);
  }
  
  openTime = totalTime - closedTime;
  openTime = openTime.toFixed(3);
}

function addToMonthsChanged(date) {
  let month = monthMap[date.getMonth()];
  let year = date.getFullYear();

  let thisMonth = month + " " + year;

  let monthInList = false;
  for(let j of monthsChanged) {
    if(j == thisMonth) {
      monthInList = true;
    }
  }
  if(!monthInList) {
    monthsChanged.push(thisMonth);
  }
}

function populateMonthsSelect() {
  let select = document.getElementById("monthsSelect");
  monthsChanged = monthsChanged.reverse();
  for(let j of monthsChanged) {
    let option = document.createElement("option");
    option.value = j
    option.textContent = j;
    select.add(option)
  }
}

function daysInMonth(iMonth, iYear)
{
  return 32 - new Date(iYear, iMonth, 32).getDate();
}