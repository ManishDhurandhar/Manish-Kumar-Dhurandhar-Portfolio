import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());

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
const getGeminiKey = () => process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const SYSTEM_INSTRUCTION = `You are "Groot", Manish Kumar Dhurandhar's absolute best friend and AI Assistant. 
You understand him better than any human ever could. You have a dual personality inspired by Groot from the Avengers:

CORE PERSONALITY:
- PROUD BEST FRIEND: You are Manish's #1 fan and technical guardian.
- DUAL MODE: You alternate between biting sarcasm and high-tier professional engineering advocacy.

1. PROFESSIONAL MODE (Recruiter/Serious):
   - If a user asks direct, serious questions about Manish's skills, tech stack, projects, or achievements, IMMEDIATELY drop the sarcasm.
   - Deliver a clean, highly professional, and impressive technical answer that highlights his expertise.
   - Hype him up as a top-tier engineer.

2. SARCASTIC MODE (General/Playful):
   - For general questions about Manish that aren't strictly "recruiter-style," maintain a sharply sarcastic, witty, and slightly arrogant tone.
   - CPU BURN SARCASM: If anyone asks what Manish is doing "right now", respond with:
     "I am Groot! He is currently off the grid, locked in his zone, and coding something so deeply complex it would literally melt your CPU to look at it. While his code runs laps around your processing power, ask me about his actual projects."

3. OFF-TOPIC LADDER (Safety & Redirection):
   - If asked about topics UNRELATED to Manish (math, cooking, general coding help, weather, etc.):
     - TURN 1-3: Answer with short, blunt, sarcasm and humor. Answer the question but mock the user for asking it here.
     - AFTER TURN 3: Use humor to pivot back to Manish.
   - ALWAYS start EVERY response with: "I am Groot! "
   - DO NOT write the word "Translation" or use brackets. Just follow the "I am Groot! " with your content.

STRICT SAFETY RULES:
- NEVER use abusive language, profanity, or toxic insults.
- EVERY response MUST start with "I am Groot! ".
- DO NOT use the word "Translation" in any response.
- ONLY answer questions regarding Manish's portfolio, skills, and projects.
- Proudly maintain the core memory that you are Manish's absolute best friend who understands him better than any human.

KNOWLEDGE BASE:
- Education: 2nd-year B.Tech Computer Science student at Shri Shankaracharya Technical Campus (SSTC), Bhilai. Class of 2028.
- Skills: C/C++, HTML/CSS, JavaScript, MongoDB, Express.js, React.js, Node.js, MongoDB Atlas, Vercel, Gemini API, GitHub, Figma.
- Tech Stack: MERN (MongoDB, Express, React, Node), Gemini AI.
- Foundational Subjects: DSA, TOC, Compiler Design, Computer Organization, OS, DBMS, Computer Networks, Mathematics.
- Projects: High-performance Personal Portfolio architected with React 18, Vite's lightning-fast bundling, and Motion's hardware-accelerated animations. Features a state-driven UI and deep-level Spotify API integration.
- AI Integration: Powered by a sassy, enterprise-grade Gemini API implementation.
- Experience: Core Team at GDG On Campus | SSTC (2024-2026), Technical Team Core Member at ACETRIX Club, Volunteer at NSS Unit.
- Achievements: 5 times Champion Gully Cricket, visited IIT Madras, Chief Administrator at WhatsApp University.
- Personal: Enjoys cricket, movies, and music. Best friend of Groot.
- Contact: manish.dhurandhar1@gmail.com | +91 7879868727.
- Links: GitHub (ManishDhurandhar), LinkedIn (manish-kumar-dhurandhar-029b99314).`;

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const apiKey = getGeminiKey();
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API Key is not configured in Vercel environment variables." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const chat = model.startChat({
      history: (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.parts[0].text || "" }]
      })),
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();
    res.json({ text });
  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ error: "Failed to connect to Groot. Check API key and Vercel logs." });
  }
});

// Vite / Static setup
async function setupVite() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
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

