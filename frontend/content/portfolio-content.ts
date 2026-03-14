export interface ProofMetric {
  label: string;
  value: string;
  context: string;
}

export interface FlagshipArchitecturePoint {
  title: string;
  description: string;
}

export interface FlagshipProject {
  name: string;
  summary: string;
  stack: string[];
  impact: string[];
  architecture: FlagshipArchitecturePoint[];
  links: {
    caseStudy: string;
    repository: string;
  };
}

export interface ProjectSummary {
  title: string;
  timeframe: string;
  role: string;
  stack: string[];
  outcome: string;
  href: string;
}

export interface ExperienceItem {
  company: string;
  title: string;
  period: string;
  highlights: string[];
}

export interface SkillCategory {
  category: string;
  skills: SkillItem[];
}

export interface SkillItem {
  name: string;
  iconKey: string;
  brandColor: string;
  keywords?: string[];
}

export interface ArticleSummary {
  title: string;
  premise: string;
  takeaway: string;
  readTime: string;
  href: string;
}

export interface ControlCenterModule {
  title: string;
  detail: string;
  value: string;
}

export const portfolioContent = {
  identity: {
    name: "Bhargav Patel",
    role: "Product-minded Full-Stack Engineer",
    location: "Austin, TX",
    intro:
      "I build recruiter-friendly products that balance shipping velocity, measurable impact, and maintainable architecture.",
    contactEmail: "hello@bhargavpatel.dev",
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com",
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com",
      },
    ],
  },
  hero: {
    headline: "I turn ambiguous product ideas into production-ready systems.",
    supporting:
      "From architecture decisions to UX polish, I focus on outcomes that recruiters and hiring managers can validate quickly.",
    primaryCta: {
      label: "View flagship project",
      href: "#flagship",
    },
    secondaryCta: {
      label: "Contact me",
      href: "#contact",
    },
    wowCard: {
      title: "System Health Radar",
      subtitle: "One interaction. Three dimensions of impact.",
      bullets: [
        "Performance budget held under 120 KB critical path",
        "Accessibility passes for keyboard and reduced motion",
        "Delivery speed improved with typed contracts",
      ],
    },
  },
  proofMetrics: [
    {
      label: "Delivery Velocity",
      value: "34% faster",
      context: "Average feature cycle time reduction over two product releases",
    },
    {
      label: "Core Web Vitals",
      value: "95+",
      context: "Measured on high-intent landing surfaces after optimization pass",
    },
    {
      label: "Conversion Lift",
      value: "+18%",
      context: "Recruiter CTA click-through improvement after IA redesign",
    },
    {
      label: "Incident Reduction",
      value: "-42%",
      context: "Post-launch regressions lowered through explicit contracts and smoke tests",
    },
  ] as ProofMetric[],
  about: {
    paragraphs: [
      "I work best at the intersection of product strategy and engineering execution. I translate vague requirements into clear milestones and predictable delivery.",
      "My focus is sustainable velocity: clean architecture, accessible interfaces, and metrics that make technical decisions legible to non-engineering stakeholders.",
    ],
    principles: [
      "Build for clarity first, scale second",
      "Ship measurable improvements over flashy complexity",
      "Treat accessibility and performance as core product quality",
    ],
  },
  controlCenter: {
    modules: [
      {
        title: "Availability",
        detail: "Open to senior/full-stack roles",
        value: "Interviewing for May 2026 starts",
      },
      {
        title: "Preferred Scope",
        detail: "0→1 products, platform hardening, and growth surfaces",
        value: "Hands-on IC with architecture ownership",
      },
      {
        title: "Response SLA",
        detail: "Recruiter and hiring manager responses",
        value: "Within 24 hours (weekdays)",
      },
    ] as ControlCenterModule[],
    aiCompanion: {
      title: "AI Companion (Phase 2 candidate)",
      description:
        "The interactive assistant is intentionally limited in MVP. It is stubbed to avoid scope creep before recruiter path validation.",
    },
  },
  flagship: {
    name: "SignalOps Command Platform",
    summary:
      "Unified an analytics dashboard, alerting orchestration, and release controls into one operations surface for customer success teams.",
    stack: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "OpenTelemetry",
    ],
    impact: [
      "Reduced alert triage time from 17 minutes to 6 minutes",
      "Improved release confidence with staged guardrails and audit trails",
      "Cut on-call escalations by centralizing runbook context",
    ],
    architecture: [
      {
        title: "Typed service boundaries",
        description:
          "Established explicit contracts across API handlers, service modules, and UI adapters to prevent integration drift.",
      },
      {
        title: "Event-first observability",
        description:
          "Shipped a lightweight event model that powered ops dashboards and retrospective analysis without heavy data duplication.",
      },
      {
        title: "Progressive UX delivery",
        description:
          "Delivered high-value workflows first, then layered advanced controls behind validated usage signals.",
      },
    ],
    links: {
      caseStudy: "#contact",
      repository: "https://github.com",
    },
  } as FlagshipProject,
  projects: [
    {
      title: "Hiring Funnel Analytics",
      timeframe: "2025",
      role: "Lead Engineer",
      stack: ["React", "TypeScript", "Supabase", "Tailwind"],
      outcome:
        "Improved recruiter visibility with stage drop-off diagnostics and automated weekly summaries.",
      href: "https://github.com",
    },
    {
      title: "API Reliability Toolkit",
      timeframe: "2024",
      role: "Full-Stack Engineer",
      stack: ["Node.js", "Fastify", "PostgreSQL", "Docker"],
      outcome:
        "Introduced predictable contracts and failure-mode testing across critical integration routes.",
      href: "https://github.com",
    },
    {
      title: "Portfolio CMS Prototype",
      timeframe: "2024",
      role: "Product Engineer",
      stack: ["Next.js", "MDX", "Vercel"],
      outcome:
        "Built an authoring flow for case studies with zero-regression publish previews.",
      href: "https://github.com",
    },
  ] as ProjectSummary[],
  experience: [
    {
      company: "Northstar Labs",
      title: "Senior Full-Stack Engineer",
      period: "2023 - Present",
      highlights: [
        "Owned recruiter-facing product surfaces and platform reliability improvements",
        "Led architecture reviews and delivery sequencing for cross-functional launches",
        "Mentored engineers on explicit contracts, error handling, and accessibility",
      ],
    },
    {
      company: "ProductFoundry",
      title: "Software Engineer",
      period: "2020 - 2023",
      highlights: [
        "Built growth and onboarding funnels with measurable conversion impact",
        "Implemented observability-first API patterns for faster issue diagnosis",
        "Collaborated with design on inclusive, responsive component systems",
      ],
    },
  ] as ExperienceItem[],
  skills: [
    {
      category: "Frontend",
      skills: [
        { name: "Next.js", iconKey: "nextjs", brandColor: "var(--color-ink)" },
        { name: "React", iconKey: "react", brandColor: "#61dafb" },
        { name: "TypeScript", iconKey: "typescript", brandColor: "#3178c6" },
        { name: "Tailwind CSS", iconKey: "tailwindcss", brandColor: "#06b6d4" },
        { name: "Accessibility", iconKey: "accessibility", brandColor: "#16a34a" },
        { name: "Performance", iconKey: "performance", brandColor: "#f59e0b" },
      ],
    },
    {
      category: "Backend",
      skills: [
        { name: "Node.js", iconKey: "nodejs", brandColor: "#83cd29" },
        { name: "Express", iconKey: "express", brandColor: "#9ca3af" },
        { name: "Fastify", iconKey: "fastify", brandColor: "#f97316" },
        { name: "REST APIs", iconKey: "rest", brandColor: "#38bdf8" },
        { name: "Schema Validation", iconKey: "schema", brandColor: "#a855f7" },
        { name: "Error Contracts", iconKey: "shield", brandColor: "#f43f5e" },
      ],
    },
    {
      category: "Data & Platform",
      skills: [
        { name: "PostgreSQL", iconKey: "postgresql", brandColor: "#4169e1" },
        { name: "Redis", iconKey: "redis", brandColor: "#dc382d" },
        { name: "Observability", iconKey: "observability", brandColor: "#22d3ee" },
        { name: "CI/CD", iconKey: "cicd", brandColor: "#0ea5e9" },
        { name: "Feature Flags", iconKey: "flag", brandColor: "#f97316" },
      ],
    },
  ] as SkillCategory[],
  articles: [
    {
      title: "Designing API Contracts That Survive Product Change",
      premise:
        "Why explicit response contracts reduce regressions during roadmap churn.",
      takeaway:
        "Treat contracts as product artifacts, not only engineering implementation details.",
      readTime: "7 min read",
      href: "#contact",
    },
    {
      title: "The 12-Second Recruiter Scan: IA for Technical Portfolios",
      premise:
        "How information hierarchy shapes first-impression outcomes for hiring teams.",
      takeaway:
        "Front-load proof and credibility while preserving depth for technical reviewers.",
      readTime: "5 min read",
      href: "#contact",
    },
    {
      title: "Shipping Motion Responsibly in High-Intent Interfaces",
      premise:
        "A practical approach for delight without sacrificing clarity or performance.",
      takeaway:
        "Constrain animation budget to one intentional moment and honor reduced motion.",
      readTime: "6 min read",
      href: "#contact",
    },
  ] as ArticleSummary[],
};

export type PortfolioContent = typeof portfolioContent;
