import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";
import { createApplication, deleteApplication, listApplications, updateApplication } from "../controllers/application.controller";

const router: Router = Router();

router.use(MiddleWhere);
router.get("/", listApplications);
router.post("/", createApplication);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
