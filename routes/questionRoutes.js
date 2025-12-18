// routes/questionsRoutes.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET RANDOM QUESTIONS PER MODULE
router.get("/:module_id", async (req, res) => {
  const { module_id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        id,
        question,
        correct_answer,
        choice_a,
        choice_b,
        choice_c,
        choice_d
      FROM module_questions
      WHERE module_id = ?
      ORDER BY RAND()
      LIMIT 10
      `,
      [module_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching module questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

export default router;
