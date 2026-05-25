import { Router } from "express";
import { StoreController } from "./store.controller";
import { requireAuth } from "../../middlewares/requireAuth.middleware";
import { adminOnly } from "../../middlewares/adminOnly.middleware";

const router = Router();

router.post("/", requireAuth, adminOnly, StoreController.create);
router.get("/", requireAuth, adminOnly, StoreController.list);

export default router;
