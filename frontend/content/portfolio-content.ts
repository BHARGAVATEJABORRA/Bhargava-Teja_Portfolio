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
      category: "Cloud Platforms",
      skills: [
        { name: "AWS", iconKey: "SiAmazonaws", brandColor: "#FF9900", keywords: ["amazon web services", "cloud"] },
        { name: "Azure", iconKey: "SiMicrosoftazure", brandColor: "#0078D4", keywords: ["microsoft", "cloud"] },
        { name: "Google Cloud", iconKey: "SiGooglecloud", brandColor: "#4285F4", keywords: ["gcp", "cloud"] },
        { name: "Oracle Cloud", iconKey: "SiOracle", brandColor: "#F80000", keywords: ["oci", "cloud"] },
      ],
    },
    {
      category: "Infrastructure as Code",
      skills: [
        { name: "Terraform", iconKey: "SiTerraform", brandColor: "#844FBA", keywords: ["iac", "hashicorp"] },
        { name: "Ansible", iconKey: "SiAnsible", brandColor: "#EE0000", keywords: ["automation", "configuration"] },
        { name: "CloudFormation", iconKey: "SiAmazoncloudformation", brandColor: "#FF4F8B", keywords: ["iac", "aws"] },
        { name: "AWS CDK", iconKey: "SiAwscdk", brandColor: "#FF9900", keywords: ["iac", "cdk", "aws"] },
        { name: "YAML", iconKey: "SiYaml", brandColor: "#CB171E", keywords: ["config"] },
        { name: "JSON", iconKey: "SiJson", brandColor: "#000000", keywords: ["config"] },
      ],
    },
    {
      category: "Containers & CI/CD",
      skills: [
        { name: "Docker", iconKey: "SiDocker", brandColor: "#2496ED", keywords: ["containers"] },
        { name: "Kubernetes", iconKey: "SiKubernetes", brandColor: "#326CE5", keywords: ["k8s", "orchestration"] },
        { name: "Helm", iconKey: "SiHelm", brandColor: "#0F1689", keywords: ["kubernetes", "charts"] },
        { name: "Jenkins", iconKey: "SiJenkins", brandColor: "#D24939", keywords: ["ci", "cd"] },
        { name: "GitHub Actions", iconKey: "SiGithubactions", brandColor: "#2088FF", keywords: ["ci", "cd"] },
        { name: "GitLab CI", iconKey: "SiGitlab", brandColor: "#FC6D26", keywords: ["ci", "cd"] },
        { name: "CircleCI", iconKey: "SiCircleci", brandColor: "#343434", keywords: ["ci", "cd"] },
      ],
    },
    {
      category: "Programming Languages",
      skills: [
        { name: "Python", iconKey: "SiPython", brandColor: "#3776AB", keywords: ["language"] },
        { name: "Java", iconKey: "SiJava", brandColor: "#007396", keywords: ["language", "jvm"] },
        { name: "JavaScript", iconKey: "SiJavascript", brandColor: "#F7DF1E", keywords: ["language"] },
        { name: "TypeScript", iconKey: "SiTypescript", brandColor: "#3178C6", keywords: ["language"] },
        { name: "C", iconKey: "SiC", brandColor: "#A8B9CC", keywords: ["language"] },
        { name: "C++", iconKey: "SiCplusplus", brandColor: "#00599C", keywords: ["language", "cpp"] },
        { name: "C#", iconKey: "TbBrandCSharp", brandColor: "#512BD4", keywords: ["language", "dotnet", "csharp"] },
        { name: "SQL", iconKey: "LuDatabase", brandColor: "#4479A1", keywords: ["query", "database"] },
        { name: "Bash", iconKey: "SiGnubash", brandColor: "#4EAA25", keywords: ["shell", "scripting"] },
      ],
    },
    {
      category: "Backend & Frameworks",
      skills: [
        { name: "Node.js", iconKey: "SiNodedotjs", brandColor: "#5FA04E", keywords: ["backend", "javascript"] },
        { name: "Express", iconKey: "SiExpress", brandColor: "#0A0A0A", keywords: ["node", "api"] },
        { name: "Spring Boot", iconKey: "SiSpringboot", brandColor: "#6DB33F", keywords: ["java", "backend"] },
        { name: "Spring Security", iconKey: "SiSpringsecurity", brandColor: "#6DB33F", keywords: ["java", "auth"] },
        { name: "Hibernate", iconKey: "SiHibernate", brandColor: "#59666C", keywords: ["java", "orm"] },
        { name: "Flask", iconKey: "SiFlask", brandColor: "#3BABC3", keywords: ["python", "api"] },
        { name: ".NET", iconKey: "SiDotnet", brandColor: "#512BD4", keywords: ["csharp", "backend"] },
        { name: "REST APIs", iconKey: "LuGlobe", brandColor: "#FF6F00", keywords: ["api", "http"] },
        { name: "Microservices", iconKey: "LuNetwork", brandColor: "#00B4D8", keywords: ["architecture", "distributed"] },
      ],
    },
    {
      category: "Frontend",
      skills: [
        { name: "React", iconKey: "SiReact", brandColor: "#61DAFB", keywords: ["ui", "javascript"] },
        { name: "Next.js", iconKey: "SiNextdotjs", brandColor: "#000000", keywords: ["react", "ssr"] },
        { name: "Tailwind CSS", iconKey: "SiTailwindcss", brandColor: "#06B6D4", keywords: ["css", "styling"] },
        { name: "HTML5", iconKey: "SiHtml5", brandColor: "#E34F26", keywords: ["markup", "web"] },
        { name: "CSS", iconKey: "SiCss3", brandColor: "#663399", keywords: ["styling", "web"] },
      ],
    },
    {
      category: "Databases",
      skills: [
        { name: "MySQL", iconKey: "SiMysql", brandColor: "#4479A1", keywords: ["sql", "relational"] },
        { name: "PostgreSQL", iconKey: "SiPostgresql", brandColor: "#4169E1", keywords: ["sql", "relational"] },
        { name: "MongoDB", iconKey: "SiMongodb", brandColor: "#47A248", keywords: ["nosql", "document"] },
        { name: "SQL Server", iconKey: "SiMicrosoftsqlserver", brandColor: "#CC2927", keywords: ["mssql", "relational"] },
        { name: "Redis", iconKey: "SiRedis", brandColor: "#FF4438", keywords: ["cache", "in-memory"] },
        { name: "DynamoDB", iconKey: "SiAmazondynamodb", brandColor: "#4053D6", keywords: ["nosql", "aws"] },
      ],
    },
    {
      category: "Data Science & AI",
      skills: [
        { name: "TensorFlow", iconKey: "SiTensorflow", brandColor: "#FF6F00", keywords: ["deep learning", "ml"] },
        { name: "NumPy", iconKey: "SiNumpy", brandColor: "#013243", keywords: ["python", "arrays"] },
        { name: "Pandas", iconKey: "SiPandas", brandColor: "#150458", keywords: ["python", "dataframes"] },
        { name: "Matplotlib", iconKey: "LuChartLine", brandColor: "#11557C", keywords: ["python", "plotting"] },
        { name: "scikit-learn", iconKey: "SiScikitlearn", brandColor: "#F7931E", keywords: ["ml", "python"] },
        { name: "Jupyter", iconKey: "SiJupyter", brandColor: "#F37626", keywords: ["notebooks", "python"] },
      ],
    },
    {
      category: "Generative AI",
      skills: [
        { name: "ChatGPT", iconKey: "SiOpenai", brandColor: "#10A37F", keywords: ["codex", "gpt", "openai", "llm"] },
        { name: "Claude", iconKey: "SiClaude", brandColor: "#D97757", keywords: ["claude code", "cowork", "anthropic", "llm"] },
        { name: "Perplexity", iconKey: "SiPerplexity", brandColor: "#1FB8CD", keywords: ["comet", "research", "llm"] },
        { name: "Prompt Engineering", iconKey: "LuMessageSquareCode", brandColor: "#38BDF8", keywords: ["llm", "ai"] },
        { name: "AI Integration", iconKey: "LuBot", brandColor: "#34D399", keywords: ["ai", "api", "automation"] },
      ],
    },
    {
      category: "Testing & Monitoring",
      skills: [
        { name: "JUnit", iconKey: "SiJunit5", brandColor: "#25A162", keywords: ["java", "testing"] },
        { name: "Mockito", iconKey: "LuFlaskConical", brandColor: "#4951F4", keywords: ["java", "mocking", "testing"] },
        { name: "Selenium", iconKey: "SiSelenium", brandColor: "#43B02A", keywords: ["e2e", "testing"] },
        { name: "ELK Stack", iconKey: "SiElasticstack", brandColor: "#005571", keywords: ["elasticsearch", "logging"] },
        { name: "CloudWatch", iconKey: "SiAmazoncloudwatch", brandColor: "#FF4F8B", keywords: ["monitoring", "observability", "aws"] },
        { name: "Postman", iconKey: "SiPostman", brandColor: "#FF6C37", keywords: ["api", "testing"] },
      ],
    },
    {
      category: "Developer Tools",
      skills: [
        { name: "Git", iconKey: "SiGit", brandColor: "#F03C2E", keywords: ["vcs", "version control"] },
        { name: "Maven", iconKey: "SiApachemaven", brandColor: "#C71A36", keywords: ["java", "build"] },
        { name: "Gradle", iconKey: "SiGradle", brandColor: "#02303A", keywords: ["java", "build"] },
        { name: "IntelliJ IDEA", iconKey: "SiIntellijidea", brandColor: "#000000", keywords: ["ide", "jetbrains"] },
        { name: "Jira", iconKey: "SiJira", brandColor: "#0052CC", keywords: ["agile", "tracking"] },
      ],
    },
    {
      category: "Operating Systems",
      skills: [
        { name: "Linux", iconKey: "SiLinux", brandColor: "#FCC624", keywords: ["os", "unix"] },
        { name: "Ubuntu", iconKey: "SiUbuntu", brandColor: "#E95420", keywords: ["os", "linux"] },
        { name: "macOS", iconKey: "SiApple", brandColor: "#000000", keywords: ["os", "apple"] },
        { name: "Windows", iconKey: "SiWindows", brandColor: "#0078D4", keywords: ["os", "microsoft"] },
      ],
    },
  ] as SkillCategory[],
  // Published LinkedIn articles. Keep the local detail pages as the portfolio
  // reading experience, with a direct link back to each original post.
  articles: [
    {
      slug: "loop-engineering",
      title: "Loop Engineering: How Coding Agents Turn Feedback Into Progress",
      source: "LinkedIn · AI Engineering",
      excerpt: "Better coding-agent retries begin with clear goals, trusted evidence, bounded authority, and explicit decisions about when to accept, revise, stop, or escalate.",
      tagline: "The capability is that an agent can keep trying; the engineering is deciding whether it should.",
      body:
        "A coding agent can produce a green test and still make the product worse. Loop Engineering is the control system around each attempt: define the goal and constraints, let the agent make a bounded change, observe the result, verify it against both the task and protected behavior, then make an explicit decision about what happens next. The loop is Plan → Execute → Observe → Verify → Decide—not an unlimited prompt-and-retry cycle.\n\nThe quality of a retry depends on the evidence it receives. Tests, logs, diffs, screenshots, and runtime behavior should change the next action. A repeat is justified only when there is a new hypothesis, a narrower scope, a different tool, or a credible transient condition. Budgets for attempts, time, tokens, parallel work, and polling keep an agent from turning uncertainty into expensive motion.\n\nA reliable stop gate recognizes four outcomes: accept when the required evidence passes; revise when a specific, fixable gap remains; stop safely when scope, permission, budget, or evidence integrity fails; and escalate when the unresolved question is about intent, architecture, security, policy, or irreversible impact. Each outcome routes work to the stage that can actually change it.\n\nThe checkout example makes the boundary concrete. A postal-code validation may fix the original failing case while breaking digital-only orders. Protected-behavior tests reject that candidate, tell the next attempt exactly what regressed, and produce an evidence packet for review. When requirements are genuinely undefined, the correct result is a well-formed human question—not another confident guess.",
      publishedAt: "July 27, 2026",
      readTime: "10 min read",
      href: "https://www.linkedin.com/pulse/loop-engineering-how-coding-agents-turn-feedback-progress-borra-vdx8c/",
      isExternal: true,
      isReal: true,
      accent: "#2dd4bf",
      ogImage: "/articles/loop-engineering-cover.png",
      tags: ["Coding Agents", "AI Engineering", "Verification"],
      premise: "Loop Engineering makes agent progress auditable: every attempt has a goal, a scope, evidence, a budget, and a deliberate ending.",
      takeaway: "A coding agent should earn its next attempt with new evidence—and hand consequential decisions back to people with a clear, reviewable record.",
    },
    {
      slug: "mcp-layer-ai-thinking-to-doing",
      title: "MCP: The Layer That Turned AI Thinking Into AI Doing",
      source: "LinkedIn · AI Infrastructure",
      excerpt: "Why Model Context Protocol is the interoperability layer that lets AI applications safely discover context, invoke tools, and work across the systems where work happens.",
      tagline: "The model is still the brain. MCP gives it a dependable way to reach the real world.",
      body:
        "AI systems can reason about a task without being able to read a dashboard, inspect a pull request, retrieve a document, or make a carefully governed change. Model Context Protocol (MCP) addresses that gap with a shared interface between AI applications and the tools, systems, and data they need. It replaces a growing web of custom, model-specific integrations with a standard capability layer.\n\nThe architecture separates responsibility cleanly. The host is the AI application and policy boundary; its clients speak the protocol; MCP servers contain the integrations, authentication, error handling, and domain logic. That host–client–server design means a change in an external API can be handled once in the server rather than rebuilt separately for every model or agent surface.\n\nMCP servers expose four useful capability types: tools for taking actions, resources for retrieving read-only context, prompts for reusable workflows, and sampling for model-assisted multi-step collaboration. Together they let a request move from reasoning to a coordinated workflow—for example, reading a pull request through GitHub, identifying an issue, and preparing a Jira ticket in the same interaction.\n\nInteroperability is not a substitute for governance. Local stdio servers are ideal for private development workflows, while remote HTTP deployments need scoped identity, auditability, and stronger controls. Least privilege, isolated servers, schema validation, approval gates for irreversible actions, and audit logs are the foundations that turn MCP from a compelling demo into dependable infrastructure.",
      publishedAt: "March 9, 2026",
      readTime: "14 min read",
      href: "https://www.linkedin.com/pulse/mcp-layer-turned-ai-thinking-doing-bhargava-teja-borra-szezc/",
      isExternal: true,
      isReal: true,
      accent: "#a78bfa",
      ogImage: "/articles/mcp-cover.png",
      tags: ["MCP", "AI Agents", "Software Architecture"],
      premise: "MCP is the interoperability layer that transforms AI from conversational intelligence into governed, operational intelligence.",
      takeaway: "Build the connection once, but govern every capability: standard access only becomes useful when permissions, approvals, and audit trails are designed with equal care.",
    },
    {
      slug: "dev-ops",
      title: "DEV Ops",
      source: "LinkedIn · DevOps",
      excerpt: "A concise look at DevOps as a culture of shared responsibility, combining development, operations, agile delivery, and system-oriented thinking.",
      tagline: "DevOps turns the handoff between building software and running it into a shared practice.",
      body:
        "DevOps is a change in IT culture centered on rapid service delivery through agile and lean practices, viewed through a system-oriented lens. Its name joins development and operations because the practice is about more than a handoff: it brings the teams responsible for building software and running it into the same collaborative effort.\n\nThe evolution of the discipline reflects the evolution of computing itself. Early programming created development roles; the growth of networked systems created operations and network centers; and later, dedicated site reliability engineering demonstrated the value of operating production systems closely with the people who build them.\n\nAgile and DevOps reinforce each other. Agile shortens the feedback cycle for creating working software, while DevOps connects that delivery work to the reliability, availability, performance, and operational learning required in production. Together they help teams reduce waste, continuously improve, and deliver value with shared accountability.",
      publishedAt: "October 30, 2021",
      readTime: "3 min read",
      href: "https://www.linkedin.com/pulse/dev-ops-bhargava-teja/",
      isExternal: true,
      isReal: true,
      accent: "#f6c343",
      ogImage: "/articles/devops-cover.png",
      tags: ["DevOps", "Agile", "Site Reliability"],
      premise: "DevOps is a cultural and operational practice that brings development and operations together around faster, more reliable delivery.",
      takeaway: "The strongest delivery teams share responsibility for both building the software and keeping it reliable once it is running.",
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
