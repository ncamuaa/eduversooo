import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db.js";

const router = express.Router();
const JWT_SECRET = "EDUVERSO_SECRET_123";

/* =========================
   GOOGLE SETUP
========================= */
const GOOGLE_CLIENT_ID =
  "455896959380-ocuuhpnodnduef1i4q70gv405ce6h5ou.apps.googleusercontent.com";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/* =========================
   EMAIL + PASSWORD LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const [[user]] = await db.query(
      "SELECT * FROM user_table WHERE email = ?",
      [email.toLowerCase()]
    );

    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (!user.password)
      return res.status(400).json({ message: "Use Google login" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Incorrect password" });

    await db.query(
      "UPDATE user_table SET last_login = NOW() WHERE id = ?",
      [user.id]
    );

    const [[updatedUser]] = await db.query(
      "SELECT * FROM user_table WHERE id = ?",
      [user.id]
    );

    const token = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: updatedUser });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GOOGLE LOGIN
========================= */
router.post("/google-login", async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token)
      return res.status(400).json({ message: "Missing Google token" });

    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub } = ticket.getPayload();

    let [[user]] = await db.query(
      "SELECT * FROM user_table WHERE email = ?",
      [email.toLowerCase()]
    );

    if (!user) {
      const [result] = await db.query(
        `
        INSERT INTO user_table (fullname, email, google_id, avatar, role)
        VALUES (?, ?, ?, ?, 'student')
        `,
        [name, email.toLowerCase(), sub, picture]
      );

      user = { id: result.insertId };
    }

    await db.query(
      "UPDATE user_table SET last_login = NOW() WHERE id = ?",
      [user.id]
    );

    const [[updatedUser]] = await db.query(
      "SELECT * FROM user_table WHERE id = ?",
      [user.id]
    );

    const token = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: updatedUser });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);
    res.status(500).json({ message: "Google login failed" });
  }
});

export default router;
