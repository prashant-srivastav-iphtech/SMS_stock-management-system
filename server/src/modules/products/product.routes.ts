import { Router } from "express";
import { ProductController } from "./product.controller";
import { requireAuth } from "../../middlewares/requireAuth.middleware";
import { adminOnly } from "../../middlewares/adminOnly.middleware";

const router = Router();

router.post("/", requireAuth, adminOnly, ProductController.create);
router.get("/", ProductController.list);
router.get("/:id", ProductController.getById);

export default router;
