/* Author: Hugues Demers
 * Copyrights 2013
*/

/*global appConfig:false*/
define([
  "jquery",
  "underscore",
  "leaflet",
  "radio"
],
function ($, _, L, radio) {
  var exports = {}, map, mapElement, markers = {},
    setViewAll, heartbeatTimeoutId, geolocationError, geolocationResponse;

  exports.initialize = function (element, options) {
    console.log("Initializing map.");
    var tileLayer,
      cloudmadeUrl = 'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png',
      osmUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      mapboxUrl = 'http://{s}.tiles.mapbox.com/v3/openplans.map-g4j0dszr/{z}/{x}/{y}.png',
      defaults = {
        watch: true,
        heartbeat: true
      }, opts = _.defaults(options || {}, defaults);

    mapElement = element;
    map = L.map(mapElement);

    tileLayer = L.tileLayer(cloudmadeUrl, {
        key: appConfig.cloudmadeApiKey,
        //styleId: 22677,
        styleId: 79839,
        //styleId: 999,
        maxZoom: 18
      }).addTo(map);


    map.setView([35, -50], 3);

    if (opts.watch) {
      exports.locate({
        watch: true,
        enableHighAccuracy: true
      });
    }

    // When on a desktop, calling locate with watch = true, will fire only
    // one locationfound event. Here, we set up a timeout that will call
    // locate (watch = false) to force a position update from the cache
    // (maximumAge: Infinity).
    if (opts.heartbeat) {
      exports.on('locationfound', function () {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = setTimeout(function () {
          console.log("Heartbeating");
          exports.locate({maximumAge: Infinity});
        }, 8000);
      });
      exports.locate({watch: false, enableHighAccuracy: true});
    }
  };


  exports.locate = function (options) {
    var defaults = {
      watch: false,
      timeout: 10000,
      maximumAge: 0,
      enableHighAccuracy: false
    }, opts = _.defaults(options || {}, defaults);

    if (!navigator.geolocation) {
      radio('locationerror').broadcast({
        code: 0,
        message: 'Geolocation not supported.'
      });
      return;
    }

    if (opts.watch) {
      navigator.geolocation.watchPosition(geolocationResponse,
        geolocationError, opts);
    }
    else if (opts.maximumAge === Infinity) {
      navigator.geolocation.getCurrentPosition(function (position) {
        geolocationResponse(position, true);
      }, geolocationError, opts);
    }
    else {
      navigator.geolocation.getCurrentPosition(geolocationResponse,
        geolocationError, opts);
    }
  };

  geolocationResponse = function (position, cached) {
    var lat = position.coords.latitude,
      lng = position.coords.longitude,
      latlng = new L.LatLng(lat, lng),
      latAccuracy = 180 * position.coords.accuracy / 40075017,
      lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat),
      bounds = L.latLngBounds(
        [lat - latAccuracy, lng - lngAccuracy],
        [lat + latAccuracy, lng + lngAccuracy]),
      data = {
        latlng: latlng,
        bounds: bounds,
        type: cached ? "cached" : "moving"
      };

    radio("locationfound").broadcast(data);
  };

  geolocationError = function (error) {
    var c = error.code,
      message = error.message ||
      (c === 1 ? 'permission denied' :
      (c === 2 ? 'position unavailable' : 'timeout'));

    radio('locationerror').broadcast({
      code: c,
      message: 'Geolocation error: ' + message + '.'
    });
  };

  exports.mark = function (location, ident, iconUrl) {
    var marker,
      html = iconUrl ?
        '<img class="img-circle" src=' + iconUrl + '></img>':
        '<span class="glyphicon glyphicon-user"></span>',
      icon = L.divIcon({
      iconSize: [34, 34],
      iconAnchor: [17, 44],
      className: "user",
      html: html + '<div class="triangle-down" id="ident-' + ident + '"></div>'
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
      setViewAll();
    }
  };

  setViewAll = function () {
    map.fitBounds(L.featureGroup(_.values(markers)).getBounds());
  };


  exports.on = function (event, callback) {
    radio(event).subscribe(callback);
  };
  exports.off = function (event, callback) {
    radio(event).unsubscribe(callback);
  };
  return exports;
});
