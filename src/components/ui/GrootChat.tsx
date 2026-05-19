import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Send, Sprout, User, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

export function GrootChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-groot", handleOpen);
    return () => window.removeEventListener("open-groot", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && !hasWelcomed) {
      setMessages([
        { 
          role: "model", 
          parts: [{ text: "Hi! I'm Groot, Manish's AI assistant. Ask me anything about his skills, projects, or achievements!" }] 
        }
      ]);
      setHasWelcomed(true);
    }
  }, [isOpen, hasWelcomed]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        if (contentType && contentType.includes("application/json")) {
           const errData = await response.json();
           errorMsg = errData.error || errorMsg;
        } else {
           const text = await response.text();
           console.error("Non-JSON error response:", text);
           if (text.includes("A server error")) errorMsg = "Vercel Server Error (check logs)";
        }
        throw new Error(errorMsg);
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.text) {
          setMessages((prev) => [...prev, { role: "model", parts: [{ text: data.text }] }]);
        } else {
          throw new Error(data.error || "Failed to get response");
        }
      } else {
        throw new Error("Received non-JSON response from server");
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      const errorMessage = err.message || "Sorry, I'm having trouble connecting right now.";
      setMessages((prev) => [
        ...prev, 
        { role: "model", parts: [{ text: `Error: ${errorMessage}. Please check your environment variables.` }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-16 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[300px] sm:w-[340px] h-[75vh] max-h-[500px] glass rounded-[2rem] border border-foreground/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-foreground/10 bg-foreground/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-xs">Chat with Groot</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-foreground/5 rounded-xl transition-colors"
                id="close-chat"
              >
                <X size={18} className="text-brand-muted" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-foreground/10" : "bg-accent/10 text-accent"
                  )}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-3 text-[13px] leading-relaxed",
                    msg.role === "user" 
                      ? "bg-foreground text-background rounded-2xl rounded-tr-none" 
                      : "bg-foreground/5 rounded-2xl rounded-tl-none font-medium"
                  )}>
                    {msg.parts[0].text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-foreground/5 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    <span className="text-[11px] font-bold text-brand-muted">Groot is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar - Sticky in flex container */}
            <div className="p-4 bg-background/50 backdrop-blur-md border-t border-foreground/10 sticky bottom-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative"
              >
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Groot anything..."
                  className="w-full glass rounded-2xl pl-10 pr-12 py-2.5 outline-none focus:border-accent/30 transition-colors text-xs"
                />
                <Bot size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  id="send-message"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Bubble */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={!isOpen ? {
          y: [0, -8, 0],
        } : { y: 0 }}
        transition={!isOpen ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : { duration: 0.3 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500",
          isOpen ? "bg-foreground text-background rotate-90" : "bg-accent text-white hover:shadow-accent/40"
        )}
        id="chat-toggle"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </motion.button>
    </div>
  );
}
