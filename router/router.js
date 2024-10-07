const express = require("express");
const router = express.Router();
const rooms = require("../store/rooms");
const activePeers = require("../store/activePeers");

router.get("/api/:socketId", (req, res) => {
  const { socketId } = req.params;
  if (!activePeers.has(socketId)) {
    return res.status(404).json({ status: "error", data: null, msg: "Peer not found" });
  }

  const peer = activePeers.get(socketId);
  const room = rooms.get(peer.roomId);
  const peers = room ? Object.fromEntries(
    [...room.peers].filter(id => activePeers.has(id)).map(id => [id, activePeers.get(id)])
  ) : {};

  res.json({
    status: "ok",
    msg: "Data fetched successfully",
    data: {
      peer: {
        id: peer.id,
        roomId: peer.roomId,
        name: peer.name,
        lastActive: peer.lastActive,
        createdAt: peer.createdAt,
      },
      room: room ? {
        id: room.id,
        peers,
        lastActive: room.lastActive,
        createdAt: room.createdAt,
      } : null,
    },
  });
});

module.exports = router;
