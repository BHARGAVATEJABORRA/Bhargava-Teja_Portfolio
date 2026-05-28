import type { ReactNode } from "react";

import { ControlCenterPanel } from "./control-center-panel";

interface WidgetShellProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function WidgetShell({ title, children, className = "" }: WidgetShellProps) {
  return (
    <ControlCenterPanel radius={28} className={`h-full min-h-full p-4 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] opacity-90">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </ControlCenterPanel>
  );
}
