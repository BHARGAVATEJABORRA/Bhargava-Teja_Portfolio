import type { CSSProperties } from "react";

export type SocialOrbThemeKey = "github" | "linkedin" | "twitter" | "instagram" | "email" | "credly" | "snapchat";

export const socialOrbThemes: Record<SocialOrbThemeKey, CSSProperties> = {
  github: {
    "--hero-social-fg": "#fff",
    "--hero-social-bg": "#8d30ab",
    "--hero-social-shadow":
      "0 0 5px #8d30ab, 0 0 15px #8d30ab, 0 0 20px #8d30ab, 0 0 40px #8d30ab, 0 0 60px rgba(141, 48, 171, 0.92)",
    "--hero-social-halo": "rgba(141, 48, 171, 0.54)",
  } as CSSProperties,
  linkedin: {
    "--hero-social-fg": "#106bc4",
    "--hero-social-bg": "#fff",
    "--hero-social-shadow":
      "0 0 5px #106bc4, 0 0 15px #106bc4, 0 0 20px #106bc4, 0 0 40px #106bc4, 0 0 60px rgba(16, 107, 196, 0.9)",
    "--hero-social-halo": "rgba(16, 107, 196, 0.42)",
  } as CSSProperties,
  twitter: {
    "--hero-social-fg": "#1da1f1",
    "--hero-social-bg": "#fff",
    "--hero-social-shadow":
      "0 0 5px #fff, 0 0 15px #fff, 0 0 20px #fff, 0 0 40px #fff, 0 0 60px rgba(255, 255, 255, 0.92)",
    "--hero-social-halo": "rgba(255, 255, 255, 0.34)",
  } as CSSProperties,
  instagram: {
    "--hero-social-fg": "#fff",
    "--hero-social-bg": "linear-gradient(180deg, #f9ce34 0%, #ee2a7b 52%, #6228d7 100%)",
    "--hero-social-shadow":
      "0 0 5px #ec4c54, 0 0 15px #ec4c54, 0 0 20px #ec4c54, 0 0 40px #ec4c54, 0 0 60px rgba(236, 76, 84, 0.9)",
    "--hero-social-halo": "rgba(236, 76, 84, 0.48)",
  } as CSSProperties,
  credly: {
    "--hero-social-fg": "#fff",
    "--hero-social-bg": "#ff6b00",
    "--hero-social-shadow":
      "0 0 5px #ff6b00, 0 0 15px #ff6b00, 0 0 20px #ff6b00, 0 0 40px #ff6b00, 0 0 60px rgba(255, 107, 0, 0.92)",
    "--hero-social-halo": "rgba(255, 107, 0, 0.58)",
  } as CSSProperties,
  snapchat: {
    "--hero-social-fg": "#111827",
    "--hero-social-bg": "#fffc00",
    "--hero-social-shadow":
      "0 0 5px #fffc00, 0 0 15px #fffc00, 0 0 20px #fffc00, 0 0 40px #fffc00, 0 0 60px rgba(255, 252, 0, 0.94)",
    "--hero-social-halo": "rgba(255, 252, 0, 0.54)",
  } as CSSProperties,
  email: {
    "--hero-social-fg": "#dc2626",
    "--hero-social-bg": "#eceff1",
    "--hero-social-shadow":
      "0 0 5px #eceff1, 0 0 15px #eceff1, 0 0 20px #eceff1, 0 0 40px #eceff1, 0 0 60px rgba(236, 239, 241, 0.92)",
    "--hero-social-halo": "rgba(236, 239, 241, 0.42)",
  } as CSSProperties,
};
