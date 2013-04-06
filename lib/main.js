var data = require("self").data;

var pageworker = require("sdk/page-worker");
var widget = require("sdk/widget");
var timers = require("sdk/timers");

var inboundWidget = widget.Widget({
  id: "inbound-closure-counter",
  width: 250,
  label: "inbound closure",
  tooltip: "Green means the tree is currently open, red means closed.\n" +
    "Times are measured in days. \n" +
    "XX days closed / XX total days in treestatus history (Last 100 changes).",
  contentURL: data.url("closurecounter.html"),
  contentScriptFile: data.url("closurecounter.js"),
  contentScriptOptions: { "tree": "INBOUND" }
});

var centralWidget = widget.Widget({
  id: "central-closure-counter",
  width: 250,
  label: "central closure",
  tooltip: "Green means the tree is currently open, red means closed.\n" +
    "Times are measured in days. \n" +
    "XX days closed / XX total days in treestatus history (Last 100 changes).",
  contentURL: data.url("closurecounter.html"),
  contentScriptFile: data.url("closurecounter.js"),
  contentScriptOptions: { "tree": "CENTRAL" }
});


timers.setInterval(requestTimes, 900000); // Automatically refresh the times for all trees every 15 minutes
requestTimes(); // Do the initial request for times for all trees

/*
 *  Opens each tree in a hidden page worker and scrapes 
 *  the 100 most recent status changes for closure times
 */
function requestTimes() {
  let startInbound = pageworker.Page({
    contentURL: "https://treestatus.mozilla.org/mozilla-inbound",
    contentScriptFile: data.url("workerscript.js"),
    contentScriptWhen: "end"
  })
  startInbound.port.on("message", function(msg) {
    inboundWidget.port.emit("data", msg);
    startInbound.destroy();
  })

  let startCentral = pageworker.Page({
    contentURL: "https://treestatus.mozilla.org/mozilla-central",
    contentScriptFile: data.url("workerscript.js"),
    contentScriptWhen: "end"
  })
  startCentral.port.on("message", function(msg) {
    centralWidget.port.emit("data", msg);
    startCentral.destroy();
  })
}

