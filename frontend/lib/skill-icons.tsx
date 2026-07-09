/**
 * Shared skill icon registry, used by both the public Skills section and the
 * admin editor so the picker always matches what actually renders on the site.
 * Add a new entry here (import + map) to make a new brand icon available.
 */

import type { ComponentType, CSSProperties } from "react";
import { FaAws, FaJava, FaMicrosoft } from "react-icons/fa6";
import { LuBrainCircuit, LuCode, LuDatabase, LuGlobe, LuNetwork } from "react-icons/lu";
import {
  SiCircleci,
  SiDocker,
  SiGithubactions,
  SiGnubash,
  SiJavascript,
  SiJenkins,
  SiKubernetes,
  SiMongodb,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenai,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiTerraform,
  SiTypescript,
} from "react-icons/si";

export type SkillIconComponent = ComponentType<{
  size?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}>;

export const skillIconMap: Record<string, SkillIconComponent> = {
  SiAmazonaws: FaAws,
  SiMicrosoftazure: FaMicrosoft,
  SiDocker,
  SiKubernetes,
  SiTerraform,
  SiGithubactions,
  SiJenkins,
  SiCircleci,
  SiPython,
  SiJava: FaJava,
  SiJavascript,
  SiTypescript,
  LuDatabase,
  SiGnubash,
  SiNodedotjs,
  SiMongodb,
  LuGlobe,
  LuNetwork,
  SiReact,
  SiNextdotjs,
  SiTailwindcss,
  SiOpenai,
  LuBrainCircuit,
};

/** The fallback used when an iconKey isn't in the map (still glows via brandColor). */
export const FallbackSkillIcon = LuCode;

/** Sorted list of valid icon keys, for the admin picker. */
export const SKILL_ICON_KEYS = Object.keys(skillIconMap).sort();

export function resolveSkillIcon(iconKey: string): SkillIconComponent {
  return skillIconMap[iconKey] ?? FallbackSkillIcon;
}
