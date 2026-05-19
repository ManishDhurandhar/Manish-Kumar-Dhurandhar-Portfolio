/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DynamicBackground } from "./components/ui/DynamicBackground";
import { Navbar } from "./components/layout/Navbar";
import { Hero } from "./components/sections/Hero";
import { SpotifyWidget } from "./components/sections/SpotifyWidget";
import { About } from "./components/sections/About";
import { Experience } from "./components/sections/Experience";
import { Projects } from "./components/sections/Projects";
import { Footer } from "./components/sections/Footer";
import { GrootChat } from "./components/ui/GrootChat";

export default function App() {
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("light");
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-accent/30 selection:text-foreground transition-colors duration-500`}>
      <DynamicBackground />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="relative z-10">
        <Hero />
        <SpotifyWidget />
        <About />
        <Experience />
        <Projects />
      </main>

      <Footer />
      <GrootChat />
    </div>
  );
}
