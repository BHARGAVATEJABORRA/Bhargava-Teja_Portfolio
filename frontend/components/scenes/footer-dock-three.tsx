"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DOCK_ASPECT = 3;
const DOCK_ASSET = "/adaline-scenes/footer/footer-dock.webp?v=5";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Pixel-faithful WebGL presentation of the finished dock artwork.
 *
 * The asset already contains the complete T-pier, all three correctly placed
 * fixtures, and their natural board lighting. Deliberately do not reconstruct
 * arms or add procedural halos here: those effects shifted the lamps away
 * from their boards and produced detached circular/elliptical light patches.
 */
export function FooterDockThree() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!mounted) return;

    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      queueMicrotask(() => setWebglFailed(true));
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;

    const geometry = new PlaneGeometry(1, 1);
    let textureReady = false;
    const texture = new TextureLoader().load(
      DOCK_ASSET,
      () => {
        textureReady = true;
        render();
      },
      undefined,
      () => queueMicrotask(() => setWebglFailed(true)),
    );
    texture.colorSpace = SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    function render() {
      if (textureReady) renderer.render(scene, camera);
    }

    function resize() {
      const width = wrapper!.clientWidth || window.innerWidth;
      const height = wrapper!.clientHeight || width / DOCK_ASPECT;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);

      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();

      mesh.scale.set(width, width / DOCK_ASPECT, 1);
      mesh.position.set(0, height / 2 - width / DOCK_ASPECT / 2, 0);
      render();
    }

    const scrollTrigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "max",
      scrub: true,
      onUpdate: (self) => {
        wrapper.dataset.dockProgress = self.progress.toFixed(3);
      },
    });
    wrapper.dataset.dockProgress = "0.000";

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        resize();
        ScrollTrigger.refresh();
      }, 100);
    });
    resizeObserver.observe(wrapper);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglFailed(true);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);

    resize();

    return () => {
      scrollTrigger.kill();
      resizeObserver.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [mounted]);

  if (!mounted) return null;

  if (webglFailed) {
    return <img src={DOCK_ASSET} alt="" aria-hidden className="relative aspect-[3] w-full object-fill" />;
  }

  return (
    <div ref={wrapperRef} data-scroll-scene="dock-three" className="relative aspect-[3] w-full">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
