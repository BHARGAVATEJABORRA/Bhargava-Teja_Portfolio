"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface EntranceCurtainProps {
  onDone: () => void;
  ready: boolean;
}

const greetings = [
  { word: "Hello", accent: "#F0D9A0" },
  { word: "నమస్తే", accent: "#D4E3FF" },
  { word: "నమస్కారం", accent: "#E5C9FF" },
];

export function EntranceCurtain({
  onDone,
  ready,
}: EntranceCurtainProps) {
  const shouldReduceMotion = useReducedMotion();

  const [wordIndex, setWordIndex] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);
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
    if (!ready || !sequenceComplete) {
      return;
    }

    const frame = window.requestAnimationFrame(completeEntrance);

    return () => {
      window.cancelAnimationFrame(frame);
    };
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

    // Prevent the curtain from trapping the visitor if something fails.
    const safetyTimeout = window.setTimeout(completeEntrance, 4500);

    const keyListener = () => {
      completeEntrance();
    };

    window.addEventListener("keydown", keyListener);

    if (isReducedMotion) {
      const timeout = window.setTimeout(() => {
        setSequenceComplete(true);
      }, 360);

      return () => {
        window.cancelAnimationFrame(resetFrame);
        window.clearTimeout(safetyTimeout);
        window.clearTimeout(timeout);
        window.removeEventListener("keydown", keyListener);
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

      endTimeout = window.setTimeout(() => {
        setSequenceComplete(true);
      }, 280);
    }, 340);

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.clearTimeout(safetyTimeout);
      window.clearInterval(interval);
      window.removeEventListener("keydown", keyListener);

      if (endTimeout !== null) {
        window.clearTimeout(endTimeout);
      }
    };
  }, [completeEntrance, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          aria-label="Entrance greeting"
          role="dialog"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.28,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          onPointerDown={completeEntrance}
          className="fixed inset-0 z-[90] flex items-center justify-center px-6"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 35%, #16234f 0%, #0d1533 55%, #070b1e 100%)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <motion.p
              key={greetings[wordIndex].word}
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 18,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      y: -14,
                    }
              }
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="px-5 text-[clamp(3.2rem,10vw,6.8rem)] leading-none"
              style={{
                color: greetings[wordIndex].accent,
                fontFamily:
                  '"Snell Roundhand", "Apple Chancery", "Segoe Script", cursive',
                fontWeight: 500,
                letterSpacing: "-0.065em",
                textShadow: "0 2px 30px rgba(231,180,80,0.28)",
              }}
            >
              {greetings[wordIndex].word}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}