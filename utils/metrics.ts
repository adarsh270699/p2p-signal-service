import client from "prom-client";

// Collect default Node metrics (memory, event loop lag, etc.)
client.collectDefaultMetrics({ prefix: "p2p_" });

// Custom metrics
export const peerGauge = new client.Gauge({
    name: "p2p_active_peers",
    help: "Current number of active peers",
});

export const roomGauge = new client.Gauge({
    name: "p2p_rooms",
    help: "Current number of rooms",
});

export const txCounter = new client.Counter({
    name: "p2p_transactions_total",
    help: "Total signaling transactions",
    labelNames: ["event"],
});

export const registry = client.register;
