"use client";

// ContactReveal — the footer contact panel collapsed to a single "Contact me"
// pill (Tony, 2026-07-07). Hovering (or keyboard-focusing) the pill reveals
// the full contact panel above it with a react-bits-style "blur up" reveal
// (opacity + rise + scale + blur, like react-bits BlurText/AnimatedContent);
// the pill itself runs a react-bits ShinyText sweep. Click pins the panel
// open so touch devices work; Esc or clicking again releases it.
//
// Popover notes:
// • The panel is an absolutely-positioned DESCENDANT of the hover wrapper, so
//   hovering the panel keeps the wrapper's mouseenter state.
// • The panel container reaches down to the pill (bottom-full with internal
//   padding instead of an external gap) — no dead strip between pill and
//   panel, so the popover doesn't collapse while the cursor crosses over.
// • The form stays mounted while hidden: typed values survive a hover-out.

import { useEffect, useRef, useState, type FocusEvent } from "react";

import { ContactForm } from "@/components/sections/contact-form";

export function ContactReveal() {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const open = hovered || pinned;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(event.relatedTarget as Node | null)) {
      setHovered(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={handleBlur}
    >
      <div
        aria-hidden={!open}
        className={`contact-reveal-panel absolute top-full left-1/2 z-30 w-[min(34rem,calc(100vw-2.5rem))] pt-4 ${
          open ? "contact-reveal-panel--open" : ""
        }`}
      >
        <ContactForm compact className="footer-liquid-panel footer-contact-card w-full" />
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="contact-reveal-form"
        onClick={() => setPinned((value) => !value)}
        className="contact-reveal-pill group relative inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-8 py-3.5 backdrop-blur-md transition-colors duration-300 hover:border-white/45 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="contact-reveal-shine text-sm font-semibold uppercase tracking-[0.22em]">
          Contact me
        </span>
        <span
          aria-hidden
          className="text-white/70 transition-transform duration-300 group-hover:translate-y-0.5"
        >
          ↓
        </span>
      </button>
    </div>
  );
}
