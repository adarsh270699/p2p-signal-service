import Peer from "../models/peer";
import Room from "../models/room";
import rooms from "../store/rooms";
import activePeers from "../store/activePeers";
import { MAX_ROOMS, MAX_PEERS_PER_ROOM } from "../config";

export default class Manager {
    createPeer(socketId: string): boolean {
        const peer = new Peer(socketId);
        activePeers.set(socketId, peer);
        return true;
    }

    private removeFromRoom(peer: Peer): void {
        const room = rooms.get(peer.roomId) as Room | undefined;
        if (room) {
            room.removePeer(peer.id);
            peer.roomId = "";
            if (room.peers.size === 0) {
                rooms.delete(room.id);
            }
        }
    }

    private addToRoom(peer: Peer, room: Room): void {
        if (room.peers.size < room.maxPeers) {
            room.peers.add(peer.id);
            peer.roomId = room.id;
            rooms.set(room.id, room);
        }
    }

    createRoomAndJoin(socketId: string) {
        const peer = activePeers.get(socketId) as Peer | undefined;
        if (!peer || rooms.size >= MAX_ROOMS) {
            return { socketId, newRoomId: "", oldRoomId: "" };
        }

        peer.lastActive = new Date();
        const oldRoomId = peer.roomId;
        this.removeFromRoom(peer);

        const newRoom = new Room(MAX_PEERS_PER_ROOM);
        this.addToRoom(peer, newRoom);

        return { socketId, newRoomId: newRoom.id, oldRoomId };
    }

    joinNewRoom(socketId: string, newRoomId: string) {
        const peer = activePeers.get(socketId) as Peer | undefined;
        if (!peer) {
            return { socketId, newRoomId: "", oldRoomId: "" };
        }
        peer.lastActive = new Date();
        const oldRoomId = peer.roomId;
        this.removeFromRoom(peer);

        const newRoom = rooms.get(newRoomId) as Room | undefined;
        if (newRoom) {
            this.addToRoom(peer, newRoom);
        } else {
            newRoomId = "";
        }

        return { socketId, newRoomId, oldRoomId };
    }

    deletePeer(socketId: string) {
        const peer = activePeers.get(socketId) as Peer | undefined;
        if (!peer) {
            return { socketId, oldRoomId: "" };
        }

        const room = rooms.get(peer.roomId) as Room | undefined;
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
}
