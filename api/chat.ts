import { GoogleGenAI } from "@google/genai";

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
      return res.status(200).json({ text: "I am Groot! (Translation: API Key missing. Please set GEMINI_API_KEY in settings.)" });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const modelName = "gemini-3-flash-preview"; // We use gemini-3-flash-preview as per the gemini-api skill recommendation

    const contents = (history || [])
      .filter((h: any) => h.role && h.parts && h.parts[0] && h.parts[0].text)
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: String(h.parts[0].text) }]
      }));

    contents.push({
      role: "user",
      parts: [{ text: String(message) }]
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    res.status(200).json({ text });
  } catch (err: any) {
    console.error("Gemini Critical Error:", err);
    res.status(200).json({ 
      text: `I am Groot! (Translation: I hit a technical snag: ${err.message})`,
      error: err.message
    });
  }
}
