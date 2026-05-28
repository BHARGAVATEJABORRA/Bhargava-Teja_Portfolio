"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { FaInstagram, FaTwitter } from "react-icons/fa";
import { LuArrowRight, LuLink2, LuMail } from "react-icons/lu";
import { SiCredly, SiSnapchat } from "react-icons/si";

import { AdalineHeroScene } from "@/components/scenes/adaline-scenes";
import { HeroControlWindow } from "@/components/sections/control-center/hero-control-window";
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

function useHeroSequenceMode() {
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setIsDesktop(media.matches);
    };

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);

      return () => {
        media.removeEventListener("change", apply);
      };
    }

    media.addListener(apply);

    return () => {
      media.removeListener(apply);
    };
  }, []);

  return isDesktop && !shouldReduceMotion;
}

function TypingCaption({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(shouldReduceMotion ? text.length : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleCount(index);

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 34);

    return () => {
      window.clearInterval(interval);
    };
  }, [shouldReduceMotion, text]);

  const visibleText = shouldReduceMotion ? text : text.slice(0, visibleCount);

  return (
    <p className="min-h-8 text-sm font-medium tracking-[0.18em] text-[var(--color-accent)] sm:min-h-10 sm:text-base">
      {visibleText}
      {!shouldReduceMotion ? (
        <span aria-hidden className="ml-1 inline-block h-[1.1em] w-px animate-pulse bg-[var(--color-accent)] align-middle" />
      ) : null}
    </p>
  );
}

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
      className="liquid-control flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-ink)] shadow-[0_18px_38px_rgba(10,23,42,0.18)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:h-14 sm:w-14"
    >
      <motion.span variants={dockIconVariants} className="flex items-center justify-center">
        <Icon size={22} aria-hidden style={{ color: iconColor } as CSSProperties} className="sm:h-6 sm:w-6" />
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
      className="hero-social-orb relative flex h-16 w-16 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <motion.span variants={dockIconVariants} className="relative z-10 flex items-center justify-center">
        <item.Icon size={29} aria-hidden />
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
      className={`absolute bottom-4 left-4 z-30 transition-all duration-200 sm:bottom-6 sm:left-6 ${
        isSuppressed ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div ref={dockRef} className="relative flex flex-col items-center sm:items-start">
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-16 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-4"
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const enableHeroSequence = useHeroSequenceMode();
  const supportingText = portfolioContent.identity.bio.split("\n\n")[0] ?? portfolioContent.identity.intro;
  const [isControlRevealState, setIsControlRevealState] = useState(false);
  const [isContentInteractive, setIsContentInteractive] = useState(true);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: enableHeroSequence ? ["start start", "end end"] : ["start start", "end start"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.12, 0.28], [1, 1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.28], [0, -64]);
  const contentScale = useTransform(scrollYProgress, [0, 0.28], [1, 0.955]);
  const dockOpacity = useTransform(scrollYProgress, [0.1, 0.24], [1, 0]);
  const controlWindowOpacity = useTransform(scrollYProgress, [0.58, 0.7, 0.86], [0, 0.88, 1]);
  const controlWindowY = useTransform(scrollYProgress, [0.58, 0.74], [88, 0]);
  const controlWindowScale = useTransform(scrollYProgress, [0.58, 0.74], [0.92, 1]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!enableHeroSequence) {
      return;
    }

    setIsControlRevealState(latest > 0.58);
    setIsContentInteractive(latest < 0.22);
  });

  const isControlReveal = enableHeroSequence ? isControlRevealState : false;
  const isHeroContentInteractive = enableHeroSequence ? isContentInteractive : true;
  const scrollToHeroWindow = useCallback(() => {
    if (!sectionRef.current || !enableHeroSequence) {
      scrollToSection("about");
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
    const scrollableDistance = Math.max(0, sectionRef.current.offsetHeight - window.innerHeight);
    const targetTop = sectionTop + scrollableDistance * 0.76;

    window.scrollTo({
      top: targetTop,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [enableHeroSequence]);

  useEffect(() => {
    if (!enableHeroSequence || window.location.hash !== "#control-center") {
      return;
    }

    const timeout = window.setTimeout(() => {
      scrollToHeroWindow();
    }, 140);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [enableHeroSequence, scrollToHeroWindow]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="hero-title"
      className={`relative isolate scroll-mt-24 ${
        enableHeroSequence ? "bg-[#f2ebde]" : "min-h-screen overflow-hidden"
      }`}
      style={enableHeroSequence ? { height: "6000px" } : undefined}
    >
      <div className={`relative ${enableHeroSequence ? "sticky top-0 h-screen overflow-hidden" : "min-h-screen"}`}>
        <AdalineHeroScene progress={scrollYProgress} enableSequence={enableHeroSequence} />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-start justify-center px-4 pb-20 pt-[max(5.75rem,10svh)] sm:px-8 sm:pb-24 sm:pt-[max(6.5rem,12svh)] md:pb-28 md:pt-[max(7rem,12svh)] [@media(max-height:700px)]:pb-16 [@media(max-height:700px)]:pt-[5.5rem] [@media(max-height:560px)]:pb-12 [@media(max-height:560px)]:pt-[4.75rem]">
          <motion.div
            style={enableHeroSequence ? { opacity: contentOpacity, y: contentY, scale: contentScale } : undefined}
            className={`relative mx-auto flex max-w-4xl flex-col items-center text-center ${
              enableHeroSequence && !isHeroContentInteractive ? "pointer-events-none" : ""
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[34%] z-0 h-[15rem] w-[min(82vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(252,249,243,0.52)_0%,rgba(252,249,243,0.2)_40%,transparent_76%)] blur-[30px] dark:bg-[radial-gradient(circle,rgba(8,13,18,0.26)_0%,rgba(8,13,18,0.12)_38%,transparent_76%)]"
            />

            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)] [@media(max-height:700px)]:text-[10px]">
              {portfolioContent.identity.location} · {portfolioContent.identity.role}
            </p>

            <h1
              id="hero-title"
              className="relative z-10 mt-6 text-balance text-[clamp(3.15rem,8vw,6.25rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--color-ink)] [text-shadow:0_20px_40px_rgba(255,250,241,0.38)] [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:text-[clamp(2.8rem,5vw,4.75rem)] [@media(max-height:560px)]:text-[clamp(2.45rem,4.2vw,4rem)] dark:[text-shadow:0_18px_34px_rgba(0,0,0,0.18)]"
            >
              {portfolioContent.identity.publicAlias}
            </h1>

            <div className="relative z-10 mt-6 [@media(max-height:700px)]:mt-4">
              <TypingCaption text={portfolioContent.identity.intro} />
            </div>

            <p className="relative z-10 mt-6 max-w-3xl text-pretty text-base leading-relaxed text-[var(--color-muted-ink)] sm:text-lg [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:max-w-2xl [@media(max-height:700px)]:text-sm [@media(max-height:700px)]:leading-snug">
              {supportingText}
            </p>

            <button
              type="button"
              onClick={() => {
                scrollToHeroWindow();
                trackEvent("hero_primary_cta_click", {
                  target: enableHeroSequence ? "#hero-control-window" : "#about",
                  label: "enter_portfolio",
                });
              }}
              className="relative z-10 mt-14 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/72 bg-[rgba(255,255,255,0.96)] px-6 text-sm font-semibold text-[#07111e] shadow-[0_22px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] dark:border-white/22 dark:bg-white dark:text-[#07111e] dark:shadow-[0_24px_56px_rgba(0,0,0,0.24)] [@media(max-height:700px)]:mt-8"
            >
              Enter Portfolio
              <LuArrowRight size={16} aria-hidden />
            </button>

            {!enableHeroSequence ? (
              <div className="relative z-10 mt-10 w-full max-w-3xl">
                <HeroControlWindow className="mx-auto" />
              </div>
            ) : null}
          </motion.div>
        </div>

        {enableHeroSequence ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[10vh] z-20 flex justify-center px-4 sm:px-6">
            <HeroControlWindow
              opacity={controlWindowOpacity}
              y={controlWindowY}
              scale={controlWindowScale}
              visible={isControlReveal}
              className="mx-auto"
            />
          </div>
        ) : null}

        <motion.div style={enableHeroSequence ? { opacity: dockOpacity } : undefined}>
          <HeroSocialDock isSuppressed={isControlReveal} />
        </motion.div>
      </div>
    </section>
  );
}
