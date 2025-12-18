// routes/aiRoutes.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------
   Multer (uploads to /uploads/)
-------------------------------------- */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/* =====================================================
                 AI CHAT ENDPOINT
    Works for: Study / Explain / Exam / Quiz Mode
===================================================== */
router.post("/chat", async (req, res) => {
  try {
    const { message, system_prompt, mode, user_id } = req.body;

    if (!message && mode !== "quiz") {
      return res.json({
        reply: "Please type something so I can help!",
      });
    }

    /* -------------------------------------
       Dynamic AI Behavior by Mode
    -------------------------------------- */
    const modePrompt = {
      study:
        "You are a friendly AI tutor who explains concepts simply with examples.",
      explain:
        "You are an advanced teacher. Break topics down step-by-step clearly.",
      exam: "You are an exam tutor. Ask the student questions, grade strictly, and give minimal hints.",
      quiz: "You are a quiz generator. Always output JSON only.",
    };

    const systemMessage =
      system_prompt || modePrompt[mode] || modePrompt.study;

    /* -------------------------------------
       QUIZ MODE (Strict JSON)
    -------------------------------------- */
    if (mode === "quiz") {
      const qPrompt = `
        Generate a short 3-question multiple choice quiz about:
        "${message}"

        STRICT JSON ONLY:

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
          { role: "user", content: qPrompt },
        ],
        temperature: 0.3,
      });

      let raw = completion.choices?.[0]?.message?.content || "";

      try {
        const jsonStart = raw.indexOf("{");
        const clean = raw.slice(jsonStart);
        const parsed = JSON.parse(clean);

        return res.json({
          reply: "Quiz generated!",
          quiz: parsed.quiz,
        });
      } catch (e) {
        return res.json({
          reply: "Unable to generate quiz in proper format.",
          raw,
          quiz: null,
        });
      }
    }

    /* -------------------------------------
       NORMAL CHAT (study/explain/exam)
    -------------------------------------- */
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
    console.log("AI Chat Error:", err);
    return res.json({
      reply: "AI is having issues right now. Please try again soon.",
    });
  }
});

/* =====================================================
                     SPEECH → TEXT (Whisper)
===================================================== */
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No audio file uploaded" });

    const audioPath = path.resolve(req.file.path);

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    fs.unlink(audioPath, () => {}); // Cleanup temp file

    return res.json({
      text: transcription.text || transcription.data?.text || "",
    });
  } catch (err) {
    console.log("STT Error:", err);
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
    if (!req.file)
      return res.status(400).json({ error: "No image uploaded" });

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    const prompt = `
      Analyze this image like a teacher:
      ${imageUrl}

      - What is shown?
      - What can a student learn from this?
      - Explain clearly and simply.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an educational assistant. Describe images clearly and relate them to learning.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.3,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I couldn't analyze the image.";

    return res.json({
      url: imageUrl,
      reply,
    });
  } catch (err) {
    console.log("Image AI Error:", err);
    return res.status(500).json({
      error: "Image analysis failed",
    });
  }
});

export default router;
