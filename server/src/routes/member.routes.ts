import { Router } from "express";

import {
  addProjectMember,
  getProjectMembers,
} from "../controllers/member.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/:projectId/members",
  authenticateToken,
  getProjectMembers
);

router.post(
  "/:projectId/members",
  authenticateToken,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  addProjectMember
);

export default router;