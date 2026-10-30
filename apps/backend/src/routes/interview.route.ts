import { startInterview, submitAnswer, streamInterviewTurn, interviewFeedback, endInterview } from "../controllers/interview.controller";
import { Router } from "express";
import { MiddleWhere, requireUser } from "../Middlewhere";

const routes: Router = Router();

routes.post('/generate', MiddleWhere, startInterview);
routes.post('/turn-stream', streamInterviewTurn);
routes.post('/answer', MiddleWhere, submitAnswer);
routes.post('/end', requireUser, endInterview);
routes.post('/feedback', requireUser, interviewFeedback);

export default routes;