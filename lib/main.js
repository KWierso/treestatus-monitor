var data = require("self").data;

var pageworker = require("sdk/page-worker");
var widget = require("sdk/widget");
var timers = require("sdk/timers");
var request = require("sdk/request");
var tabs = require("sdk/tabs");

var inboundWidget = widget.Widget({
  id: "inbound-closure-counter",
  width: 250,
  label: "inbound closure",
  tooltip: "Green means the tree is currently open, red means closed.\n" +
    "Times are measured in days. \n" +
    "XX days closed / XX total days from last 100 changes.\n" +
    "Click to see more detailed information.",
  contentURL: data.url("closurecounter.html"),
  contentScriptFile: data.url("closurecounter.js"),
  contentScriptOptions: { "tree": "INBOUND" },
  onClick: function() {
    request.Request({
      url: "https://treestatus.mozilla.org/mozilla-inbound/logs?all=1",
      onComplete: function(response) {
        tabs.open({
          url: data.url("treestatus.html"),
          onReady: function(tab) {
            let worker = tab.attach({ 
              contentScriptFile: [data.url("d3.v3.min.js"),data.url("treestatus.js")]
            });
            worker.port.on("message", function(msg) {
              worker.port.emit("treestatus", response.json);
            });
          }
        });
        
      }
    }).get();
  }
});

var centralWidget = widget.Widget({
  id: "central-closure-counter",
  width: 250,
  label: "central closure",
  tooltip: "Green means the tree is currently open, red means closed.\n" +
    "Times are measured in days. \n" +
    "XX days closed / XX total days from last 100 changes.\n" +
    "Click to see more detailed information.",
  contentURL: data.url("closurecounter.html"),
  contentScriptFile: data.url("closurecounter.js"),
  contentScriptOptions: { "tree": "CENTRAL" },
  onClick: function() {
    request.Request({
      url: "https://treestatus.mozilla.org/mozilla-central/logs?all=1",
      onComplete: function(response) {
        tabs.open({
          url: data.url("treestatus.html"),
          onReady: function(tab) {
            let worker = tab.attach({ 
              contentScriptFile: [data.url("d3.v3.min.js"),data.url("treestatus.js")]
            });
            worker.port.on("message", function(msg) {
              worker.port.emit("treestatus", response.json);
            });
          }
        });
        
      }
    }).get();
  }
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

