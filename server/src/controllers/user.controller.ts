import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";

// ============================================
// GET USERS
// ADMIN -> ALL USERS
// PROJECT_MANAGER -> DEVELOPERS ONLY
// DEVELOPER -> NO ACCESS
// ============================================

export const getUsers = async (
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
          id,
          name,
          email,
          role,
          created_at
        FROM users
        ORDER BY name ASC
        `
      );
    } else if (req.user.role === "PROJECT_MANAGER") {
      result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          created_at
        FROM users
        WHERE role = 'DEVELOPER'
        ORDER BY name ASC
        `
      );
    } else {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};