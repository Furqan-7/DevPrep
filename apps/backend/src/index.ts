import dotenv from "dotenv";
import path from "path";
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace("&channel_binding=require", "").replace("channel_binding=require&", "");
}
console.log("[Backend Startup] DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":***@") : "UNDEFINED");

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route";
import interviewRouter from "./routes/interview.route";
import resumeRouter from "./routes/resume.route";
import applicationRouter from "./routes/application.route";
import codingRouter from "./routes/coding.route";
import insightsRouter from "./routes/insights.route";
import adminRouter from "./routes/admin.route";
import publicRouter from "./routes/public.route";

const app = express();
app.use(express.json());
// Parse cookies — required for reading the httpOnly "token" cookie set by
// the Google OAuth callback (used by the /api/auth/me endpoint).
app.use(cookieParser());


app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*",
  credentials: true,
}));


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});


app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/coding', codingRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);



const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is Running on Port ${PORT}`);
});
