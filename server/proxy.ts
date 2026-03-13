import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple rate limiter: 20 req/min
const windowMs = 60_000;
const maxRequests = 20;
let requestTimestamps: number[] = [];

function rateLimit(): boolean {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((t) => now - t < windowMs);
  if (requestTimestamps.length >= maxRequests) return false;
  requestTimestamps.push(now);
  return true;
}

app.post("/api/extract", async (req, res) => {
  if (!rateLimit()) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  const { system, user } = req.body;
  if (!system || !user) {
    res.status(400).json({ error: "Missing system or user prompt" });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });

    let text = message.content[0]?.type === "text" ? message.content[0].text : "";
    // Strip markdown fences if the model wraps the JSON
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: unknown) {
    console.error("Claude API error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429 || status === 500 || status === 503) {
      res.status(502).json({ error: "Upstream API temporarily unavailable" });
      return;
    }
    res.status(500).json({ error: "Entity extraction failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
