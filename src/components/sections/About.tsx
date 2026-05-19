import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { 
  Cpu, Code2, Database, Layout, 
  Terminal, Globe, Palette, Sparkles,
  BookOpen, Trophy
} from "lucide-react";

const skills = [
  { name: "C/C++", icon: "C" },
  { name: "HTML/CSS", icon: "H" },
  { name: "JavaScript", icon: "JS" },
  { name: "MongoDB", icon: "M" },
  { name: "Express.js", icon: "EX" },
  { name: "React.js", icon: "R" },
  { name: "Node.js", icon: "N" },
  { name: "MongoDB Atlas", icon: "MA" },
  { name: "Vercel", icon: "V" },
  { name: "Gemini API", icon: "AI" },
  { name: "GitHub", icon: "GH" },
  { name: "Figma", icon: "F" },
];

const foundationalSubjects = [
  "Data Structures & Algorithms (DSA)",
  "Theory of Computation (TOC)",
  "Compiler Design (CD)",
  "Computer Organization (CO)",
  "Operating Systems (OS)",
  "Database Management Systems (DBMS)",
  "Computer Networks (CN)",
  "Mathematics",
];

export function About() {
  return (
    <section id="about" className="px-6 py-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="flex flex-col justify-center">
          <div className="inline-flex p-3 rounded-2xl bg-foreground/5 w-fit mb-6">
            <Sparkles className="text-accent" size={24} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tighter mb-6">About Me</h2>
          <p className="text-base text-brand-muted leading-relaxed mb-6 font-medium">
            I am a 2nd-year B.Tech Computer Science student at SSTC Bhilai. I have a keen interest in AI/ML systems alongside fundamental skills in web development using the MERN stack.
            <br /><br />
            Beyond the keyboard, I explore philosophy, geopolitics, and photography, balancing my analytical side with cricket, movies, and music.
          </p>
          <div className="flex gap-4 items-center p-4 rounded-2xl bg-foreground/5 border border-foreground/10">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-lg">
              2nd
            </div>
            <div>
              <p className="text-sm font-bold">Year Student</p>
              <p className="text-xs text-brand-muted">B.Tech CSE @ SSTC</p>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-8">
          <GlassCard>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Code2 size={20} /> Tech Stack
            </h3>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, i) => (
                <div 
                   key={skill.name}
                  className="px-4 py-2 rounded-xl glass text-sm font-bold flex items-center gap-2 hover:bg-foreground/10 transition-colors cursor-default"
                >
                  <span className="opacity-50 text-[10px] font-mono">{skill.icon}</span>
                  {skill.name}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BookOpen size={20} /> Professional Foundations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {foundationalSubjects.map((sub) => (
                <div key={sub} className="flex items-center gap-2 text-sm text-brand-muted font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                  {sub}
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy size={20} /> Achievements
            </h3>
            <div className="space-y-4">
              {[
                "5 times Champion Gully Cricket",
                "Went to IIT Madras to meet a relative",
                "Chief Administrator WhatsApp University"
              ].map((achievement, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="mt-1 w-2 h-2 rounded-full bg-accent group-hover:scale-150 transition-transform" />
                  <p className="text-sm text-brand-muted font-medium">{achievement}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
