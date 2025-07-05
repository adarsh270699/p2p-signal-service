import dotenv from "dotenv";

dotenv.config();

// Allowed comma-separated list of origins, e.g. "https://app.example.com,https://www.app.example.com"
export const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS || "")
    .split(/[\,\s]+/)
    .filter(Boolean);

export const PEER_TTL_MS = Number(process.env.PEER_TTL_MS) || 5 * 60 * 1000; // default 5 minutes
export const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 1000;
export const MAX_PEERS_PER_ROOM = Number(process.env.MAX_PEERS_PER_ROOM) || 4;
export const JWT_SECRET = process.env.JWT_SECRET || "changeme_secret";
export const RATE_LIMIT_WINDOW_MS =
    Number(process.env.RATE_LIMIT_WINDOW_MS) || 5000; // 5s
export const RATE_LIMIT_MAX_EVENTS =
    Number(process.env.RATE_LIMIT_MAX_EVENTS) || 50;
export const MAX_PAYLOAD_BYTES =
    Number(process.env.MAX_PAYLOAD_BYTES) || 16 * 1024; // 16KB
