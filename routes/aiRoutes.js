import dotenv from "dotenv";
dotenv.config();

import express from "express";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

/* =====================================================
   SAFE OPENAI CLIENT (PREVENTS RAILWAY CRASH)
===================================================== */
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/* =====================================================
   MULTER CONFIG (UPLOADS)
===================================================== */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/* =====================================================
   AI CHAT ENDPOINT
   Modes: study | explain | exam | quiz
===================================================== */
router.post("/chat", async (req, res) => {
  try {
    const { message, system_prompt, mode = "study" } = req.body;

    if (!message && mode !== "quiz") {
      return res.json({
        reply: "Please type something so I can help!",
      });
    }

    const modePrompt = {
      study:
        "You are a friendly AI tutor who explains concepts simply with examples.",
      explain:
        "You are an advanced teacher. Break topics down step-by-step clearly.",
      exam:
        "You are an exam tutor. Ask questions, evaluate answers, and give minimal hints.",
      quiz:
        "You are a quiz generator. Output STRICT JSON only. No explanations.",
    };

    const systemMessage =
      system_prompt || modePrompt[mode] || modePrompt.study;

    const client = getOpenAI();

    /* ======================
       QUIZ MODE (JSON ONLY)
    ======================= */
    if (mode === "quiz") {
      const quizPrompt = `
Generate a short 3-question multiple choice quiz about:
"${message}"

STRICT JSON FORMAT ONLY:

{
  "quiz": [
    {
      "q": "",
      "choices": ["A","B","C","D"],
      "answer": 0
    }
  ]
}
`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: modePrompt.quiz },
          { role: "user", content: quizPrompt },
        ],
        temperature: 0.3,
      });

      const raw = completion.choices?.[0]?.message?.content || "";

      try {
        const jsonStart = raw.indexOf("{");
        const clean = raw.slice(jsonStart);
        const parsed = JSON.parse(clean);

        return res.json({
          reply: "Quiz generated successfully",
          quiz: parsed.quiz,
        });
      } catch (e) {
        return res.json({
          reply: "Quiz format error",
          quiz: null,
          raw,
        });
      }
    }

    /* ======================
       NORMAL CHAT
    ======================= */
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message },
      ],
      max_tokens: 900,
      temperature: 0.4,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm not sure how to answer that.";

    return res.json({ reply });

  } catch (err) {
    console.error("AI Chat Error:", err.message);
    return res.json({
      reply: "AI service is currently unavailable.",
    });
  }
});

/* =====================================================
   SPEECH → TEXT (WHISPER)
===================================================== */
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const client = getOpenAI();
    const audioPath = path.resolve(req.file.path);

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    fs.unlink(audioPath, () => {}); // cleanup temp file

    return res.json({
      text: transcription.text || "",
    });
  } catch (err) {
    console.error("STT Error:", err.message);
    return res.status(500).json({
      text: "",
      error: "Transcription failed",
    });
  }
});

/* =====================================================
   IMAGE → AI EXPLANATION
===================================================== */
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const client = getOpenAI();

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const prompt = `
Analyze this image like a teacher:
${imageUrl}

- What is shown?
- What can a student learn?
- Explain clearly and simply.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an educational assistant. Describe images clearly for students.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.3,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Unable to analyze the image.";

    return res.json({
      url: imageUrl,
      reply,
    });
  } catch (err) {
    console.error("Image AI Error:", err.message);
    return res.status(500).json({
      error: "Image analysis failed",
    });
  }
});

export default router;
