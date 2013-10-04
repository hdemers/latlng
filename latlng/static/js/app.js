/* Author: Hugues Demers
 * Copyrights 2013
*/

/*global appConfig:false, CryptoJS:false*/
define([
  "jquery",
  "underscore",
  "knockout",
  "map",
  "viewmodel",
  "peershare",
  "md5"
],
function ($, _, ko, map, viewmodel, peershare) {
  var exports = {}, mapElement = 'map', my_peer_id,
    sendLocation,
    onOpen,
    myself;

  exports.initialize = function () {
    var ident, peer_id;
    console.log("Initializing app.");

    my_peer_id = sessionStorage.my_peer_id ||
      Math.random().toString(36).substring(7);
    //my_peer_id = Math.random().toString(36).substring(7);
    sessionStorage.my_peer_id = my_peer_id;
    peershare.initialize(my_peer_id, onOpen);

    ko.applyBindings(viewmodel);

    peer_id = location.search.substr(3, 11);
    ident = location.search.substr(17);
    if (peer_id !== "") {
      peershare
        .connect(peer_id, viewmodel.update, ident)
        .done(onOpen);
    }

    // Add ourself to the list of viewmodel.peers.
    myself = {
      email: viewmodel.senderEmail(),
      ident: my_peer_id,
      location: {
        accuracy: null,
        latlng: [],
        type: null
      }
    };
    viewmodel.update(myself.ident, myself);

    // Build our map.
    map.initialize(mapElement);

    map.on('locationfound', function (location) {
      console.log("Received location data.");
      myself.location.latlng = [location.latlng.lat, location.latlng.lng];
      myself.location.accuracy = location.accuracy;
      myself.location.type = location.type;
      myself.email = viewmodel.senderEmail();
      viewmodel.update(myself.ident, myself);
      sendLocation(myself);
    });
  };

  sendLocation = function (data) {
    if (data !== null) {
      peershare.send(data);
    }
  };

  onOpen = function (peerIdent) {
    console.log("Sending location on open", myself.location);
    sendLocation(myself);
  };

  viewmodel.updateMap = function (peer) {
    var location, iconUrl = null;

    //if (peer.email() !== null && peer.email() !== "") {
      //iconUrl = "http://www.gravatar.com/avatar/" +
        //CryptoJS.MD5(peer.email()) + "?s=34&d=404";
    //}
    if (peer.location.latlng().length === 2) {
      location = {
        latlng: {
          lat: peer.location.latlng()[0],
          lng: peer.location.latlng()[1]
        }
      };

      if (iconUrl === null) {
        map.mark(location, peer.ident(), iconUrl);
      }
      else {
        $.ajax({
          url: iconUrl
        }).done(function () {
          map.mark(location, peer.ident(), iconUrl);
        }).error(function () {
          console.log("User has no gravatar.");
          map.mark(location, peer.ident(), null);
        });
      }
      if (peer.location.type() === "moving") {
        $("#ident-" + peer.ident()).removeClass("nonreporting nonmoving");

      }
      else if (peer.location.type() === "cached") {
        $("#ident-" + peer.ident())
          .removeClass("nonreporting")
          .addClass("nonmoving");
      }
      else if (peer.location.type() === "nonreporting") {
        $("#ident-" + peer.ident())
          .removeClass("nonmoving")
          .addClass("nonreporting");
      }
    }
  };

  viewmodel.invite = function () {
    var ident, url;
    if (viewmodel.senderEmail() === "" ||
        viewmodel.recipientEmail() === "") {
      return;
    }

    ident = peershare.add(viewmodel.update, ident);
    viewmodel.update(ident, {
      email: viewmodel.recipientEmail(),
      location: {latlng: []}
    });
    url = location.protocol + "//" + location.host + "?p=" + my_peer_id +
      "&i=" + ident;

    $.ajax({
      url: '/invite',
      data: JSON.stringify({
        from: viewmodel.senderEmail(),
        to: viewmodel.recipientEmail(),
        url: url,
        ident: ident
      }),
      type: 'post',
      contentType: 'application/json;charset=UTF-8'
    });

  };

  return exports;
});

