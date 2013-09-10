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
  var exports = {}, mapElement = 'map', my_id, peer_id, token,
    currentLocation = null,
    sendLocation,
    updateLocation,
    onOpen;

  exports.initialize = function () {
    console.log("Initializing app.");
    
    // Connect to the peer server.
    
    my_id = sessionStorage.my_id || Math.random().toString(36).substring(7);
    //my_id = Math.random().toString(36).substring(7);
    sessionStorage.my_id = my_id;
    peershare.initialize(my_id, onOpen);

    ko.applyBindings(viewmodel);

    peer_id = location.search.substr(3, 11);
    token = location.search.substr(17);
    if (peer_id !== "") {
      peershare
        .connect(peer_id, token, updateLocation)
        .done(function () {
          onOpen(token);
        });
    }

    // Build our map.
    map.initialize(mapElement);
    
    map.on('locationfound', function (location) {
      console.log("Received location data.");
      currentLocation = location;
      updateLocation(viewmodel.sender_email(), location);
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

  onOpen = function (token) {
    console.log("Sending location on open", currentLocation);
    sendLocation(currentLocation);
  };

  updateLocation = function (email, location) {
    var iconUrl = "http://www.gravatar.com/avatar/" + CryptoJS.MD5(email) +
      "?s=30&d=identicon";
    map.mark(location, iconUrl);
  };

  viewmodel.invite = function () {
    var token, url;
    if (viewmodel.sender_email() === "" ||
        viewmodel.recipient_email() === "") {
      return;
    }
    // A token. To identify a peer that connect back to us.
    token = Math.random().toString(36).substring(7);
    url = location.protocol + "//" + location.host + "?p=" + my_id +
      "&t=" + token;

    $.ajax({
      url: '/invite',
      data: JSON.stringify({
        from: viewmodel.sender_email(),
        to: viewmodel.recipient_email(),
        url: url,
        token: token
      }),
      type: 'post',
      contentType: 'application/json;charset=UTF-8'
    });

    peershare.add(token, viewmodel.recipient_email(), updateLocation);
  };

  return exports;
});

