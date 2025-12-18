import express from "express";
import { db } from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const router = express.Router();

/* =====================================================
   FILE UPLOAD SETUP
===================================================== */
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, "student_avatar_" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* =====================================================
   GET ALL STUDENTS
===================================================== */
router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, fullname, email, avatar, xp, streak, created_at
       FROM user_table
       WHERE role = 'student'
       ORDER BY fullname ASC`
    );
    res.json({ students: rows });
  } catch (err) {
    console.error("Student list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   GET STUDENT BY ID
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, fullname, email, avatar, xp, streak, role, created_at
       FROM user_table
       WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: "Student not found" });

    res.json(rows[0]); // return clean user object
  } catch (err) {
    console.error("Student fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   CREATE STUDENT
===================================================== */
router.post("/", async (req, res) => {
  const { fullname, email, password, avatar, xp = 0, streak = 0 } = req.body;

  if (!fullname || !email)
    return res.status(400).json({ message: "fullname and email required" });

  try {
    const [dup] = await db.query(
      "SELECT id FROM user_table WHERE email = ? LIMIT 1",
      [email]
    );

    if (dup.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    let passHash = password ? await bcrypt.hash(password, 10) : null;

    const [result] = await db.query(
      `INSERT INTO user_table 
       (fullname, email, password, avatar, xp, streak, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'student', NOW())`,
      [fullname, email, passHash, avatar || null, xp, streak]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("CREATE STUDENT:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   UPDATE STUDENT
===================================================== */
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { fullname, email, password, avatar, xp, streak } = req.body;

  if (!fullname || !email)
    return res.status(400).json({ message: "fullname and email required" });

  try {
    const [rows] = await db.query("SELECT * FROM user_table WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Student not found" });

    let passHash = rows[0].password;
    if (password?.trim()) passHash = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE user_table
       SET fullname=?, email=?, password=?, avatar=?, xp=?, streak=?
       WHERE id=?`,
      [
        fullname,
        email,
        passHash,
        avatar || rows[0].avatar,
        xp ?? rows[0].xp,
        streak ?? rows[0].streak,
        id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE STUDENT:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   DELETE STUDENT
===================================================== */
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await db.query("SELECT avatar FROM user_table WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Student not found" });

    const avatar = rows[0].avatar;
    if (avatar?.startsWith("uploads/")) {
      try { fs.unlinkSync(avatar); } catch {}
    }

    await db.query("DELETE FROM user_table WHERE id=?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE STUDENT:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================================================
   AVATAR UPLOAD
===================================================== */
router.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filepath = `uploads/${req.file.filename}`;

    if (req.body.id) {
      await db.query("UPDATE user_table SET avatar=? WHERE id=?", [
        filepath,
        req.body.id,
      ]);
    }

    res.json({ success: true, avatar: filepath });
  } catch (err) {
    console.error("AVATAR UPLOAD:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* =====================================================
   ADD XP
===================================================== */
router.post("/:id/add-xp", async (req, res) => {
  const userId = req.params.id;
  const amount = Number(req.body.amount || 0);

  if (!amount) return res.status(400).json({ error: "XP amount required" });

  try {
    const [rows] = await db.query("SELECT xp FROM user_table WHERE id = ?", [
      userId,
    ]);

    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const newXp = rows[0].xp + amount;

    await db.query("UPDATE user_table SET xp=? WHERE id=?", [newXp, userId]);

    res.json({ ok: true, newXp });
  } catch (err) {
    console.error("ADD XP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================================================
   RECENT MODULE
===================================================== */
router.get("/:id/recent", async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT mp.progress, mp.completed, mp.updated_at, 
              m.title, m.thumbnail
       FROM module_progress mp
       JOIN modules m ON mp.module_id = m.id
       WHERE mp.user_id = ?
       ORDER BY mp.updated_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) return res.json({ found: false });

    res.json({ found: true, ...rows[0] });
  } catch (err) {
    console.error("RECENT MODULE:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
