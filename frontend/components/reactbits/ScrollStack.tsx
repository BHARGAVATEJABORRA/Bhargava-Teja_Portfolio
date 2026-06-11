"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { getActiveLenis } from "@/lib/smooth-scroll-instance";
import "./ScrollStack.css";

export const ScrollStackItem = ({
  children,
  itemClassName = "",
}: {
  children: ReactNode;
  itemClassName?: string;
}) => <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>;

const ScrollStack = ({
  children,
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  onStackComplete,
}: {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  rotationAmount?: number;
  blurAmount?: number;
  onStackComplete?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);

  // Natural document-top positions measured with transforms reset.
  // getBoundingClientRect reflects applied transforms, so we must snapshot
  // positions before applying any transforms and reuse them on every scroll tick.
  const naturalTopsRef = useRef<number[]>([]);
  const endTopRef = useRef<number>(0);

  const lastTransformsRef = useRef(
    new Map<number, { translateY: number; scale: number; rotation: number; blur: number }>(),
  );
  const isUpdatingRef = useRef(false);
  const stackCompletedRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const parsePercentage = useCallback((value: string, h: number) => {
    return value.includes("%") ? (parseFloat(value) / 100) * h : parseFloat(value);
  }, []);

  const calculateProgress = useCallback((v: number, start: number, end: number) => {
    if (v <= start) return 0;
    if (v >= end) return 1;
    return (v - start) / (end - start);
  }, []);

  // Reset transforms → force reflow → snapshot positions into refs.
  const measureNaturalPositions = useCallback(() => {
    const cards = cardsRef.current;
    const container = containerRef.current;
    if (!cards.length || !container) return;

    // Clear all applied transforms so getBoundingClientRect reads natural flow positions.
    cards.forEach((card) => {
      card.style.transform = "none";
      card.style.filter = "";
    });
    lastTransformsRef.current.clear();

    // Force the browser to commit the style changes before we measure.
    void container.offsetHeight;

    const scrollY = window.scrollY;
    naturalTopsRef.current = cards.map((c) => c.getBoundingClientRect().top + scrollY);

    const endEl = container.querySelector<HTMLElement>(".scroll-stack-end");
    endTopRef.current = endEl ? endEl.getBoundingClientRect().top + scrollY : 0;
  }, []);

  const updateCardTransforms = useCallback(() => {
    const cards = cardsRef.current;
    if (prefersReducedMotionRef.current) return;
    if (!cards.length || isUpdatingRef.current || !naturalTopsRef.current.length) return;
    isUpdatingRef.current = true;

    const scrollTop = window.scrollY;
    const vh = window.innerHeight;
    const stackPx = parsePercentage(stackPosition, vh);
    const scaleEndPx = parsePercentage(scaleEndPosition, vh);
    const endTop = endTopRef.current;
    const pinEnd = endTop - vh / 2;

    cards.forEach((card, i) => {
      const cardTop = naturalTopsRef.current[i];
      const pinStart = cardTop - stackPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPx;

      const scaleProgress = calculateProgress(scrollTop, pinStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topIdx = 0;
        for (let j = 0; j < cards.length; j++) {
          if (scrollTop >= naturalTopsRef.current[j] - stackPx - itemStackDistance * j) topIdx = j;
        }
        if (i < topIdx) blur = Math.max(0, (topIdx - i) * blurAmount);
      }

      let translateY = 0;
      if (scrollTop >= pinStart && scrollTop <= pinEnd) {
        translateY = scrollTop - cardTop + stackPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPx + itemStackDistance * i;
      }

      const t = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      };

      const last = lastTransformsRef.current.get(i);
      if (
        !last ||
        Math.abs(last.translateY - t.translateY) > 0.1 ||
        Math.abs(last.scale - t.scale) > 0.001 ||
        Math.abs(last.rotation - t.rotation) > 0.1 ||
        Math.abs(last.blur - t.blur) > 0.1
      ) {
        card.style.transform = `translate3d(0, ${t.translateY}px, 0) scale(${t.scale}) rotate(${t.rotation}deg)`;
        card.style.filter = t.blur > 0 ? `blur(${t.blur}px)` : "";
        lastTransformsRef.current.set(i, t);
      }

      if (i === cards.length - 1) {
        const inView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (inView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!inView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    calculateProgress,
    parsePercentage,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll<HTMLElement>(":scope > .scroll-stack-card"));
    cardsRef.current = cards;
    const cache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`;
      card.style.willChange = "transform, filter";
      card.style.transformOrigin = "top center";
    });

    const remeasureAndUpdate = () => {
      measureNaturalPositions();
      updateCardTransforms();
    };

    // Reduced motion: cards stay a plain in-flow list — no pinning, no scale,
    // no blur. measureNaturalPositions already resets transforms to "none".
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = media.matches;
    const onMediaChange = () => {
      prefersReducedMotionRef.current = media.matches;
      remeasureAndUpdate();
    };
    media.addEventListener("change", onMediaChange);

    window.addEventListener("scroll", updateCardTransforms, { passive: true });
    window.addEventListener("resize", remeasureAndUpdate);
    getActiveLenis()?.on("scroll", updateCardTransforms);

    // Remeasure as fonts / images settle; each call resets transforms then re-snapshots.
    const timeouts = [50, 250, 700, 1400].map((d) => window.setTimeout(remeasureAndUpdate, d));

    remeasureAndUpdate();

    return () => {
      media.removeEventListener("change", onMediaChange);
      window.removeEventListener("scroll", updateCardTransforms);
      window.removeEventListener("resize", remeasureAndUpdate);
      getActiveLenis()?.off("scroll", updateCardTransforms);
      timeouts.forEach(clearTimeout);
      stackCompletedRef.current = false;
      cardsRef.current = [];
      naturalTopsRef.current = [];
      endTopRef.current = 0;
      cache.clear();
      isUpdatingRef.current = false;
    };
  }, [itemDistance, measureNaturalPositions, updateCardTransforms]);

  return (
    <div className={`scroll-stack-container ${className}`.trim()} ref={containerRef}>
      {children}
      <div className="scroll-stack-end" />
    </div>
  );
};

export default ScrollStack;
