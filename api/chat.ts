import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiKey = () => {
  let key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!key) return "";
  
  // Clean whitespace and potential quotes if the user pasted it with them
  key = key.trim().replace(/^['"]|['"]$/g, "").trim();
  
  // Handle case where some people paste "GEMINI_API_KEY=AIza..."
  if (key.includes("=")) {
    key = key.split("=").pop()?.trim() || key;
  }
  
  return key;
};

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

export default async function handler(req: any, res: any) {
  // Set headers to allow JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const apiKey = getGeminiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY. Set it in Vercel Project Settings > Environment Variables." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Validate and clean history for the SDK
    let validHistory = (history || [])
      .filter((h: any) => h.parts && Array.isArray(h.parts) && h.parts[0] && h.parts[0].text)
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: String(h.parts[0].text) }]
      }));

    // CRITICAL: Gemini requires the first message in history to be from 'user'.
    while (validHistory.length > 0 && validHistory[0].role !== "user") {
      validHistory.shift();
    }

    const chat = model.startChat({ history: validHistory });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
       throw new Error("Gemini returned an empty response.");
    }

    res.status(200).json({ text });
  } catch (err: any) {
    console.error("Gemini Critical Error:", err);
    // Explicitly show the error message so the user can debug Vercel environment variables
    const detailedError = err.message || "Unknown error";
    res.status(200).json({ 
      text: `I am Groot! (Translation: Connection failed. Error: ${detailedError}. Please ensure GEMINI_API_KEY is correctly set in Vercel settings.)`,
      error: detailedError
    });
  }
}
