"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface EntranceCurtainProps {
  isOpen: boolean;
  onComplete: () => void;
}

const greetings = ["Hello", "नमस्ते", "నమస్కారం"];

export function EntranceCurtain({ isOpen, onComplete }: EntranceCurtainProps) {
  const shouldReduceMotion = useReducedMotion();
  const isReducedMotion =
    shouldReduceMotion || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [wordIndex, setWordIndex] = useState(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    hasCompletedRef.current = false;
    const resetFrame = window.requestAnimationFrame(() => {
      setWordIndex(0);
    });

    const finish = () => {
      if (hasCompletedRef.current) {
        return;
      }

      hasCompletedRef.current = true;
      onComplete();
    };

    const keyListener = () => {
      finish();
    };

    window.addEventListener("keydown", keyListener);

    if (isReducedMotion) {
      const timeout = window.setTimeout(finish, 360);

      return () => {
        window.cancelAnimationFrame(resetFrame);
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
      endTimeout = window.setTimeout(finish, 280);
    }, 340);

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.removeEventListener("keydown", keyListener);
      window.clearInterval(interval);

      if (endTimeout !== null) {
        window.clearTimeout(endTimeout);
      }
    };
  }, [isOpen, onComplete, isReducedMotion]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          aria-label="Entrance greeting"
          role="dialog"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
          onPointerDown={() => {
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true;
              onComplete();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)] px-6 text-[var(--color-bg)]"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <motion.p
              key={greetings[wordIndex]}
              initial={isReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={isReducedMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {greetings[wordIndex]}
            </motion.p>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-bg)/0.75]">
              Press any key or click to skip
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
