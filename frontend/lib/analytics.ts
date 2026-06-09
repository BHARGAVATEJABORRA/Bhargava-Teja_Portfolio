export type AnalyticsEventName =
  | "header_nav_click"
  | "command_palette_open"
  | "theme_change"
  | "dock_toggle"
  | "login_icon_click"
  | "social_icon_click"
  | "ai_placeholder_click"
  | "ai_companion_query"
  | "ai_companion_voice_start"
  | "hero_primary_cta_click"
  | "hero_secondary_cta_click"
  | "flagship_case_study_click"
  | "project_card_click"
  | "project_click"
  | "resume_packet_click"
  | "resume_download"
  | "dock_link_click"
  | "experience_tab_change"
  | "command_used"
  | "contact_submit_success"
  | "contact_submit_error";

export function trackEvent(
  event: AnalyticsEventName,
  properties: Record<string, string | number | boolean> = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    event,
    ...properties,
    event_ts: Date.now(),
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", event, properties);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", payload);
  }
}

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}
