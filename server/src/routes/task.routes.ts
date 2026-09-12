import { Router } from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/task.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// Everyone gets only tasks they are allowed to see
router.get(
  "/",
  authenticateToken,
  getTasks
);

router.get(
  "/:id",
  authenticateToken,
  getTaskById
);

// Admin and PM create tasks
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  createTask
);

// Admin and PM edit task details
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  updateTask
);

// Admin, PM and Developer can update status.
// Controller ensures Developer can modify only their own task.
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  updateTaskStatus
);

// Admin and PM delete tasks
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  deleteTask
);

export default router;