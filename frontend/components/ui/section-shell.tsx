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
    <section id={id} aria-labelledby={labelledBy} className={`py-16 sm:py-20 ${className}`}>
      <Container>{animateOnView ? <SectionReveal>{children}</SectionReveal> : children}</Container>
    </section>
  );
}
