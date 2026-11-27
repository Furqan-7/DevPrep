import type { Request, Response } from "express";
import type { ZodType } from "zod";

/** The signed-in user's id, set by MiddleWhere. */
export const userIdOf = (res: Response) => Number(res.locals.userId);

/** A positive integer route parameter, or null. */
export function intParam(req: Request, name: string): number | null {
    const n = Number(req.params[name]);
    return Number.isInteger(n) && n > 0 ? n : null;
}

/** Validates req.body, answering 400 with the first issue when it doesn't match. */
export function parseBody<T>(schema: ZodType<T>, req: Request, res: Response): T | null {
    const parsed = schema.safeParse(req.body);
    if (parsed.success) return parsed.data;
    const issue = parsed.error.issues[0];
    res.status(400).json({ success: false, message: issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request." });
    return null;
}

/** Formats a date as YYYY-MM-DD in the given IANA time zone (UTC if it isn't valid). */
export function dayKey(date: Date, timeZone: string): string {
    try {
        return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    } catch {
        return date.toISOString().slice(0, 10);
    }
}
