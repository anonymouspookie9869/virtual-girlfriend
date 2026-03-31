import express, { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from "../../services/geminiLogic";

const apiRouter = Router();

// Request logger for API
apiRouter.use((req, _res, next) => {
  console.log(`API Request: ${req.method} ${req.url}`);
  next();
});

// Health check
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// Gemini API Endpoints
apiRouter.post("/chat", async (req, res) => {
  const { userProfile, mood, relationshipStatus, history, activeScenario, message } = req.body;
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key is missing on server." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = getSystemInstruction(userProfile, mood, relationshipStatus, activeScenario);
    
    const formattedHistory = history
      .filter((msg: any) => msg.role === 'user' || msg.role === 'model')
      .map((msg: any) => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Server Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/generate-avatar", async (req, res) => {
  const { description } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key missing." });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A beautiful Indian girl avatar, highly detailed, soft lighting, professional portrait, ${description}` }],
      },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return res.json({ url: `data:image/png;base64,${part.inlineData.data}` });
      }
    }
    res.status(500).json({ error: "No image data returned." });
  } catch (error: any) {
    console.error("Server Avatar Error:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/memories", async (req, res) => {
  const { messages, currentMemories } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key missing." });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const recentHistory = messages.slice(-10).map((m: any) => `${m.role}: ${m.content}`).join('\n');
    const existingMemories = currentMemories.join(', ');

    const prompt = `You are an AI assistant helping a virtual girlfriend remember things about her boyfriend.
Current memories: [${existingMemories}]
Recent conversation:
${recentHistory}

Extract any NEW specific facts, preferences, or significant dates mentioned by the user.
Respond ONLY with a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    res.json({ memories: JSON.parse(response.text || "[]") });
  } catch (error: any) {
    console.error("Server Memory Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for /api to ensure JSON errors
apiRouter.use((_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

export default apiRouter;
