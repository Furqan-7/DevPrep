import { Router } from "express";
import { requireUser } from "../Middlewhere";
import { getFrequency, getGaps, getGoal, getRoleFeedback, getSessions, getSummary, putGoal } from "../controllers/feedback.controller";

const routes: Router = Router();

routes.use(requireUser);
routes.get("/summary", getSummary);
routes.get("/sessions", getSessions);
routes.get("/gaps", getGaps);
routes.get("/frequency", getFrequency);
routes.get("/goal", getGoal);
routes.put("/goal", putGoal);
routes.get("/roles/:roleId", getRoleFeedback);

export default routes;
