// routes/announcementsRoutes.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ===============================
    GET ALL ANNOUNCEMENTS
=============================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM announcements ORDER BY created_at DESC"
    );

    res.json({ announcements: rows });
  } catch (err) {
    console.error("ANNOUNCEMENT GET ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
    CREATE ANNOUNCEMENT
=============================== */
router.post("/", async (req, res) => {
  const { title, body, category } = req.body;

  if (!title || !body)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const [result] = await db.query(
      `INSERT INTO announcements (title, body, category, is_new)
       VALUES (?, ?, ?, 1)`,
      [title, body, category]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("ANNOUNCEMENT CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
    EDIT ANNOUNCEMENT
=============================== */
router.put("/:id", async (req, res) => {
  const { title, body, category } = req.body;

  try {
    await db.query(
      `UPDATE announcements
       SET title = ?, body = ?, category = ?, is_new = 1
       WHERE id = ?`,
      [title, body, category, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ANNOUNCEMENT UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
    DELETE ANNOUNCEMENT
=============================== */
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM announcements WHERE id = ?", [
      req.params.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("ANNOUNCEMENT DELETE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
