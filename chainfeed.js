let EventSource = require('eventsource');

module.exports = {
    listen: function(onData, onConnected, onDisconnect) {
      var source = new EventSource('https://chainfeed.org/stream')
      source.addEventListener('message', function(e) {
        var m = JSON.parse(e.data)
        onData(m.data)
      }, false)
      source.addEventListener('open', function(e) {
        console.log("Chainfeed Connected");
        if(onConnected != undefined){
            onConnected();
        }
      }, false)
      source.addEventListener('error', function(e) {
        if (e.target.readyState == EventSource.CLOSED) {
          console.log("Chainfeed Disconnected", e);
          if(onDisconnect != undefined){
              onDisconnect();
          }
        }
        else if (e.target.readyState == EventSource.CONNECTING) {
          console.log("Chainfeed is connecting...", e);
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