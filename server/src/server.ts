import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import pool from "./config/db";
import { setIO } from "./config/socket";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import memberRoutes from "./routes/member.routes";
import taskRoutes from "./routes/task.routes";
import activityRoutes from "./routes/activity.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

const PORT = Number(process.env.PORT) || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

// ============================================
// CORS
// ============================================

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
  })
);

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

app.use(cookieParser());

// ============================================
// HTTP SERVER
// ============================================

const server = http.createServer(app);

// ============================================
// SOCKET.IO
// ============================================

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],
  },
});

setIO(io);

io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id}`
  );

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

// ============================================
// BASIC API TEST
// ============================================

app.get("/", (_req, res) => {
  res.json({
    message: "API is running",
  });
});

app.get("/api/test", (_req, res) => {
  res.json({
    message: "API is running",
  });
});

// ============================================
// DATABASE TEST
// ============================================

app.get(
  "/api/db-test",
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          "SELECT NOW()"
        );

      res.json({
        message:
          "Database connected successfully",
        time: result.rows[0].now,
      });
    } catch (error) {
      console.error(
        "Database connection error:",
        error
      );

      res.status(500).json({
        message:
          "Database connection failed",
      });
    }
  }
);

// ============================================
// API ROUTES
// ============================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/projects",
  memberRoutes
);

app.use(
  "/api/tasks",
  taskRoutes
);

app.use(
  "/api/activities",
  activityRoutes
);

app.use(
  "/api/users",
  userRoutes
);

// ============================================
// 404 HANDLER
// ============================================

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );

  console.log(
    `Allowed client: ${CLIENT_URL}`
  );
});