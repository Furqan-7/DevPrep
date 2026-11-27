import { Router } from "express";
import { getSharedReport } from "../controllers/report.controller";

/** Routes that need no sign-in. */
const router: Router = Router();

router.get("/reports/:token", getSharedReport);

export default router;
