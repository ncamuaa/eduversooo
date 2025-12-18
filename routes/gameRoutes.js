import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ---------------------------------------------------------
   GET RANDOM QUESTIONS
---------------------------------------------------------- */
router.get("/questions/:module_id", async (req, res) => {
  const { module_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT id, module_id, question, correct_answer,
              choice_a, choice_b, choice_c, choice_d
       FROM module_questions
       WHERE module_id = ?
       ORDER BY RAND()
       LIMIT 10`,
      [Number(module_id)]
    );

    res.json({ questions: rows });
  } catch (err) {
    console.error("❌ Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

/* ---------------------------------------------------------
   SAVE SCORE + APPLY XP
---------------------------------------------------------- */
router.post("/save-score", async (req, res) => {
  let { student_id, module_id, game_name, correct, total } = req.body;

  // Force to numbers
  student_id = Number(student_id);
  module_id = Number(module_id);
  correct = Number(correct);
  total = Number(total);

  console.log("📩 Incoming Score:", { student_id, module_id, correct, total });

  if (!student_id || !module_id || !game_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const percentage = Math.round((correct / total) * 100);

  // ⭐ XP RULES
  let xpEarned = 0;
  if (percentage >= 90) xpEarned = 30;
  else if (percentage >= 80) xpEarned = 20;
  else if (percentage >= 60) xpEarned = 15;
  else if (percentage >= 40) xpEarned = 10;
  else xpEarned = 5;

  xpEarned = Number(xpEarned) || 0;  // 🟢 Prevent NULL

  console.log("🎯 XP Earned:", xpEarned);

  try {
    /* 1️⃣ INSERT score into game_scores */
    const [insertResult] = await db.query(
      `INSERT INTO game_scores 
        (student_id, module_id, game_name, correct, total, percentage, xp_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        module_id,
        game_name,
        correct,
        total,
        percentage,
        xpEarned  // 🟢 ensures numeric insert, not NULL
      ]
    );

    console.log("✅ Game Score Insert Result:", insertResult);

    /* 2️⃣ UPDATE user XP */
    const [xpUpdate] = await db.query(
      `UPDATE user_table 
       SET xp = xp + ?
       WHERE id = ?`,
      [xpEarned, student_id]
    );

    console.log("🔥 XP Update Result:", xpUpdate);

    res.json({
      message: "Score saved + XP granted!",
      xp_earned: xpEarned,
      percentage,
    });

  } catch (err) {
    console.error("❌ Error saving score:", err);
    res.status(500).json({ error: "Failed to save score" });
  }
});

/* ---------------------------------------------------------
   FETCH FINAL SCORE (LATEST ATTEMPT)
---------------------------------------------------------- */
router.get("/final-score/:student_id/:module_id", async (req, res) => {
  const student_id = Number(req.params.student_id);
  const module_id = Number(req.params.module_id);

  try {
    const [rows] = await db.query(
      `SELECT correct, total, percentage, xp_earned
       FROM game_scores
       WHERE student_id = ? AND module_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [student_id, module_id]
    );

    if (rows.length === 0) {
      return res.json({
        student_id,
        module_id,
        correct: 0,
        total: 0,
        percentage: 0,
        xp_earned: 0,
        status: "fail",
      });
    }

    const { correct, total, percentage, xp_earned } = rows[0];

    res.json({
      student_id,
      module_id,
      correct,
      total,
      percentage,
      xp_earned,
      status: percentage >= 80 ? "pass" : "fail",
    });

  } catch (err) {
    console.error("❌ Error fetching final score:", err);
    res.status(500).json({ error: "Failed to fetch final score" });
  }
});

export default router;
