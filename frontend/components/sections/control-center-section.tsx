"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { HeroControlWindow } from "@/components/sections/control-center/hero-control-window";

export function ControlCenterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section
      aria-label="At a glance"
      className="relative scroll-mt-24 px-4 py-20 sm:px-8 sm:py-28"
    >
      <motion.div
        ref={ref}
        initial={{ y: 40, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-center"
      >
        <HeroControlWindow className="mx-auto" />
      </motion.div>
    </section>
  );
}
