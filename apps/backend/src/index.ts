import express from "express";
import dotenv from "dotenv";
import path from "path";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
config();
// Load DATABASE_URL from the database package .env at runtime
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });

import cors from "cors";
import authRouter from "./routes/auth.route";
import interviewRouter from "./routes/interview.route";

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



const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is Running on Port ${PORT}`);
});
