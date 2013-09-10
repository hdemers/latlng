/* Author: Hugues Demers
 * Copyrights 2013
 */

/*global appConfig:false*/
define([
  "jquery",
  "underscore",
  "leaflet",
],
function ($, _, L) {
  var exports = {}, map, mapElement, markers = {};

  exports.initialize = function (element) {
    console.log("Initializing map.");
    var cloudmade;

    mapElement = element;
    map = L.map(mapElement);

    cloudmade = L.tileLayer(
      'http://{s}.tile.cloudmade.com/' + appConfig.cloudmadeApiKey +
      '/997/256/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

    map.setView([35, -50], 3);

    map.locate({
      watch: true,
      locate: true,
      //setView: true,
      enableHighAccuracy: true
    });

    exports.mark = function (location, iconUrl) {
      var icon, marker;
      if (_.has(markers, iconUrl)) {
        markers[iconUrl].setLatLng(location.latlng);
        //marker.setAccuracy(location.accuracy);
      }
      else {
        icon = L.icon({iconUrl: iconUrl});
        marker = L.marker(location.latlng, {icon: icon});
        markers[iconUrl] = marker;
        marker.addTo(map);
        //marker.setAccuracy(location.accuracy);
        exports.setViewAll();
      }
    };
  };

  exports.on = function (eventType, callback) {
    map.on(eventType, callback);
  };

  exports.setViewAll = function () {
    map.fitBounds(L.featureGroup(_.values(markers)).getBounds());
  };

  return exports;
});
