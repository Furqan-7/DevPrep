import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";
import { getAdminStats, requireAdmin } from "../controllers/admin.controller";

const router: Router = Router();

router.get("/stats", MiddleWhere, requireAdmin, getAdminStats);

export default router;
