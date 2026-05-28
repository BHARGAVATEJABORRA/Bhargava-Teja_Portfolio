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
  metrics?: ProjectMetric[];
}

export interface ExperienceItem {
  organization: string;
  title: string;
  period: string;
  highlights: string[];
  location?: string;
  href?: string;
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
}

export interface ControlCenterModule {
  title: string;
  detail: string;
  value: string;
}

export const portfolioContent = {
  identity: {
    name: "Bhargava Teja Borra",
    publicAlias: "Bhargava Teja Borra",
    legalName: "Bhargava Teja Borra",
    role: "Software Engineer",
    location: "Addison (Dallas), TX, USA",
    currentlyAt: "Capital One",
    avatarUrl: "",
    bio:
      "Architect and engineer scalable AWS infrastructure and microservice platforms with 3+ years of production delivery across enterprise systems.\n\nI focus on reliability, automation, and measurable outcomes, including reducing compute costs by 35% and improving API and deployment performance by 40%.",
    resumeHref: "/bhargava-teja-borra-resume.txt",
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
      weatherLocation: "Dallas",
      weatherTimezone: "America/Chicago",
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
      "I build cloud-first systems that balance reliability, velocity, and operating cost. My work spans AWS platform engineering, infrastructure as code, and developer workflows that help teams ship with confidence.",
      "I prefer practical engineering over abstraction-heavy complexity: clear ownership, measurable outcomes, and systems that are straightforward for the next engineer to operate and evolve.",
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
      timeframe: "Jan 2023 - Present",
      role: "Senior Software Engineer",
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
      timeframe: "Nov 2020 - Dec 2022",
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
        title: "Senior Software Engineer",
        period: "Jan 2023 - Present",
        location: "Addison, TX",
        highlights: [
          "Led migration of core services to AWS serverless microservices and API-driven architecture for better scale and reliability.",
          "Engineered multi-region AWS deployment patterns with Terraform and standardized environment provisioning.",
          "Implemented CI/CD with GitHub Actions, improving deployment speed and quality checks across release pipelines.",
          "Reduced compute costs by 35% through rightsizing, workload optimization, and automation controls.",
          "Improved API and delivery performance by 40% with observability-led refactors and pipeline improvements.",
        ],
      },
      {
        organization: "Accenture",
        title: "Software Engineer",
        period: "Nov 2020 - Dec 2022",
        location: "Hyderabad, India",
        highlights: [
          "Built ETL pipelines using Python and AWS Step Functions to orchestrate reliable data-processing workflows.",
          "Containerized backend services with Docker and Kubernetes to improve portability and runtime consistency.",
          "Applied Terraform-based IaC to reduce environment drift and accelerate provisioning across teams.",
          "Improved data-processing and platform efficiency by 40% through monitoring, tuning, and automation.",
          "Delivered modernization initiatives that lowered operational costs by 35% and reduced manual intervention.",
        ],
      },
    ],
    education: [
      {
        organization: "University of Missouri - Kansas City",
        title: "Master of Science in Computer Science",
        period: "2019 - 2021",
        location: "Kansas City, MO",
        highlights: ["GPA: 3.83 · Graduate coursework in distributed systems, cloud computing, and software engineering."],
      },
    ],
    certifications: [
      {
        organization: "Amazon Web Services",
        title: "AWS Solutions Architect - Associate",
        period: "Active",
        highlights: ["Validated cloud architecture and AWS solution design competencies."],
      },
      {
        organization: "Microsoft",
        title: "Azure Developer Associate (AZ-204)",
        period: "Active",
        highlights: ["Certification focused on Azure application development and deployment."],
      },
      {
        organization: "Microsoft",
        title: "Azure Fundamentals (AZ-900)",
        period: "Active",
        highlights: ["Foundational cloud concepts and Azure service knowledge."],
      },
      {
        organization: "Microsoft",
        title: "Azure AI Fundamentals (AI-900)",
        period: "Active",
        highlights: ["Foundational AI and machine learning services on Azure."],
      },
      {
        organization: "Oracle",
        title: "Oracle Cloud Infrastructure Foundations",
        period: "Active",
        highlights: ["Foundational credential for OCI platform concepts and services."],
      },
      {
        organization: "AWS + AICTE",
        title: "AWS Cloud Virtual Internship",
        period: "2020",
        highlights: ["Applied AWS implementation learning in an internship track."],
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
  articles: [
    {
      slug: "resilient-microservices-patterns",
      title: "Building Resilient Cloud Microservices: Practical Patterns from Production",
      excerpt:
        "Lessons from migrating Capital One services to AWS serverless - deployment safety, observability checkpoints, and cost-aware scaling patterns.",
      publishedAt: "2024-11",
      readTime: "8 min read",
      href: "#",
      isReal: false,
      tags: ["AWS", "Microservices", "Cloud"],
      premise:
        "Lessons from migrating Capital One services to AWS serverless - deployment safety, observability checkpoints, and cost-aware scaling patterns.",
      takeaway:
        "Use release gating, service-level telemetry, and cost-aware autoscaling policies together to keep cloud migration reliable and sustainable.",
    },
    {
      slug: "terraform-multi-region",
      title: "Terraform Multi-Region Deployments Without Drift",
      excerpt:
        "How we standardized environment parity across AWS and Azure using Terraform modules and GitHub Actions, reducing configuration drift to near zero.",
      publishedAt: "2024-09",
      readTime: "7 min read",
      href: "#",
      isReal: false,
      tags: ["Terraform", "IaC", "CI/CD"],
      premise:
        "How we standardized environment parity across AWS and Azure using Terraform modules and GitHub Actions, reducing configuration drift to near zero.",
      takeaway:
        "Modular IaC with opinionated validation and CI pipelines prevents region drift before it reaches production environments.",
    },
  ] as ArticleSummary[],
};

export type PortfolioContent = typeof portfolioContent;
