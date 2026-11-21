import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";
import { getInsights } from "../controllers/insights.controller";

const router: Router = Router();

router.get("/", MiddleWhere, getInsights);

export default router;
