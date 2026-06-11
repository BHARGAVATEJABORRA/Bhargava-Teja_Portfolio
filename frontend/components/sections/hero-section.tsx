"use client";

import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { FaInstagram, FaTwitter } from "react-icons/fa";
import { LuArrowRight, LuLink2, LuMail } from "react-icons/lu";
import { SiCredly, SiSnapchat } from "react-icons/si";

import { GlareHover } from "@/components/reactbits/glare-hover";
import DecryptedText from "@/components/reactbits/decrypted-text";
import { Iridescence } from "@/components/reactbits/iridescence";
import TextType from "@/components/reactbits/text-type";
import { AiCompanion } from "@/components/sections/ai-companion";
import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";
import { getResolvedSocialLink, resolveRecruiterSafeLink } from "@/lib/profile-links";
import { scrollToSection } from "@/lib/scroll-to-section";
import { socialOrbThemes, type SocialOrbThemeKey } from "@/lib/social-orb-theme";

type HeroIconComponent = ComponentType<{
  size?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}>;

type HeroDockOpenMode = "mail" | "new-tab" | "same-tab";

interface HeroDockItem {
  key: SocialOrbThemeKey;
  label: string;
  href: string;
  Icon: HeroIconComponent;
  eventName: "resume_download" | "social_icon_click";
  openMode: HeroDockOpenMode;
}

const dockIconVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: {
    rotate: 360,
    scale: 1.04,
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const dockLabelVariants = {
  rest: {
    opacity: 0,
    x: -8,
    scale: 0.98,
  },
  hover: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function openDockItem(item: HeroDockItem) {
  trackEvent(item.eventName, { platform: item.key, source: "hero_social_dock", target: item.href });

  if (item.href.startsWith("#")) {
    scrollToSection(item.href.replace("#", ""));
    return;
  }

  if (item.openMode === "mail") {
    window.location.assign(item.href);
    return;
  }

  if (item.openMode === "new-tab") {
    window.open(item.href, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.assign(item.href);
}

interface HeroCornerButtonProps {
  Icon: HeroIconComponent;
  label: string;
  onClick: () => void;
  iconColor?: string;
  isExpanded?: boolean;
  hasPopup?: boolean;
}

function HeroCornerButton({
  Icon,
  label,
  onClick,
  iconColor = "var(--color-ink)",
  isExpanded = false,
  hasPopup = false,
}: HeroCornerButtonProps) {
  return (
    <motion.button
      type="button"
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-label={label}
      aria-expanded={hasPopup ? isExpanded : undefined}
      aria-haspopup={hasPopup ? "menu" : undefined}
      title={label}
      data-liquid-glass="on"
      className="liquid-control flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] shadow-[0_14px_30px_rgba(10,23,42,0.16)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:h-11 sm:w-11"
    >
      <motion.span variants={dockIconVariants} className="flex items-center justify-center">
        <Icon size={18} aria-hidden style={{ color: iconColor } as CSSProperties} className="sm:h-5 sm:w-5" />
      </motion.span>
    </motion.button>
  );
}

function HeroSocialMenuButton({
  item,
  onSelect,
}: {
  item: HeroDockItem;
  onSelect: (item: HeroDockItem) => void;
}) {
  const orbStyle = socialOrbThemes[item.key];

  return (
    <motion.button
      type="button"
      role="menuitem"
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.97 }}
      aria-label={item.label}
      title={item.label}
      onClick={() => onSelect(item)}
      style={orbStyle}
      className="hero-social-orb relative flex h-12 w-12 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:h-[3.25rem] sm:w-[3.25rem]"
    >
      <motion.span variants={dockIconVariants} className="relative z-10 flex items-center justify-center">
        <item.Icon size={22} aria-hidden />
      </motion.span>
      <motion.span
        variants={dockLabelVariants}
        className="pointer-events-none absolute left-[calc(100%+0.8rem)] top-1/2 z-10 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/18 bg-[rgba(28,28,28,0.92)] px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-white shadow-[0_16px_32px_rgba(0,0,0,0.28)] sm:block"
      >
        {item.label}
      </motion.span>
    </motion.button>
  );
}

function HeroSocialDock({ isSuppressed }: { isSuppressed: boolean }) {
  const github = getResolvedSocialLink("github");
  const linkedIn = getResolvedSocialLink("linkedin");
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const socialLinkByLabel = (label: string) =>
    portfolioContent.identity.socialLinks.find((link) => link.label.toLowerCase() === label.toLowerCase())?.href;

  const instagram = resolveRecruiterSafeLink(socialLinkByLabel("instagram"));
  const twitter = resolveRecruiterSafeLink(socialLinkByLabel("twitter"));
  const credly = resolveRecruiterSafeLink(socialLinkByLabel("credly"));
  const snapchat = resolveRecruiterSafeLink(socialLinkByLabel("snapchat"));

  const items: HeroDockItem[] = [
    ...(github.isConfigured
      ? [
          {
            key: "github",
            label: "GitHub",
            href: github.href,
            Icon: FaGithub,
            eventName: "social_icon_click",
            openMode: "new-tab",
          } satisfies HeroDockItem,
        ]
      : []),
    ...(linkedIn.isConfigured
      ? [
          {
            key: "linkedin",
            label: "LinkedIn",
            href: linkedIn.href,
            Icon: FaLinkedinIn,
            eventName: "social_icon_click",
            openMode: "new-tab",
          } satisfies HeroDockItem,
        ]
      : []),
    ...(credly.isConfigured
      ? [
          {
            key: "credly",
            label: "Credly",
            href: credly.href,
            Icon: SiCredly,
            eventName: "social_icon_click",
            openMode: credly.openInNewTab ? "new-tab" : "same-tab",
          } satisfies HeroDockItem,
        ]
      : []),
    ...(twitter.isConfigured
      ? [
          {
            key: "twitter",
            label: "Twitter",
            href: twitter.href,
            Icon: FaTwitter,
            eventName: "social_icon_click",
            openMode: twitter.openInNewTab ? "new-tab" : "same-tab",
          } satisfies HeroDockItem,
        ]
      : []),
    ...(instagram.isConfigured
      ? [
          {
            key: "instagram",
            label: "Instagram",
            href: instagram.href,
            Icon: FaInstagram,
            eventName: "social_icon_click",
            openMode: instagram.openInNewTab ? "new-tab" : "same-tab",
          } satisfies HeroDockItem,
        ]
      : []),
    ...(snapchat.isConfigured
      ? [
          {
            key: "snapchat",
            label: "Snapchat",
            href: snapchat.href,
            Icon: SiSnapchat,
            eventName: "social_icon_click",
            openMode: snapchat.openInNewTab ? "new-tab" : "same-tab",
          } satisfies HeroDockItem,
        ]
      : []),
    {
      key: "email",
      label: "Email",
      href: `mailto:${portfolioContent.identity.contactEmail}`,
      Icon: LuMail,
      eventName: "social_icon_click",
      openMode: "mail",
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dockRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isSuppressed) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isSuppressed]);

  return (
    <aside
      aria-label="Hero social links"
      className={`fixed bottom-3 left-3 z-50 transition-all duration-200 sm:bottom-5 sm:left-5 ${
        isSuppressed ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div ref={dockRef} className="relative flex flex-col items-center sm:items-start">
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-12 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2.5 sm:bottom-14"
            role="menu"
            aria-label="Hero link shortcuts"
          >
            {items.map((item) => (
              <HeroSocialMenuButton
                key={item.key}
                item={item}
                onSelect={(selectedItem) => {
                  setIsOpen(false);
                  openDockItem(selectedItem);
                }}
              />
            ))}
          </motion.div>
        ) : null}

        <HeroCornerButton
          Icon={LuLink2}
          label="Open links menu"
          onClick={() => setIsOpen((current) => !current)}
          isExpanded={isOpen}
          hasPopup
        />
      </div>
    </aside>
  );
}

export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate min-h-screen overflow-hidden scroll-mt-24 bg-[#0b1020]"
    >
      {/* React Bits Iridescence — animated holographic field tuned to a violet
          base so its teal/magenta bands bridge into the sunset→night footer. */}
      <Iridescence
        color={[0.45, 0.32, 0.62]}
        speed={0.7}
        amplitude={0.1}
        mouseReact
        className="absolute inset-0 -z-10 h-full w-full"
      />

      {/* Soft scrim for headline legibility over the saturated shader. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(6,10,22,0.34)_0%,rgba(6,10,22,0.12)_38%,transparent_70%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 pb-24 pt-[max(6.5rem,12svh)] sm:px-8 md:pb-28">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <DecryptedText
            text={`${portfolioContent.identity.location} · ${portfolioContent.identity.role}`}
            animateOn="view"
            sequential
            speed={42}
            revealDirection="start"
            parentClassName="text-xs font-semibold uppercase tracking-[0.24em] text-white/85 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] [@media(max-height:700px)]:text-[10px]"
            encryptedClassName="text-white/40"
          />

          <h1
            id="hero-title"
            className="relative z-10 mt-6 text-balance text-[clamp(3.15rem,8vw,6.25rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-white [text-shadow:0_18px_44px_rgba(6,10,22,0.45)] [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:text-[clamp(2.8rem,5vw,4.75rem)] [@media(max-height:560px)]:text-[clamp(2.45rem,4.2vw,4rem)]"
          >
            {portfolioContent.identity.publicAlias}
          </h1>

          <TextType
            as="p"
            text={portfolioContent.identity.intro}
            loop={false}
            typingSpeed={34}
            initialDelay={350}
            showCursor
            cursorCharacter="|"
            cursorClassName="text-white"
            className="relative z-10 mt-6 max-w-3xl text-pretty text-base font-medium leading-relaxed tracking-[0.01em] text-white/90 [text-shadow:0_2px_14px_rgba(0,0,0,0.32)] sm:text-lg [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:max-w-2xl [@media(max-height:700px)]:text-sm [@media(max-height:700px)]:leading-snug"
          />

          <AiCompanion />

          <GlareHover
            background="rgba(255,255,255,0.96)"
            borderColor="rgba(255,255,255,0.72)"
            borderRadius="9999px"
            width="auto"
            height="auto"
            glareColor="#ffffff"
            glareOpacity={0.4}
            glareAngle={-30}
            glareSize={300}
            transitionDuration={750}
            className="relative z-10 mt-8 transition-transform duration-200 hover:-translate-y-0.5 [@media(max-height:700px)]:mt-5"
            style={{
              display: "inline-block",
              boxShadow: "0 22px 50px rgba(0,0,0,0.28)",
              backdropFilter: "blur(12px)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                scrollToSection("control-center");
                trackEvent("hero_primary_cta_click", {
                  target: "#control-center",
                  label: "enter_portfolio",
                });
              }}
              className="inline-flex min-h-12 items-center gap-2 px-6 text-sm font-semibold text-[#07111e] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Enter Portfolio
              <LuArrowRight size={16} aria-hidden />
            </button>
          </GlareHover>
        </div>
      </div>

      {/* Blend the shader's bottom edge into the page background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[24vh] bg-[linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--color-bg),transparent_30%)_60%,var(--color-bg)_100%)]"
      />

      <HeroSocialDock isSuppressed={false} />
    </section>
  );
}
