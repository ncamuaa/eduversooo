import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ============================
   GET ALL FEEDBACK
============================ */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM peer_feedback ORDER BY id DESC");
    res.json({ feedback: rows });
  } catch (err) {
    console.error("FEEDBACK GET ERROR:", err);
    res.status(500).json({ error: "Failed to load feedback" });
  }
});

/* ============================
   ADD FEEDBACK
============================ */
router.post("/", async (req, res) => {
  try {
    const { title, text, student, stars, tag } = req.body;

    if (!title || !text || !student) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await db.query(
      "INSERT INTO peer_feedback (title, text, student, stars, tag, date) VALUES (?, ?, ?, ?, ?, NOW())",
      [title, text, student, stars || 5, tag || "General"]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("FEEDBACK POST ERROR:", err);
    res.status(500).json({ error: "Failed to add feedback" });
  }
});

/* ============================
   DELETE FEEDBACK
============================ */
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM peer_feedback WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE FEEDBACK ERROR:", err);
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

export default router;
