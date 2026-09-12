import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../config/socket";

// ============================================
// HELPER: ADD ACTIVITY LOG
// ============================================

const addActivityLog = async (
  userId: number,
  projectId: number,
  taskId: number | null,
  action: string,
  details: string
) => {
  await pool.query(
    `
    INSERT INTO activity_logs (
      user_id,
      project_id,
      task_id,
      action,
      details
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [userId, projectId, taskId, action, details]
  );
};

// ============================================
// CREATE TASK
// ADMIN / PROJECT_MANAGER
// ============================================

export const createTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const {
      title,
      description,
      priority,
      projectId,
      assignedTo,
      dueDate,
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        message: "Title and project ID are required",
      });
    }

    const projectResult = await pool.query(
      `
      SELECT id, manager_id
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    if (
      req.user.role === "PROJECT_MANAGER" &&
      project.manager_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (assignedTo) {
      const developerResult = await pool.query(
        `
        SELECT id, role
        FROM users
        WHERE id = $1
        `,
        [assignedTo]
      );

      if (developerResult.rows.length === 0) {
        return res.status(404).json({
          message: "Assigned user not found",
        });
      }

      if (developerResult.rows[0].role !== "DEVELOPER") {
        return res.status(400).json({
          message: "Tasks can only be assigned to Developers",
        });
      }

      const membership = await pool.query(
        `
        SELECT *
        FROM project_members
        WHERE project_id = $1
        AND user_id = $2
        `,
        [projectId, assignedTo]
      );

      if (membership.rows.length === 0) {
        return res.status(400).json({
          message: "Developer is not a member of this project",
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO tasks (
        title,
        description,
        priority,
        project_id,
        assigned_to,
        created_by,
        due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        title,
        description || null,
        priority || "MEDIUM",
        projectId,
        assignedTo || null,
        req.user.userId,
        dueDate || null,
      ]
    );

    const task = result.rows[0];

    await addActivityLog(
      req.user.userId,
      projectId,
      task.id,
      "TASK_CREATED",
      `Task "${task.title}" was created`
    );

    getIO().emit("task-created", task);

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ============================================
// GET TASKS
// ADMIN -> ALL
// PM -> MANAGED PROJECT TASKS
// DEV -> ASSIGNED TASKS ONLY
// ============================================

export const getTasks = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    let result;

    if (req.user.role === "ADMIN") {
      result = await pool.query(
        `
        SELECT
          t.*,
          p.name AS project_name,
          u.name AS assigned_user_name
        FROM tasks t
        INNER JOIN projects p
          ON t.project_id = p.id
        LEFT JOIN users u
          ON t.assigned_to = u.id
        ORDER BY t.created_at DESC
        `
      );
    } else if (req.user.role === "PROJECT_MANAGER") {
      result = await pool.query(
        `
        SELECT
          t.*,
          p.name AS project_name,
          u.name AS assigned_user_name
        FROM tasks t
        INNER JOIN projects p
          ON t.project_id = p.id
        LEFT JOIN users u
          ON t.assigned_to = u.id
        WHERE p.manager_id = $1
        ORDER BY t.created_at DESC
        `,
        [req.user.userId]
      );
    } else if (req.user.role === "DEVELOPER") {
      result = await pool.query(
        `
        SELECT
          t.*,
          p.name AS project_name
        FROM tasks t
        INNER JOIN projects p
          ON t.project_id = p.id
        WHERE t.assigned_to = $1
        ORDER BY t.created_at DESC
        `,
        [req.user.userId]
      );
    } else {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      tasks: result.rows,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ============================================
// GET ONE TASK
// ============================================

export const getTaskById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const result = await pool.query(
      `
      SELECT
        t.*,
        p.manager_id
      FROM tasks t
      INNER JOIN projects p
        ON t.project_id = p.id
      WHERE t.id = $1
      `,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const task = result.rows[0];

    if (
      req.user.role === "PROJECT_MANAGER" &&
      task.manager_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (
      req.user.role === "DEVELOPER" &&
      task.assigned_to !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ============================================
// UPDATE TASK DETAILS
// ADMIN / PROJECT_MANAGER
// ============================================

export const updateTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const {
      title,
      description,
      priority,
      assignedTo,
      dueDate,
    } = req.body;

    const existingResult = await pool.query(
      `
      SELECT
        t.*,
        p.manager_id
      FROM tasks t
      INNER JOIN projects p
        ON t.project_id = p.id
      WHERE t.id = $1
      `,
      [taskId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const existingTask = existingResult.rows[0];

    if (
      req.user.role === "PROJECT_MANAGER" &&
      existingTask.manager_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const membership = await pool.query(
        `
        SELECT u.id
        FROM users u
        INNER JOIN project_members pm
          ON u.id = pm.user_id
        WHERE u.id = $1
        AND u.role = 'DEVELOPER'
        AND pm.project_id = $2
        `,
        [assignedTo, existingTask.project_id]
      );

      if (membership.rows.length === 0) {
        return res.status(400).json({
          message: "Assigned Developer is not a member of this project",
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        assigned_to = COALESCE($4, assigned_to),
        due_date = COALESCE($5, due_date),
        updated_by = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        title ?? null,
        description ?? null,
        priority ?? null,
        assignedTo ?? null,
        dueDate ?? null,
        req.user.userId,
        taskId,
      ]
    );

    const updatedTask = result.rows[0];

    await addActivityLog(
      req.user.userId,
      existingTask.project_id,
      taskId,
      "TASK_UPDATED",
      `Task "${updatedTask.title}" was updated`
    );

    getIO().emit("task-updated", updatedTask);

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ============================================
// UPDATE TASK STATUS
// ADMIN / PROJECT_MANAGER / DEVELOPER
// DEV CAN ONLY UPDATE OWN TASK
// ============================================

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const taskId = Number(req.params.id);
    const { status } = req.body;

    if (Number.isNaN(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const allowedStatuses = [
      "TODO",
      "IN_PROGRESS",
      "COMPLETED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status",
      });
    }

    const taskResult = await pool.query(
      `
      SELECT
        t.*,
        p.manager_id
      FROM tasks t
      INNER JOIN projects p
        ON t.project_id = p.id
      WHERE t.id = $1
      `,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const task = taskResult.rows[0];

    if (
      req.user.role === "PROJECT_MANAGER" &&
      task.manager_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (
      req.user.role === "DEVELOPER" &&
      task.assigned_to !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        status = $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [
        status,
        req.user.userId,
        taskId,
      ]
    );

    const updatedTask = result.rows[0];

    await addActivityLog(
      req.user.userId,
      task.project_id,
      taskId,
      "TASK_STATUS_CHANGED",
      `Task status changed to ${status}`
    );

    getIO().emit("task-status-updated", updatedTask);

    return res.status(200).json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ============================================
// DELETE TASK
// ADMIN / PROJECT_MANAGER
// ============================================

export const deleteTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const taskResult = await pool.query(
      `
      SELECT
        t.*,
        p.manager_id
      FROM tasks t
      INNER JOIN projects p
        ON t.project_id = p.id
      WHERE t.id = $1
      `,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const task = taskResult.rows[0];

    if (
      req.user.role === "PROJECT_MANAGER" &&
      task.manager_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await addActivityLog(
      req.user.userId,
      task.project_id,
      null,
      "TASK_DELETED",
      `Task "${task.title}" was deleted`
    );

    await pool.query(
      `
      DELETE FROM tasks
      WHERE id = $1
      `,
      [taskId]
    );

    getIO().emit("task-deleted", {
      taskId,
    });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};