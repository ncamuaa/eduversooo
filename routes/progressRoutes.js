// routes/progressRoutes.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* -----------------------------------------
   GET PROGRESS OF A MODULE FOR A USER
   GET /progress/:userId/:moduleId
------------------------------------------ */
router.get("/:userId/:moduleId", async (req, res) => {
  const { userId, moduleId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM module_progress WHERE user_id = ? AND module_id = ?",
      [userId, moduleId]
    );

    if (!rows.length) {
      return res.json({ exists: false, progress: 0, completed: 0 });
    }

    res.json({ exists: true, ...rows[0] });
  } catch (err) {
    console.error("GET progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -----------------------------------------
   SAVE / UPDATE PROGRESS
   POST /progress/save
   body: { user_id, module_id, progress, completed }
------------------------------------------ */
router.post("/save", async (req, res) => {
  const { user_id, module_id, progress, completed } = req.body;

  if (!user_id || !module_id) {
    return res.status(400).json({ error: "Missing user_id or module_id" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id FROM module_progress WHERE user_id = ? AND module_id = ?",
      [user_id, module_id]
    );

    if (!rows.length) {
      // INSERT
      await db.query(
        `INSERT INTO module_progress (user_id, module_id, progress, completed)
         VALUES (?, ?, ?, ?)`,
        [user_id, module_id, progress ?? 0, completed ? 1 : 0]
      );
    } else {
      // UPDATE
      await db.query(
        `UPDATE module_progress
         SET progress = ?, completed = ?, updated_at = NOW()
         WHERE user_id = ? AND module_id = ?`,
        [progress ?? 0, completed ? 1 : 0, user_id, module_id]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("SAVE progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
