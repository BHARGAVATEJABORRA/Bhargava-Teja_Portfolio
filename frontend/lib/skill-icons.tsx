/**
 * Shared skill icon registry, used by both the public Skills section and the
 * admin editor so the picker always matches what actually renders on the site.
 * Add a new entry here (import + map) to make a new brand icon available.
 *
 * Naming: keys stay in `Si*`-style simple-icons spelling even when the mark is
 * sourced from another pack. react-icons v5 dropped the Amazon/Azure/Oracle/
 * Microsoft brand sets from `si` (trademark scrub), so those keys alias to the
 * genuine mark wherever it still lives (fa6/vsc/gr/di). Keeping the key stable
 * means existing database rows keep resolving after the swap.
 *
 * AWS publishes no per-service marks in any pack, so every AWS service key
 * aliases the AWS logo and is distinguished by its official service color.
 */

import type { ComponentType, CSSProperties } from "react";
import { DiMsqlServer } from "react-icons/di";
import { FaAws, FaJava, FaMicrosoft, FaWindows } from "react-icons/fa6";
import { GrOracle } from "react-icons/gr";
import {
  LuBrainCircuit,
  LuBot,
  LuChartLine,
  LuCode,
  LuDatabase,
  LuFlaskConical,
  LuGlobe,
  LuMessageSquareCode,
  LuNetwork,
  LuShieldCheck,
  LuWorkflow,
} from "react-icons/lu";
import {
  SiAnsible,
  SiAnthropic,
  SiApachemaven,
  SiApple,
  SiC,
  SiCircleci,
  SiClaude,
  SiCplusplus,
  SiCss,
  SiDocker,
  SiDotnet,
  SiElasticstack,
  SiExpress,
  SiFlask,
  SiGit,
  SiGithubactions,
  SiGitlab,
  SiGnubash,
  SiGooglecloud,
  SiGradle,
  SiHelm,
  SiHibernate,
  SiHtml5,
  SiIntellijidea,
  SiJavascript,
  SiJenkins,
  SiJira,
  SiJson,
  SiJunit5,
  SiJupyter,
  SiKubernetes,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiNumpy,
  SiOpenai,
  SiPandas,
  SiPerplexity,
  SiPostgresql,
  SiPostman,
  SiPython,
  SiReact,
  SiRedis,
  SiScikitlearn,
  SiSelenium,
  SiSpring,
  SiSpringboot,
  SiSpringsecurity,
  SiTailwindcss,
  SiTensorflow,
  SiTerraform,
  SiTypescript,
  SiUbuntu,
  SiYaml,
} from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";
import { VscAzure, VscAzureDevops } from "react-icons/vsc";

export type SkillIconComponent = ComponentType<{
  size?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}>;

export const skillIconMap: Record<string, SkillIconComponent> = {
  // --- Cloud platforms -----------------------------------------------------
  SiAmazonaws: FaAws,
  SiMicrosoftazure: VscAzure,
  SiGooglecloud,
  SiOracle: GrOracle,
  SiAzuredevops: VscAzureDevops,
  SiMicrosoft: FaMicrosoft,

  // --- AWS services (AWS mark + official per-service color) ----------------
  SiAmazonec2: FaAws,
  SiAmazons3: FaAws,
  SiAwslambda: FaAws,
  SiAmazonrds: FaAws,
  SiAmazondynamodb: FaAws,
  SiAmazoneks: FaAws,
  SiAwsiam: FaAws,
  SiAmazoncloudwatch: FaAws,
  SiAmazoncloudformation: FaAws,
  SiAmazonsagemaker: FaAws,
  SiAmazonapigateway: FaAws,
  SiAwscdk: FaAws,

  // --- Infrastructure as code ---------------------------------------------
  SiTerraform,
  SiAnsible,
  SiYaml,
  SiJson,

  // --- Containers & CI/CD --------------------------------------------------
  SiDocker,
  SiKubernetes,
  SiHelm,
  SiJenkins,
  SiGitlab,
  SiGithubactions,
  SiCircleci,

  // --- Languages -----------------------------------------------------------
  SiPython,
  SiJava: FaJava,
  SiJavascript,
  SiTypescript,
  SiC,
  SiCplusplus,
  // NOT SiSharp — that key is the `sharp` image-processing library's logo
  // (verified against simple-icons' `sharp.svg`), not C#. react-icons v5 has no
  // C# mark in `si`, so this uses Tabler's.
  SiCsharp: TbBrandCSharp,
  TbBrandCSharp,
  SiDotnet,
  SiGnubash,
  SiHtml5,
  SiCss3: SiCss,

  // --- Backend & frameworks ------------------------------------------------
  SiNodedotjs,
  SiExpress,
  SiSpringboot,
  SiSpring,
  SiSpringsecurity,
  SiHibernate,
  SiFlask,

  // --- Frontend ------------------------------------------------------------
  SiReact,
  SiNextdotjs,
  SiTailwindcss,

  // --- Databases -----------------------------------------------------------
  SiMysql,
  SiPostgresql,
  SiMongodb,
  SiRedis,
  SiMicrosoftsqlserver: DiMsqlServer,

  // --- Data science & AI ---------------------------------------------------
  SiTensorflow,
  SiPandas,
  SiNumpy,
  SiScikitlearn,
  SiJupyter,
  SiOpenai,
  SiClaude,
  SiAnthropic,
  SiPerplexity,

  // --- Testing & monitoring ------------------------------------------------
  SiJunit5,
  SiSelenium,
  SiElasticstack,
  SiPostman,

  // --- Dev tools -----------------------------------------------------------
  SiGit,
  SiApachemaven,
  SiGradle,
  SiIntellijidea,
  SiJira,

  // --- Operating systems ---------------------------------------------------
  SiLinux,
  SiUbuntu,
  SiApple,
  SiWindows: FaWindows,

  // --- Generic / concept icons (for skills with no brand mark) -------------
  LuDatabase,
  LuGlobe,
  LuNetwork,
  LuBrainCircuit,
  LuBot,
  LuChartLine,
  LuFlaskConical,
  LuMessageSquareCode,
  LuShieldCheck,
  LuWorkflow,
  LuCode,
};

/** The fallback used when an iconKey isn't in the map (still glows via brandColor). */
export const FallbackSkillIcon = LuCode;

/** Sorted list of valid icon keys, for the admin picker. */
export const SKILL_ICON_KEYS = Object.keys(skillIconMap).sort();

export function resolveSkillIcon(iconKey: string): SkillIconComponent {
  return skillIconMap[iconKey] ?? FallbackSkillIcon;
}
