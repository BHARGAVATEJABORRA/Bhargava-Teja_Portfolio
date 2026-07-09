"use client";

// Footer meteor layer. Meteors are <img> streaks (a white streak on a black
// jpg; plus-lighter blend is additive, so only the streak shows) spawned by JS
// and moved each frame with inline transforms — no CSS keyframes.
//
// The numbers below drive the look:
//   velocity  (-2800/3.61, +4200/3.61) px/s ≈ (-776, +1163) — down-left
//   rotation  34deg (the streak image is vertical, head at the bottom)
//   fade      opacity = 1 - 1.4 * ageSeconds  → gone in ~0.71s
//   spawn x   bimodal: 10-45% or 65-100% of the viewport width
//   spawn y   0 (the img sits at -top-80 so the streak starts above the edge)
//   cadence   next spawn in 5-10s; first spawn 800ms after the layer shows
//             (3000ms if it was visible less than 5s ago)
//
// Movement runs on a plain rAF loop gated by tab visibility and does no work
// while no meteors are alive. Spawning is gated by an IntersectionObserver so
// meteors only appear while the footer is on screen; reduced-motion disables
// the layer entirely.

import { useEffect, useRef } from "react";

interface Meteor {
  element: HTMLImageElement;
  initialX: number;
  initialY: number;
  initialTime: number;
}

const VX = -2800 / 3.61;
const VY = 4200 / 3.61;

export function FooterMeteors() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const meteors: Meteor[] = [];
    let visible = false;
    let lastVisibleAt = 0;
    let spawnTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;
    let running = false;

    const step = () => {
      rafId = window.requestAnimationFrame(step);
      if (meteors.length === 0) {
        return;
      }
      const now = performance.now();
      for (let index = meteors.length - 1; index >= 0; index -= 1) {
        const meteor = meteors[index];
        const age = (now - meteor.initialTime) / 1000;
        const opacity = 1 - 1.4 * age;
        if (opacity <= 0) {
          meteor.element.remove();
          meteors.splice(index, 1);
          continue;
        }
        const x = meteor.initialX + VX * age;
        const y = meteor.initialY + VY * age;
        meteor.element.style.transform = `translate(${x}px, ${y}px) rotate(34deg)`;
        meteor.element.style.opacity = String(opacity);
      }
    };

    const startLoop = () => {
      if (!running) {
        running = true;
        rafId = window.requestAnimationFrame(step);
      }
    };
    const stopLoop = () => {
      running = false;
      window.cancelAnimationFrame(rafId);
    };
    const handleVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    startLoop();

    const clearMeteors = () => {
      for (const meteor of meteors) {
        meteor.element.remove();
      }
      meteors.length = 0;
    };

    const spawn = () => {
      if (!visible || !layerRef.current) {
        return;
      }
      const x =
        (0.35 * Math.random() + 0.1 + (Math.random() < 0.5 ? 0 : 0.55)) *
        window.innerWidth;
      const img = document.createElement("img");
      img.src = "/adaline-scenes/footer/footer-meteor.jpg";
      img.alt = "";
      img.className = "absolute -top-80 left-0 h-80 origin-bottom object-contain";
      img.style.transform = `translate(${x}px, 0px) rotate(34deg)`;
      img.style.opacity = "1";
      layerRef.current.appendChild(img);
      meteors.push({
        element: img,
        initialX: x,
        initialY: 0,
        initialTime: performance.now(),
      });
      spawnTimer = setTimeout(spawn, 5000 + 5000 * Math.random());
    };

    const observer = new IntersectionObserver((entries) => {
      const nowVisible = entries.some((entry) => entry.isIntersecting);
      if (nowVisible && !visible) {
        visible = true;
        if (spawnTimer) {
          clearTimeout(spawnTimer);
        }
        spawnTimer = setTimeout(
          spawn,
          Date.now() - lastVisibleAt < 5000 ? 3000 : 800,
        );
        lastVisibleAt = Date.now();
      } else if (!nowVisible && visible) {
        visible = false;
        lastVisibleAt = Date.now();
        if (spawnTimer) {
          clearTimeout(spawnTimer);
          spawnTimer = null;
        }
        clearMeteors();
      }
    }, { rootMargin: "200px" });
    observer.observe(layer);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      stopLoop();
      if (spawnTimer) {
        clearTimeout(spawnTimer);
      }
      clearMeteors();
    };
  }, []);

  // Layer container: black background with additive plus-lighter blend (stays
  // invisible until a streak img is inside), masked so nothing pokes above.
  return (
    <div
      ref={layerRef}
      aria-hidden
      data-scroll-scene="meteors"
      className="pointer-events-none absolute -top-40 bottom-0 w-full overflow-clip bg-black mix-blend-plus-lighter [mask-image:linear-gradient(to_bottom,transparent_0%,black_5%)]"
    />
  );
}
