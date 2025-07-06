import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import activePeers from "../store/activePeers";
import Manager from "./manager";
import { ALLOWED_ORIGINS, PEER_TTL_MS } from "../config";
import { TRANSACTION_EVENTS } from "./constants";
import rooms from "../store/rooms";
import logger from "./logger";
import { peerGauge, roomGauge, txCounter } from "./metrics";
import { Transaction } from "./types";
import { validateTransaction } from "./validator";

const init = (server: HttpServer): IOServer => {
    const manager = new Manager();
    const io = new IOServer(server, {
        cors: { origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false },
    });

    // Debounce room-state emissions
    const roomStateTimeouts = new Map<string, NodeJS.Timeout>();
    const ROOM_STATE_DEBOUNCE_MS = 100;

    const basicPayloadValid = (
        transaction: Transaction,
        socket: Socket
    ): boolean => {
        if (!validateTransaction(transaction)) return false;
        if (transaction.from !== socket.id) return false;
        return true;
    };

    const isValid = (transaction: Transaction, socket: Socket): boolean => {
        if (!basicPayloadValid(transaction, socket)) return false;
        const from = activePeers.get(socket.id);
        const to = activePeers.get(transaction.to);
        return (
            !!from &&
            !!to &&
            !!from.roomId &&
            !!to.roomId &&
            from.roomId === to.roomId
        );
    };

    const executeTransaction = (
        transaction: Transaction,
        socket: Socket
    ): void => {
        if (isValid(transaction, socket)) {
            const fromPeer = activePeers.get(transaction.from);
            if (fromPeer) fromPeer.lastActive = new Date();
            io.to(transaction.to).emit(transaction.event, transaction);
            txCounter.inc({ event: transaction.event });
        }
    };

    const emitRoomState = (roomId: string): void => {
        const room = rooms.get(roomId);
        if (!room) return;
        const peersArr = [...room.peers].filter((id) => activePeers.has(id));
        io.to(roomId).emit("room-state", { roomId, peers: peersArr });
    };

    const debouncedEmitRoomState = (roomId: string): void => {
        if (roomStateTimeouts.has(roomId)) {
            clearTimeout(roomStateTimeouts.get(roomId));
        }
        const timeoutId = setTimeout(() => {
            emitRoomState(roomId);
            roomStateTimeouts.delete(roomId);
        }, ROOM_STATE_DEBOUNCE_MS);
        roomStateTimeouts.set(roomId, timeoutId);
    };

    const handlePeerLeft = (socketId: string, roomId: string): void => {
        io.to(roomId).emit("peer-left", { peerId: socketId });
        debouncedEmitRoomState(roomId);
        if (roomId && !rooms.has(roomId)) roomGauge.dec();
    };

    const handleRoomChange = (
        socket: Socket,
        oldRoomId: string,
        newRoomId: string
    ): void => {
        if (oldRoomId) {
            socket.leave(oldRoomId);
            handlePeerLeft(socket.id, oldRoomId);
        }
        if (newRoomId) {
            socket.join(newRoomId);
            io.to(newRoomId).emit("peer-joined", { peerId: socket.id });
            debouncedEmitRoomState(newRoomId);
        }
    };

    io.on("connection", (socket: Socket) => {
        manager.createPeer(socket.id);
        peerGauge.inc();
        logger.info({ msg: "peer connected", peerId: socket.id });

        socket.on("disconnect", () => {
            const { oldRoomId } = manager.deletePeer(socket.id);
            if (oldRoomId) {
                handlePeerLeft(socket.id, oldRoomId);
            }
            peerGauge.dec();
            logger.info({ msg: "peer disconnected", peerId: socket.id });
        });

        socket.on("create-room", () => {
            const { oldRoomId, newRoomId } = manager.createRoomAndJoin(
                socket.id
            );
            handleRoomChange(socket, oldRoomId, newRoomId);
            roomGauge.inc();
            socket.emit("room-created", { roomId: newRoomId });
        });

        socket.on("join-room", (newRoomId: string) => {
            const { oldRoomId } = manager.joinNewRoom(socket.id, newRoomId);
            handleRoomChange(socket, oldRoomId, newRoomId);
            socket.emit("room-joined", { roomId: newRoomId });
        });

        TRANSACTION_EVENTS.forEach((event) => {
            socket.on(event, (transaction: Transaction) =>
                executeTransaction(transaction, socket)
            );
        });
    });

    // Periodic cleanup of inactive peers
    setInterval(() => {
        const now = Date.now();
        for (const [socketId, peer] of activePeers) {
            if (now - peer.lastActive.getTime() > PEER_TTL_MS) {
                const { oldRoomId } = manager.deletePeer(socketId);
                if (oldRoomId) {
                    handlePeerLeft(socketId, oldRoomId);
                }
                peerGauge.dec();
            }
        }
    }, 60_000);

    return io;
};

export default init;
