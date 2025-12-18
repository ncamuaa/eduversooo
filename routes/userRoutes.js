import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================
   GET USER BY ID (REAL ACTIVITY TRACKING)
   GET /users/:id
============================================ */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    // 🔐 Make sure user only accesses their own data
    if (Number(req.params.id) !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ UPDATE REAL ACTIVITY TIME
    await db.query(
      "UPDATE user_table SET last_login = NOW() WHERE id = ?",
      [req.userId]
    );

    const [[user]] = await db.query(
      "SELECT * FROM user_table WHERE id = ?",
      [req.userId]
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================
   UPDATE AVATAR
============================================ */
router.put("/:id/avatar", authMiddleware, async (req, res) => {
  const { avatar } = req.body;

  if (!avatar)
    return res.status(400).json({ message: "Avatar path required" });

  if (Number(req.params.id) !== req.userId)
    return res.status(403).json({ message: "Forbidden" });

  try {
    await db.query(
      "UPDATE user_table SET avatar = ? WHERE id = ?",
      [avatar, req.userId]
    );

    res.json({ message: "Avatar updated" });
  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================
   UPDATE XP + STREAK
============================================ */
router.put("/:id/progress", authMiddleware, async (req, res) => {
  const { xp, streak } = req.body;

  if (xp == null || streak == null)
    return res.status(400).json({ message: "xp and streak required" });

  if (Number(req.params.id) !== req.userId)
    return res.status(403).json({ message: "Forbidden" });

  try {
    await db.query(
      "UPDATE user_table SET xp = ?, streak = ? WHERE id = ?",
      [xp, streak, req.userId]
    );

    res.json({ message: "Progress updated" });
  } catch (err) {
    console.error("Progress update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
