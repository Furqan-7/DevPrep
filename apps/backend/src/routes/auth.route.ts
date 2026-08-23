import { Router } from "express";
import { signup, signin, google, googleCallback, me } from "../controllers/auth.controller";


const router: Router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/google', google);
router.get('/google/callback', googleCallback);
// Used by the frontend's useCurrentUser hook to identify Google OAuth users
// (whose JWT lives in an httpOnly cookie, invisible to client-side JS).
router.get('/me', me);

export default router;