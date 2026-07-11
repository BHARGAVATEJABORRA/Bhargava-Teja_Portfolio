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

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectSummary {
  title: string;
  timeframe: string;
  role: string;
  category: string;
  problem: string;
  approach: string;
  stack: string[];
  techStack: string[];
  outcome: string;
  href: string;
  linkState: "configured" | "on-request";
  liveUrl?: string;
  repoUrl?: string;
  /** Card cover image URL (uploaded in admin). Recommended 1200×800 (3:2). */
  imageUrl?: string;
  /** Accessible alt text for the cover image. */
  imageAlt?: string;
  metrics?: ProjectMetric[];
}

export interface ExperienceItem {
  organization: string;
  title: string;
  period: string;
  highlights: string[];
  location?: string;
  href?: string;
  /** Credly badge image URL (certifications). */
  badgeUrl?: string;
  /** Public verification URL for the credential (certifications). */
  verifyUrl?: string;
  /** react-icons key used as a logo / badge fallback. */
  brandIconKey?: string;
  /** Brand color for the logo chip background tint. */
  brandColor?: string;
}

export interface ExperienceCollection {
  work: ExperienceItem[];
  education: ExperienceItem[];
  certifications: ExperienceItem[];
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
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  href: string;
  isExternal?: boolean;
  isReal?: boolean;
  tags?: string[];
  premise: string;
  takeaway: string;
  /** Short kicker shown in the card header, e.g. "Cloud Cost · FinOps". */
  source?: string;
  /** One-line hook rendered under the title in the stacking deck. */
  tagline?: string;
  /** Longer body paragraph shown when the card is the active/expanded one. */
  body?: string;
  /** Legacy cosmetic like count — real likes now live in the Like table (/api/likes). */
  likes?: number;
  /** Accent color for the card image panel / gradient. */
  accent?: string;
  /** Per-article social share image (falls back to the site OG image). */
  ogImage?: string;
}

export interface ControlCenterModule {
  title: string;
  detail: string;
  value: string;
}

// Admin CMS overlay: the admin dashboard (Prisma/SQLite) publishes edited
// collections to portfolio-overrides.json; when present they replace the
// static defaults below. See lib/content-store.ts.
import overridesJson from "./portfolio-overrides.json";

import type { PublicSiteConfig } from "@/lib/site-config";

export interface PortfolioOverrides {
  projects?: ProjectSummary[];
  experience?: ExperienceCollection;
  skills?: SkillCategory[];
  articles?: ArticleSummary[];
  /** Site-wide settings from /admin/settings (identity, hero, about, social, contact, metadata). */
  siteConfig?: Partial<PublicSiteConfig>;
}

const overrides = overridesJson as PortfolioOverrides;

