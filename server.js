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

/* =====================================================
   ✅ CORS (RAILWAY + APK + NETLIFY SAFE)
===================================================== */
app.use(
  cors({
    origin: "*", // allow mobile APK + admin web
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* =====================================================
   MIDDLEWARE
===================================================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use("/certificates", express.static("certificates"));

/* =====================================================
   ROUTES
===================================================== */
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

/* =====================================================
   HEALTH CHECK (IMPORTANT FOR RAILWAY)
===================================================== */
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

/* =====================================================
   404 HANDLER
===================================================== */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* =====================================================
   START SERVER (RAILWAY REQUIRED)
===================================================== */

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EduVerso Backend running on port ${PORT}`);
});
