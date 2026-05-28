import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { SectionReveal } from "@/components/motion/section-reveal";

interface SectionShellProps {
  id: string;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  animateOnView?: boolean;
}

export function SectionShell({ id, labelledBy, children, className = "", animateOnView = true }: SectionShellProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`scroll-mt-28 flex min-h-svh items-center py-20 sm:py-24 ${className}`}>
      <Container className="w-full">{animateOnView ? <SectionReveal>{children}</SectionReveal> : children}</Container>
    </section>
  );
}