const basePortfolioContent = {
  identity: {
    name: "Bhargava Teja Borra",
    publicAlias: "Bhargava Teja Borra",
    legalName: "Bhargava Teja Borra",
    role: "Software Engineer",
    location: "Addison (Dallas), TX, USA",
    currentlyAt: "Capital One",
    avatarUrl: "",
    bio:
      "Software engineer with 4+ years building high-scale AWS cloud infrastructure for enterprise banking and Fortune 500 systems.\n\nI focus on reliability, automation, and measurable outcomes, including cutting cloud costs by 35% and boosting performance by 40%.",
    resumeHref: "/bhargava-teja-borra-resume.pdf",
    phone: "123-456-7890",
    phoneVisibleOnPage: false,
    intro:
      "Architect and engineer scalable AWS infrastructure with measurable reliability, performance, and cost outcomes.",
    contactEmail: "bhargavateja.borra@gmail.com",
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com/BHARGAVATEJABORRA",
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/bhargavatejaborra/",
      },
      {
        label: "Credly",
        href: "https://www.credly.com/users/borra-bhargava-teja.00b61798/badges#credly",
      },
      {
        label: "Instagram",
        href: "https://www.instagram.com/bhargav_bh__?igsh=Y3NmZ2pwMDdwYXU%3D&utm_source=qr",
      },
      {
        label: "Snapchat",
        href: "https://snapchat.com/t/hv7Trqdu",
      },
    ],
    controlCenter: {
      availability: "open-to-opportunities" as const,
      availabilityNote: "Open to senior IC and tech-lead opportunities in cloud, platform, and backend engineering",
      location: "Dallas, TX",
      timezone: "Central Time (CT)",
      coffeeCount: 847,
      githubUsername: "BHARGAVATEJABORRA",
      weatherLocation: "Dallas, TX",
      weatherTimezone: "America/Chicago",
      weatherLat: 32.7767,
      weatherLng: -96.797,
    },
  },
  hero: {
    headline: "Architecting resilient cloud systems with measurable outcomes.",
    primaryCta: {
      label: "View My Work",
      href: "#projects",
    },
    secondaryCta: {
      label: "Download Resume",
      href: "/bhargava-teja-borra-resume.txt",
    },
    signalPanel: {
      title: "Professional Summary",
      subtitle: "Resume-backed outcomes from cloud and platform engineering delivery",
      bullets: [
        "Reduced compute spend by 35% using rightsizing and AWS optimization",
        "Improved API and deployment performance by 40% with automation",
        "Delivered resilient AWS systems with reliability-first architecture",
      ],
    },
  },
  proofMetrics: [
    {
      label: "Cloud Experience",
      value: "3+ Years",
      context: "AWS infrastructure, microservices, CI/CD, and reliability engineering delivery",
    },
    {
      label: "Cost Optimization",
      value: "35%",
      context: "Compute cost reduction through optimization and automation",
    },
    {
      label: "API + Deploy Speed",
      value: "40%",
      context: "Performance gains from refactoring, automation, and better pipelines",
    },
    {
      label: "Reliability",
      value: "99.9%",
      context: "Uptime delivered on enterprise systems serving millions of users",
    },
  ] as ProofMetric[],
  about: {
    paragraphs: [
      "I'm a software engineer with 4+ years building high-scale AWS cloud infrastructure for enterprise banking and Fortune 500 systems — currently at Capital One in Dallas. I design architectures that hold 99.9% uptime, automate everything repeatable with Terraform and CloudFormation, and build CI/CD pipelines that turned three-week release cycles into two-day ships. I care about practical engineering: clear ownership, measurable outcomes, and systems the next engineer can run without a manual.",
    ],
    /** The 3 stat tiles in the About card (admin-editable via /admin/settings). */
    stats: [
      { value: "4+", label: "Years building cloud systems" },
      { value: "99.9%", label: "Uptime on banking workloads" },
      { value: "35%", label: "Cloud costs cut" },
    ],
    /** Specialty chips in the About card (admin-editable via /admin/settings). */
    specialties: [
      "AWS Platform Engineering",
      "Infrastructure as Code",
      "CI/CD & Automation",
      "Observability & Reliability",
    ],
    principles: [
      "Automate repeatable operations to accelerate delivery and reduce risk",
      "Design for resilience, observability, and recovery from day one",
      "Use measurable outcomes to guide architecture and implementation choices",
    ],
  },
  controlCenter: {
    modules: [
      {
        title: "Availability",
        detail: "Open to software engineering opportunities",
        value: "Cloud, platform, backend, and full-stack delivery teams",
      },
      {
        title: "Focus",
        detail: "Cloud infrastructure, performance, and reliability",
        value: "Hands-on IC work with strong ownership",
      },
      {
        title: "Response SLA",
        detail: "Recruiter and hiring manager outreach",
        value: "Typically within one business day",
      },
    ] as ControlCenterModule[],
    aiCompanion: {
      title: "AI Companion",
      description: "AI companion will be enabled in Phase 2.",
    },
  },
  flagship: {
    name: "Capital One Cloud Migration and Reliability Platform",
    summary:
      "Led migration and modernization of financial services workloads onto AWS serverless microservices with reliability, security, and delivery speed as first-class goals.",
    stack: ["AWS", "Terraform", "Lambda", "API Gateway", "GitHub Actions", "IAM", "VPC"],
    impact: [
      "Reduced compute spend by 35% through rightsizing and platform automation",
      "Improved API and deployment performance by 40% via CI/CD modernization",
      "Strengthened resilience with multi-region design and disaster recovery planning",
    ],
    architecture: [
      {
        title: "Automation-first infrastructure",
        description:
          "Implemented Terraform-driven infrastructure patterns to keep provisioning repeatable, auditable, and environment-consistent.",
      },
      {
        title: "Recovery and security posture",
        description:
          "Applied VPC segmentation, IAM controls, and region-aware recovery patterns to reduce failure blast radius.",
      },
      {
        title: "Delivery acceleration",
        description:
          "Established GitHub Actions pipelines, quality gates, and deployment automation to reduce release cycle friction.",
      },
    ],
    links: {
      caseStudy: "#contact",
      repository: "#contact",
    },
  } as FlagshipProject,
  projects: [
    {
      title: "Capital One Cloud Migration and Reliability Platform",
      timeframe: "Jul 2025 - Present",
      role: "Software Engineer",
      category: "Cloud Infrastructure",
      problem: "Legacy services were expensive to operate and slow to deploy, with reliability risk under transaction-heavy load.",
      approach: "Migrated services to AWS serverless microservices, codified infrastructure with Terraform, and standardized CI/CD with GitHub Actions.",
      stack: ["AWS", "Lambda", "API Gateway", "Terraform", "GitHub Actions", "DynamoDB", "CloudWatch"],
      techStack: ["AWS", "Lambda", "Terraform", "GitHub Actions", "CloudWatch"],
      outcome: "Reduced compute costs and improved API and delivery throughput while increasing platform resilience.",
      href: "#contact",
      linkState: "on-request",
      metrics: [
        { value: "35%", label: "Cost Reduction" },
        { value: "40%", label: "API/Deploy Gain" },
      ],
    },
    {
      title: "Accenture Data and Cloud Automation Platform",
      timeframe: "May 2020 - Jun 2023",
      role: "Software Engineer",
      category: "Data Engineering",
      problem: "Manual data-processing pipelines were slow, error-prone, and difficult to scale across enterprise environments.",
      approach: "Built Python ETL workflows with AWS Step Functions, containerized services on Docker/Kubernetes, and standardized Terraform IaC.",
      stack: ["Python", "AWS Step Functions", "Docker", "Kubernetes", "Terraform", "S3", "CloudWatch"],
      techStack: ["Python", "AWS Step Functions", "Docker", "Kubernetes", "Terraform"],
      outcome: "Improved data-processing throughput and reliability while reducing operational overhead through automation.",
      href: "#contact",
      linkState: "on-request",
      metrics: [
        { value: "40%", label: "Processing Gain" },
        { value: "35%", label: "Cost Reduction" },
      ],
    },
    {
      title: "Transaction Intelligence and Fraud Signal Pipeline",
      timeframe: "On request",
      role: "Software Engineer",
      category: "AI/ML",
      problem: "Rule-based fraud and anomaly checks did not scale with transaction growth and evolving behavior patterns.",
      approach: "Designed ML-assisted feature pipelines and event-driven scoring services to improve detection quality under high throughput.",
      stack: ["Python", "AWS", "Machine Learning", "Microservices", "Event-Driven Architecture"],
      techStack: ["Python", "AWS", "ML", "Microservices", "Event-Driven"],
      outcome: "Delivered scalable transaction intelligence workflows used by product and risk teams.",
      href: "#contact",
      linkState: "on-request",
      metrics: [
        { value: "On request", label: "Case Study" },
        { value: "On request", label: "Deployment Scope" },
      ],
    },
  ] as ProjectSummary[],
  experience: {
    work: [
      {
        organization: "Capital One",
        title: "Software Engineer",
        period: "Jul 2025 - Present",
        location: "Dallas, TX",
        highlights: [
          "Architect and maintain AWS cloud infrastructure (EC2, Lambda, S3, RDS) for enterprise banking systems, sustaining 99.9% uptime.",
          "Automate deployments with Terraform and CloudFormation, cutting provisioning time by 60% across 5 engineering teams.",
          "Implemented CI/CD with Jenkins and AWS CodePipeline, cutting release cycles from 3 weeks to 2 days and deployment failures by 70%.",
          "Designed disaster recovery with 15-minute RTO meeting SOC2 and PCI-DSS compliance requirements.",
          "Lowered monthly cloud spend by 25% (~$40K annual savings) through cost analysis and rightsizing.",
        ],
      },
      {
        organization: "Accenture",
        title: "Software Engineer",
        period: "Jul 2021 - Jun 2023",
        location: "Hyderabad, India",
        highlights: [
          "Designed and deployed microservices on AWS (EC2/EKS) serving 2M+ users at 99.9% uptime for Fortune 500 financial clients.",
          "Built secure REST APIs with Spring Security (OAuth2/JWT) processing 500K+ daily calls, reducing auth failures by 85%.",
          "Automated provisioning with Terraform, halving environment setup time; CI/CD with Jenkins and GitHub Actions cut deployments from 4 hours to 15 minutes.",
          "Tuned PostgreSQL and DynamoDB with Redis caching, speeding API responses by 40% and cutting DB load by 60%.",
          "Built CloudWatch dashboards detecting incidents 3x faster; resolved 200+ incidents and led 15+ Well-Architected workshops.",
        ],
      },
      {
        organization: "Accenture",
        title: "Associate Software Engineer",
        period: "May 2020 - Jun 2021",
        location: "Hyderabad, India",
        highlights: [
          "Built serverless data-processing workflows with AWS Lambda, API Gateway, and S3 handling 500K+ daily events, cutting infrastructure costs by 30%.",
          "Developed ML-enabled applications with pattern recognition and predictive analytics processing 500K+ transactions daily.",
          "Created CodePipeline and Jenkins workflows reducing release errors by 85% via automated testing.",
          "Improved SQL query performance by 50%; CloudWatch and SNS alerting cut MTTD by 70% and prevented 95% of outages.",
        ],
      },
    ],
    education: [
      {
        organization: "University of Missouri - Kansas City",
        title: "Master of Science in Computer Science",
        period: "Aug 2023 - May 2025",
        location: "Kansas City, MO",
        highlights: ["GPA: 3.83 · Graduate coursework in distributed systems, cloud computing, and software engineering."],
      },
    ],
    certifications: [
      {
        organization: "Amazon Web Services",
        title: "AWS Certified Solutions Architect – Associate",
        period: "Active",
        highlights: [],
        badgeUrl: "https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png",
        verifyUrl: "https://www.credly.com/badges/aa60da34-5e5b-4665-aced-7a31b080e087/public_url",
        brandIconKey: "SiAmazonwebservices",
        brandColor: "#FF9900",
      },
      {
        organization: "Microsoft",
        title: "Azure Developer Associate (AZ-204)",
        period: "Active",
        highlights: [],
        badgeUrl: "https://images.credly.com/images/63316b60-f62d-4e51-aacc-c23cb850089c/azure-developer-associate-600x600.png",
        verifyUrl: "https://www.credly.com/badges/7cc8142a-e515-4ffc-85f7-27caf120af7b/public_url",
        brandIconKey: "SiMicrosoftazure",
        brandColor: "#0078D4",
      },
      {
        organization: "Microsoft",
        title: "Azure Fundamentals (AZ-900)",
        period: "Active",
        highlights: [],
        badgeUrl: "https://images.credly.com/images/be8fcaeb-c769-4858-b567-ffaaa73ce8cf/image.png",
        verifyUrl: "https://www.credly.com/badges/b2a5c6ea-7033-4b47-8e4c-2a200a7f219f/public_url",
        brandIconKey: "SiMicrosoftazure",
        brandColor: "#0078D4",
      },
      {
        organization: "Microsoft",
        title: "Azure AI Fundamentals (AI-900)",
        period: "Active",
        highlights: [],
        badgeUrl: "https://images.credly.com/images/4136ced8-75d5-4afb-8677-40b6236e2672/azure-ai-fundamentals-600x600.png",
        verifyUrl: "https://www.credly.com/badges/4746a260-add2-4d19-80fe-35864680c254/public_url",
        brandIconKey: "SiMicrosoftazure",
        brandColor: "#0078D4",
      },
      {
        organization: "Oracle",
        title: "Oracle Cloud Infrastructure Foundations",
        period: "Active",
        highlights: [],
        badgeUrl: "https://images.credly.com/images/27db49f3-8bae-4314-8a84-884935b569db/50_Oracle_Cloud_Infrastructure.png",
        verifyUrl:
          "https://catalog-education.oracle.com/ords/certview/sharebadge?id=94EF5220200418E05B601197C63E6BCB2CCD5061D98566CE5EB9384498A1B00F",
        brandIconKey: "SiOracle",
        brandColor: "#F80000",
      },
      {
        organization: "AWS + AICTE",
        title: "AWS Cloud Virtual Internship",
        period: "2020",
        highlights: [],
        verifyUrl:
          "https://aictecert.eduskillsfoundation.org/pages/home/verify.php?cert=acce9a106b5e284184e5990b3ea64433",
        brandIconKey: "SiAmazonwebservices",
        brandColor: "#FF9900",
      },
    ],
  } as ExperienceCollection,
  skills: [
    {
      category: "Cloud/DevOps",
      skills: [
        { name: "AWS", iconKey: "SiAmazonaws", brandColor: "#FF9900" },
        { name: "Azure", iconKey: "SiMicrosoftazure", brandColor: "#0078D4" },
        { name: "Docker", iconKey: "SiDocker", brandColor: "#2496ED" },
        { name: "Kubernetes", iconKey: "SiKubernetes", brandColor: "#326CE5" },
        { name: "Terraform", iconKey: "SiTerraform", brandColor: "#7B42BC" },
        { name: "GitHub Actions", iconKey: "SiGithubactions", brandColor: "#2088FF" },
        { name: "Jenkins", iconKey: "SiJenkins", brandColor: "#D33833" },
        { name: "CircleCI", iconKey: "SiCircleci", brandColor: "#343434" },
      ],
    },
    {
      category: "Programming Languages",
      skills: [
        { name: "Python", iconKey: "SiPython", brandColor: "#3776AB" },
        { name: "Java", iconKey: "SiJava", brandColor: "#007396" },
        { name: "JavaScript", iconKey: "SiJavascript", brandColor: "#F7DF1E" },
        { name: "TypeScript", iconKey: "SiTypescript", brandColor: "#3178C6" },
        { name: "SQL", iconKey: "LuDatabase", brandColor: "#4479A1" },
        { name: "Bash", iconKey: "SiGnubash", brandColor: "#4EAA25" },
      ],
    },
    {
      category: "Backend/Infrastructure",
      skills: [
        { name: "Node.js", iconKey: "SiNodedotjs", brandColor: "#339933" },
        { name: "MongoDB", iconKey: "SiMongodb", brandColor: "#47A248" },
        { name: "CloudFormation", iconKey: "SiAmazonaws", brandColor: "#FF9900" },
        { name: "API Gateway", iconKey: "LuGlobe", brandColor: "#FF4F00" },
        { name: "Microservices", iconKey: "LuNetwork", brandColor: "#00B4D8" },
      ],
    },
    {
      category: "Frontend",
      skills: [
        { name: "React", iconKey: "SiReact", brandColor: "#61DAFB" },
        { name: "Next.js", iconKey: "SiNextdotjs", brandColor: "#000000" },
        { name: "Tailwind CSS", iconKey: "SiTailwindcss", brandColor: "#06B6D4" },
      ],
    },
    {
      category: "AI/ML",
      skills: [
        { name: "SageMaker", iconKey: "SiAmazonaws", brandColor: "#FF9900" },
        { name: "ChatGPT / LLM", iconKey: "SiOpenai", brandColor: "#412991" },
        { name: "Machine Learning", iconKey: "LuBrainCircuit", brandColor: "#7C3AED" },
      ],
    },
  ] as SkillCategory[],
  // Placeholder posts themed on the resume. Swap in real published posts later;
  // `isReal: false` keeps them flagged as samples.
  articles: [
    {
      slug: "cutting-aws-bill-35-percent",
      title: "Cutting a Fortune 500 Bank's AWS Bill by 35% Without Shipping Less",
      source: "Cloud Cost · FinOps",
      excerpt: "Rightsizing, savings plans, and a ruthless audit of idle capacity — how a banking platform got 35% cheaper while uptime stayed at 99.9%.",
      tagline: "The cheapest server is the one you turned off on Friday.",
      body:
        "When monthly cloud spend creeps past six figures, the savings hide in the boring places. I walked through EC2 rightsizing, S3 lifecycle tiers, and Savings Plans coverage, then automated the cleanup so idle dev environments shut themselves down overnight. The result: ~$40K in annual savings and a cost dashboard the whole org could actually read.",
      publishedAt: "March 2025",
      readTime: "8 min read",
      href: "#",
      isReal: false,
      accent: "#fcbc1d",
      tags: ["AWS", "FinOps", "Cost Optimization"],
      premise: "Where cloud savings actually hide on a high-scale banking platform.",
      takeaway: "Rightsizing plus automated idle-resource shutdown beats heroic one-off cleanups every time.",
    },
    {
      slug: "three-week-releases-to-two-day-ships",
      title: "From 3-Week Releases to 2-Day Ships: Rebuilding a Banking CI/CD Pipeline",
      source: "DevOps · CI/CD",
      excerpt: "Replacing manual change windows with Jenkins + CodePipeline gates cut release cycles from three weeks to two days and dropped deploy failures 70%.",
      tagline: "Slow releases aren't safe releases — they're just rare ones.",
      body:
        "Enterprise banking treats every deploy as a risk event, which is exactly why the pipeline had calcified into three-week change windows. I introduced automated test gates, progressive rollouts, and one-click rollback. Releases that once needed a committee now ship in two days, and deployment failures fell by 70% because the safety lived in the pipeline, not in people.",
      publishedAt: "January 2025",
      readTime: "7 min read",
      href: "#",
      isReal: false,
      accent: "#6aa6ff",
      tags: ["CI/CD", "Jenkins", "AWS CodePipeline"],
      premise: "How automated gates made frequent banking deploys safer, not scarier.",
      takeaway: "Encode safety into the pipeline and release frequency stops being a liability.",
    },
    {
      slug: "designing-for-15-minute-rto",
      title: "Designing for a 15-Minute RTO: Disaster Recovery That Survives Real Outages",
      source: "Reliability · DR",
      excerpt: "Multi-AZ failover, VPC isolation, and IAM guardrails that meet SOC2 and PCI-DSS while keeping recovery under fifteen minutes.",
      tagline: "Your DR plan is a hypothesis until a region goes dark.",
      body:
        "A recovery-time objective only matters if you've actually rehearsed it. I designed failover across availability zones with hardened VPCs, scoped security groups, and least-privilege IAM, then ran game days until 15-minute recovery was routine rather than aspirational — all while satisfying SOC2 and PCI-DSS auditors.",
      publishedAt: "November 2024",
      readTime: "9 min read",
      href: "#",
      isReal: false,
      accent: "#c084fc",
      tags: ["Disaster Recovery", "AWS", "Compliance"],
      premise: "Building disaster recovery you can prove, not just document.",
      takeaway: "Rehearsed failover beats a beautiful runbook nobody has tested.",
    },
    {
      slug: "terraform-without-drift",
      title: "Terraform at Scale: Killing Configuration Drift Across AWS and Azure",
      source: "IaC · Platform",
      excerpt: "Opinionated modules plus CI validation drove multi-cloud environment parity and pushed configuration drift to near zero.",
      tagline: "Drift is just undocumented decisions piling up in production.",
      body:
        "Two clouds, five teams, and endless 'just one quick console change' — that's how drift starts. I built reusable Terraform modules with policy validation baked into GitHub Actions, so every environment came from the same source of truth. Provisioning time dropped 60% and the gap between staging and prod effectively disappeared.",
      publishedAt: "September 2024",
      readTime: "7 min read",
      href: "#",
      isReal: false,
      accent: "#34d399",
      tags: ["Terraform", "IaC", "Multi-Cloud"],
      premise: "Standardizing multi-cloud environments before drift reaches prod.",
      takeaway: "Modular IaC with CI validation keeps every environment honest.",
    },
    {
      slug: "oauth2-jwt-at-500k-calls",
      title: "OAuth2 + JWT at 500K Calls a Day: Hardening Spring Security in Production",
      source: "Security · APIs",
      excerpt: "Token rotation, scoped claims, and Redis-backed sessions cut authentication failures 85% on a half-million daily API calls.",
      tagline: "Auth bugs don't scale gracefully — they fail loudly at 3 a.m.",
      body:
        "At 500K calls a day, a sloppy auth layer becomes a pager magnet. I tightened Spring Security with short-lived JWTs, scoped OAuth2 claims, and Redis-backed token state, then load-tested the failure modes. Authentication failures dropped 85% and the on-call rotation finally got quiet.",
      publishedAt: "June 2024",
      readTime: "6 min read",
      href: "#",
      isReal: false,
      accent: "#f97316",
      tags: ["Spring Security", "OAuth2", "JWT"],
      premise: "Making high-volume API authentication boringly reliable.",
      takeaway: "Short-lived, scoped tokens plus load-tested failure modes keep auth quiet.",
    },
    {
      slug: "serverless-on-a-budget",
      title: "Serverless on a Budget: Replacing EC2 Fleets with Lambda + API Gateway",
      source: "Serverless · AWS",
      excerpt: "Moving 500K daily events from always-on EC2 to event-driven Lambda trimmed infrastructure cost 30% with no throughput loss.",
      tagline: "Stop paying for servers that spend the night doing nothing.",
      body:
        "An always-on EC2 fleet for bursty, event-driven work is a standing invoice for idle time. I rebuilt the workflow around Lambda, API Gateway, and S3 so capacity followed demand instead of the clock. Handling 500K daily events got 30% cheaper, and scaling stopped being a capacity-planning meeting.",
      publishedAt: "March 2024",
      readTime: "6 min read",
      href: "#",
      isReal: false,
      accent: "#38bdf8",
      tags: ["Serverless", "Lambda", "API Gateway"],
      premise: "When event-driven serverless beats an always-on fleet.",
      takeaway: "Match capacity to demand and idle time stops showing up on the bill.",
    },
    {
      slug: "postgres-dynamodb-40-percent-latency",
      title: "Taming PostgreSQL and DynamoDB: A 40% Latency Win with Redis Caching",
      source: "Data · Performance",
      excerpt: "Query tuning, smart indexing, and a Redis cache layer sped API responses 40% and cut database load 60%.",
      tagline: "The fastest query is the one you never send to the database.",
      body:
        "Hot read paths were hammering the primary database long after the data stopped changing. I profiled the slow queries, fixed the indexing, and put a Redis cache in front of the expensive lookups. API responses got 40% faster and database load fell 60% — headroom the team spent on features instead of firefighting.",
      publishedAt: "December 2023",
      readTime: "7 min read",
      href: "#",
      isReal: false,
      accent: "#60a5fa",
      tags: ["PostgreSQL", "DynamoDB", "Redis"],
      premise: "Cutting database load without rewriting the application.",
      takeaway: "Profile first, index well, then cache the lookups that don't change.",
    },
    {
      slug: "cloudwatch-dashboards-3x-faster",
      title: "CloudWatch Dashboards That Actually Catch Incidents 3x Faster",
      source: "Observability · SRE",
      excerpt: "Signal-first dashboards and SNS alerting detected incidents three times faster and prevented 95% of would-be outages.",
      tagline: "A dashboard nobody watches is just expensive wallpaper.",
      body:
        "Most monitoring dies of noise — a hundred green tiles and the one red one nobody notices. I rebuilt the CloudWatch dashboards around the handful of signals that actually predict failure, wired SNS alerts to the right humans, and tuned thresholds against real incident history. Detection got 3x faster and 95% of outages were caught before customers ever felt them.",
      publishedAt: "October 2023",
      readTime: "5 min read",
      href: "#",
      isReal: false,
      accent: "#a78bfa",
      tags: ["CloudWatch", "Observability", "Alerting"],
      premise: "Designing monitoring around signal instead of noise.",
      takeaway: "Alert on the few signals that predict failure and the rest is wallpaper.",
    },
  ] as ArticleSummary[],
  contact: {
    heading: "Let's build something reliable",
    subheading: "Recruiter and hiring-manager outreach welcome — typically answered within one business day.",
    email: "bhargavateja.borra@gmail.com",
    formDestination: "bhargavateja.borra@gmail.com",
    availableFor: "Open to senior IC and tech-lead opportunities in cloud, platform, and backend engineering",
    showForm: true,
  },
  meta: {
    titleTemplate: "Bhargava Teja Borra | Software Engineer (Cloud & Platform)",
    description:
      "Recruiter-first software engineering portfolio with resume-backed cloud architecture, reliability, and delivery outcomes.",
    ogImage: "/og-image.svg",
    analyticsId: "",
  },
};

