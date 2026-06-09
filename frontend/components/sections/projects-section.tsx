"use client";

import { useEffect, useRef, useState } from "react";

import { getActiveLenis } from "@/lib/smooth-scroll-instance";

import { Container } from "@/components/ui/container";
import { BorderGlowCard } from "@/components/ui/border-glow-card";
import { SectionHeading } from "@/components/ui/section-heading";

interface GithubProject {
  id: number;
  title: string;
  category: string;
  description: string;
  stack: string[];
  accent: string;
  /** Live demo if the repo has one, otherwise the GitHub repo link. */
  href: string;
}

// Pulled from github.com/BHARGAVATEJABORRA — each card links to its repo (or
// live demo where one exists).
const githubProjects: GithubProject[] = [
  {
    id: 1,
    title: "Amazon Lex Chatbot",
    category: "AI / Cloud",
    description: "Production-ready Amazon Lex V2 chatbot with Lambda fulfillment, DynamoDB session storage, multi-channel delivery (web/Slack/Connect), and IaC.",
    stack: ["Amazon Lex", "Lambda", "DynamoDB", "Terraform"],
    accent: "#22d3c2",
    href: "https://github.com/BHARGAVATEJABORRA/Chat-Bot-Using-Amazon-LEX",
  },
  {
    id: 2,
    title: "Rekognition Vision Pipeline",
    category: "Cloud / ML",
    description: "Serverless blueprint for Amazon Rekognition — image and video analysis with S3/Lambda triggers, Step Functions for async jobs, and DynamoDB/OpenSearch indexing.",
    stack: ["Rekognition", "Lambda", "Step Functions", "OpenSearch"],
    accent: "#6aa6ff",
    href: "https://github.com/BHARGAVATEJABORRA/Integrating-Amazon-Recognition-in-AWS-Cloud",
  },
  {
    id: 3,
    title: "Deep Learning Vision Suite",
    category: "AI / ML",
    description: "Image classification, object detection, segmentation, and style transfer built with CNNs, YOLOv8, and SegFormer.",
    stack: ["PyTorch", "YOLOv8", "SegFormer", "CNN"],
    accent: "#c084fc",
    href: "https://github.com/BHARGAVATEJABORRA/deep-learning-final-project-SP24",
  },
  {
    id: 4,
    title: "Creature Login UI",
    category: "Frontend",
    description: "Interactive login page with animated creatures that watch you type — eyes follow the cursor, creatures lean toward inputs, and expressions react to password strength.",
    stack: ["React", "TypeScript", "GSAP"],
    accent: "#f59e0b",
    href: "https://github.com/BHARGAVATEJABORRA/creature-login-ui",
  },
  {
    id: 5,
    title: "Transaction Ingest Service",
    category: "Backend",
    description: "A .NET 10 transaction ingestion exercise — typed pipelines for parsing, validating, and persisting financial transaction streams.",
    stack: [".NET 10", "C#"],
    accent: "#34d399",
    href: "https://github.com/BHARGAVATEJABORRA/TransactionIngestExercise",
  },
];

