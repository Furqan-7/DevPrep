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