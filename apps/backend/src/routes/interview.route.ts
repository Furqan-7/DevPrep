import { startInterview, submitAnswer, streamInterviewTurn } from "../controllers/interview.controller";
import { createAttempt, createReport, getSession, listSessions } from "../controllers/report.controller";
import { Router } from "express";
import { MiddleWhere } from "../Middlewhere";

const routes: Router = Router();

routes.post('/generate', MiddleWhere, startInterview);
routes.post('/turn-stream', streamInterviewTurn);
routes.post('/answer', MiddleWhere, submitAnswer);

// Post-interview feedback
routes.get('/sessions', MiddleWhere, listSessions);
routes.get('/sessions/:id', MiddleWhere, getSession);
routes.post('/sessions/:id/report', MiddleWhere, createReport);
routes.post('/questions/:id/attempts', MiddleWhere, createAttempt);

export default routes;