// ---------------------------------------------------------------------------
// Overlay merge
//
// Collections (projects/experience/skills/articles): when the DB overlay has
// entries, they REPLACE the static defaults wholesale — never merged by index.
//
// siteConfig: identity/hero/about/social/contact/meta values from
// /admin/settings are folded into the matching sections below. Empty strings
// mean "not configured" and fall back to the static default.
// ---------------------------------------------------------------------------

const sc = overrides.siteConfig;

function pick(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

function mergeSocialLinks(): { label: string; href: string }[] {
  if (!sc) return basePortfolioContent.identity.socialLinks;
  const links = basePortfolioContent.identity.socialLinks.map((link) => {
    const label = link.label.toLowerCase();
    if (label === "github" && sc.githubUrl?.trim()) return { ...link, href: sc.githubUrl };
    if (label === "linkedin" && sc.linkedinUrl?.trim()) return { ...link, href: sc.linkedinUrl };
    return link;
  });
  if (sc.twitterUrl?.trim() && !links.some((l) => /^(twitter|x)$/i.test(l.label))) {
    links.push({ label: "Twitter", href: sc.twitterUrl });
  }
  const custom = sc.customLink;
  if (custom?.label?.trim() && custom?.url?.trim() && !links.some((l) => l.label.toLowerCase() === custom.label.trim().toLowerCase())) {
    links.push({ label: custom.label.trim(), href: custom.url });
  }
  return links;
}

const mergedIdentity = sc
  ? {
      ...basePortfolioContent.identity,
      name: pick(sc.fullName, basePortfolioContent.identity.name),
      publicAlias: pick(sc.fullName, basePortfolioContent.identity.publicAlias),
      legalName: pick(sc.fullName, basePortfolioContent.identity.legalName),
      role: pick(sc.roleLine, basePortfolioContent.identity.role),
      location: pick(sc.location, basePortfolioContent.identity.location),
      currentlyAt: pick(sc.currentEmployer, basePortfolioContent.identity.currentlyAt),
      bio: pick(sc.aboutBio, basePortfolioContent.identity.bio),
      intro: pick(sc.heroTagline, basePortfolioContent.identity.intro),
      contactEmail: pick(sc.contactEmail || sc.email, basePortfolioContent.identity.contactEmail),
      resumeHref: pick(sc.resumeUrl, basePortfolioContent.identity.resumeHref),
      socialLinks: mergeSocialLinks(),
    }
  : basePortfolioContent.identity;

const mergedAbout = sc
  ? {
      ...basePortfolioContent.about,
      paragraphs: sc.aboutBio?.trim()
        ? [sc.aboutBio, ...basePortfolioContent.about.paragraphs.slice(1)]
        : basePortfolioContent.about.paragraphs,
      stats: sc.aboutStats?.length ? sc.aboutStats : basePortfolioContent.about.stats,
      specialties: sc.aboutSpecialties?.length ? sc.aboutSpecialties : basePortfolioContent.about.specialties,
    }
  : basePortfolioContent.about;

const mergedContact = sc
  ? {
      heading: pick(sc.contactHeading, basePortfolioContent.contact.heading),
      subheading: pick(sc.contactSubheading, basePortfolioContent.contact.subheading),
      email: pick(sc.contactEmail, basePortfolioContent.contact.email),
      formDestination: pick(sc.contactFormDestination, basePortfolioContent.contact.formDestination),
      availableFor: pick(sc.availableFor, basePortfolioContent.contact.availableFor),
      showForm: typeof sc.showContactForm === "boolean" ? sc.showContactForm : basePortfolioContent.contact.showForm,
    }
  : basePortfolioContent.contact;

const mergedMeta = sc
  ? {
      titleTemplate: pick(sc.titleTemplate, basePortfolioContent.meta.titleTemplate),
      description: pick(sc.metaDescription, basePortfolioContent.meta.description),
      ogImage: pick(sc.ogImageUrl, basePortfolioContent.meta.ogImage),
      analyticsId: pick(sc.analyticsId, basePortfolioContent.meta.analyticsId),
    }
  : basePortfolioContent.meta;

// Feature flags + availability status from /admin settings (default on / available).
const flag = (value: boolean | undefined, fallback = true): boolean => (typeof value === "boolean" ? value : fallback);

const mergedFeatures = {
  projects: flag(sc?.showProjects),
  experience: flag(sc?.showExperience),
  skills: flag(sc?.showSkills),
  articles: flag(sc?.showArticles),
};

const mergedAvailability = {
  status: sc?.availabilityStatus?.trim() || "available",
  show: flag(sc?.showAvailabilityBadge),
};

const mergedNow = {
  text: sc?.nowText ?? "",
  updatedAt: sc?.nowUpdatedAt ?? "",
};

export const portfolioContent = {
  ...basePortfolioContent,
  identity: mergedIdentity,
  about: mergedAbout,
  contact: mergedContact,
  meta: mergedMeta,
  features: mergedFeatures,
  availability: mergedAvailability,
  now: mergedNow,
  projects: overrides.projects?.length ? overrides.projects : basePortfolioContent.projects,
  experience: overrides.experience ?? basePortfolioContent.experience,
  skills: overrides.skills?.length ? overrides.skills : basePortfolioContent.skills,
  articles: overrides.articles?.length ? overrides.articles : basePortfolioContent.articles,
};

export type PortfolioContent = typeof portfolioContent;
