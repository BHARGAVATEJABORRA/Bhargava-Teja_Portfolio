"use client";

import { Command } from "cmdk";
import { useCallback, useEffect, useMemo, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { getResolvedSocialLink, getResumeHref } from "@/lib/profile-links";
import { scrollToSection } from "@/lib/scroll-to-section";
import { contentAvailability } from "@/lib/site";

interface PaletteCommand {
  id: string;
  group: "Navigate" | "Profile" | "Assets";
  label: string;
  keywords: string;
  run: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const githubLink = getResolvedSocialLink("github");
  const linkedInLink = getResolvedSocialLink("linkedin");
  const resumeAsset = getResumeHref();

  const commands = useMemo<PaletteCommand[]>(
    () => [
      { id: "jump-hero", group: "Navigate", label: "Go to Hero", keywords: "hero top intro", run: () => scrollToSection("hero") },
      { id: "jump-about", group: "Navigate", label: "Go to About", keywords: "about summary", run: () => scrollToSection("about") },
      { id: "jump-skills", group: "Navigate", label: "Go to Skills", keywords: "skills stack", run: () => scrollToSection("skills") },
      {
        id: "jump-experience",
        group: "Navigate",
        label: "Go to Experience",
        keywords: "experience timeline",
        run: () => scrollToSection("experience"),
      },
      {
        id: "jump-projects",
        group: "Navigate",
        label: "Go to Projects",
        keywords: "projects work portfolio",
        run: () => scrollToSection("projects"),
      },
      ...(contentAvailability.hasRealArticles
        ? [
            {
              id: "jump-articles",
              group: "Navigate" as const,
              label: "Go to Articles",
              keywords: "articles blogs writing",
              run: () => scrollToSection("articles"),
            },
          ]
        : []),
      {
        id: "jump-contact",
        group: "Navigate",
        label: "Go to Contact",
        keywords: "contact email message",
        run: () => scrollToSection("contact"),
      },
      {
        id: "open-github",
        group: "Profile",
        label: "Open GitHub",
        keywords: "github code repo",
        run: () => {
          if (!githubLink.isConfigured) {
            scrollToSection("contact");
            return;
          }

          window.open(githubLink.href, "_blank", "noopener,noreferrer");
        },
      },
      {
        id: "open-linkedin",
        group: "Profile",
        label: "Open LinkedIn",
        keywords: "linkedin profile",
        run: () => {
          if (!linkedInLink.isConfigured) {
            scrollToSection("contact");
            return;
          }

          window.open(linkedInLink.href, "_blank", "noopener,noreferrer");
        },
      },
      {
        id: "download-resume",
        group: "Assets",
        label: "Download Resume",
        keywords: "resume cv download",
        run: () => {
          const anchor = document.createElement("a");
          anchor.href = resumeAsset;
          anchor.download = resumeAsset.split("/").pop() ?? "resume";
          anchor.rel = "noopener";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          trackEvent("resume_download", { source: "command_palette" });
        },
      },
    ],
    [githubLink.href, githubLink.isConfigured, linkedInLink.href, linkedInLink.isConfigured, resumeAsset],
  );

  const groupedCommands = useMemo(() => {
    const groups: Record<PaletteCommand["group"], PaletteCommand[]> = {
      Navigate: [],
      Profile: [],
      Assets: [],
    };

    commands.forEach((command) => {
      groups[command.group].push(command);
    });

    return groups;
  }, [commands]);

  const execute = useCallback((command: PaletteCommand) => {
    command.run();
    trackEvent("command_used", { command_id: command.id, command_group: command.group });
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const onOpenRequest = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("portfolio:open-command-palette", onOpenRequest);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("portfolio:open-command-palette", onOpenRequest);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 tint-ink-bg-45 px-4 pt-[14vh] backdrop-blur-[1px]"
      onPointerDown={() => {
        setIsOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        aria-describedby="command-palette-description"
        className="mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_24px_60px_rgba(8,15,28,0.28)]"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <p id="command-palette-title" className="sr-only">
          Command palette
        </p>
        <p id="command-palette-description" className="sr-only">
          Type to filter commands, press enter to execute, and press escape to close.
        </p>

        <Command label="Command palette" loop>
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <Command.Input
              autoFocus
              placeholder="Type a command..."
              className="w-full bg-transparent text-base text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted-ink)]"
            />
          </div>
          <Command.List className="max-h-[52vh] overflow-auto p-2">
            <Command.Empty className="px-3 py-4 text-sm text-[var(--color-muted-ink)]">No matching commands.</Command.Empty>

            {(Object.keys(groupedCommands) as Array<PaletteCommand["group"]>).map((groupName) => {
              const group = groupedCommands[groupName];

              if (group.length === 0) {
                return null;
              }

              return (
                <Command.Group key={groupName} heading={groupName} className="mb-2">
                  {group.map((command) => (
                    <Command.Item
                      key={command.id}
                      value={`${command.label} ${command.keywords}`}
                      onSelect={() => execute(command)}
                      className="cursor-pointer rounded-full px-3 py-2 text-sm text-[var(--color-ink)] data-[selected=true]:bg-[var(--color-surface)]"
                    >
                      {command.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted-ink)]">
            <span>Press Esc to close</span>
            <span>Cmd/Ctrl + K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
