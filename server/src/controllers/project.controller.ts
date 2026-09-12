import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";

// CREATE PROJECT
// ADMIN and PROJECT_MANAGER only

export const createProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, description, managerId } = req.body;

    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const createdBy = req.user.userId;

    let finalManagerId = managerId || null;

    // Project Manager automatically manages
    // the project they create.
    if (req.user.role === "PROJECT_MANAGER") {
      finalManagerId = req.user.userId;
    }

    // Validate selected manager.
    if (finalManagerId) {
      const managerResult = await pool.query(
        `
        SELECT id, role
        FROM users
        WHERE id = $1
        `,
        [finalManagerId]
      );

      if (managerResult.rows.length === 0) {
        return res.status(404).json({
          message: "Manager not found",
        });
      }

      if (managerResult.rows[0].role !== "PROJECT_MANAGER") {
        return res.status(400).json({
          message: "Selected user is not a Project Manager",
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO projects (
        name,
        description,
        created_by,
        manager_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        name,
        description || null,
        createdBy,
        finalManagerId,
      ]
    );

    return res.status(201).json({
      message: "Project created successfully",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET PROJECTS
// Role-based visibility

export const getProjects = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const userId = req.user.userId;
    const role = req.user.role;

    let result;

    // Admin sees every project.
    if (role === "ADMIN") {
      result = await pool.query(
        `
        SELECT
          p.*,
          u.name AS manager_name
        FROM projects p
        LEFT JOIN users u
          ON p.manager_id = u.id
        ORDER BY p.created_at DESC
        `
      );
    }

    // Project Manager only sees projects they manage.
    else if (role === "PROJECT_MANAGER") {
      result = await pool.query(
        `
        SELECT
          p.*,
          u.name AS manager_name
        FROM projects p
        LEFT JOIN users u
          ON p.manager_id = u.id
        WHERE p.manager_id = $1
        ORDER BY p.created_at DESC
        `,
        [userId]
      );
    }

    // Developer only sees projects they are a member of.
    else if (role === "DEVELOPER") {
      result = await pool.query(
        `
        SELECT
          p.*,
          u.name AS manager_name
        FROM projects p
        INNER JOIN project_members pm
          ON p.id = pm.project_id
        LEFT JOIN users u
          ON p.manager_id = u.id
        WHERE pm.user_id = $1
        ORDER BY p.created_at DESC
        `,
        [userId]
      );
    } else {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      projects: result.rows,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET SINGLE PROJECT

export const getProjectById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const projectId = Number(req.params.id);
    const userId = req.user.userId;
    const role = req.user.role;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    let result;

    if (role === "ADMIN") {
      result = await pool.query(
        `
        SELECT *
        FROM projects
        WHERE id = $1
        `,
        [projectId]
      );
    } else if (role === "PROJECT_MANAGER") {
      result = await pool.query(
        `
        SELECT *
        FROM projects
        WHERE id = $1
        AND manager_id = $2
        `,
        [projectId, userId]
      );
    } else {
      result = await pool.query(
        `
        SELECT p.*
        FROM projects p
        INNER JOIN project_members pm
          ON p.id = pm.project_id
        WHERE p.id = $1
        AND pm.user_id = $2
        `,
        [projectId, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    return res.status(200).json({
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};