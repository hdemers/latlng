/* Author: Hugues Demers
 * Copyrights 2013
 */
define(["knockout", "underscore", "mapping", "map"],
function (ko, _, mapping, map) {
  var peerMapping = {
    key: function (item) {
      return ko.utils.unwrapObservable(item.ident);
    },
    create: function (options) {
      var peer = mapping.fromJS(options.data),
        updateMap = function () { exports.updateMap(peer); };

      peer.email.subscribe(updateMap);
      peer.location.latlng.subscribe(updateMap);
      return peer;
    }
  }, exports = {
    senderEmail: ko.observable('hdemers@gmail.com'),
    recipientEmail: ko.observable('hugues.demers@gmail.com'),
    peers: mapping.fromJS([], peerMapping)
  };


  // A peer:
  //  { 
  //    ident,
  //    location: {accuracy, latlng},
  //    email
  //  }

  exports.update = function (ident, data) {
    var index;
    data.ident = ident;
    index = exports.peers.mappedIndexOf(data);
    if (index !== -1) {
      mapping.fromJS(data, peerMapping, exports.peers()[index]);
    }
    else {
      exports.peers.mappedCreate(data);
    }
  };

  return exports;
});
