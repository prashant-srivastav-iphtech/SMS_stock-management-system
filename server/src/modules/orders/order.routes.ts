import { Router } from "express";
import { OrderController } from "./order.controller";
import { requireAuth } from "../../middlewares/requireAuth.middleware";
import { adminOnly } from "../../middlewares/adminOnly.middleware";

const router = Router();

router.get("/admin", requireAuth, adminOnly, OrderController.adminList);
router.post("/checkout", requireAuth, OrderController.checkout);
router.get("/", requireAuth, OrderController.list);
router.get("/:id", requireAuth, OrderController.getById);
router.patch("/:id/status", requireAuth, adminOnly, OrderController.updateStatus);

export default router;
