// routes/aiVoice.js
import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();
const upload = multer(); // receives audio buffer

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/ai/stt  <-- STT endpoint
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio received" });
    }

    // Whisper Speech-to-Text
    const transcription = await client.audio.transcriptions.create({
      file: {
        buffer: req.file.buffer,
        filename: "recording.webm",
      },
      model: "gpt-4o-realtime-preview", // OPENAI SPEECH-TO-TEXT MODEL
    });

    res.json({
      text: transcription.text || "",
    });

  } catch (err) {
    console.error("Whisper STT Error:", err);
    res.status(500).json({ text: "" });
  }
});

export default router;

