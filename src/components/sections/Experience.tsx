import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { Calendar, Users, Trophy, BadgeCheck } from "lucide-react";

const events = [
  {
    title: "Core Team Member",
    organization: "GDG On Campus | SSTC",
    desc: "Organized tech events and promoted Google technologies within the campus community.",
    icon: <Users size={20} />,
    date: "2024 - 2026"
  },
  {
    title: "Technical Team Core Member",
    organization: "ACETRIX Club",
    desc: "Managed esports events and provided live casting/commentary using OBS Studio.",
    icon: <Trophy size={20} />,
    date: "2024 - 2025"
  },
  {
    title: "Volunteer",
    organization: "NSS Unit",
    desc: "Participated in community service and a 7-day residential special camp focusing on village development.",
    icon: <BadgeCheck size={20} />,
    date: "2024"
  }
];

export function Experience() {
  return (
    <section id="experience" className="px-6 py-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-muted mb-2">My Journey</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Experience & Leadership</h2>
        </div>
      </div>

      <div className="relative border-l-2 border-foreground/10 ml-2 sm:ml-12 pl-6 sm:pl-8 space-y-12">
        {events.map((item, i) => (
          <div key={i} className="relative">
            {/* Timeline Dot */}
            <div className="absolute -left-[32px] sm:-left-[42px] top-8 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-background border-4 border-accent z-10 shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
            
            <GlassCard delay={i * 0.1} className="relative group p-4 sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/50 group-hover:text-foreground transition-colors shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-xl font-bold mb-0.5 sm:mb-1">{item.title}</h3>
                      <p className="text-[10px] sm:text-xs font-mono text-brand-muted/60 uppercase tracking-[0.1em] sm:tracking-[0.2em]">{item.organization}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-foreground/5 text-[9px] sm:text-[10px] font-bold text-accent h-fit shrink-0 mt-1">
                    <Calendar size={10} className="sm:w-3 sm:h-3" /> {item.date}
                  </div>
                </div>
                
                <p className="text-brand-muted text-sm leading-relaxed max-w-3xl">
                  {item.desc}
                </p>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </section>
  );
}
