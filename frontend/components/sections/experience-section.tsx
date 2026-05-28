"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaCertificate,
  FaGraduationCap,
  FaRegStar,
  FaThumbsUp,
} from "react-icons/fa";
import type { IconType } from "react-icons";

import { SectionShell } from "@/components/ui/section-shell";
import { type ExperienceItem, portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";

type ExperienceTab = "education" | "work" | "certifications";

interface ExperienceTabMeta {
  label: string;
  heading: string;
  icon: IconType;
  posterEyebrow: string;
}

interface PosterPalette {
  word: string;
  accent: string;
  glow: string;
  panel: string;
}

const tabOrder: ExperienceTab[] = ["education", "work", "certifications"];

const tabMeta: Record<ExperienceTab, ExperienceTabMeta> = {
  education: {
    label: "Education",
    heading: "My Education",
    icon: FaGraduationCap,
    posterEyebrow: "Academic Foundation",
  },
  work: {
    label: "Career",
    heading: "My Career",
    icon: FaBriefcase,
    posterEyebrow: "Professional Impact",
  },
  certifications: {
    label: "Certifications",
    heading: "My Certifications",
    icon: FaCertificate,
    posterEyebrow: "Validated Expertise",
  },
};

const posterPalettes: Record<ExperienceTab, PosterPalette[]> = {
  education: [
    {
      word: "#0f5c7b",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.16)",
      panel: "linear-gradient(135deg, #f7fbff 0%, #e6effa 100%)",
    },
    {
      word: "#174f86",
      accent: "#22c55e",
      glow: "rgba(34, 197, 94, 0.14)",
      panel: "linear-gradient(135deg, #f8fcff 0%, #eef5fb 100%)",
    },
  ],
  work: [
    {
      word: "#0e5f7e",
      accent: "#f0b739",
      glow: "rgba(34, 211, 194, 0.18)",
      panel: "linear-gradient(135deg, #fbfcfe 0%, #ebf1f6 100%)",
    },
    {
      word: "#145a7a",
      accent: "#7c3aed",
      glow: "rgba(124, 58, 237, 0.16)",
      panel: "linear-gradient(135deg, #fafbfd 0%, #edf3f7 100%)",
    },
  ],
  certifications: [
    {
      word: "#0d5773",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.14)",
      panel: "linear-gradient(135deg, #fffdf8 0%, #f3efe3 100%)",
    },
    {
      word: "#125d78",
      accent: "#14b8a6",
      glow: "rgba(20, 184, 166, 0.14)",
      panel: "linear-gradient(135deg, #fbfdfd 0%, #ebf3f0 100%)",
    },
  ],
};

const slideVariants = {
  hidden: {
    opacity: 0,
    scale: 0.62,
    x: 0,
    rotateY: 0,
    z: -420,
  },
  prev: {
    opacity: 0.34,
    scale: 0.82,
    x: -210,
    rotateY: 18,
    z: -220,
  },
  active: {
    opacity: 1,
    scale: 1,
    x: 0,
    rotateY: 0,
    z: 0,
  },
  next: {
    opacity: 0.34,
    scale: 0.82,
    x: 210,
    rotateY: -18,
    z: -220,
  },
};

const initialIndices: Record<ExperienceTab, number> = {
  education: 0,
  work: 0,
  certifications: 0,
};

const initialExpanded: Record<ExperienceTab, string | null> = {
  education: null,
  work: null,
  certifications: null,
};

function modulo(value: number, length: number) {
  if (length === 0) {
    return 0;
  }

  return ((value % length) + length) % length;
}

function clampIndex(value: number, length: number) {
  if (length === 0) {
    return 0;
  }

  return Math.min(Math.max(value, 0), length - 1);
}

function getMountedIndices(length: number, activeIndex: number) {
  if (length === 0) {
    return [];
  }

  if (length === 1) {
    return [0];
  }

  if (length === 2) {
    return [activeIndex, modulo(activeIndex + 1, length)];
  }

  return [modulo(activeIndex - 1, length), activeIndex, modulo(activeIndex + 1, length)];
}

function buildItemKey(item: ExperienceItem) {
  return `${item.organization}-${item.title}-${item.period}`;
}

function buildPosterName(organization: string) {
  const cleaned = organization.replace(/[|]/g, " ").replace(/\s+/g, " ").trim();

  if (cleaned.length <= 16) {
    return cleaned.toUpperCase();
  }

  const parts = cleaned
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .filter((part) => !["of", "the", "and", "in", "for"].includes(part.toLowerCase()));

  const acronym = parts.map((part) => part[0]).join("");

  if (acronym.length >= 2 && acronym.length <= 6) {
    return acronym.toUpperCase();
  }

  return parts.slice(0, 2).join(" ").toUpperCase();
}

function buildSummary(item: ExperienceItem) {
  return item.highlights[0] ?? `${item.title} at ${item.organization}.`;
}

