"use client";

import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

/**
 * Returns the reader to the Articles section. When the visitor arrived here
 * from the home page (client-side navigation), history.back() restores the
 * exact previous scroll position — no reload, no jump to the top. Direct
 * visits (deep link / new tab) fall back to navigating to /#blogs.
 */
export function BackToArticles() {
  const router = useRouter();

  const handleBack = () => {
    const cameFromThisSite =
      typeof document !== "undefined" &&
      document.referrer.startsWith(window.location.origin) &&
      window.history.length > 1;

    if (cameFromThisSite) {
      router.back();
    } else {
      router.push("/#blogs");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white"
    >
      <LuArrowLeft size={15} aria-hidden /> Back to Articles
    </button>
  );
}
