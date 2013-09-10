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
  var exports = {}, peers = {}, myId = null, peerInstance = null,
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


  exports.add = function (token, identity, callback) {
    peers[token] = {
      token: token,
      identity: identity,
      conn: null,
      callback: callback
    };
  };

  exports.get = function (token) {
    if (_.has(peers, token)) {
      console.log("Accepted token", token, "for peer", peers[token].identity);
      return peers[token];
    }
    else {
      console.log("Rejected token", token);
      return null;
    }
  };


  exports.connect = function (peerId, token, callback) {
    var conn;
    
    //if (_.has(peers, peerId)) {
      //return;
    //}
    console.log("Trying to connect to", peerId);

    conn = peerInstance.connect(peerId, {serialization: "json", metadata: token});
    exports.add(token, null, callback);
    return setupConnection(conn);
  };

  setupConnection = function (conn) {
    console.log("Peer", conn.peer, "is connecting to us.");
    var peer = exports.get(conn.metadata), deferred = new $.Deferred();

    if (peer === null) {
      console.log("Peer is null. Closing connection.");
      conn.close();
      delete peers[conn.metadata];
      return;
    }

    // Attach event handlers
    conn.on('open', function () {
      // Store the connection
      peer.conn = conn;
      console.log("Connection opened with", conn.peer);
      deferred.resolve();
      onOpen(peer.token);
    });

    conn.on('data', function (data) {
      peer.callback(peer.identity, data);
      console.log('Got data:', data);
    });

    conn.on('close', function () {
      console.log("Peer", conn.peer, "has closed connection");
      //delete peers[conn.metadata];
    });

    conn.on('error', function (error) {
      console.log("Connection error:", error);
    });
  
    console.log("Returning promise");
    return deferred.promise();
  };

  exports.send = function (message) {
    _.each(peers, function (peer) {
      if (peer.conn.open) {
        peer.conn.send(message);
        console.log("Sent message to", peer.conn.peer, "(", peer.token, ")");
      }
    });
  };

  return exports;
});