function getPosterPalette(tab: ExperienceTab, index: number) {
  const palettes = posterPalettes[tab];
  return palettes[index % palettes.length];
}

function ExperiencePoster({ item, tab, index }: { item: ExperienceItem; tab: ExperienceTab; index: number }) {
  const palette = getPosterPalette(tab, index);

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-black/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_14px_32px_rgba(12,18,28,0.12)] sm:p-6 lg:p-8"
      style={{ background: palette.panel }}
    >
      <div
        aria-hidden
        className="absolute -bottom-12 right-6 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: palette.glow }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-4 hidden h-44 w-32 rounded-t-[4.5rem] rounded-br-[1.5rem] md:block"
        style={{ background: `linear-gradient(180deg, ${palette.accent}, ${palette.word})` }}
      />
      <div
        aria-hidden
        className="absolute bottom-7 right-10 hidden h-24 w-24 rounded-full border-[18px] md:block"
        style={{ borderColor: palette.glow }}
      />
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-full"
        style={{
          background: `radial-gradient(circle at 84% 22%, ${palette.glow} 0%, transparent 30%)`,
        }}
      />

      <div className="relative max-w-[70%] space-y-3">
        <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
          {tabMeta[tab].posterEyebrow}
        </span>
        <p
          className="text-[clamp(2.4rem,7vw,6rem)] font-black leading-none tracking-[-0.08em]"
          style={{ color: palette.word }}
        >
          {buildPosterName(item.organization)}
        </p>
        <p className="max-w-[32rem] text-[clamp(1rem,2.4vw,2.4rem)] font-medium leading-[1.05] text-slate-700">
          {item.title}
        </p>
      </div>
    </div>
  );
}

