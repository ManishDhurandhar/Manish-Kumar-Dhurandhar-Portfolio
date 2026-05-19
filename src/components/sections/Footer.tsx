import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Github, Linkedin, Mail, Phone, 
  Send, ExternalLink, Globe, Code,
  Eye
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "@/src/lib/utils";

const socials = [
  { name: "GitHub", href: "https://github.com/ManishDhurandhar", icon: <Github size={20} /> },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/manish-kumar-dhurandhar-029b99314", icon: <Linkedin size={20} /> },
  { name: "LeetCode", href: "https://leetcode.com/u/ManishKuDhurandhar/", icon: <Code size={20} /> },
  { name: "GFG", href: "https://www.geeksforgeeks.org/user/manishdhu8x4i/", icon: <Globe size={20} /> },
  { 
    name: "X", 
    href: "https://x.com/Manishxdhurndhr", 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.493h2.039L6.486 3.24H4.298l13.311 17.405z"/>
      </svg>
    ) 
  },
];

export function Footer() {
  const [views, setViews] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch("/api/views");
        const data = await res.json();
        setViews(data.count);
      } catch (err) {
        console.error("View Counter Error:", err);
      }
    };
    fetchViews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <footer id="contact" className="px-6 py-20 bg-background/80 backdrop-blur-3xl border-t border-foreground/5">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Quote Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20 max-w-2xl px-4"
        >
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" }}
            className="text-2xl md:text-3xl font-black tracking-tight italic mb-4 leading-tight text-foreground"
          >
            "Trying to understand the fundamental nature of reality."
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            className="text-[10px] font-black tracking-[0.4em] uppercase text-accent/60"
          >
            — Demis Hassabis
          </motion.p>
          <div className="w-12 h-0.5 bg-accent/20 mx-auto mt-6 rounded-full" />
        </motion.div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Contact Info */}
          <div>
            <h2 className="text-4xl font-black tracking-tighter mb-6">Let's Connect</h2>
            <p className="text-brand-muted font-medium mb-10 leading-relaxed max-w-md">
              I'm open to freelance work, job opportunities, and collaborations. Resume available on demand. Reach out to me!
            </p>
            
            <div className="space-y-6">
              <a href="mailto:manish.dhurandhar1@gmail.com" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center group-hover:bg-foreground text-brand-muted group-hover:text-background transition-all">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-0.5">Email Me</p>
                  <p className="font-bold text-foreground">manish.dhurandhar1@gmail.com</p>
                </div>
              </a>
              <a href="tel:+917879868727" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center group-hover:bg-foreground text-brand-muted group-hover:text-background transition-all">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-0.5">Call Me</p>
                  <p className="font-bold text-foreground">+91 7879868727</p>
                </div>
              </a>
            </div>

            <div className="flex flex-col gap-4 mt-12">
              <div className="flex gap-4">
                {socials.map((social) => (
                  <a 
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 rounded-2xl glass flex items-center justify-center hover:scale-110 hover:bg-foreground/10 transition-all text-foreground"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <p className="text-accent font-mono text-[10px] uppercase tracking-[0.2em]">
                Resume available on demand. Reach Out :
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <GlassCard className="lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Your Name"
                    className="w-full glass rounded-2xl px-6 py-4 outline-none focus:border-foreground/20 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="w-full glass rounded-2xl px-6 py-4 outline-none focus:border-foreground/20 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Message</label>
                <textarea 
                  rows={4} 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell me about your project..."
                  className="w-full glass rounded-2xl px-6 py-4 outline-none focus:border-foreground/20 transition-colors resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={status === "sending" || status === "success"}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                  status === "success" ? "bg-green-500 text-white" : "bg-foreground text-background hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {status === "idle" && <>Send Message <Send size={18} /></>}
                {status === "sending" && "Sending..."}
                {status === "success" && "Message Sent!"}
                {status === "error" && "Error Sending!"}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Footer Bottom */}
        <div className="w-full pt-10 border-t border-white/5 flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex flex-col items-center md:items-start gap-4">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="mb-2"
             >
               <div className="flex flex-col items-center md:items-start text-center md:text-left">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1 flex items-center gap-2">
                   <span className="w-8 h-[1px] bg-accent/30" /> Pro Tip
                 </span>
                 <p className="text-xs font-bold text-foreground/60 transition-colors max-w-xs md:max-w-sm">
                   Before you leave, say hi to Groot — my AI chatbot who understands me better than most humans. 
                   <button 
                     onClick={() => window.dispatchEvent(new CustomEvent("open-groot"))}
                     className="text-accent underline decoration-accent/30 underline-offset-4 ml-1 hover:text-accent/80 transition-colors cursor-pointer inline-block"
                   >
                     Click to chat with Groot!
                   </button>
                 </p>
               </div>
             </motion.div>

             <div className="bg-foreground/5 border border-foreground/10 px-6 py-4 rounded-[24px] flex flex-col items-start gap-1">
                <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest leading-none">Total Views</p>
                <p className="text-2xl font-black font-mono tracking-tighter text-foreground">
                  {typeof views === 'number' ? views.toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: true }) : "00,000"}
                </p>
             </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs font-bold text-foreground">
              Crafted with ❤️ by Manish
            </p>
          </div>

          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity">
            Back to Top
          </button>
        </div>

        {/* Copyright */}
        <div className="w-full mt-12 text-center text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
          <p>© 2026 Manish Kumar Dhurandhar. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
