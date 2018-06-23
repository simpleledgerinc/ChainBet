let EventSource = require('eventsource');

// TypeError: Cannot read property 'readyState' of undefined
// chainfeed.js:17
//     at EventSource.<anonymous> (/Users/jamescramer/Source/chainbet/chainfeed.js:17:22)
//     at EventSource.emit (events.js:180:13)
//     at _emit (/Users/jamescramer/Source/chainbet/node_modules/eventsource/lib/eventsource.js:222:17)
//     at onConnectionClosed (/Users/jamescramer/Source/chainbet/node_modules/eventsource/lib/eventsource.js:40:5)
//     at IncomingMessage.<anonymous> (/Users/jamescramer/Source/chainbet/node_modules/eventsource/lib/eventsource.js:157:9)
//     at IncomingMessage.emit (events.js:185:15)
//     at endReadableNT (_stream_readable.js:1106:12)
//     at process._tickCallback (internal/process/next_tick.js:178:19)


module.exports = {
    listen: function(onData, onConnected, onDisconnect) {
      var source = new EventSource('https://chainfeed.org/stream')
      source.addEventListener('message', function(e) {
        var m = JSON.parse(e.data);
        onData(m.data);
      }, false)
      source.addEventListener('open', function(e) {
        //console.log("Chainfeed Connected");
        if(onConnected != undefined){
            onConnected(e);
        }
      }, false)
      source.addEventListener('error', function(e) {
        if (e.target.readyState == EventSource.CLOSED) {
          //console.log("Chainfeed Disconnected", e);
          if(onDisconnect != undefined){
              onDisconnect(e);
          }
        }
        else if (e.target.readyState == EventSource.CONNECTING) {
          //console.log("Chainfeed is connecting...", e);
        }
      }, false)
    },
    recent: function(size, callback) {
      chainfeed._req('https://chainfeed.org/recent/' + size, callback);
    },
    range: function(start, end, callback) {
      chainfeed._req('https://chainfeed.org/range/' + start + ',' + end, callback);
    },
    tx: function(hash, callback) {
      chainfeed._req('https://chainfeed.org/tx/' + hash);
    },
    _req: function(endpoint, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', endpoint);
      xhr.responseType = 'json';
      xhr.onload = function(e) {
        if (this.status == 200) {
          callback(this.response)
        }
      };
      xhr.send();
    }
  }