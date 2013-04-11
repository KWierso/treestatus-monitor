let closedTime, openTime, totalTime, monthsChanged;

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

let allSelects = document.getElementsByTagName("select");
function hideFilterSelects() {
  for(let select of allSelects) {
    if(select.id != "selectSelect") {
      select.setAttribute("hidden", true);
    }
  }
}
hideFilterSelects();

let selectSelect = document.getElementById("selectSelect");
selectSelect.addEventListener("change", function(evt) {
  let value = evt.target[evt.target.selectedIndex].value;
  hideFilterSelects();
  switch(value) {
    case "UNSET":
      unhideAll();
      break;
    case "MONTHS":
      unhideAll();
      document.getElementById("monthsSelect").selectedIndex = 0;
      document.getElementById("monthsSelect").removeAttribute("hidden");
      break;
    case "CHANGES":
      unhideAll();
      document.getElementById("changesSelect").selectedIndex = 0;
      document.getElementById("changesSelect").removeAttribute("hidden");
      break;
    case "DAYS":
      unhideAll();
      document.getElementById("daysSelect").selectedIndex = 0;
      document.getElementById("daysSelect").removeAttribute("hidden");
      break;
  }
  updateChangesTimes();
  change();
});

let daysSelect = document.getElementById("daysSelect");
daysSelect.addEventListener("change", function(evt) { 
  let value = evt.target[evt.target.selectedIndex].value; 
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  if(value == "ALL") {
    unhideAll();
  } else {
    for(let row of rows) {
      let thisDate = new Date(row.getAttribute("when"));
      let thisDay = thisDate.getDay();
      if(thisDay == value) {
        row.removeAttribute("hidden");
      } else {
        row.setAttribute("hidden", true);
      }
    }
  }
  
  updateDaysTimes();
  change();
}, false);

let changesSelect = document.getElementById("changesSelect");
changesSelect.addEventListener("change", function(evt) { 
  let value = evt.target[evt.target.selectedIndex].value; 
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  if(value == "ALL") {
    unhideAll();
  } else {
    for(row of rows) {
      if(row.rowIndex < value) {
        row.removeAttribute("hidden");
      } else {
        row.setAttribute("hidden", true);
      }
    }
  }
  
  updateChangesTimes();
  change();
}, false);

let monthsSelect = document.getElementById("monthsSelect");
monthsSelect.addEventListener("change", function(evt) { 
  let value = evt.target[evt.target.selectedIndex].value; 
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  if(value == "ALL") {
    unhideAll();
  } else {
    for(let row of rows) {
      let thisDate = new Date(row.getAttribute("when"));
      let thisDateString = monthMap[thisDate.getMonth()] + " " +  thisDate.getFullYear()
      if(thisDateString == value) {
        row.removeAttribute("hidden");
      } else {
        row.setAttribute("hidden", true);
      }
    }
  }
  
  updateMonthsTimes(value);
  change();
}, false);

function unhideAll() {
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  for(row of rows) {
    row.removeAttribute("hidden");
  }
}

self.port.on("treetitle", function(title) {
  document.title = title;
});

