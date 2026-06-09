"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LuBot, LuSendHorizontal, LuSparkles, LuX } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";

interface CompanionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const starterPrompts = [
  "What is Bhargava strongest at?",
  "Show me his cloud experience",
  "Why should I hire him?",
];

function createMessage(role: CompanionMessage["role"], content: string): CompanionMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

export function AiCompanionDock() {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<CompanionMessage[]>([
    createMessage(
      "assistant",
      `Hi, I am the AI companion for ${portfolioContent.identity.name}. Ask me about his cloud work, projects, skills, or availability.`,
    ),
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const apiHistory = useMemo(
    () =>
      messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 160);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [messages, isLoading, shouldReduceMotion]);

  const submitQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setIsOpen(true);
    setQuery("");
    setIsLoading(true);
    setMessages((current) => [...current, createMessage("user", trimmed)]);
    trackEvent("ai_companion_query", { source: "dock", length: trimmed.length });

    try {
      const response = await fetch("/api/ai-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: apiHistory }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      setMessages((current) => [
        ...current,
        createMessage("assistant", data.answer || data.error || "I could not generate an answer right now."),
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "I could not reach the companion service. Please try again in a moment."),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion(query);
  };

  return (
    <div className="ai-dock">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="window"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="ai-dock-window"
            role="dialog"
            aria-label="AI companion chat"
          >
            <div className="ai-dock-header">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <LuSparkles size={16} aria-hidden className="text-[var(--color-accent)]" />
                AI Companion
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI companion"
                className="ai-companion-icon-button !h-8 !w-8"
              >
                <LuX size={16} aria-hidden />
              </button>
            </div>

            <div ref={transcriptRef} className="ai-dock-transcript">
              <div className="grid gap-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`ai-companion-message ${
                      message.role === "user" ? "ml-auto bg-white text-[#07111e]" : "mr-auto bg-white/[0.075] text-white/84"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                {isLoading ? <div className="ai-companion-message mr-auto bg-white/[0.075] text-white/72">Gathering context...</div> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/10 px-3 py-2.5">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitQuestion(prompt)}
                  className="rounded-full border border-white/12 bg-white/[0.055] px-2.5 py-1 text-[11px] font-semibold text-white/72 transition-colors hover:border-white/28 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="ai-dock-form">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask about Bhargava..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/52"
              />
              <button type="submit" aria-label="Send question" className="ai-companion-send-button" disabled={isLoading || !query.trim()}>
                <LuSendHorizontal size={18} aria-hidden />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? "Close AI companion" : "Open AI companion"}
        aria-expanded={isOpen}
        className="ai-dock-launcher"
        data-open={isOpen}
      >
        <span className="ai-dock-launcher-icon">
          {isOpen ? <LuX size={19} aria-hidden /> : <LuBot size={21} aria-hidden />}
        </span>
        <span className="ai-dock-launcher-ring" aria-hidden />
      </button>
    </div>
  );
}
