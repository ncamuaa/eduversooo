// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const JWT_SECRET = "EDUVERSO_SECRET_123";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.id;

    // ✅ UPDATE last_login ONLY ON REAL ACTIVITY
    await db.query(
      "UPDATE user_table SET last_login = NOW() WHERE id = ?",
      [decoded.id]
    );

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
