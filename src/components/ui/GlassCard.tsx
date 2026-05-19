import React, { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  key?: React.Key;
}

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5 }}
      className={cn(
        "glass rounded-[32px] p-6 relative overflow-hidden transition-all duration-500",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
