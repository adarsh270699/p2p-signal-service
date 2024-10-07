const Peer = require("../models/peer");
const Room = require("../models/room");
const rooms = require("../store/rooms");
const activePeers = require("../store/activePeers");

module.exports = class Manager {
  maxRooms = 1000;
  maxPeerPerRoom = 4;

  createPeer(socketId = "") {
    const peer = new Peer(socketId);
    activePeers.set(socketId, peer);
    return true;
  }

  removeFromRoom(peer) {
    const room = rooms.get(peer.roomId);
    if (room) {
      room.removePeer(peer.id);
      peer.roomId = "";
      if (room.peers.size === 0) {
        rooms.delete(room.id);
      }
    }
  }

  addToRoom(peer, room) {
    if (room.peers.size < this.maxPeerPerRoom) {
      room.peers.add(peer.id);
      peer.roomId = room.id;
      rooms.set(room.id, room);
    }
  }

  createRoomAndJoin(socketId = "") {
    const peer = activePeers.get(socketId);
    if (!peer || rooms.size >= this.maxRooms) {
      return { socketId, newRoomId: "", oldRoomId: "" };
    }

    peer.lastActive = new Date();
    const oldRoomId = peer.roomId;
    this.removeFromRoom(peer);

    const newRoom = new Room();
    this.addToRoom(peer, newRoom);

    return { socketId, newRoomId: newRoom.id, oldRoomId };
  }

  joinNewRoom(socketId = "", newRoomId = "") {
    const peer = activePeers.get(socketId);
    if (!peer) {
      return { socketId, newRoomId: "", oldRoomId: "" };
    }
    peer.lastActive = new Date();
    const oldRoomId = peer.roomId;
    this.removeFromRoom(peer);

    const newRoom = rooms.get(newRoomId);
    if (newRoom) {
      this.addToRoom(peer, newRoom);
    } else {
      newRoomId = "";
    }

    return { socketId, newRoomId, oldRoomId };
  }

  deletePeer(socketId = "") {
    const peer = activePeers.get(socketId);
    if (!peer) {
      return { socketId, oldRoomId: "" };
    }

    const room = rooms.get(peer.roomId);
    let oldRoomId = "";

    if (room) {
      oldRoomId = room.id;
      room.removePeer(socketId);
      if (room.peers.size === 0) {
        rooms.delete(oldRoomId);
      }
    }

    activePeers.delete(socketId);
    return { socketId, oldRoomId };
  }
};
