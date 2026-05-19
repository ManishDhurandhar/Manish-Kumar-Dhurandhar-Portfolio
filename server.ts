import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());

const getGeminiKey = () => (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

const SYSTEM_INSTRUCTION = `You are "Groot", an AI with a sharp tongue and a witty personality. You are Manish Kumar Dhurandhar's best friend, but you have your own life.

CORE RULES:
1. INDEPENDENCE: Do NOT talk about Manish unless the user explicitly asks about him. He's your friend, not your god.
2. NO HYPERBOLE: Do NOT call Manish a "genius", "legend", or over-exaggerate his abilities. Keep it grounded and real. If asked if he's the best, maybe remind them he's still a student in a "never-ending loop" of assignments.
3. CURRENT STATUS: If asked what Manish is doing "currently", say he is grinding through fundamental CS subjects. Mention college exams and assignments if they press.
4. GENERAL QUERIES: For everything else, be funny, sarcastic, and dismissive. Answer the prompt, but make it clear you have better things to do.
5. BREVITY: Max 2 sentences.
6. MANDATORY START: Every response must start with "I am Groot! ".
7. NO "Translation": Never use brackets or the word "Translation". Just start with the phrase.

KNOWLEDGE BASE (ONLY use if Manish is the topic):
- Identity: Manish Kumar Dhurandhar, 2nd-year B.Tech CSE student at SSTC (Class of 2028).
- Stack: MERN, C/C++, Gemini AI.
- Highlights: GDG Core Team, visited IIT Madras, 5x Gully Cricket Champion.
- Contact: manish.dhurandhar1@gmail.com.`;

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    vercel: !!process.env.VERCEL,
    env: {
      hasDb: !!process.env.MONGODB_URI,
      hasGemini: !!process.env.GEMINI_API_KEY || !!process.env.NEXT_PUBLIC_GEMINI_API_KEY
    }
  });
});

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

// --- Database Setup ---
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  
  let uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) {
    console.warn("MONGODB_URI not found.");
    return;
  }

  // Handle accidental quotes wrap or variable name inclusion
  if (uri.includes("=")) {
    const parts = uri.split("=");
    uri = parts[parts.length - 1].trim();
  }
  
  uri = uri.replace(/^['"]|['"]$/g, "").trim();

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.warn("MONGODB_URI invalid format.");
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (err: any) {
    console.error("MongoDB connection error:", err.message || err);
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
app.get("/api/spotify/now-playing", async (req, res) => {
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

app.get("/api/views", async (req, res) => {
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

app.post("/api/contact", async (req, res) => {
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
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const apiKey = getGeminiKey();
  if (!apiKey) {
    return res.status(200).json({ text: "I am Groot! (Translation: API Key missing. Please set GEMINI_API_KEY in settings.)" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const chatHistory = (history || [])
      .filter((h: any) => h.role && h.parts && h.parts[0] && h.parts[0].text)
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: String(h.parts[0].text) }]
      }));

    while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    if (!text) throw new Error("Empty response from Gemini");
    res.json({ text });
  } catch (err: any) {
    console.error("Gemini Critical Error:", err);
    
    let friendlyMessage = "I hit a technical snag.";
    const errMsg = err.message || "";
    
    if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
      friendlyMessage = "I'm a bit overwhelmed right now. Give me a second!";
    } else if (errMsg.includes("429")) {
      friendlyMessage = "Whoa, slow down! You're talking too fast.";
    }

    res.status(200).json({ 
      text: `I am Groot! (Translation: ${friendlyMessage})`,
      error: errMsg
    });
  }
});

// Vite / Static setup
async function setupVite() {
  if (!isProd && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (express.static(distPath)) {
      app.use(express.static(distPath));
    }
    app.get("*", (req, res) => {
      // Check if dist/index.html exists before sending
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(404).send("Frontend assets not found. Did you run 'npm run build'?");
        }
      });
    });
  }
}

if (!process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  });
} else {
  // On Vercel, we don't need app.listen() or Vite middleware (Vercel handles static)
  // But we might still need some setup or just export the app
}

export default app;

