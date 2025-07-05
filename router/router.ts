import express, { Request, Response } from "express";
import rooms from "../store/rooms";
import activePeers from "../store/activePeers";
import logger from "../utils/logger";
import rateLimit from "express-rate-limit";
import { registry } from "../utils/metrics";

const router = express.Router();

// Apply simple rate limiter to all API routes
router.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Log each request
router.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on("finish", () => {
        logger.debug({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - start,
        });
    });
    next();
});

// Health check
router.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", msg: "alive" });
});

// Get peer information
router.get("/api/peers/:socketId", (req: Request, res: Response) => {
    const { socketId } = req.params as { socketId: string };
    if (!activePeers.has(socketId)) {
        return res.status(404).json({ status: "error", msg: "Peer not found" });
    }

    const { id, roomId, name, lastActive, createdAt } =
        activePeers.get(socketId)!;
    res.json({
        status: "ok",
        data: { id, roomId, name, lastActive, createdAt },
    });
});

// Get room information
router.get("/api/rooms/:roomId", (req: Request, res: Response) => {
    const { roomId } = req.params as { roomId: string };
    if (!rooms.has(roomId)) {
        return res.status(404).json({ status: "error", msg: "Room not found" });
    }

    const room = rooms.get(roomId)!;
    const peers = Object.fromEntries(
        [...room.peers]
            .filter((id) => activePeers.has(id))
            .map((id) => [id, activePeers.get(id)])
    );

    res.json({
        status: "ok",
        data: {
            id: room.id,
            peers,
            lastActive: room.lastActive,
            createdAt: room.createdAt,
        },
    });
});

// Prometheus metrics endpoint
router.get("/metrics", async (_req: Request, res: Response) => {
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
});

router.get("/api/rooms", (req: Request, res: Response) => {
    const roomIds = Array.from(rooms.keys());
    res.json({
        status: "ok",
        data: roomIds,
    });
});

router.get("/api/peers", (req: Request, res: Response) => {
    const peerIds = Array.from(activePeers.keys());
    res.json({
        status: "ok",
        data: peerIds,
    });
});

export default router;
