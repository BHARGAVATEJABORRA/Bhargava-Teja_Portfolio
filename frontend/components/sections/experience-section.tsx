"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaBriefcase,
  FaCertificate,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaRegStar,
} from "react-icons/fa";

import { SectionShell } from "@/components/ui/section-shell";
import { type ExperienceItem, portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";

type ExperienceTab = "work" | "education" | "certifications";

interface ExperienceTabMeta {
  label: string;
  heading: string;
  eyebrow: string;
  description: string;
  icon: IconType;
}

const tabOrder: ExperienceTab[] = ["work", "education", "certifications"];

const tabMeta: Record<ExperienceTab, ExperienceTabMeta> = {
  work: {
    label: "Career",
    heading: "Production Engineering Experience",
    eyebrow: "Experience",
    description:
      "Cloud, platform, and backend ownership across enterprise systems, with measurable reliability, cost, and delivery outcomes.",
    icon: FaBriefcase,
  },
  education: {
    label: "Education",
    heading: "Academic Foundation",
    eyebrow: "Education",
    description:
      "Graduate computer science training focused on the systems and software engineering fundamentals behind my platform work.",
    icon: FaGraduationCap,
  },
  certifications: {
    label: "Certifications",
    heading: "Validated Cloud Skills",
    eyebrow: "Credentials",
    description:
      "Cloud and AI credentials that support the AWS, Azure, and infrastructure work represented across the portfolio.",
    icon: FaCertificate,
  },
};

function buildItemKey(item: ExperienceItem) {
  return `${item.organization}-${item.title}-${item.period}`;
}

function getPrimaryMetric(item: ExperienceItem) {
  const metric = item.highlights.find((highlight) => /\d/.test(highlight));

  if (!metric) {
    return item.period;
  }

  const match = metric.match(/(?:reduced|improved|lowered|accelerat\w*|delivered)?[^.]*?(\d+%|\d+\+?)/i);

  return match?.[1] ?? item.period;
}

function ExperienceCard({
  item,
  index,
  featured = false,
}: {
  item: ExperienceItem;
  index: number;
  featured?: boolean;
}) {
  const visibleHighlights = item.highlights.slice(0, featured ? 3 : 2);

  return (
    <article
      className={`experience-card ${featured ? "experience-card--featured" : ""}`}
      style={{ ["--experience-card-index" as string]: index }}
    >
      <div className="experience-card__meta">
        <span>{item.period}</span>
        {item.location ? (
          <span className="inline-flex items-center gap-1.5">
            <FaMapMarkerAlt aria-hidden className="h-3 w-3" />
            {item.location}
          </span>
        ) : null}
      </div>

      <div className="experience-card__header">
        <div>
          <h3>{item.title}</h3>
          <p>{item.organization}</p>
        </div>

        <div className="experience-card__metric" aria-label="Primary outcome">
          {getPrimaryMetric(item)}
        </div>
      </div>

      <ul className="experience-card__highlights">
        {visibleHighlights.map((highlight) => (
          <li key={highlight}>
            <span aria-hidden />
            <p>{highlight}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ExperienceSection() {
  const [activeTab, setActiveTab] = useState<ExperienceTab>("work");
  const items = portfolioContent.experience[activeTab];
  const featuredItem = items[0];
  const supportingItems = items.slice(1);
  const ActiveIcon = tabMeta[activeTab].icon;

  return (
    <SectionShell
      id="experience"
      labelledBy="experience-title"
      animateOnView={false}
      className="items-start py-16 sm:py-20"
    >
      <div className="experience-reference-stage relative overflow-hidden rounded-[28px] border border-white/10 px-4 py-6 shadow-[0_28px_90px_rgba(1,5,10,0.34)] sm:px-6 sm:py-8 lg:px-8">
        <div className="relative z-10">
          <div
            role="tablist"
            aria-label="Experience categories"
            className="experience-tabs mx-auto"
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
                    trackEvent("experience_tab_change", { tab, source: "experience_section" });
                  }}
                  className="experience-tab"
                  data-active={isActive ? "true" : "false"}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  <span>{tabMeta[tab].label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
            <div className="experience-intro">
              <div className="experience-intro__icon" aria-hidden>
                <ActiveIcon className="h-5 w-5" />
              </div>
              <p className="experience-intro__eyebrow">{tabMeta[activeTab].eyebrow}</p>
              <h2 id="experience-title">{tabMeta[activeTab].heading}</h2>
              <p>{tabMeta[activeTab].description}</p>

              <div className="experience-intro__stats">
                <div>
                  <span>{items.length}</span>
                  <p>{items.length === 1 ? "Entry" : "Entries"}</p>
                </div>
                <div>
                  <span>{featuredItem ? getPrimaryMetric(featuredItem) : "Ready"}</span>
                  <p>Lead Signal</p>
                </div>
              </div>
            </div>

            <div
              id="experience-panel"
              role="tabpanel"
              aria-labelledby={`experience-tab-${activeTab}`}
              className="experience-panel"
            >
              {featuredItem ? <ExperienceCard item={featuredItem} index={0} featured /> : null}

              {supportingItems.length > 0 ? (
                <div className="experience-supporting-grid">
                  {supportingItems.map((item, index) => (
                    <ExperienceCard key={buildItemKey(item)} item={item} index={index + 1} />
                  ))}
                </div>
              ) : null}

              {items.length === 0 ? (
                <div className="experience-empty">
                  <FaRegStar aria-hidden className="h-4 w-4" />
                  No entries configured yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
