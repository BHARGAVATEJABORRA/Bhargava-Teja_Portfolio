"use client";

import { useEffect, useState } from "react";

interface HeroWowCardProps {
  title: string;
  subtitle: string;
  bullets: string[];
}

export function HeroWowCard({ title, subtitle, bullets }: HeroWowCardProps) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      setIsReducedMotion(media.matches);
    };

    handleChange();
    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <article
      onPointerMove={(event) => {
        if (isReducedMotion) {
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        setTilt({ x: y * -8, y: x * 12 });
        setGlow({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      onPointerLeave={() => {
        setTilt({ x: 0, y: 0 });
        setGlow({ x: 50, y: 50 });
      }}
      className="group relative isolate overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_20px_45px_rgba(8,15,28,0.12)]"
      style={{
        transform: isReducedMotion ? "none" : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 140ms ease-out",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(72, 187, 120, 0.28), transparent 54%)`,
        }}
      />
      <div className="relative space-y-5">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Hero Signal</p>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">{title}</h2>
          <p className="text-sm text-[var(--color-muted-ink)]">{subtitle}</p>
        </header>
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-muted-ink)]">
              <span aria-hidden className="mt-2 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
