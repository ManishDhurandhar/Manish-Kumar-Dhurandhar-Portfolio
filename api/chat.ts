import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiKey = () => {
  let key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!key) return "";
  
  key = key.trim().replace(/^['"]|['"]$/g, "").trim();
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
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const apiKey = getGeminiKey();
    if (!apiKey) {
      return res.status(200).json({ text: "I am Groot! (Translation: My API Key is missing. Please add GEMINI_API_KEY to your Vercel Environment Variables and redeploy.)" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    let validHistory = (history || [])
      .filter((h: any) => h.parts && Array.isArray(h.parts) && h.parts[0] && h.parts[0].text)
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: String(h.parts[0].text) }]
      }));

    while (validHistory.length > 0 && validHistory[0].role !== "user") {
      validHistory.shift();
    }

    const getModelResponse = async (name: string) => {
      const model = genAI.getGenerativeModel({ 
        model: name,
        systemInstruction: SYSTEM_INSTRUCTION
      });
      const chat = model.startChat({ 
        history: validHistory.map(h => ({
          role: h.role,
          parts: h.parts
        }))
      });
      const result = await chat.sendMessage(message);
      return (await result.response).text();
    };

    let text = "";
    try {
      text = await getModelResponse("gemini-1.5-flash");
    } catch (firstErr: any) {
      if (firstErr.message && (firstErr.message.includes("404") || firstErr.message.includes("not found"))) {
        console.log("Gemini 1.5 Flash not found, falling back to gemini-pro");
        try {
          // gemini-pro (Gemini 1.0) doesn't always support systemInstruction in the same way in older SDKs
          // but we'll try it
          text = await getModelResponse("gemini-pro");
        } catch (secondErr: any) {
           throw secondErr;
        }
      } else {
        throw firstErr;
      }
    }
    
    if (!text) throw new Error("Empty response");

    res.status(200).json({ text });
  } catch (err: any) {
    console.error("Gemini Error:", err);
    const detailedError = err.message || "Unknown error";
    
    // If we got a 404, let's try gemini-pro as a fallback internally or explain
    if (detailedError.includes("404") || detailedError.includes("not found")) {
       res.status(200).json({ 
         text: `I am Groot! (Translation: I can't find the model "gemini-1.5-flash" in your region. This is likely a regional restriction or an older API key. Please check your Vercel logs for help.)`,
         error: detailedError
       });
    } else {
       res.status(200).json({ 
         text: `I am Groot! (Translation: I hit a technical snag: ${detailedError})`,
         error: detailedError
       });
    }
  }
}
