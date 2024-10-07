const activePeers = require("../store/activePeers");
const Manager = require("./manager");

const init = (server) => {
  const manager = new Manager();
  const io = require("socket.io")(server, { cors: { origin: "*" } });

  const isValid = (transaction, socket) => {
    const from = activePeers.get(socket.id);
    const to = activePeers.get(transaction.to);
    return from && to && from.roomId && to.roomId && from.roomId === to.roomId;
  };

  const executeTransaction = (transaction, socket) => {
    if (isValid(transaction, socket)) {
      activePeers.get(transaction.from).lastActive = new Date();
      io.to(transaction.to).emit(transaction.event, transaction);
    }
  };

  const handleRoomChange = (socket, oldRoomId, newRoomId) => {
    socket.leave(oldRoomId);
    io.to(oldRoomId).emit("room-updated");
    if (newRoomId) {
      socket.join(newRoomId);
      io.to(newRoomId).emit("room-updated");
    }
  };

  io.on("connection", (socket) => {
    manager.createPeer(socket.id);

    socket.on("disconnect", () => {
      const { oldRoomId } = manager.deletePeer(socket.id);
      io.to(oldRoomId).emit("room-updated");
    });

    socket.on("create-room", () => {
      const { oldRoomId, newRoomId } = manager.createRoomAndJoin(socket.id);
      handleRoomChange(socket, oldRoomId, newRoomId);
    });

    socket.on("join-room", (newRoomId) => {
      const { oldRoomId } = manager.joinNewRoom(socket.id, newRoomId);
      handleRoomChange(socket, oldRoomId, newRoomId);
    });

    const transactionEvents = [
      "init-transfer-sender",
      "init-transfer-reciever",
      "offer",
      "answer",
      "add-ice-candidates",
    ];

    transactionEvents.forEach(event => {
      socket.on(event, (transaction) => executeTransaction(transaction, socket));
    });
  });

  return io;
};

module.exports = init;
