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
    currentLocation = null,
    sendLocation,
    updateLocation,
    onOpen,
    myself;

  exports.initialize = function () {
    var ident, peer_id;
    console.log("Initializing app.");

    my_peer_id = sessionStorage.my_peer_id ||
      Math.random().toString(36).substring(7);
      //my_pper_id = Math.random().toString(36).substring(7);
    sessionStorage.my_peer_id = my_peer_id;
    peershare.initialize(my_peer_id, onOpen);

    ko.applyBindings(viewmodel);

    peer_id = location.search.substr(3, 11);
    ident = location.search.substr(17);
    if (peer_id !== "") {
      peershare
        .connect(peer_id, updateLocation, ident)
        .done(function () {
          onOpen(ident);
        });
    }

    myself = {
      email: viewmodel.senderEmail(),
      ident: my_peer_id
    };

    viewmodel.senderEmail.subscribe(function (email) {
      console.log("Setting email");
      myself.email = email;
      updateLocation(myself, currentLocation);
    });

    // Build our map.
    map.initialize(mapElement);

    map.on('locationfound', function (location) {
      console.log("Received location data.");
      currentLocation = location;
      updateLocation(myself, location);
      sendLocation(location);
    });
  };

  sendLocation = function (location) {
    if (location !== null) {
      peershare.send({
        accuracy: location.accuracy,
        latlng: location.latlng
      });
    }
  };

  onOpen = function (peer) {
    console.log("Sending location on open", currentLocation);
    sendLocation(currentLocation);
  };

  updateLocation = function (peer, location) {
    var icon = "bluedot.png",
      iconUrl = window.location.protocol + "//" + window.location.host +
                "/static/img/" + icon;
    if (peer.email !== undefined) {
      iconUrl = "http://www.gravatar.com/avatar/" +
        CryptoJS.MD5(peer.email) + "?s=30";
    }
    map.mark(location, peer.ident, iconUrl);
  };

  viewmodel.invite = function () {
    var ident, url, metadata;
    if (viewmodel.senderEmail() === "" ||
        viewmodel.recipientEmail() === "") {
      return;
    }

    metadata = {email: viewmodel.recipientEmail()};
    ident = peershare.add(updateLocation, metadata, ident);
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

