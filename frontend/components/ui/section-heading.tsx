interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title?: string;
  description?: string;
}

export function SectionHeading({ id, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <header className="max-w-3xl space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{eyebrow}</p>
      {title ? (
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="text-base leading-relaxed text-[var(--color-muted-ink)] sm:text-lg">{description}</p>
      ) : null}
    </header>
  );
}
