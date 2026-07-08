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
  | "cert_verify_click"
  | "command_used"
  | "contact_submit_success"
  | "contact_submit_error";

/**
 * Anonymous, per-tab session id (sessionStorage). Not an identifier — it rotates
 * each new browser session and carries no PII. Used only to estimate reach.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.sessionStorage.getItem("pf_sid");
    if (!sid) {
      sid = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem("pf_sid", sid);
    }
    return sid;
  } catch {
    return "";
  }
}

/** Fire-and-forget beacon to the first-party ingest (/api/track). */
export function sendBeacon(body: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ ...body, sessionId: getSessionId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
    }
  } catch {
    /* never let analytics break the UI */
  }
}

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

  // First-party ingest (own your data — no third-party script required).
  sendBeacon({ type: "event", name: event, path: window.location?.pathname, meta: properties });

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