export function ExperienceSection() {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<ExperienceTab>("work");
  const [activeIndices, setActiveIndices] = useState<Record<ExperienceTab, number>>(initialIndices);
  const [expandedItems, setExpandedItems] = useState<Record<ExperienceTab, string | null>>(initialExpanded);

  const items = portfolioContent.experience[activeTab];
  const activeIndex = clampIndex(activeIndices[activeTab], items.length);
  const mountedIndices = getMountedIndices(items.length, activeIndex);
  const slideTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.82,
        ease: "easeInOut" as const,
      };

  function setSlide(index: number) {
    setActiveIndices((previous) => ({
      ...previous,
      [activeTab]: index,
    }));
    setExpandedItems((previous) => ({
      ...previous,
      [activeTab]: null,
    }));
  }

  function moveSlide(direction: 1 | -1) {
    if (items.length <= 1) {
      return;
    }

    const nextIndex = modulo(activeIndex + direction, items.length);
    setSlide(nextIndex);
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const swipePower = Math.abs(info.offset.x) * info.velocity.x;

    if (swipePower < -10000) {
      moveSlide(1);
    }

    if (swipePower > 10000) {
      moveSlide(-1);
    }
  }

  return (
    <SectionShell id="experience" labelledBy="experience-title" animateOnView={false} className="py-16 sm:py-20">
      <div className="experience-reference-stage relative overflow-hidden rounded-[42px] border border-white/10 px-4 py-8 shadow-[0_36px_120px_rgba(1,5,10,0.48)] sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="relative z-10 space-y-8">
          <div
            role="tablist"
            aria-label="Experience categories"
            className="mx-auto flex w-full max-w-[72rem] items-center justify-between gap-2 rounded-full border border-white/8 bg-[rgba(21,24,29,0.72)] px-2 py-2 shadow-[4px_4px_8px_rgba(0,0,0,0.44),-4px_-4px_12px_rgba(58,65,73,0.22),inset_-2px_-2px_4px_rgba(58,65,73,0.16),inset_2px_2px_6px_rgba(0,0,0,0.32)] backdrop-blur-md sm:gap-3 sm:px-4 sm:py-4"
          >
            {tabOrder.map((tab) => {
              const Icon = tabMeta[tab].icon;
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  id={`experience-tab-${tab}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="experience-panel"
                  onClick={() => {
                    setActiveTab(tab);
                    trackEvent("experience_tab_change", { tab, source: "experience_showcase" });
                  }}
                  className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b739] sm:text-base ${
                    isActive
                      ? "bg-[#f0b739] text-[#17191f] shadow-[0_10px_24px_rgba(240,183,57,0.26)]"
                      : "text-white/86 hover:bg-[#f0b739]/15 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
                  <span className="truncate">{tabMeta[tab].label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/52">Experience</p>
            <h2 id="experience-title" className="text-[clamp(2.3rem,5vw,4.3rem)] font-semibold tracking-tight text-white">
              {tabMeta[activeTab].heading}
            </h2>
          </div>

          <div
            id="experience-panel"
            role="tabpanel"
            aria-labelledby={`experience-tab-${activeTab}`}
            className="relative mx-auto w-full max-w-[74rem]"
          >
            {items.length === 0 ? (
              <div className="mx-auto max-w-[64rem] rounded-[34px] border border-white/10 bg-[rgba(15,19,24,0.78)] p-8 text-center text-white/72 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                No entries configured yet.
              </div>
            ) : (
              <div className="relative flex min-h-[570px] items-center justify-center [perspective:1800px] sm:min-h-[640px] lg:min-h-[700px]">
                {items.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Previous experience"
                    onClick={() => moveSlide(-1)}
                    className="absolute left-0 top-1/2 z-30 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-md transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b739] sm:h-20 sm:w-20 lg:-left-5"
                  >
                    <FaArrowLeft className="h-8 w-8 sm:h-10 sm:w-10" />
                  </button>
                ) : null}

                <motion.div
                  className="relative h-full w-full"
                  drag={items.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={handleDragEnd}
                >
                  <AnimatePresence initial={false}>
                    {mountedIndices.map((index) => {
                      const item = items[index];
                      const isActive = index === activeIndex;
                      const itemKey = buildItemKey(item);
                      const isExpanded = expandedItems[activeTab] === itemKey;
                      const slideState =
                        items.length === 1
                          ? "active"
                          : isActive
                            ? "active"
                            : index === modulo(activeIndex - 1, items.length)
                              ? "prev"
                              : "next";

                      return (
                        <motion.article
                          key={`${activeTab}-${itemKey}`}
                          variants={slideVariants}
                          initial="hidden"
                          animate={slideState}
                          exit="hidden"
                          transition={slideTransition}
                          className={`absolute left-1/2 top-1/2 flex h-[92%] w-[min(100%,1020px)] -translate-x-1/2 -translate-y-1/2 transform-gpu flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[rgba(15,19,24,0.78)] shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl [transform-style:preserve-3d] ${
                            isActive ? "pointer-events-auto" : "pointer-events-none"
                          }`}
                          style={{ willChange: "transform, opacity" }}
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent_38%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_28%)]" />
                          <div className="absolute right-4 top-4 z-20 rounded-full bg-white shadow-[0_14px_24px_rgba(0,0,0,0.28)]">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffffff_0%,#eff2f5_100%)] text-[#17191f]">
                              <FaThumbsUp className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="relative z-10 flex h-full flex-col gap-5 p-5 sm:p-6 lg:p-8">
                            <ExperiencePoster item={item} tab={activeTab} index={index} />

                            <div className="flex flex-1 flex-col gap-4">
                              <div className="space-y-1.5">
                                <h3 className="bg-[linear-gradient(135deg,#d7ba56_0%,#f0d97d_44%,#b89a3f_100%)] bg-clip-text text-[clamp(1.7rem,3vw,2.65rem)] font-semibold leading-[1.03] tracking-tight text-transparent">
                                  {item.title}
                                </h3>
                                <p className="text-[clamp(1rem,1.8vw,1.45rem)] font-semibold text-white/92">
                                  {item.organization}
                                  {item.location ? ` | ${item.location}` : ""}
                                </p>
                                <p className="text-sm font-medium text-white/68 sm:text-base">{item.period}</p>
                              </div>

                              <p className="rounded-[28px] border border-white/12 bg-white/4 px-5 py-4 text-sm leading-relaxed text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:text-base">
                                {buildSummary(item)}
                              </p>

                              <AnimatePresence initial={false}>
                                {isExpanded ? (
                                  <motion.div
                                    key={`${itemKey}-details`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="rounded-[28px] border border-[#f0b739]/16 bg-black/18 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                                        <FaRegStar className="h-3 w-3" />
                                        Highlights
                                      </div>
                                      <ul className="space-y-2.5 text-sm leading-relaxed text-white/76 sm:text-[0.95rem]">
                                        {item.highlights.map((highlight) => (
                                          <li key={highlight} className="flex gap-3">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b739]" />
                                            <span>{highlight}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>

                              <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedItems((previous) => ({
                                      ...previous,
                                      [activeTab]: isExpanded ? null : itemKey,
                                    }));
                                  }}
                                  className="group inline-flex items-center justify-center rounded-xl border border-[#d2d7dd] bg-white px-5 py-4 text-sm font-semibold text-[#17191f] shadow-[0_10px_0_rgba(123,129,138,0.6)] transition duration-200 hover:-translate-y-1 hover:bg-[#f0b739] hover:shadow-[0_16px_0_rgba(123,129,138,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b739] sm:text-base"
                                >
                                  {isExpanded ? "Hide Highlights" : "Learn More →"}
                                </button>

                                <p className="text-sm font-medium text-white/72">
                                  Highlights: {item.highlights.length}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                {items.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Next experience"
                    onClick={() => moveSlide(1)}
                    className="absolute right-0 top-1/2 z-30 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-md transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b739] sm:h-20 sm:w-20 lg:-right-5"
                  >
                    <FaArrowRight className="h-8 w-8 sm:h-10 sm:w-10" />
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
