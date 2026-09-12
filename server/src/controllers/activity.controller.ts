import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";

export const getActivities = async (
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
          a.*,
          u.name AS user_name,
          p.name AS project_name
        FROM activity_logs a
        LEFT JOIN users u
          ON a.user_id = u.id
        LEFT JOIN projects p
          ON a.project_id = p.id
        ORDER BY a.created_at DESC
        LIMIT 50
        `
      );
    } else if (req.user.role === "PROJECT_MANAGER") {
      result = await pool.query(
        `
        SELECT
          a.*,
          u.name AS user_name,
          p.name AS project_name
        FROM activity_logs a
        LEFT JOIN users u
          ON a.user_id = u.id
        INNER JOIN projects p
          ON a.project_id = p.id
        WHERE p.manager_id = $1
        ORDER BY a.created_at DESC
        LIMIT 50
        `,
        [req.user.userId]
      );
    } else {
      result = await pool.query(
        `
        SELECT
          a.*,
          u.name AS user_name,
          p.name AS project_name
        FROM activity_logs a
        LEFT JOIN users u
          ON a.user_id = u.id
        LEFT JOIN projects p
          ON a.project_id = p.id
        INNER JOIN tasks t
          ON a.task_id = t.id
        WHERE t.assigned_to = $1
        ORDER BY a.created_at DESC
        LIMIT 50
        `,
        [req.user.userId]
      );
    }

    return res.status(200).json({
      activities: result.rows,
    });
  } catch (error) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};