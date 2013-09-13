/* Author: Hugues Demers
 * Copyrights 2013
  
*/
/*global Peer:false, appConfig:false, CryptoJS:false*/
define([
  "jquery",
  "underscore",
  "peerjs"
],
function ($, _) {
  var exports = {}, pool = {}, myId = null, peerInstance = null,
    setupConnection, onOpen;

  exports.initialize = function (ownId, onOpenCallback) {
    myId = ownId;
    onOpen = onOpenCallback;
    
    console.log("Connecting to peer server with id '" + ownId + "'");
    // Connect to the PeerServer Cloud
    peerInstance = new Peer(myId,
      {key: appConfig.peerserverApiKey}
    );
    
    peerInstance.on('error', function (error) {
      console.log("Peer error", error);
    });

    peerInstance.on('connection', setupConnection);

    //window.onbeforeunload = function () {
      //if (peerInstance !== null) {
        //peerInstance.destroy();
      //}
    //};
  };


  exports.add = function (onData, metadata, identity) {
    var ident = identity || Math.random().toString(36).substring(7);

    pool[ident] = {
      ident: ident,
      conn: null,
      onData: onData,
      metadata: metadata || {}
    };
    return ident;
  };

  exports.get = function (ident) {
    if (_.has(pool, ident)) {
      return pool[ident];
    }
    else {
      return null;
    }
  };


  exports.connect = function (peerId, onData, ident) {
    var conn;
    console.log("Trying to connect to", peerId);

    exports.add(onData, {}, ident);
    conn = peerInstance.connect(peerId,
      {serialization: "json", metadata: ident}
    );
    return setupConnection(conn);
  };

  setupConnection = function (conn) {
    var peer = null, deferred = new $.Deferred();
    
    console.log("Peer", conn.peer, "is connecting to us.");
    peer = exports.get(conn.metadata);
    if (peer === null) {
      console.log("Peer", conn.peer, "is not already part of the pool.");
      console.log("Rejecting and closing connection.");
      conn.close();
      return;
    }
    console.log("Accepted connection for", peer.ident);

    // Attach event handlers
    conn.on('open', function () {
      // Store the connection
      peer.conn = conn;
      console.log("Connection opened with", conn.peer);
      deferred.resolve();
      onOpen(peer.metadata);
    });

    conn.on('data', function (data) {
      peer.onData(peer.metadata, data);
      console.log('Got data:', data);
    });

    conn.on('close', function () {
      console.log("Peer", conn.peer, "has closed connection");
      //delete pool[conn.metadata];
    });

    conn.on('error', function (error) {
      console.log("Connection error:", error);
    });
  
    console.log("Returning promise");
    return deferred.promise();
  };

  exports.send = function (message) {
    _.each(pool, function (peer) {
      if (peer.conn !== null && peer.conn.open) {
        peer.conn.send(message);
        console.log("Sent message to", peer.conn.peer, "(", peer.ident, ")");
      }
    });
  };

  return exports;
});

