import { Router } from "express";
import { getUsers } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  getUsers
);

export default router;