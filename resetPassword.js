import bcrypt from "bcryptjs";
import { db } from "./db.js";

const reset = async () => {
  try {
    const newPassword = "123456";
    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE user_table SET password = ? WHERE email = ?",
      [hash, "abc@gmail.com"]
    );

    console.log("✅ Password reset to:", newPassword);
  } catch (err) {
    console.error("❌ Reset failed:", err);
  } finally {
    process.exit();
  }
};

reset();
