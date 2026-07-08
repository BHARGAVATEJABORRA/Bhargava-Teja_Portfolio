"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface EntranceCurtainProps {
  onDone: () => void;
}

const greetings = ["Hello", "नमस्ते", "నమస్కారం"];

export function EntranceCurtain({ onDone }: EntranceCurtainProps) {
  const shouldReduceMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
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
    if (shouldReduceMotion === null) {
      return;
    }

    const isReducedMotion = shouldReduceMotion;

    hasCompletedRef.current = false;
    const resetFrame = window.requestAnimationFrame(() => {
      setWordIndex(0);
      setIsVisible(true);
    });

    const keyListener = () => {
      completeEntrance();
    };

    window.addEventListener("keydown", keyListener);

    if (isReducedMotion) {
      const timeout = window.setTimeout(completeEntrance, 360);

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
      endTimeout = window.setTimeout(completeEntrance, 280);
    }, 340);

    return () => {
      window.cancelAnimationFrame(resetFrame);
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--color-ink)] px-6 text-[var(--color-bg)]"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <motion.p
              key={greetings[wordIndex]}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {greetings[wordIndex]}
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
