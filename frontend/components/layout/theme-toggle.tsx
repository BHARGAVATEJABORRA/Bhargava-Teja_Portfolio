"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { useTheme } from "next-themes";

import { trackEvent } from "@/lib/analytics";

type ThemeChoice = "light" | "dark" | "system";
interface ThemeToggleProps {
  buttonClassName?: string;
}

type MenuPosition = {
  right: number;
  top: number;
};

const order: ThemeChoice[] = ["system", "dark", "light"];

function getSafeTheme(theme: string | undefined): ThemeChoice {
  if (theme === "light" || theme === "dark" || theme === "system") {
    return theme;
  }

  return "system";
}

export function ThemeToggle({ buttonClassName }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeTheme = getSafeTheme(theme);
  const canUseDom = typeof document !== "undefined";

  const updateMenuPosition = () => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: Math.round(rect.bottom + 8),
      right: Math.max(16, Math.round(window.innerWidth - rect.right)),
    });
  };

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

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  const Icon = activeTheme === "light" ? LuSun : activeTheme === "dark" ? LuMoon : LuMonitor;
  const activeLabel = activeTheme[0].toUpperCase() + activeTheme.slice(1);
  const themeChoices = useMemo(
    () =>
      order.map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
    [],
  );

  const applyTheme = (value: ThemeChoice) => {
    setTheme(value);
    setIsOpen(false);
    trackEvent("theme_change", { theme: value, source: "menu_button" });
  };

  return (
    <div className="relative inline-flex shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Theme: ${activeLabel}. Open theme menu.`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`Theme: ${activeLabel}`}
        onClick={() => {
          if (!isOpen) {
            updateMenuPosition();
          }

          setIsOpen((current) => !current);
        }}
        data-liquid-glass="on"
        className={`liquid-control inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
          buttonClassName ?? ""
        }`}
      >
        <Icon size={17} aria-hidden />
      </button>

      {isOpen && canUseDom
        ? createPortal(
            <div
              ref={menuRef}
              data-liquid-glass="on"
              className="liquid-control fixed z-50 min-w-40 rounded-[1.75rem] p-1.5"
              role="menu"
              aria-label="Theme options"
              style={menuPosition ? { position: "fixed", ...menuPosition } : { position: "fixed" }}
            >
              {themeChoices.map((choice) => {
                const isActive = choice.value === activeTheme;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => applyTheme(choice.value)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-full px-3.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                      isActive
                        ? "liquid-control text-[var(--color-ink)]"
                        : "text-[var(--color-muted-ink)] hover:bg-[color:var(--glass-bg)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    <span>{choice.label}</span>
                    {isActive ? <span className="text-xs font-semibold text-[var(--color-accent)]">Active</span> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
