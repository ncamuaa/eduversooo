import express from "express";
import { db } from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = express.Router();

/* ---------------------------------------------------------
   GENERATE MODULE CERTIFICATE PDF
---------------------------------------------------------- */
router.post("/generate", async (req, res) => {
  try {
    const { student_id, module_id, percentage } = req.body;

    if (!student_id || !module_id || percentage == null) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 1. CHECK STUDENT EXISTS
    const [student] = await db.query(
      "SELECT fullname FROM user_table WHERE id = ?",
      [student_id]
    );

    if (student.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 2. CHECK MODULE EXISTS
    const [module] = await db.query(
      "SELECT title FROM modules WHERE id = ?",
      [module_id]
    );

    if (module.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }

    const studentName = student[0].fullname;
    const moduleTitle = module[0].title;

    // 3. ENSURE FOLDER EXISTS
    const certDir = path.resolve("uploads/certificates");
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    // 4. FILE PATH
    const fileName = `certificate-${student_id}-${module_id}.pdf`;
    const filePath = path.join(certDir, fileName);

    // 5. CREATE PDF
    const doc = new PDFDocument();

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // PDF CONTENT
    doc.fontSize(26).text("Certificate of Completion", { align: "center" });
    doc.moveDown();

    doc.fontSize(18).text(`This certifies that`, { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(22).text(studentName, { align: "center", underline: true });
    doc.moveDown(1);

    doc.fontSize(18).text(
      `has successfully completed the module "${moduleTitle}"`,
      { align: "center" }
    );

    doc.moveDown(1);

    doc.fontSize(16).text(`Final Score: ${percentage}%`, {
      align: "center",
    });

    doc.moveDown(2);
    doc.fontSize(12).text(`Issued on: ${new Date().toLocaleDateString()}`);

    doc.end(); // VERY IMPORTANT

    // Wait for file to finish writing
    writeStream.on("finish", () => {
      res.json({
        message: "Certificate generated successfully",
        certificate_url: `/uploads/certificates/${fileName}`,
      });
    });

    writeStream.on("error", (err) => {
      console.error("WriteStream Error:", err);
      res.status(500).json({ error: "Failed to write certificate file" });
    });

  } catch (err) {
    console.error("❌ Certificate Error:", err);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

export default router;
