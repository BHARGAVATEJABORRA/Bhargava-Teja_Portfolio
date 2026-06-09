"use client";

import { useEffect, useId, useState } from "react";
import { LuBadgeCheck, LuFingerprint, LuLockKeyhole, LuMail, LuShieldCheck } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";

const reflectiveNoise =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";

export function ReflectiveAccessCard() {
  const rawId = useId();
  const filterId = `reflective-access-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [tilt, setTilt] = useState({ x: -4, y: 8 });
  const [glow, setGlow] = useState({ x: 66, y: 28 });

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
      aria-label="Private access card preview"
      onPointerMove={(event) => {
        if (isReducedMotion) {
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        setTilt({
          x: (0.5 - y) * 16,
          y: (x - 0.5) * 20,
        });
        setGlow({ x: x * 100, y: y * 100 });
      }}
      onPointerLeave={() => {
        setTilt({ x: -4, y: 8 });
        setGlow({ x: 66, y: 28 });
      }}
      className="group relative mx-auto w-full max-w-[21rem] overflow-hidden rounded-[2rem] border border-white/12 bg-[#08111a] shadow-[0_32px_80px_rgba(7,15,24,0.34)]"
      style={{
        transform: isReducedMotion ? "none" : `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 160ms ease-out",
      }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="26"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,18,0.98)_0%,rgba(7,18,30,0.92)_56%,rgba(3,8,15,0.98)_100%)]" />
      <div
        aria-hidden
        className="absolute inset-[-12%] opacity-85"
        style={{
          background: `
            radial-gradient(circle at 18% 14%, rgba(34, 211, 194, 0.34), transparent 28%),
            radial-gradient(circle at 82% 0%, rgba(104, 143, 255, 0.32), transparent 30%),
            radial-gradient(circle at 50% 82%, rgba(255, 165, 120, 0.18), transparent 36%),
            linear-gradient(135deg, rgba(220, 238, 255, 0.26), rgba(255, 255, 255, 0.02) 42%, rgba(34, 211, 194, 0.12) 100%)
          `,
          filter: `url(#${filterId}) blur(22px) saturate(138%)`,
          transform: isReducedMotion
            ? "scale(1.08)"
            : `translate3d(${tilt.y * -1.2}px, ${tilt.x * 1.4}px, 0) scale(1.1)`,
          transition: "transform 160ms ease-out",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.48), rgba(255,255,255,0.14) 18%, transparent 44%)`,
          transition: "background 120ms ease-out",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45 mix-blend-overlay"
        style={{
          backgroundImage: reflectiveNoise,
          backgroundSize: "180px 180px",
        }}
      />
      <div
        aria-hidden
        className="animate-reflective-sweep pointer-events-none absolute -left-[24%] top-[-12%] h-[72%] w-[72%] rounded-full bg-[linear-gradient(140deg,rgba(255,255,255,0.56),rgba(255,255,255,0.12)_42%,rgba(255,255,255,0)_70%)] opacity-60 blur-3xl mix-blend-screen"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
        style={{
          background:
            "linear-gradient(132deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0) 38%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0.32) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/14" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/8" />

      <div className="relative z-10 flex aspect-[0.68] h-full flex-col justify-between p-6 text-white sm:p-7">
        <header className="flex items-start justify-between gap-3 border-b border-white/14 pb-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/86 backdrop-blur-sm">
              <LuLockKeyhole size={12} aria-hidden />
              <span>Private Access</span>
            </div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/52">Review Capsule</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-100/85">
            <LuBadgeCheck size={12} aria-hidden />
            Verified
          </span>
        </header>

        <div className="space-y-5">
          <div className="space-y-3">
            <h2 className="max-w-[14rem] text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.32)]">
              Invite-based login for private portfolio reviews.
            </h2>
            <p className="max-w-[16rem] text-sm leading-relaxed text-white/72">
              Recruiter handoffs, architecture notes, and restricted walkthrough links are shared after approval.
            </p>
          </div>

          <dl className="grid gap-2 rounded-[1.35rem] border border-white/12 bg-black/18 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 text-sm">
              <dt className="inline-flex items-center gap-2 text-white/54">
                <LuShieldCheck size={14} aria-hidden />
                Scope
              </dt>
              <dd className="font-medium text-white/84">Reviewer access</dd>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <dt className="inline-flex items-center gap-2 text-white/54">
                <LuMail size={14} aria-hidden />
                Channel
              </dt>
              <dd className="font-medium text-white/84">Direct email handoff</dd>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-white/54">Response</dt>
              <dd className="font-medium text-white/84">Usually within 1 business day</dd>
            </div>
          </dl>
        </div>

        <footer className="flex items-end justify-between gap-4 border-t border-white/14 pt-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/46">Contact Route</p>
            <p className="truncate pt-1 font-mono text-[0.78rem] text-white/78">{portfolioContent.identity.contactEmail}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-white/42">
            <LuFingerprint size={28} aria-hidden />
            <span className="text-[0.58rem] uppercase tracking-[0.24em]">Manual handoff</span>
          </div>
        </footer>
      </div>
    </article>
  );
}
