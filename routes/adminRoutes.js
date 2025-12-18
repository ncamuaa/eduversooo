import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ============================================
   TOTAL STUDENTS
============================================ */
router.get("/total-students", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS total FROM user_table"
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ total: 0 });
  }
});

/* ============================================
   ACTIVE TODAY (students who played today)
============================================ */
router.get("/active-today", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(DISTINCT student_id) AS activeToday
      FROM game_scores
      WHERE DATE(created_at) = CURDATE()
    `);

    res.json({ activeToday: rows[0].activeToday });
  } catch (err) {
    console.error(err);
    res.status(500).json({ activeToday: 0 });
  }
});

/* ============================================
   AVERAGE XP (from game_scores)
============================================ */
router.get("/average-xp", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT AVG(total_xp) AS avgXP
      FROM (
        SELECT student_id, SUM(xp_earned) AS total_xp
        FROM game_scores
        GROUP BY student_id
      ) t
    `);

    res.json({ avgXP: Math.round(rows[0].avgXP || 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ avgXP: 0 });
  }
});


/* ============================================
   COMPLETION (% students who played at least once)
============================================ */
router.get("/completion", async (req, res) => {
  try {
    const [[total]] = await db.query(
      "SELECT COUNT(*) AS total FROM user_table"
    );

    const [[played]] = await db.query(`
      SELECT COUNT(DISTINCT student_id) AS played
      FROM game_scores
    `);

    const percent =
      total.total === 0 ? 0 : Math.round((played.played / total.total) * 100);

    res.json({ completion: percent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ completion: 0 });
  }
});

/* ============================================
   XP TREND (last 5 days)
============================================ */
router.get("/xp-trend", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%a') AS date,
        SUM(xp_earned) AS xp
      FROM game_scores
      GROUP BY DATE(created_at)
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({ trend: rows.reverse() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ trend: [] });
  }
});

/* ============================================
   MODULE USAGE
============================================ */
router.get("/module-usage", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        game_name AS module,
        COUNT(*) AS value
      FROM game_scores
      GROUP BY game_name
      ORDER BY value DESC
    `);

    res.json({ usage: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ usage: [] });
  }
});

export default router;
