"use client";

import type { CSSProperties, Ref } from "react";
import { useEffect, useRef, useState } from "react";
import { LuArrowRight, LuThumbsUp } from "react-icons/lu";

import { Container } from "@/components/ui/container";
import { portfolioContent } from "@/content/portfolio-content";

interface GithubProject {
  id: number;
  title: string;
  category: string;
  timeframe: string;
  description: string;
  tagline?: string;
  stack: string[];
  accent: string;
  href: string;
  likes: number;
  imageUrl?: string;
  imageAlt?: string;
}

// Card accents cycle through the section's established palette so DB-managed
// projects keep the same visual rhythm as the original hand-tuned cards.
const CARD_ACCENTS = ["#38bdf8", "#6aa6ff", "#c084fc", "#f59e0b", "#34d399"];

/** Deterministic pseudo like-count so cards stay stable across renders/builds. */
function seedLikes(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash * 31 + title.charCodeAt(i)) % 997;
  return 12 + (hash % 39);
}

// Data source: portfolioContent.projects — static defaults overridden by the
// admin CMS overlay (content/portfolio-overrides.json). See lib/content-store.ts.
const githubProjects: GithubProject[] = portfolioContent.projects.map((project, index) => ({
  id: index + 1,
  title: project.title,
  category: project.category,
  timeframe: project.timeframe,
  description: `${project.problem} ${project.approach}`,
  tagline: project.outcome,
  stack: project.stack,
  accent: CARD_ACCENTS[index % CARD_ACCENTS.length],
  href: project.linkState === "configured" ? project.liveUrl ?? project.repoUrl ?? project.href : project.href,
  likes: seedLikes(project.title),
  imageUrl: project.imageUrl,
  imageAlt: project.imageAlt,
}));

// Sticky stack tuning — mirrors kartavya-singh.com:
// each card pins at (BASE + i*STEP) so previous cards peek above the next.
// BASE is bumped to sit below the sticky section header (kicker + h2) that
// stays pinned for the whole section.
const STACK_BASE_PX = 220;
const STACK_STEP_PX = 75;
const SCALE_STEP = 0.00625;

function ProjectCard({
  project,
  index,
  slotRef,
}: {
  project: GithubProject;
  index: number;
  slotRef?: Ref<HTMLDivElement>;
}) {
  const accent = project.accent;
  const [liked, setLiked] = useState(false);
  const likeCount = project.likes + (liked ? 1 : 0);

  const stickyStyle: CSSProperties = {
    position: "sticky",
    top: `${STACK_BASE_PX + index * STACK_STEP_PX}px`,
    transform: `scale(${1 - index * SCALE_STEP})`,
    transformOrigin: "top center",
    ["--article-accent" as string]: accent,
    zIndex: 10 + index,
  };

  return (
    <div ref={slotRef} className="project-sticky-slot" style={stickyStyle}>
      <article className="article-card project-card-flat group" style={{ ["--article-accent" as string]: accent }}>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={liked ? "Unlike project" : "Like project"}
          className="article-like"
          data-liked={liked}
        >
          <LuThumbsUp size={18} aria-hidden />
        </button>

        <div className="article-info">
          <p className="article-kicker">
            <span>{project.category}</span>
            <span className="article-kicker-sep" aria-hidden>
              |
            </span>
            <span>{project.timeframe}</span>
          </p>

          <h3 className="article-title">{project.title}</h3>

          <span className="article-rule" aria-hidden />

          {project.tagline ? <p className="article-tagline">&quot;{project.tagline}&quot;</p> : null}

          <p className="article-body">{project.description}</p>

          <div className="article-meta">
            <span>Stack</span>
            {project.stack.slice(0, 4).map((tech) => (
              <span key={tech} className="article-tag">
                {tech}
              </span>
            ))}
          </div>

          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="article-learn"
          >
            Learn More <LuArrowRight size={16} aria-hidden />
          </a>
        </div>

        <div className="article-image" aria-hidden={project.imageUrl ? undefined : true}>
          {project.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, no loader config
            <img
              src={project.imageUrl}
              alt={project.imageAlt ?? `${project.title} preview`}
              loading="lazy"
              className="article-image-photo"
            />
          ) : (
            <div className="article-image-glow" />
          )}
          <span className="article-image-label">{project.category}</span>
          <span className="article-image-likes">Likes: {likeCount}</span>
        </div>
      </article>
    </div>
  );
}

export function ProjectsSection() {
  const lastCardRef = useRef<HTMLDivElement>(null);
  const [titleFading, setTitleFading] = useState(false);

  // Fade the sticky "My Projects" title once the last card starts dominating
  // the top of the viewport. Pure-CSS sticky can't handle this cleanly
  // because the title's containing block extends past the last card's pin
  // release point, so it lingers over the released card (see screenshot).
  useEffect(() => {
    const el = lastCardRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      // Title pin is around y=88; hide it once the last card's top has moved
      // above ~y=200 (i.e. it's occupying the title's area).
      setTitleFading(rect.top < 200);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const lastIndex = githubProjects.length - 1;

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative scroll-mt-28 pb-32 pt-20 sm:pt-24"
    >
      <Container className="w-full">
        <div className="project-stack">
          {/* Sticky title lives INSIDE the stack so its containing block is
              the same as the cards. It fades out when the last card is
              taking over the viewport (see effect above). */}
          <div
            className={`projects-header-sticky${titleFading ? " projects-header-sticky--fade" : ""}`}
          >
            <h2
              id="projects-title"
              className="text-center text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl"
            >
              My Projects
            </h2>
          </div>
          {githubProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              slotRef={index === lastIndex ? lastCardRef : undefined}
            />
          ))}
          {/* Trailing spacer: small buffer so the last card + title don't
              snap loose exactly at the seam. Kept short so title fades out
              with the last card instead of hanging on after. */}
          <div aria-hidden className="project-stack-end" />
        </div>
      </Container>
    </section>
  );
}
