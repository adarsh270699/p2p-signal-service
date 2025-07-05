import pino from "pino";

const level = (process.env.LOG_LEVEL as pino.Level | undefined) || "info";

const logger = pino({
    level,
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export default logger;
