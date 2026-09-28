import { startInterview, submitAnswer, streamInterviewTurn, interviewFeedback } from "../controllers/interview.controller";
import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";

const routes: Router = Router();

routes.post('/generate', MiddleWhere, startInterview);
routes.post('/turn-stream', streamInterviewTurn);
routes.post('/answer', MiddleWhere, submitAnswer);
routes.post('/feedback', MiddleWhere, interviewFeedback);

export default routes;