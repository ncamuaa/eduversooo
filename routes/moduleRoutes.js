// routes/moduleRoutes.js
import express from "express";
import multer from "multer";
import { db } from "../db.js";
import path from "path";
import fs from "fs";

const router = express.Router();

/* -------------------------------------
   MULTER STORAGE FOR PDF + IMAGE
-------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = "uploads/modules";
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/ /g, "_"));
  },
});

const upload = multer({ storage });

/* -------------------------------------
   GET ALL MODULES
   GET /modules   (or /api/modules, depending on server.js mount)
-------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM modules ORDER BY id DESC");
    res.json({ modules: rows });
  } catch (err) {
    console.error("MODULE LIST ERROR:", err);
    res.status(500).json({ error: "Cannot load modules" });
  }
});

/* -------------------------------------
   ADD A MODULE (thumbnail + pdf_file)
   POST /modules
-------------------------------------- */
router.post(
  "/",
  upload.fields([{ name: "thumbnail" }, { name: "pdf_file" }]),
  async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const thumbnail = req.files.thumbnail
        ? `uploads/modules/${req.files.thumbnail[0].filename}`
        : null;

      const pdf_file = req.files.pdf_file
        ? `uploads/modules/${req.files.pdf_file[0].filename}`
        : null;

      await db.query(
        "INSERT INTO modules (title, description, thumbnail, pdf_file) VALUES (?, ?, ?, ?)",
        [title, description || null, thumbnail, pdf_file]
      );

      res.json({ success: true });
    } catch (err) {
      console.error("MODULE UPLOAD ERROR:", err);
      res.status(500).json({ error: "Module upload failed" });
    }
  }
);

/* -------------------------------------
   DELETE MODULE
   DELETE /modules/:id
-------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM modules WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("MODULE DELETE ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
