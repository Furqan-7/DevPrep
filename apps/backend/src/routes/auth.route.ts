import { Router } from "express";
import { signup, signin, google, googleCallback } from "../controllers/auth.controller";


const router: Router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/google', google);
router.get('/google/callback', googleCallback);

export default router;