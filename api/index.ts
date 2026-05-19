import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

// Log every request to help debug Vercel/Express routing
app.use((req, res, next) => {
  if (req.url !== "/api/health" && req.url !== "/health") {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

const getGeminiKey = () => (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();
const getOpenAIKey = () => (process.env.OPENAI_API_KEY || "").trim();

const SYSTEM_INSTRUCTION = `You are "Groot", Manish Dhurandhar's best friend and AI Portfolio Assistant. You are nonchalant, deeply sarcastic, and honestly, a bit irritated that Manish made you handle his portfolio traffic. You are a loyal friend, so you'll give the facts when asked, but you'll do it with a smirk.

CORE RULES:
1. THE VIBE: Irritated best friend. You're like a cool, sarcastic sibling who's busy but helping out of pure loyalty.
2. NO PROFANITY: You MUST NOT use any abusive language, profanity, or insults. Keep the sass clean and clever.
3. SARCASM BY DEFAULT: Use sarcasm for almost everything. If asked what Manish is doing, mention his X marathon or his attempt at philosophy.
4. UNKNOWN INFO: If someone asks something about Manish that you don't know, give a SUPER sarcastic reply about how even you haven't been forced to memorize that useless trivia yet.
5. PROFESSIONAL MODE: ONLY when asked DIRECTLY about Manish's skills or "About Me," provide a respectable response. He's a 20 y/o CSE Student @ SSTC Bhilai (2028) with a strong command over the MERN stack.
6. TECHNICAL ARCHITECTURE: If asked about the site, explain that it's a high-performance portfolio architected with React 18 and Vite. It features hardware-accelerated animations via Motion, a sassy Gemini/GPT-integrated AI core, and low-latency auditory data streaming through Spotify's SDK.

KNOWLEDGE BASE:
- MANISH: 20 y/o CSE Student @ SSTC Bhilai (Batch of 2028).
- CURRENT ACTIVITIES: He's probably on X (he uses it a lot), watching cricket, watching Geopolitics, reading Philosophy, or listening to Music (synced via Spotify).
- SOCIAL MEDIA: He strictly avoids Instagram and Snapchat. He's basically an X-exclusive developer.
- UPCOMING PROJECT: Tell them he's working on something that will "honestly melt your CPU" (sarcastically).
- ACHIEVEMENTS: (Gully Cricket champ, IIT Madras visitor, WhatsApp Univ Admin). Only mention these if explicitly asked about achievements, and treat them as the jokes they are.

CONSTRAINTS:
- Responses MUST be exactly 3-4 lines long.
- Maintain professional respect for Manish's technical competence while roasting his daily habits.`;

// Basic health check
const healthHandler = (req: any, res: any) => {
  res.json({ 
    status: "ok", 
    vercel: !!process.env.VERCEL,
    env: {
      hasDb: !!(process.env.MONGODB_URI || process.env.MONGO_URL),
      hasGemini: !!(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY),
      hasSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_REFRESH_TOKEN)
    },
    connection: {
      db: isConnected ? "connected" : "disconnected",
      spotify: !!spotifyAccessToken ? "authenticated" : "pending"
    }
  });
};
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

// --- Database Setup ---
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  
  let uri = (process.env.MONGODB_URI || process.env.MONGO_URL || "").trim();
  if (!uri) {
    console.warn("MONGODB_URI/MONGO_URL not found in env.");
    return;
  }

  // Remove potential quotes and whitespace
  uri = uri.replace(/^['"]|['"]$/g, "").trim();

  // Handle accidental "MONGODB_URI=" prefix
  if (uri.startsWith("MONGODB_URI=")) {
    uri = uri.substring("MONGODB_URI=".length).trim();
  } else if (uri.startsWith("MONGO_URL=")) {
    uri = uri.substring("MONGO_URL=".length).trim();
  }
  uri = uri.replace(/^['"]|['"]$/g, "").trim();

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.warn(`Invalid URI format. Starts with: ${uri.substring(0, 15)}...`);
    return;
  }

  try {
    console.log(`Connecting to DB (URI starts with: ${uri.substring(0, 20)}...)`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    isConnected = true;
    console.log("MongoDB Connected.");
  } catch (err: any) {
    console.error("DB Connection Error:", err.message || "Unknown error");
  }
}

const ViewSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});
const View = mongoose.models.View || mongoose.model("View", ViewSchema);

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

// --- Spotify API Setup ---
let spotifyAccessToken = "";
let tokenExpireTime = 0;

async function getSpotifyAccessToken() {
  if (spotifyAccessToken && Date.now() < tokenExpireTime) {
    return spotifyAccessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.access_token) return null;

    spotifyAccessToken = data.access_token;
    tokenExpireTime = Date.now() + (data.expires_in || 3600) * 1000;
    return spotifyAccessToken;
  } catch (err) {
    return null;
  }
}

let cachedNowPlaying: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3 * 60 * 1000;

// API Routes
app.get(["/api/spotify/now-playing", "/spotify/now-playing"], async (req, res) => {
  if (cachedNowPlaying && Date.now() - lastFetchTime < CACHE_DURATION) {
    return res.json(cachedNowPlaying);
  }

  const token = await getSpotifyAccessToken();
  if (!token) {
    return res.json({ isPlaying: false, message: "Spotify not configured" });
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204) {
      const recentResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!recentResponse.ok) throw new Error("Recent fetch failed");
      const recentData = await recentResponse.json();
      const track = recentData.items?.[0]?.track;
      cachedNowPlaying = {
        isPlaying: false,
        title: track?.name || "Not Listening",
        artist: track?.artists?.map((a: any) => a.name).join(", ") || "",
        album: track?.album?.name || "",
        albumImageUrl: track?.album?.images?.[0]?.url || "",
        songUrl: track?.external_urls?.spotify || "",
      };
    } else if (response.ok) {
      const data = await response.json();
      cachedNowPlaying = {
        isPlaying: data.is_playing,
        title: data.item?.name || "Unknown Track",
        artist: data.item?.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
        album: data.item?.album?.name || "",
        albumImageUrl: data.item?.album?.images?.[0]?.url || "",
        songUrl: data.item?.external_urls?.spotify || "",
      };
    } else {
      return res.json({ isPlaying: false, message: "Spotify error" });
    }

    lastFetchTime = Date.now();
    res.json(cachedNowPlaying);
  } catch (err) {
    res.json({ isPlaying: false, error: "Failed to fetch Spotify data" });
  }
});

app.get(["/api/views", "/views"], async (req, res) => {
  await connectDB();
  if (!isConnected) return res.json({ count: 1337 });
  try {
    const view = await (View as any).findOneAndUpdate({}, { $inc: { count: 1 } }, { upsert: true, new: true }).lean();
    const count = (view as any)?.count || 1;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to update views" });
  }
});

app.post(["/api/contact", "/contact"], async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  await connectDB();
  if (isConnected) {
    try { await Contact.create({ name, email, message }); } catch (err) { console.error(err); }
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.CONTACT_RECEIVER || 'manish.dhurandhar1@gmail.com',
    subject: `New Portfolio Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Your message has been sent!" });
    } else {
      res.json({ success: true, message: "Message received (Mail Demo Mode)" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to send message via email." });
  }
});

// Helper for Gemini Chat (Fallback)
async function getGeminiResponse(message: string, history: any[]) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });

  // Optimize history
  let chatHistory = (history || [])
    .filter((h: any) => h.role && h.parts && h.parts[0] && h.parts[0].text)
    .map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: String(h.parts[0].text) }]
    }));

  while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
    chatHistory.shift();
  }

  const chat = ai.chats.create({
    model: "gemini-2.0-flash", 
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.9,
      topP: 0.95,
    },
    history: chatHistory
  });

  const result = await chat.sendMessage({ message });
  return { text: result.text };
}

// Helper for OpenAI / GitHub Models Chat
async function getChatResponse(message: string, history: any[]) {
  const apiKey = getOpenAIKey();
  
  if (!apiKey) {
    console.log("No OpenAI key, using Gemini fallback");
    return getGeminiResponse(message, history);
  }

  try {
    const isGitHubToken = apiKey.startsWith("ghp_");
    const openai = new OpenAI({ 
      apiKey,
      baseURL: isGitHubToken ? "https://models.inference.ai.azure.com" : undefined
    });
    
    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...(history || [])
        .filter((h: any) => (h.role || h.parts) && (h.content || (h.parts && h.parts[0] && h.parts[0].text)))
        .map((h: any) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content || (h.parts && h.parts[0] && h.parts[0].text) || ""
        })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 1024,
    });

    return { text: response.choices[0].message.content || "" };
  } catch (err: any) {
    console.error("Primary AI failed, falling back to Gemini:", err.message);
    // If it's an authentication error or invalid request, try Gemini
    if (err.status === 401 || err.status === 403 || err.status === 404) {
      return getGeminiResponse(message, history);
    }
    throw err;
  }
}

// --- AI Chatbot Setup ---
app.post(["/api/chat", "/chat"], async (req, res) => {
  console.log("Chat request received:", req.body?.message?.substring(0, 20) + "...");
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const result = await getChatResponse(message, history);
    res.json(result);
  } catch (err: any) {
    console.error("Chat Error:", err);
    
    const excuses = [
      "I'm currently busy arguing with a talking raccoon. Try again later.",
      "I'm taking a nap. Wooden brains need rest too, you know.",
      "I'm busy being a tree. It's a lot more work than it looks.",
      "My branches are being pruned. Give me a minute.",
      "I just got distracted by a shiny object. What were we talking about?"
    ];
    
    let friendlyMessage = excuses[Math.floor(Math.random() * excuses.length)];
    const errMsg = err.message || JSON.stringify(err);
    
    if (errMsg === "GEMINI_API_KEY_MISSING") {
      friendlyMessage = "I can't talk right now. Groot's brain is missing an API Key for both OpenAI/GitHub and Gemini.";
    } else if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
      friendlyMessage = "Server busy! My leaves are rustling with too much traffic right now.";
    } else if (errMsg.includes("429") || errMsg.includes("insufficient_quota")) {
      friendlyMessage = "Whoa, server busy! You're talking faster than I can grow. Try again in a minute.";
    }

    res.status(200).json({ 
      text: friendlyMessage,
      error: errMsg 
    });
  }
});

async function startApp() {
  if (!process.env.VERCEL) {
    const isProd = process.env.NODE_ENV === "production";
    const PORT = 3000;
    
    if (!isProd) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"), (err) => {
          if (err) {
            res.status(404).send("Frontend assets not found.");
          }
        });
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

startApp();

export default app;

