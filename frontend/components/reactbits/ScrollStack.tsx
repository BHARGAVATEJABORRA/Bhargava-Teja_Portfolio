"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

import {
  requestScrollRuntimeUpdate,
  subscribeToScrollRead,
  subscribeToScrollWrite,
  type ScrollSnapshot,
} from "@/lib/scroll-runtime";
import "./ScrollStack.css";

type CardTransform = {
  translateY: number;
  scale: number;
  rotation: number;
  blur: number;
};

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

  const lastTransformsRef = useRef(new Map<number, CardTransform>());
  const pendingTransformsRef = useRef<CardTransform[]>([]);
  const pendingStackInViewRef = useRef(false);
  const needsMeasurementRef = useRef(true);
  const needsTransformResetRef = useRef(false);
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

  // offsetTop is layout geometry, so it is not affected by the transforms
  // applied during the preceding write phase. This lets us remeasure without
  // clearing styles or forcing a synchronous reflow.
  const measureNaturalPositions = useCallback(() => {
    const cards = cardsRef.current;
    const container = containerRef.current;
    if (!cards.length || !container) return;

    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const scrollY = window.scrollY;
    naturalTopsRef.current = cards.map((card) => containerTop + card.offsetTop);

    const endEl = container.querySelector<HTMLElement>(".scroll-stack-end");
    endTopRef.current = endEl ? containerTop + endEl.offsetTop : scrollY;
  }, []);

  const calculateCardTransforms = useCallback((snapshot: ScrollSnapshot) => {
    const cards = cardsRef.current;
    if (prefersReducedMotionRef.current || !cards.length || !naturalTopsRef.current.length) {
      pendingTransformsRef.current = [];
      pendingStackInViewRef.current = false;
      return;
    }

    const scrollTop = snapshot.y;
    const vh = snapshot.height;
    const stackPx = parsePercentage(stackPosition, vh);
    const scaleEndPx = parsePercentage(scaleEndPosition, vh);
    const endTop = endTopRef.current;
    const pinEnd = endTop - vh / 2;
    let finalCardInView = false;

    pendingTransformsRef.current = cards.map((_, i) => {
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

      const transform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      };

      if (i === cards.length - 1) {
        finalCardInView = scrollTop >= pinStart && scrollTop <= pinEnd;
      }

      return transform;
    });
    pendingStackInViewRef.current = finalCardInView;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    calculateProgress,
    parsePercentage,
  ]);

  const applyCardTransforms = useCallback(() => {
    const cards = cardsRef.current;

    pendingTransformsRef.current.forEach((transform, i) => {
      const card = cards[i];
      if (!card) return;
      const last = lastTransformsRef.current.get(i);
      if (
        !last ||
        Math.abs(last.translateY - transform.translateY) > 0.1 ||
        Math.abs(last.scale - transform.scale) > 0.001 ||
        Math.abs(last.rotation - transform.rotation) > 0.1 ||
        Math.abs(last.blur - transform.blur) > 0.1
      ) {
        card.style.transform = `translate3d(0, ${transform.translateY}px, 0) scale(${transform.scale}) rotate(${transform.rotation}deg)`;
        card.style.filter = transform.blur > 0 ? `blur(${transform.blur}px)` : "";
        lastTransformsRef.current.set(i, transform);
      }
    });

    const inView = pendingStackInViewRef.current;
    if (inView && !stackCompletedRef.current) {
      stackCompletedRef.current = true;
      onStackComplete?.();
    } else if (!inView && stackCompletedRef.current) {
      stackCompletedRef.current = false;
    }
  }, [onStackComplete]);

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

    const requestRemeasure = () => {
      needsMeasurementRef.current = true;
      requestScrollRuntimeUpdate();
    };

    // Reduced motion: cards stay a plain in-flow list — no pinning, no scale,
    // no blur. The next write phase resets transforms to "none".
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = media.matches;
    const onMediaChange = () => {
      prefersReducedMotionRef.current = media.matches;
      needsTransformResetRef.current = true;
      requestRemeasure();
    };
    media.addEventListener("change", onMediaChange);

    let width = window.innerWidth;
    let height = window.innerHeight;
    const unsubscribeRead = subscribeToScrollRead((snapshot) => {
      if (snapshot.width !== width || snapshot.height !== height) {
        width = snapshot.width;
        height = snapshot.height;
        needsMeasurementRef.current = true;
      }

      if (needsMeasurementRef.current) {
        measureNaturalPositions();
        needsMeasurementRef.current = false;
      }

      calculateCardTransforms(snapshot);
    });
    const unsubscribeWrite = subscribeToScrollWrite(() => {
      if (needsTransformResetRef.current) {
        cards.forEach((card) => {
          card.style.transform = "none";
          card.style.filter = "";
        });
        lastTransformsRef.current.clear();
        pendingTransformsRef.current = [];
        pendingStackInViewRef.current = false;
        needsTransformResetRef.current = false;
      }

      applyCardTransforms();
    });

    // Remeasure as fonts / images settle; offsetTop remains transform-free.
    const timeouts = [50, 250, 700, 1400].map((d) => window.setTimeout(requestRemeasure, d));

    requestRemeasure();

    return () => {
      media.removeEventListener("change", onMediaChange);
      unsubscribeRead();
      unsubscribeWrite();
      timeouts.forEach(clearTimeout);
      cards.forEach((card) => {
        card.style.removeProperty("margin-bottom");
        card.style.removeProperty("will-change");
        card.style.removeProperty("transform-origin");
        card.style.removeProperty("transform");
        card.style.removeProperty("filter");
      });
      stackCompletedRef.current = false;
      cardsRef.current = [];
      naturalTopsRef.current = [];
      endTopRef.current = 0;
      pendingTransformsRef.current = [];
      pendingStackInViewRef.current = false;
      needsMeasurementRef.current = true;
      needsTransformResetRef.current = false;
      cache.clear();
    };
  }, [applyCardTransforms, calculateCardTransforms, itemDistance, measureNaturalPositions]);

  return (
    <div className={`scroll-stack-container ${className}`.trim()} ref={containerRef}>
      {children}
      <div className="scroll-stack-end" />
    </div>
  );
};

export default ScrollStack;
