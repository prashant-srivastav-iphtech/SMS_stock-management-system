import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { requireAuth } from "../../middlewares/requireAuth.middleware";
import { adminOnly } from "../../middlewares/adminOnly.middleware";

const router = Router();

router.post("/", requireAuth, adminOnly, OrganizationController.create);
router.get("/", requireAuth, adminOnly, OrganizationController.list);

export default router;