function ProjectCard({ project }: { project: GithubProject }) {
  // Blueprint look: a deep technical-drawing blue panel with a faint grid,
  // corner registration ticks, and mono labels. The card's own accent tints
  // the grid, the corners, the spec line, and the cursor-tracking glow so each
  // sheet reads as its own schematic rather than five identical blueprints.
  return (
    <BorderGlowCard
      glowColor={project.accent}
      className="h-[460px] w-[min(82vw,380px)] shrink-0"
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border p-7"
        style={{
          background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #071422 100%)",
          borderColor: `${project.accent}40`,
        }}
      >
        {/* Faint engineering grid, tinted to the card accent. */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage: `linear-gradient(${project.accent}14 1px, transparent 1px), linear-gradient(90deg, ${project.accent}14 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Corner registration ticks. */}
        <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t" style={{ borderColor: `${project.accent}66` }} aria-hidden />
        <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t" style={{ borderColor: `${project.accent}66` }} aria-hidden />
        <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: `${project.accent}66` }} aria-hidden />
        <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: `${project.accent}66` }} aria-hidden />

        <div className="relative flex h-full flex-col">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: `${project.accent}99` }}
          >
            PRJ-{String(project.id).padStart(3, "0")} / {project.category}
          </p>

          <h3 className="mt-6 font-mono text-xl font-bold leading-tight text-white">{project.title}</h3>

          <div className="mt-4 space-y-1">
            <p
              className="font-mono text-[9px] uppercase tracking-[0.2em]"
              style={{ color: `${project.accent}80` }}
            >
              ↳ OVERVIEW
            </p>
            <p className="text-sm leading-relaxed text-white/65">{project.description}</p>
          </div>

          <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="rounded border px-2 py-0.5 font-mono text-[10px]"
                style={{
                  borderColor: `${project.accent}33`,
                  backgroundColor: `${project.accent}10`,
                  color: `${project.accent}cc`,
                }}
              >
                {tech}
              </span>
            ))}
          </div>

          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 self-start rounded-full border px-4 py-2 font-mono text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: `${project.accent}66` }}
          >
            View Project →
          </a>
        </div>
      </div>
    </BorderGlowCard>
  );
}

export function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const activeProjectIndexRef = useRef(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const activeProject = githubProjects[activeProjectIndex] ?? githubProjects[0];

  // Drive the horizontal translate from scroll progress manually. We read the
  // track's geometry on every scroll tick (works with native scroll and Lenis)
  // and write the transform straight to the element — no animation library
  // between the scroll position and the pixels.
  useEffect(() => {
    const clamp = (value: number) => Math.min(1, Math.max(0, value));

    const measureTravel = () => {
      const gallery = galleryRef.current;
      if (!gallery || gallery.children.length < 2) return 0;
      const cards = gallery.children;
      const firstRect = cards[0].getBoundingClientRect();
      const lastRect = cards[cards.length - 1].getBoundingClientRect();
      // Center-to-center distance so the last card finishes centered exactly
      // where the first one started. Add back any transform already applied.
      const currentX = currentTranslate;
      const firstCenter = firstRect.left + firstRect.width / 2 - currentX;
      const lastCenter = lastRect.left + lastRect.width / 2 - currentX;
      return Math.max(0, lastCenter - firstCenter);
    };

    let travel = 0;
    let currentTranslate = 0;

    const update = () => {
      const track = containerRef.current;
      const gallery = galleryRef.current;
      if (!track || !gallery) return;
      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance > 0 ? clamp(-rect.top / distance) : 0;
      currentTranslate = -progress * travel;
      gallery.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;

      const nextIndex = Math.round(progress * (githubProjects.length - 1));

      if (activeProjectIndexRef.current !== nextIndex) {
        activeProjectIndexRef.current = nextIndex;
        setActiveProjectIndex(nextIndex);
      }
    };

    const remeasure = () => {
      travel = measureTravel();
      update();
    };

    remeasure();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", remeasure);

    const lenis = getActiveLenis();
    lenis?.on("scroll", update);

    // Fonts/layout can settle after mount; re-measure a few times.
    const timeouts = [200, 600, 1200].map((delay) => window.setTimeout(remeasure, delay));

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", remeasure);
      lenis?.off("scroll", update);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  // Stable, SSR-safe scroll-track height. One extra "screen" of scroll per card.
  const trackHeightVh = 100 + (githubProjects.length - 1) * 55;

  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-28">
      <Container className="w-full pt-20 sm:pt-24">
        <SectionHeading
          id="projects-title"
          eyebrow="Projects"
          title="Selected work, scrolled sideways"
          description="A few builds straight from my GitHub — scroll to track through the gallery, then open any card to view the repo."
        />
      </Container>

      {/* Tall scroll track; the gallery sticks and translates horizontally as you scroll. */}
      <div
        ref={containerRef}
        className="projects-scroll-track relative"
        style={{ height: `${trackHeightVh}vh` }}
      >
        <div className="projects-sticky sticky top-0 flex h-svh items-center overflow-hidden">
          <div className="projects-scroll-title pointer-events-none absolute left-4 right-4 top-[8rem] z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 sm:left-6 sm:right-6 md:top-[calc(4.5rem+env(safe-area-inset-top))] lg:top-24">
            <div className="min-w-0">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">Projects</p>
              <h3 className="truncate text-xl font-bold leading-tight text-[var(--color-ink)] sm:text-2xl">{activeProject.title}</h3>
            </div>
            <p
              className="hidden shrink-0 rounded-full border px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] sm:block"
              style={{
                borderColor: `${activeProject.accent}55`,
                backgroundColor: `${activeProject.accent}12`,
                color: activeProject.accent,
              }}
            >
              {activeProject.category}
            </p>
          </div>

          <div
            ref={galleryRef}
            className="projects-gallery flex gap-6 pl-[max(1.5rem,calc(50vw-190px))] pr-[50vw] will-change-transform"
          >
            {githubProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
