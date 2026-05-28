"use client";

import { useRef } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { type ProjectSummary, portfolioContent } from "@/content/portfolio-content";

function BlueprintProjectCard({ project, index }: { project: ProjectSummary; index: number }) {
  const isConfigured = project.linkState === "configured";
  const destination = project.liveUrl ?? project.repoUrl ?? project.href ?? "#";
  const techStack = project.techStack.length > 0 ? project.techStack : project.stack;

  return (
    <article
      className="relative w-[min(80vw,320px)] shrink-0 snap-center overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #071422 100%)",
        border: "1px solid rgba(100,160,255,0.25)",
      }}
    >
      <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[rgba(100,160,255,0.4)]" aria-hidden />
      <div className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[rgba(100,160,255,0.4)]" aria-hidden />
      <div className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[rgba(100,160,255,0.4)]" aria-hidden />
      <div className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[rgba(100,160,255,0.4)]" aria-hidden />

      <div className="relative space-y-4 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[rgba(100,160,255,0.6)]">
          PRJ-{String(index + 1).padStart(3, "0")} / {project.category}
        </p>

        <h3 className="font-mono text-base font-bold leading-tight text-white">{project.title}</h3>

        <div className="space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[rgba(100,160,255,0.5)]">↳ PROBLEM</p>
          <p className="text-xs leading-relaxed text-[rgba(255,255,255,0.7)]">{project.problem}</p>
        </div>

        {project.approach ? (
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[rgba(100,160,255,0.5)]">↳ APPROACH</p>
            <p className="text-xs leading-relaxed text-[rgba(255,255,255,0.7)]">{project.approach}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded border border-[rgba(100,160,255,0.25)] bg-[rgba(100,160,255,0.06)] px-2 py-0.5 font-mono text-[9px] text-[rgba(100,160,255,0.8)]"
            >
              {tech}
            </span>
          ))}
        </div>

        {project.metrics && project.metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 border-t border-[rgba(100,160,255,0.15)] pt-2">
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <p className="font-mono text-sm font-bold text-white">{metric.value}</p>
                <p className="font-mono text-[9px] text-[rgba(100,160,255,0.5)]">{metric.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="pt-2">
          {isConfigured ? (
            <a
              href={destination}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[rgba(100,160,255,0.4)] px-3 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-[rgba(100,160,255,0.1)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              View Project →
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[rgba(100,160,255,0.2)] px-3 py-2 font-mono text-xs text-[rgba(100,160,255,0.5)]">
              Available on request
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const isDragging = useRef(false);

  const handleDragStart = (event: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    dragStartX.current = event.pageX - scrollRef.current.offsetLeft;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleDragMove = (event: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    event.preventDefault();
    const x = event.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleDragEnd = () => {
    isDragging.current = false;
  };

  return (
    <SectionShell id="projects" labelledBy="projects-title" className="overflow-hidden">
      <div className="space-y-8">
        <SectionHeading
          id="projects-title"
          eyebrow="Projects"
          title="Full-width proof of work"
          description="Each project now sits inside a dedicated viewport-height section while the page background stays continuous from one chapter to the next."
        />

        <div
          ref={scrollRef}
          className="no-scrollbar flex cursor-grab gap-6 overflow-x-auto pb-6 active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {portfolioContent.projects.map((project, index) => (
            <BlueprintProjectCard key={project.title} project={project} index={index} />
          ))}
          <div className="w-4 shrink-0" />
        </div>
      </div>
    </SectionShell>
  );
}
