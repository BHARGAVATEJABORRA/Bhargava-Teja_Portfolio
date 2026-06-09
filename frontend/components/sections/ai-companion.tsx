"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LuBot, LuMic, LuSendHorizontal, LuSparkles, LuX } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

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

export function AiCompanion() {
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

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 120);

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
    trackEvent("ai_companion_query", { source: "hero", length: trimmed.length });

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

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "Voice input is not available in this browser yet. Type your question instead."),
      ]);
      setIsOpen(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      void submitQuestion(transcript);
    };
    recognition.start();
    trackEvent("ai_companion_voice_start", { source: "hero" });
  };

  return (
    <div className="ai-companion-shell relative z-20 mx-auto mt-8 w-full max-w-[46rem] [@media(max-height:700px)]:mt-5">
      <form
        onSubmit={handleSubmit}
        className="ai-companion-bar group flex min-h-14 w-full items-center gap-2 rounded-[20px] border border-white/22 bg-[rgba(8,15,24,0.78)] px-3 shadow-[0_22px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-colors focus-within:border-[rgba(116,255,210,0.48)] sm:min-h-16 sm:px-4"
      >
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={isOpen ? "Close AI companion" : "Open AI companion"}
          className="ai-companion-icon-button shrink-0"
        >
          {isOpen ? <LuX size={18} aria-hidden /> : <LuBot size={19} aria-hidden />}
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Ask Bhargava's AI companion..."
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none ring-0 placeholder:text-white/52 focus:outline-none focus:ring-0 focus-visible:outline-none sm:text-base"
        />
        <button type="button" onClick={startVoiceInput} aria-label="Use voice input" className="ai-companion-icon-button">
          <LuMic size={17} aria-hidden />
        </button>
        <button type="submit" aria-label="Send question" className="ai-companion-send-button" disabled={isLoading || !query.trim()}>
          <LuSendHorizontal size={18} aria-hidden />
        </button>
      </form>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="ai-companion-panel absolute left-0 top-[calc(100%+0.75rem)] z-40 w-full overflow-hidden rounded-[24px] border border-white/18 bg-[rgba(5,12,20,0.9)] text-left shadow-[0_28px_80px_rgba(0,0,0,0.36)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <LuSparkles size={16} aria-hidden className="text-[var(--color-accent)]" />
                AI Companion
              </div>
              <p className="hidden text-xs text-white/46 sm:block">Preview mode until API key is added</p>
            </div>

            <div ref={transcriptRef} className="max-h-[18rem] overflow-auto px-4 py-4">
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

            <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitQuestion(prompt)}
                  className="rounded-full border border-white/12 bg-white/[0.055] px-3 py-1.5 text-xs font-semibold text-white/72 transition-colors hover:border-white/28 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
