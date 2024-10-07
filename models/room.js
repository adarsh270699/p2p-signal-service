const crypto = require('crypto');

module.exports = class Room {
  constructor(maxPeers = Infinity) {
    this.id = crypto.randomUUID();
    this.peers = new Set();
    this.lastActive = this.createdAt = new Date();
    this.maxPeers = maxPeers;
  }

  updateLastActive() {
    this.lastActive = new Date();
  }

  addPeer(socketId) {
    if (this.peers.size < this.maxPeers) {
      this.peers.add(socketId);
      this.updateLastActive();
      return true;
    }
    return false;
  }

  removePeer(socketId) {
    if (this.peers.delete(socketId)) {
      this.updateLastActive();
      return true;
    }
    return false;
  }
};
