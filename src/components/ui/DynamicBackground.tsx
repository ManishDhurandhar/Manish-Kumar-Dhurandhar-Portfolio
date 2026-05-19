import { motion } from "motion/react";

export function DynamicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Background with dynamic color */}
      <div className="absolute inset-0 bg-background">
        <motion.div
          animate={{
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[80px] will-change-[opacity]"
        />
        <motion.div
          animate={{
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[80px] will-change-[opacity]"
        />
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      </div>
      
      {/* Grid Pattern with dynamic color */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-brand-muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-muted)_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.4] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}
