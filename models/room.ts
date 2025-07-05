import crypto from "crypto";

export default class Room {
    id: string;
    peers: Set<string>;
    lastActive: Date;
    createdAt: Date;
    maxPeers: number;

    constructor(maxPeers: number = Infinity) {
        this.id = crypto.randomUUID();
        this.peers = new Set<string>();
        this.lastActive = this.createdAt = new Date();
        this.maxPeers = maxPeers;
    }

    private updateLastActive(): void {
        this.lastActive = new Date();
    }

    addPeer(socketId: string): boolean {
        if (this.peers.size < this.maxPeers) {
            this.peers.add(socketId);
            this.updateLastActive();
            return true;
        }
        return false;
    }

    removePeer(socketId: string): boolean {
        if (this.peers.delete(socketId)) {
            this.updateLastActive();
            return true;
        }
        return false;
    }
}
