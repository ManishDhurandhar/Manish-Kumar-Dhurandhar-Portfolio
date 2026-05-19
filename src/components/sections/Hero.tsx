import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import { cn } from "@/src/lib/utils";

import { GlassCard } from "../ui/GlassCard";

export function Hero() {
  const scrollTo = (id: string) => {
    const targetId = id.replace("#", "");
    const elem = document.getElementById(targetId);
    if (elem) {
      const offset = 80;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      window.history.pushState(null, "", id);
    }
  };

  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center pt-32 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-accent font-mono text-sm mb-4 tracking-tight"
          >
            Hello world, I am
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-4 leading-[0.9]">
            Manish Kumar <br />
            <span className="text-gradient">Dhurandhar</span>
          </h1>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-muted tracking-tight mb-8">
            Computer Science Engineer
          </h2>
          
          <p className="text-base sm:text-lg text-brand-muted max-w-lg mb-10 leading-relaxed font-medium">
            2nd-year B.Tech CSE student at SSTC Bhilai. Passionate about AI/ML systems, fluid and high-performance web architectures.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo("#projects")}
              className="px-8 sm:px-10 py-3 sm:py-4 bg-foreground text-background font-black rounded-full flex items-center gap-2 hover:scale-105 transition-transform text-xs sm:text-sm"
            >
              View My Work <ArrowRight size={18} />
            </button>
            <button
              onClick={() => scrollTo("#contact")}
              className="px-8 sm:px-10 py-3 sm:py-4 glass font-black rounded-full flex items-center gap-2 hover:bg-foreground/10 transition-colors text-xs sm:text-sm text-foreground"
            >
              Contact Me
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex justify-center lg:justify-end mt-12 lg:mt-0"
        >
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-accent/20 to-transparent blur-2xl rounded-full opacity-50 transition-opacity" />
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px] lg:w-[480px] lg:h-[480px] rounded-[3.5rem] overflow-hidden glass p-4 transition-transform duration-500">
              <img 
                src="/input_file_1.png" 
                alt="Manish Avatar" 
                className="w-full h-full object-cover rounded-[2.8rem] bg-foreground/5 shadow-inner"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Manish+Kumar&background=f97316&color=fff&size=512";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Badges */}
            <div 
              className="absolute -top-4 -right-4 glass p-4 rounded-2xl shadow-xl font-bold italic"
            >
              SSTC '28
            </div>
            <div 
              className="absolute -bottom-4 -left-4 glass p-4 rounded-2xl shadow-xl font-bold"
            >
              CSE
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
