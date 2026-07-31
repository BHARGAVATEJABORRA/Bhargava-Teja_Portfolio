import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** Override the default width cap. Passed as a class (not merged with the
   *  default) so callers never end up with two competing max-w-* utilities. */
  maxWidthClassName?: string;
}

export function Container({ children, className = "", maxWidthClassName = "max-w-6xl" }: ContainerProps) {
  return <div className={`mx-auto w-full ${maxWidthClassName} px-5 sm:px-8 ${className}`}>{children}</div>;
}
