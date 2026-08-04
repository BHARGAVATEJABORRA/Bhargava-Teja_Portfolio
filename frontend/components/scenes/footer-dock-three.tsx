"use client";

import Image from "next/image";

const DOCK_ASSET = "/adaline-scenes/footer/footer-dock.webp";

/**
 * The finished dock is artwork, not an interactive 3D model. Rendering the
 * same bitmap through WebGL consumed a context and GPU memory for no visual
 * gain, so this intentionally stays a responsive image.
 */
export function FooterDockThree() {
  return (
    <div data-scroll-scene="dock-three" className="relative aspect-[3] w-full">
      <Image
        src={DOCK_ASSET}
        data-footer-dock-static
        alt=""
        aria-hidden
        width={1200}
        height={400}
        sizes="(min-width: 1280px) 110vw, 70vw"
        className="absolute inset-0 h-full w-full object-fill"
      />
    </div>
  );
}
