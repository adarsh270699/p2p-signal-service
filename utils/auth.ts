import { Request, Response, NextFunction } from "express";
import { API_KEY } from "../config";

/**
 * Express middleware to protect routes with an application-wide API key.
 *
 * The client can supply the key in either:
 *   • `X-API-Key` header
 *   • `api_key` query parameter
 *
 * If `API_KEY` is **not** set in env/config, the middleware becomes a no-op
 * (all requests are allowed). That lets dev environments stay friction-free.
 */
export default function requireApiKey(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // If no key configured, skip protection.
    if (!API_KEY) {
        return next();
    }

    const providedKey =
        (req.headers["x-api-key"] as string | undefined) ||
        (req.query.api_key as string | undefined) ||
        "";

    if (providedKey === API_KEY) {
        return next();
    }

    return res.status(401).json({ status: "error", msg: "Unauthorized" });
}
