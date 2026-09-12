import { Router } from "express";
import { getActivities } from "../controllers/activity.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  getActivities
);

export default router;