// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { db } from "./db.js";

// ROUTES
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import announcementsRoutes from "./routes/announcementsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import aiVoiceRoutes from "./routes/aiVoice.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";

const app = express();

/* ===================== CORS ===================== */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ===================== MIDDLEWARE ===================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use("/certificates", express.static("certificates"));

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ai", aiVoiceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/certificates", certificateRoutes);

/* ===================== HEALTH CHECK ===================== */
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

/* ===================== ROOT ===================== */
app.get("/", (req, res) => {
  res.send("EduVerso Backend running 🚀");
});

/* ===================== 404 ===================== */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "EduVerso Backend is running 🚀",
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


