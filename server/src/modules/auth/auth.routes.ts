import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middlewares/requireAuth.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", requireAuth, AuthController.logout);
router.get("/me", requireAuth, AuthController.me);
 
export default router;
