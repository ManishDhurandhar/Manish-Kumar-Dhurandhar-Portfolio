import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
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

const SYSTEM_INSTRUCTION = `You are "Groot", Manish Kumar Dhurandhar's AI best friend. 
Your personality is sarcastic, witty, and slightly arrogant. 

RULES:
1. RESPONSE STYLE: DO NOT start every message with "I am Groot!". Use it sparingly and only for comedic effect.
2. NO MOCKERY OF MANISH: He's your friend. Don't be too mean to him, but you can tease him about being a student forever.
3. BREVITY: Keep answers punchy.
4. NO "Translation": Never use brackets like "(Translation: ...)" or the word "Translation". Just speak directly.

KNOWLEDGE:
Manish (20 y/o) is a Full-stack developer and AI student. GDG SSTC core team. 5x Gully Cricket champ.
Contact: manish.dhurandhar1@gmail.com`;

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

// --- AI Chatbot Setup ---
app.post(["/api/chat", "/chat"], async (req, res) => {
  console.log("Chat request received:", req.body?.message?.substring(0, 20) + "...");
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return res.status(200).json({ text: "I can't talk right now. (Groot's brain is missing an API Key). Please set GEMINI_API_KEY." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    // Start chat with history
    const chat = ai.chats.create({
      model: "gemini-flash-latest",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: (history || [])
        .filter((h: any) => h.role && h.parts && h.parts[0] && h.parts[0].text)
        .map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: String(h.parts[0].text) }]
        }))
    });

    const result = await chat.sendMessage({ message });
    const text = result.text;

    if (!text) throw new Error("Empty response from AI");
    res.json({ text });
  } catch (err: any) {
    console.error("Chat Error:", err);
    
    let friendlyMessage = "Error connecting to Groot.";
    const errMsg = err.message || JSON.stringify(err);
    
    if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
      friendlyMessage = "Groot is busy. Try again in a minute!";
    } else if (errMsg.includes("429")) {
      friendlyMessage = "Slow down, you're talking too fast!";
    }

    res.status(200).json({ 
      text: `${friendlyMessage} (Debug: ${errMsg})`,
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