self.port.on("treestatus", function(status) {
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

  populateChangesSelect(Math.floor(rowcount/100));
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


function updateChangesTimes() {
  let statusChanges = [];
  let previousStatus;
  let firstClosed = "";
  let previousStatusAction;
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  let rowcount = 0;
  
  for(let row of rows) {
    if(!row.hasAttribute("hidden")) {
      rowcount = rowcount + 1;
    }
  }

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

function updateMonthsTimes(monthAndYear) {
  let currentDate = new Date();
  if(monthsSelect[monthsSelect.selectedIndex].value == "ALL") {
    updateChangesTimes();
    return;
  }
  let startOfMonth = new Date(monthAndYear.split(" ")[0] + " 1, " + monthAndYear.split(" ")[1]);
  
  let nextMonth = startOfMonth.getMonth() + 1;
  let year = startOfMonth.getFullYear();
  
  if(nextMonth > 11) {
    nextMonth = 1;
    year = year + 1;
  }
  let endOfMonth = new Date(monthMap[nextMonth] + " 1, " + year);
  
  startOfMonth.setHours(0);
  endOfMonth.setHours(0);
  
  
  
  
  let statusChanges = [];
  let previousStatus;
  let firstClosed = "";
  let previousStatusAction;
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  let firstrowvisible = 0;
  let lastrowvisible;
  let countingVisible = false;
  
  for(let row of rows) {
    if(countingVisible) {
      if(row.hasAttribute("hidden")) {
        lastrowvisible = lastrowvisible - 1;
        break;
      } else {
        lastrowvisible = lastrowvisible + 1;
      }
    } else {
      if(row.hasAttribute("hidden")) {
        firstrowvisible = firstrowvisible + 1;
      } else {
        countingVisible = true;
        lastrowvisible = firstrowvisible + 1;
      }
    }
  }

  for(let i = firstrowvisible; i< lastrowvisible; i++) {
    if(rows[i].getElementsByTagName("th").length == 0) {
      let thisStatus = rows[i];
        let thisStatusAction = thisStatus.getElementsByTagName("td")[2].textContent;
      if(previousStatus)
        previousStatusAction = previousStatus.getElementsByTagName("td")[2].textContent;

      if(thisStatusAction != previousStatusAction && previousStatusAction == "closed" && thisStatusAction == "open") {
        statusChanges.push(i);
      }
      
      if(thisStatusAction != "added" && thisStatusAction != "approval require") {
        previousStatus = thisStatus;
      }
    }
  }
  statusChanges = statusChanges.reverse();
  
  

  closedTime = 0;
  openTime = 0;
  totalTime = 0;

  // If the last month ended while closed, we need to count everything up to the first change of the month as closed
  try {
    if(rows[lastrowvisible+1].children[2].textContent == "closed") {
      closedTime = computeTime(rows[lastrowvisible], new Date(startOfMonth));
    }
  }catch(e) {}
  
  // Compute the time spent closed between the status changes
  for(i in statusChanges) {
    try {
      closedTime = closedTime + computeTime(rows[statusChanges[parseInt(i)+1]], rows[statusChanges[i]-1]);
    //  console.log((computeTime(rows[statusChanges[parseInt(i)+1]], rows[statusChanges[i]-1]) / 1000 / 60/60/24).toFixed(2));
    } catch(e) {}
  }

  // If the last status of the month is "closed", we need to count the rest of the month as closed time
  // (Unless it's the current month, then we only count until today)
  if(rows[firstrowvisible].children[2].textContent == "closed") {
    let lastClosed = firstrowvisible;
    while(rows[lastClosed].children[2].textContent == "closed") {
      lastClosed = lastClosed + 1;
    }
    if(currentDate.getMonth() == nextMonth - 1) {
      closedTime = closedTime + computeTime(currentDate, rows[lastClosed-1]);
    } else {
      closedTime = closedTime + computeTime(endOfMonth, rows[lastClosed-1]);
    }
  }
  
  closedTime = closedTime / 1000 / 60 / 60 / 24;
  closedTime = closedTime.toFixed(2);

  if(currentDate.getMonth() == nextMonth - 1) {
    totalTime = computeTime(currentDate, startOfMonth) / 1000 / 60 / 60 / 24;
  } else {
    totalTime = computeTime(endOfMonth, startOfMonth) / 1000 / 60 / 60 / 24;
  }
  
  totalTime = totalTime.toFixed(2);

  openTime = totalTime - closedTime;
  openTime = openTime.toFixed(2);
}

function updateDaysTimes() {
  let currentDate = new Date();
  
  let firstVisible, lastVisible;
  let dayChange = [];
  
  if(daysSelect[daysSelect.selectedIndex].value == "ALL") {
    updateChangesTimes();
    return;
  }
  
  let rows = document.getElementById("statusTable").getElementsByTagName("tr");
  for(let i=rows.length-1;i>0;i--) {
    if(!rows[i].hasAttribute("hidden")) {
      let thisDate = new Date(rows[i].children[0].textContent);
      let prevDate;
      try {
        prevDate = new Date(rows[i+1].children[0].textContent);
        if(thisDate.getDay() != prevDate.getDay()) {
          dayChange.push([i, rows[i+1].children[2].textContent]);
          console.log(thisDate, rows[i+1].children[2].textContent);
        }
      } catch(e) { console.log("ERROR", i) }
    }
  }
  console.log(dayChange);
}

function logTime() {
  console.log(closedTime, openTime, totalTime);
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

function populateChangesSelect(count) {
  let select = document.getElementById("changesSelect");
  for(i=count;i>0;i--) {
    let option = document.createElement("option");
    option.value = i*100;
    option.textContent = i*100 + " MOST RECENT CHANGES";
    select.add(option)
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