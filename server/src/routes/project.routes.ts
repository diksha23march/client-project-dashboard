import { Router } from "express";

import {
  createProject,
  getProjects,
  getProjectById,
} from "../controllers/project.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// Get projects visible to logged-in user.
router.get(
  "/",
  authenticateToken,
  getProjects
);

// Get one project.
router.get(
  "/:id",
  authenticateToken,
  getProjectById
);

// Admin and Project Manager can create projects.
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  createProject
);

export default router;