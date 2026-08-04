"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import { LuArrowRight, LuThumbsUp } from "react-icons/lu";

import { Container } from "@/components/ui/container";
import type { ProjectSummary } from "@/content/portfolio-content";
import { likeKey, useLikes } from "@/lib/use-likes";

interface DisplayProject {
  id: number;
  title: string;
  category: string;
  timeframe: string;
  description: string;
  href: string;
  likeId: string;
  imageUrl?: string;
  imageAlt?: string;
}

const CARD_TINTS = ["139, 69, 90", "54, 79, 107", "97, 89, 38"];
const DESKTOP_STACK_BASE = 161;
const MOBILE_STACK_BASE = 131;

function toDisplayProjects(projects: ProjectSummary[]): DisplayProject[] {
  return projects.map((project, index) => ({
    id: index + 1,
    title: project.title,
    category: project.category,
    timeframe: project.timeframe,
    description: `${project.problem} ${project.approach}`,
    href: project.linkState === "configured" ? project.liveUrl ?? project.repoUrl ?? project.href : project.href,
    likeId: likeKey(project.title),
    imageUrl: project.imageUrl,
    imageAlt: project.imageAlt,
  }));
}

function ProjectCard({
  project,
  index,
  cardRef,
  liked,
  likeCount,
  onToggleLike,
}: {
  project: DisplayProject;
  index: number;
  cardRef: (element: HTMLDivElement | null) => void;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
}) {
  const style = {
    "--project-tint": CARD_TINTS[index % CARD_TINTS.length],
    "--project-scale": 1 - index * 0.00625,
    zIndex: 10 + index,
  } as CSSProperties;

  return (
    <div ref={cardRef} className="project-card-flat" data-card-index={index} style={style}>
      <button
        type="button"
        onClick={onToggleLike}
        aria-pressed={liked}
        aria-label={liked ? "Unlike project" : "Like project"}
        className="project-card-like"
        data-liked={liked}
      >
        <LuThumbsUp size={20} aria-hidden />
      </button>

      <div className="project-card-info">
        <p className="project-card-kicker">
          <span>{project.category}</span>
          <span aria-hidden>|</span>
          <span>{project.timeframe}</span>
        </p>

        <h3 className="project-card-title">{project.title}</h3>
        <span className="project-card-rule" aria-hidden />
        <p className="project-card-body">{project.description}</p>

        <a href={project.href} target="_blank" rel="noopener noreferrer" className="project-card-learn">
          Learn More <LuArrowRight size={20} aria-hidden />
        </a>
      </div>

      <div className="project-card-image" aria-hidden={project.imageUrl ? undefined : true}>
        {project.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, no loader config
          <img
            src={project.imageUrl}
            alt={project.imageAlt ?? `${project.title} preview`}
            loading="lazy"
            className="article-image-photo"
          />
        ) : (
          <div className="project-card-image-fallback">
            <span>{project.title}</span>
          </div>
        )}
      </div>

      <span className="project-card-likes">Likes: {likeCount}</span>
    </div>
  );
}

export function ProjectsSection({ projects }: { projects: ProjectSummary[] }) {
  const likes = useLikes("project");
  const displayProjects = useMemo(() => toDisplayProjects(projects), [projects]);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const cards = cardRefs.current.filter((card): card is HTMLDivElement => Boolean(card));
    if (!cards.length) return;

    let frame = 0;
    const layoutCards = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const mobile = window.innerWidth <= 768;
        const base = mobile ? MOBILE_STACK_BASE : DESKTOP_STACK_BASE;
        const reserve = mobile ? 556 : 484;
        const minimumStep = mobile ? 36 : 44;
        const step = cards.length > 1
          ? Math.floor(Math.max(minimumStep, (window.innerHeight - reserve) / (cards.length - 1)))
          : 0;

        cards.forEach((card, index) => {
          card.style.top = `${base + index * step}px`;
        });
      });
    };

    const resizeObserver = new ResizeObserver(layoutCards);
    cards.forEach((card) => resizeObserver.observe(card));
    window.addEventListener("resize", layoutCards);
    layoutCards();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", layoutCards);
    };
  }, [displayProjects.length]);

  return (
    <section id="projects" aria-labelledby="projects-title" className="projects-reference-section">
      <Container className="w-full !px-0" maxWidthClassName="max-w-none">
        <h2 id="projects-title" className="project-section-title">
          My Projects
        </h2>

        <div className="project-reference-container">
          {displayProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              cardRef={(element) => {
                cardRefs.current[index] = element;
              }}
              liked={likes.isLiked(project.likeId)}
              likeCount={likes.count(project.likeId)}
              onToggleLike={() => likes.toggle(project.likeId)}
            />
          ))}
          <div className="project-reference-end" aria-hidden />
        </div>
      </Container>
    </section>
  );
}
