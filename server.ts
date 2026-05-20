import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY is not set in .env file!");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "missing_key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Calculation endpoint
  app.post("/api/calculate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

      const promptTemplate = `You are a mathematical assistant. The user wants to solve: "${prompt}". 
      Provide the numerical result and a very brief explanation if necessary. 
      Format your response as a simple string, e.g., "Result: 42. Explanation: ...".
      If it's just a simple calculation, just return the number.`;

      const result = await model.generateContent(promptTemplate);
      const aiText = result.response.text();

      res.json({ result: aiText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI calculation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Server ready!`);
    console.log(`🏠 Local:   http://localhost:${PORT}`);
    console.log(`📱 Mobile:  Connect to your computer's IP address at port ${PORT}`);
    console.log(`   (Run 'ipconfig' in your terminal to find your IP)\n`);
  });
}

startServer();
