"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  eventName: AnalyticsEventName;
  eventProperties?: Record<string, string | number | boolean>;
}

export function TrackedLink({
  children,
  eventName,
  eventProperties,
  href,
  onClick,
  ...rest
}: TrackedLinkProps) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        trackEvent(eventName, {
          target: href ?? "",
          ...eventProperties,
        });

        if (onClick) {
          onClick(event);
        }
      }}
    >
      {children}
    </a>
  );
}
