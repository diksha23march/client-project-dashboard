import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";

// ADD MEMBER TO PROJECT
// ADMIN or PROJECT_MANAGER

export const addProjectMember = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const projectId = Number(req.params.projectId);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Check project exists.
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

    // Project Manager can manage only their own project.
    if (
      req.user.role === "PROJECT_MANAGER" &&
      project.manager_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Check user exists.
    const userResult = await pool.query(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent duplicate membership.
    const existingMember = await pool.query(
      `
      SELECT *
      FROM project_members
      WHERE project_id = $1
      AND user_id = $2
      `,
      [projectId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({
        message: "User is already a project member",
      });
    }

    await pool.query(
      `
      INSERT INTO project_members (
        project_id,
        user_id
      )
      VALUES ($1, $2)
      `,
      [projectId, userId]
    );

    return res.status(201).json({
      message: "Project member added successfully",
      user: userResult.rows[0],
    });
  } catch (error) {
    console.error("Add project member error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET PROJECT MEMBERS

export const getProjectMembers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const projectId = Number(req.params.projectId);

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

    if (req.user.role === "DEVELOPER") {
      const membership = await pool.query(
        `
        SELECT *
        FROM project_members
        WHERE project_id = $1
        AND user_id = $2
        `,
        [projectId, req.user.userId]
      );

      if (membership.rows.length === 0) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }

    const members = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        pm.joined_at
      FROM project_members pm
      INNER JOIN users u
        ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at ASC
      `,
      [projectId]
    );

    return res.status(200).json({
      members: members.rows,
    });
  } catch (error) {
    console.error("Get project members error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};