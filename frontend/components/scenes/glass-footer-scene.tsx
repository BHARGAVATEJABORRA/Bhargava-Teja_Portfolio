"use client";

import type { CSSProperties, ReactNode } from "react";

interface GlassFooterSceneProps {
  contact: ReactNode;
  contactId?: string;
  footer: ReactNode;
}

const footerTheme = {
  "--color-ink": "#eef3ff",
  "--color-muted-ink": "rgba(214, 224, 250, 0.72)",
  "--color-border": "rgba(186, 200, 255, 0.22)",
  "--color-accent": "#8ab4ff",
  "--color-accent-strong": "#b69cff",
} as CSSProperties;

// Static chromium-glass footer. Keeps the contact card + nav content but drops
// the old animated landscape/sky in favor of a frosted glass backdrop with an
// iridescent glow — consistent with the rest of the site.
export function GlassFooterScene({ contact, contactId, footer }: GlassFooterSceneProps) {
  return (
    <div className="glass-footer relative flex flex-col overflow-clip" style={footerTheme}>
      {/* Iridescent glow + grid backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="glass-footer__glow glass-footer__glow--a" />
        <span className="glass-footer__glow glass-footer__glow--b" />
        <span className="glass-footer__grid" />
      </div>

      {/* CTA / contact band */}
      <div className="relative z-20 w-full px-6 pt-[16vh] pb-[10vh] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[120rem]">
          <div id={contactId} className="mx-auto w-full max-w-[34rem] scroll-mt-28">
            {contact}
          </div>
        </div>
      </div>

      {/* Footer nav band */}
      <div className="relative z-20 border-t border-white/10 px-6 pb-16 sm:px-8 lg:px-12 xl:pb-24">
        <div className="mx-auto flex max-w-[120rem] flex-col pt-12 md:flex-row md:flex-wrap md:justify-between">
          {footer}
        </div>
      </div>
    </div>
  );
}
