import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";
import { createSubmission, listProblems, listSubmissions } from "../controllers/coding.controller";

const router: Router = Router();

router.get("/problems", listProblems);
router.get("/submissions", MiddleWhere, listSubmissions);
router.post("/submissions", MiddleWhere, createSubmission);

export default router;
