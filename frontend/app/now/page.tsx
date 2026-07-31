import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowLeft, LuActivity } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";

export const metadata: Metadata = {
  title: "Now",
  description: "What Bhargava Teja Borra is focused on right now.",
};

export default function NowPage() {
  const now = portfolioContent.now;
  const paragraphs = (now.text || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <main
      id="main-content"
      className="relative min-h-screen text-white"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 48%, #060f1c 100%)" }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          backgroundImage: "linear-gradient(rgba(251,191,36,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <section className="relative mx-auto w-[min(92vw,720px)] px-1 py-16 sm:py-24">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-white/60 transition hover:text-white">
          <LuArrowLeft size={14} aria-hidden /> Back home
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <span className="relative inline-flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
          <h1 className="text-3xl font-bold sm:text-4xl">
            <LuActivity size={22} className="mr-2 inline text-amber-400" aria-hidden />
            Now
          </h1>
        </div>
        {now.updatedAt && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">Last updated · {now.updatedAt}</p>
        )}

        <div className="mt-8 space-y-5 text-[1.05rem] leading-[1.85] text-white/80">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p className="text-white/50">Nothing here yet.</p>
          )}
        </div>

        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
          Inspired by the{" "}
          <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/60">
            /now page
          </a>{" "}
          movement.
        </p>
      </section>
    </main>
  );
}
