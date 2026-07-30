"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface EntranceCurtainProps {
  onDone: () => void;
  ready: boolean;
}

const greetings = [
  { word: "Hello", note: "a calm beginning", accent: "#F0D9A0" },
  { word: "నమస్తే", note: "with warmth", accent: "#D4E3FF" },
  { word: "నమస్కారం", note: "with intention", accent: "#E5C9FF" },
];

export function EntranceCurtain({ onDone, ready }: EntranceCurtainProps) {
  const shouldReduceMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  // Start visible so the curtain is present in the initial SSR HTML and paints
  // instantly on reload — otherwise the dark body/hero flashes through before
  // hydration runs the effect that would set isVisible=true.
  const [isVisible, setIsVisible] = useState(true);
  const hasCompletedRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const completeEntrance = useCallback(() => {
    if (hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    setIsVisible(false);
    onDoneRef.current();
  }, []);

  useEffect(() => {
    if (!ready || !sequenceComplete) return;
    const frame = window.requestAnimationFrame(completeEntrance);
    return () => window.cancelAnimationFrame(frame);
  }, [completeEntrance, ready, sequenceComplete]);

  useEffect(() => {
    if (shouldReduceMotion === null) {
      return;
    }

    const isReducedMotion = shouldReduceMotion;

    hasCompletedRef.current = false;
    const resetFrame = window.requestAnimationFrame(() => {
      setWordIndex(0);
      setIsVisible(true);
      setSequenceComplete(false);
    });
    // Asset or worker failure must never trap the visitor behind the curtain.
    const safetyTimeout = window.setTimeout(completeEntrance, 4500);

    const keyListener = () => {
      completeEntrance();
    };

    window.addEventListener("keydown", keyListener);

    if (isReducedMotion) {
      const timeout = window.setTimeout(() => setSequenceComplete(true), 360);

      return () => {
        window.cancelAnimationFrame(resetFrame);
        window.clearTimeout(safetyTimeout);
        window.removeEventListener("keydown", keyListener);
        window.clearTimeout(timeout);
      };
    }

    let localIndex = 0;
    let endTimeout: number | null = null;

    const interval = window.setInterval(() => {
      localIndex += 1;

      if (localIndex < greetings.length) {
        setWordIndex(localIndex);
        return;
      }

      window.clearInterval(interval);
      endTimeout = window.setTimeout(() => setSequenceComplete(true), 280);
    }, 340);

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.clearTimeout(safetyTimeout);
      window.removeEventListener("keydown", keyListener);
      window.clearInterval(interval);

      if (endTimeout !== null) {
        window.clearTimeout(endTimeout);
      }
    };
  }, [completeEntrance, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          aria-label="Entrance greeting"
          role="dialog"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
          onPointerDown={completeEntrance}
          className="fixed inset-0 z-[90] flex items-center justify-center px-6"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 35%, #16234f 0%, #0d1533 55%, #070b1e 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <motion.p
              key={greetings[wordIndex].word}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative px-5 pb-4 text-[clamp(3.2rem,10vw,6.8rem)] leading-none"
              style={{
                color: greetings[wordIndex].accent,
                fontFamily: '"Snell Roundhand", "Apple Chancery", "Segoe Script", cursive',
                fontWeight: 500,
                letterSpacing: "-0.065em",
                textShadow: "0 2px 30px rgba(231,180,80,0.28)",
              }}
            >
              {greetings[wordIndex].word}
              <span
                aria-hidden
                className="absolute bottom-0 left-[12%] h-px w-[78%] origin-left rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${greetings[wordIndex].accent}, transparent)` }}
              />
            </motion.p>
            <motion.span
              key={`${greetings[wordIndex].word}-note`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 0.72, y: 0 }}
              transition={{ delay: 0.08, duration: 0.28 }}
              className="font-mono text-[0.58rem] uppercase tracking-[0.38em] text-white/70"
            >
              {greetings[wordIndex].note}
            </motion.span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
