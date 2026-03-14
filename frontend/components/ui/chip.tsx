import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
}

export function Chip({ children }: ChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-muted-ink)]">
      {children}
    </span>
  );
}
