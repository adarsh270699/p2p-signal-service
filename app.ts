import express from "express";
import http from "http";
import cors from "cors";
import router from "./router/router";
import "./store/rooms";
import "./store/activePeers";
import initSocket from "./utils/socket";
import { ALLOWED_ORIGINS } from "./config";
import logger from "./utils/logger";

const PORT = process.env.PORT || 30001;
const app = express();

app.use(
    cors({
        origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
    })
);

app.use("/", router);

const server = http.createServer(app);
const io = initSocket(server);

server.listen(PORT, () =>
    logger.info({ msg: "Server is running", port: PORT })
);

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info("Graceful shutdown initiated");
    io.close(() => logger.info("Socket.IO server closed"));
    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("uncaughtException", (err: Error) => {
    logger.error({ err }, "Uncaught exception");
    gracefulShutdown();
});
process.on("unhandledRejection", (reason: unknown) => {
    logger.error({ reason }, "Unhandled promise rejection");
});

// Periodic memory log
setInterval(() => {
    const { rss, heapUsed } = process.memoryUsage();
    logger.info({ rss, heapUsed }, "memory-stats");
}, 10 * 60_000); // every 10 minutes
