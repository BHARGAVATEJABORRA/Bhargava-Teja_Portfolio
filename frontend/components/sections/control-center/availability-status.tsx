import { portfolioContent } from "@/content/portfolio-content";

import { WidgetShell } from "./widget-shell";

type Availability = "open-to-opportunities" | "employed" | "selective";

function availabilityTone(availability: Availability) {
  if (availability === "open-to-opportunities") {
    return {
      label: "Open to opportunities",
      dotClass: "bg-emerald-500",
    };
  }

  if (availability === "selective") {
    return {
      label: "Selective conversations",
      dotClass: "bg-amber-400",
    };
  }

  return {
    label: "Currently employed",
    dotClass: "bg-zinc-400",
  };
}

export function AvailabilityStatus() {
  const { availability, availabilityNote } = portfolioContent.identity.controlCenter;
  const tone = availabilityTone(availability);

  return (
    <WidgetShell title="Status">
      <div className="flex items-center gap-2">
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone.dotClass}`} aria-hidden>
          <span className={`absolute inset-0 animate-ping rounded-full ${tone.dotClass} opacity-60`} />
        </span>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{tone.label}</p>
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-muted-ink)]">{availabilityNote}</p>
    </WidgetShell>
  );
}
