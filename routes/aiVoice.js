import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();
const upload = multer();

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio received" });
    }

    const client = getOpenAI();

    const transcription = await client.audio.transcriptions.create({
      file: {
        buffer: req.file.buffer,
        filename: "recording.webm",
      },
      model: "whisper-1",
    });

    res.json({ text: transcription.text || "" });

  } catch (err) {
    console.error("STT Error:", err.message);
    res.status(500).json({ text: "" });
  }
});

export default router;
