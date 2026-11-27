import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";
import { listProblemProgress, updateProblemProgress } from "../controllers/progress.controller";

const router: Router = Router();

router.use(MiddleWhere);
router.get("/problems", listProblemProgress);
router.put("/problems/:problemId", updateProblemProgress);

export default router;
