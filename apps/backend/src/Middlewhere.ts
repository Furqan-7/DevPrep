import { error } from "console";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();


export function MiddleWhere(req: Request, res: Response, next: NextFunction) {

    const token = req.headers.token;

    if (!token || typeof token !== 'string') {
        return res.status(411).json({
            message: "Invalid Token"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN as string);

        if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
            return res.status(404).json({
                message: "Invalid Token",
            });
        }
        res.locals.userId = decoded.userId;
        next();
    } catch (e) {
        console.log("Failed Here");
        return res.status(403).json({
            message: "Invalid or Expired Token",
            error: e
        });
    }
}

function readToken(req: Request): string | null {
    const header = req.headers.token;
    if (typeof header === "string" && header) return header;
    const auth = req.headers.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7);
    const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.token;
    return typeof cookie === "string" && cookie ? cookie : null;
}

/**
 * Auth for JSON APIs consumed by fetch(): accepts the `token` header (JWT login),
 * `Authorization: Bearer`, or the httpOnly `token` cookie (Google OAuth), and
 * answers 401 so the frontend can redirect to sign-in.
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
    const token = readToken(req);
    if (!token) {
        return res.status(401).json({ message: "Not signed in" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN as string);
        if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const userId = parseInt(String(decoded.userId), 10);
        if (isNaN(userId)) {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.locals.userId = userId;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
