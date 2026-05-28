"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LuFileText, LuHash, LuLogIn, LuMail, LuMoon, LuMonitor, LuSun } from "react-icons/lu";
import { useTheme } from "next-themes";

import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";
import { getResumeHref } from "@/lib/profile-links";
import { contentAvailability } from "@/lib/site";

const sections = [
  { id: "about", label: "About" },
  { id: "projects", label: "My Work" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  ...(contentAvailability.hasPublishedArticles ? [{ id: "blogs", label: "Articles" }] : []),
  { id: "contact", label: "Contact" },
];

type ThemeChoice = "light" | "dark" | "system";
const themeOrder: ThemeChoice[] = ["system", "light", "dark"];

function getSafeTheme(theme: string | undefined): ThemeChoice {
  if (theme === "light" || theme === "dark" || theme === "system") {
    return theme;
  }

  return "system";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const resumeHref = getResumeHref();
  const email = portfolioContent.identity.contactEmail;
  const activeTheme = getSafeTheme(theme);

  const nextTheme = useMemo(() => {
    const currentIndex = themeOrder.indexOf(activeTheme);
    return themeOrder[(currentIndex + 1) % themeOrder.length];
  }, [activeTheme]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("portfolio:open-command-palette", handleOpen);
    return () => window.removeEventListener("portfolio:open-command-palette", handleOpen);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => {
          const next = !current;
          if (next) {
            trackEvent("command_palette_open", { source: "keyboard_shortcut" });
          }
          return next;
        });
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigateTo = (sectionId: string) => {
    setOpen(false);
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    section.scrollIntoView({ behavior, block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
    trackEvent("command_used", { command: `navigate_${sectionId}` });
  };

  const ThemeIcon = activeTheme === "light" ? LuSun : activeTheme === "dark" ? LuMoon : LuMonitor;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[20%] z-50 w-[min(90vw,500px)] -translate-x-1/2"
          >
            <Command className="glass-surface overflow-hidden rounded-[2rem] shadow-2xl" loop>
              <Command.Input
                autoFocus
                placeholder="Search sections or actions..."
                className="w-full border-b border-[var(--color-border)] bg-transparent px-4 py-3.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted-ink)]"
              />
              <Command.List className="max-h-64 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-[var(--color-muted-ink)]">No results found.</Command.Empty>

                <Command.Group
                  heading="Navigate"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[var(--color-muted-ink)]"
                >
                  {sections.map((section) => (
                    <Command.Item
                      key={section.id}
                      value={section.label}
                      onSelect={() => navigateTo(section.id)}
                      className="aria-selected:bg-[color:var(--glass-bg-strong)] flex cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm text-[var(--color-ink)]"
                    >
                      <LuHash size={14} className="text-[var(--color-muted-ink)]" aria-hidden />
                      {section.label}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[var(--color-muted-ink)]"
                >
                  <Command.Item
                    value="Toggle theme"
                    onSelect={() => {
                      setTheme(nextTheme);
                      setOpen(false);
                      trackEvent("theme_change", { theme: nextTheme, source: "command_palette" });
                      trackEvent("command_used", { command: `theme_${nextTheme}` });
                    }}
                    className="aria-selected:bg-[color:var(--glass-bg-strong)] flex cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm text-[var(--color-ink)]"
                  >
                    <ThemeIcon size={14} className="text-[var(--color-muted-ink)]" aria-hidden />
                    Toggle theme
                  </Command.Item>
                  <Command.Item
                    value="Open login page"
                    onSelect={() => {
                      window.location.href = "/login";
                      setOpen(false);
                      trackEvent("login_icon_click", { source: "command_palette", target: "/login" });
                      trackEvent("command_used", { command: "open_login" });
                    }}
                    className="aria-selected:bg-[color:var(--glass-bg-strong)] flex cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm text-[var(--color-ink)]"
                  >
                    <LuLogIn size={14} className="text-[var(--color-muted-ink)]" aria-hidden />
                    Open login page
                  </Command.Item>
                  <Command.Item
                    value="Download resume"
                    onSelect={() => {
                      window.open(resumeHref, "_blank", "noopener,noreferrer");
                      setOpen(false);
                      trackEvent("resume_download", { source: "command_palette_layout" });
                    }}
                    className="aria-selected:bg-[color:var(--glass-bg-strong)] flex cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm text-[var(--color-ink)]"
                  >
                    <LuFileText size={14} className="text-[var(--color-muted-ink)]" aria-hidden />
                    Download resume
                  </Command.Item>
                  <Command.Item
                    value="Send email"
                    onSelect={() => {
                      window.location.href = `mailto:${email}`;
                      setOpen(false);
                      trackEvent("command_used", { command: "send_email" });
                    }}
                    className="aria-selected:bg-[color:var(--glass-bg-strong)] flex cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm text-[var(--color-ink)]"
                  >
                    <LuMail size={14} className="text-[var(--color-muted-ink)]" aria-hidden />
                    Send email
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="flex items-center gap-4 border-t border-[var(--color-border)] px-3 py-2 text-[10px] text-[var(--color-muted-ink)]">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </div>
            </Command>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
