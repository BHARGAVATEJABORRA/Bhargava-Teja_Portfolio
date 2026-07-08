"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaBriefcase,
  FaCertificate,
  FaGraduationCap,
} from "react-icons/fa";
import {
  FaArrowUpRightFromSquare,
  FaAws,
  FaMicrosoft,
  FaShieldHalved,
} from "react-icons/fa6";

import { SectionShell } from "@/components/ui/section-shell";
import GlassSurface from "@/components/ui/glass-surface";
import { type ExperienceItem, portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";

type ExperienceTab = "work" | "education" | "certifications";

interface ExperienceTabMeta {
  label: string;
  icon: IconType;
}

// Order: Education first, Career in the middle, Certifications last.
const tabOrder: ExperienceTab[] = ["education", "work", "certifications"];

const tabMeta: Record<ExperienceTab, ExperienceTabMeta> = {
  work: { label: "Career", icon: FaBriefcase },
  education: { label: "Education", icon: FaGraduationCap },
  certifications: { label: "Certifications", icon: FaCertificate },
};

const brandIconMap: Record<string, IconType> = {
  SiAmazonwebservices: FaAws,
  SiMicrosoftazure: FaMicrosoft,
  SiOracle: FaCertificate,
};

/** Career entry: company, role, dates only. */
function WorkCard({ item }: { item: ExperienceItem }) {
  return (
    <article className="xp-row">
      <div className="xp-row__bullet" aria-hidden />
      <div className="xp-row__body">
        <h3 className="xp-row__title">{item.title}</h3>
        <p className="xp-row__org">{item.organization}</p>
      </div>
      <span className="xp-row__period">{item.period}</span>
    </article>
  );
}

/** Education entry: degree title + school only. */
function EducationCard({ item }: { item: ExperienceItem }) {
  return (
    <article className="xp-row">
      <div className="xp-row__bullet" aria-hidden />
      <div className="xp-row__body">
        <h3 className="xp-row__title">{item.title}</h3>
        <p className="xp-row__org">{item.organization}</p>
      </div>
      <span className="xp-row__period">{item.period}</span>
    </article>
  );
}

/**
 * Certification flip card: badge + title on the front; hovering (or keyboard
 * focus) flips it to reveal only a "Verify credential" button. Moving the
 * cursor away flips it back — no taps, no back button.
 */
function CertCard({ item }: { item: ExperienceItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const FallbackIcon = item.brandIconKey ? brandIconMap[item.brandIconKey] : undefined;
  const accent = item.brandColor ?? "#6aa6ff";
  const showImage = item.badgeUrl && !imgFailed;

  return (
    <div className="cert-card" style={{ ["--cert-accent" as string]: accent }}>
      <div className="cert-card__inner">
        {/* Front — badge + title. Hover flips the card. */}
        <div className="cert-card__face cert-card__face--front">
          <div className="cert-tile__badge">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Credly badge, no loader config
              <img
                src={item.badgeUrl}
                alt={`${item.title} badge`}
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            ) : FallbackIcon ? (
              <FallbackIcon aria-hidden />
            ) : (
              <FaCertificate aria-hidden />
            )}
          </div>
          <h3 className="cert-tile__title">{item.title}</h3>
        </div>

        {/* Back — just the verify action */}
        <div className="cert-card__face cert-card__face--back">
          {item.verifyUrl ? (
            <a
              href={item.verifyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="cert-card__verify"
              aria-label={`Verify ${item.title}`}
              onClick={() =>
                trackEvent("cert_verify_click", {
                  certification: item.title,
                  source: "experience_section",
                })
              }
            >
              <FaShieldHalved aria-hidden />
              <span>Verify credential</span>
              <FaArrowUpRightFromSquare aria-hidden className="cert-card__verify-ext" />
            </a>
          ) : (
            <p className="cert-card__novf">Verification link unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExperienceSection() {
  const [activeTab, setActiveTab] = useState<ExperienceTab>("education");
  const items = portfolioContent.experience[activeTab];

  return (
    <SectionShell
      id="experience"
      labelledBy="experience-title"
      animateOnView={false}
      className="items-start py-16 sm:py-20"
    >
      <GlassSurface
        className="rounded-[28px] px-5 py-8 sm:px-8 sm:py-10"
        borderRadius={28}
        width="100%"
        height="auto"
        distortionScale={-90}
        redOffset={0}
        greenOffset={0}
        blueOffset={0}
        brightness={60}
        opacity={0.93}
        blur={14}
        displace={2}
        backgroundOpacity={0.08}
        saturation={1.1}
        mixBlendMode="screen"
      >
        <div>
          <div className="xp-head">
            <p className="xp-eyebrow">Experience</p>
            <h2 id="experience-title" className="xp-heading">
              Where I&apos;ve studied, worked &amp; certified
            </h2>

            <div role="tablist" aria-label="Experience categories" className="xp-tabs">
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
                    className="xp-tab"
                    data-active={isActive ? "true" : "false"}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                    <span>{tabMeta[tab].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="experience-panel"
            role="tabpanel"
            aria-labelledby={`experience-tab-${activeTab}`}
            className="mt-8"
          >
            {activeTab === "certifications" ? (
              <div className="cert-grid">
                {items.map((item) => (
                  <CertCard key={`${item.organization}-${item.title}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="xp-list">
                {items.map((item) =>
                  activeTab === "work" ? (
                    <WorkCard key={`${item.organization}-${item.title}`} item={item} />
                  ) : (
                    <EducationCard key={`${item.organization}-${item.title}`} item={item} />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </GlassSurface>
    </SectionShell>
  );
}
