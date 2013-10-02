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
  var exports = {}, map, mapElement, markers = {},
    setViewAll, heartbeatTimeoutId;

  exports.initialize = function (element, options) {
    console.log("Initializing map.");
    var tileLayer,
      cloudmadeUrl = 'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png',
      osmUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      mapboxUrl = 'http://{s}.tiles.mapbox.com/v3/openplans.map-g4j0dszr/{z}/{x}/{y}.png',
      defaults = {
        locate: true,
        heartbeat: true
      }, opts = _.defaults(options || {}, defaults);

    mapElement = element;
    map = L.map(mapElement);

    exports.locate = function () {
      map.locate();
    };

    tileLayer = L.tileLayer(cloudmadeUrl, {
        key: appConfig.cloudmadeApiKey,
        //styleId: 22677,
        styleId: 79839,
        //styleId: 999,
        maxZoom: 18
      }).addTo(map);


    map.setView([35, -50], 3);

    if (opts.locate) {
      map.locate({
        watch: true,
        enableHighAccuracy: true
      });
    }

    // When on a desktop, calling map.locate with watch = true, will fire only
    // one locationfound event. Here, we set up a timeout that will call
    // map.locate (watch = false) to force a position update from the cache
    // (maximumAge: Infinity).
    if (opts.heartbeat) {
      map.on('locationfound', function () {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = setTimeout(function () {
          console.log("Heartbeating");
          map.locate({maximumAge: Infinity});
        }, 8000);
      });
      map.locate({watch: false, enableHighAccuracy: true});
    }
  };

  exports.mark = function (location, ident, iconUrl) {
    var marker,
      html = iconUrl ?
        '<img class="img-circle" src=' + iconUrl + '></img>':
        '<span class="glyphicon glyphicon-user"></span>',
      icon = L.divIcon({
      iconSize: [34, 34],
      className: "user",
      html: html
    });

    if (_.has(markers, ident)) {
      markers[ident].setLatLng(location.latlng);
      markers[ident].setIcon(icon);
      //marker.setAccuracy(location.accuracy);
    }
    else {
      marker = L.marker(location.latlng, {icon: icon});
      markers[ident] = marker;
      marker.addTo(map);
      //marker.setAccuracy(location.accuracy);
      setViewAll();
    }
  };

  exports.on = function (eventType, callback) {
    map.on(eventType, callback);
  };

  setViewAll = function () {
    map.fitBounds(L.featureGroup(_.values(markers)).getBounds());
  };

  return exports;
});
