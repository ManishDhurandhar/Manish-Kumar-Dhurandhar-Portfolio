import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { Loader2 } from "lucide-react";

export function Projects() {
  return (
    <section id="projects" className="px-6 py-20 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 italic">Featured Work</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <GlassCard className="group overflow-hidden flex flex-col p-0 border-foreground/5 hover:border-foreground/10 transition-colors">
          <div className="relative h-64 overflow-hidden bg-foreground/5">
            <img 
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800&h=600" 
              alt="Portfolio Website" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8" />
          </div>
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-black tracking-tight">Personal Portfolio</h3>
              <span className="text-[10px] font-bold px-2 py-1 glass rounded-full uppercase tracking-widest text-brand-muted">React + Vite</span>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed mb-6 font-medium">
              A high-performance portfolio architected with React 18 and Vite. Features hardware-accelerated animations via Motion, a sassy Gemini-integrated AI core, and low-latency auditory data streaming through Spotify's SDK.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest flex items-center">Live Site</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="h-full flex flex-col items-center justify-center border-dashed border-2 border-foreground/10 group p-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="mb-8 p-6 rounded-full bg-foreground/5"
          >
            <Loader2 size={48} className="text-foreground/20" />
          </motion.div>
          
          <h3 className="text-2xl font-black mb-2 tracking-tight italic">Coming Soon</h3>
          <p className="text-brand-muted font-medium mb-8 text-center text-sm">Expect greatness. Or atleast something better than my last excuse. Delivering soon.</p>
          
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-foreground"
              />
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
