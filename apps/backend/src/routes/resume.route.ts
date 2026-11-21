import express, { Router } from "express";
import { MiddleWhere } from "../Middlewhere";
import { createCoverLetter, createMatch, deleteResume, getResume, uploadResume } from "../controllers/resume.controller";

const router: Router = Router();

router.use(MiddleWhere);
router.get("/", getResume);
router.put("/", express.raw({ type: "application/pdf", limit: "5mb" }), uploadResume);
router.delete("/", deleteResume);
router.post("/match", createMatch);
router.post("/cover-letter", createCoverLetter);

export default router;
