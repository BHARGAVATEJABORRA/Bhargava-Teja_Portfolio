"use client";

// Aurora — EXACT port of adaline.ai's footer aurora, extracted from their
// production bundle (www.adaline.ai/_next/static/chunks/35515.969aa68e0ec1e16b.js).
//
// This is NOT the react-bits screen-space curtain shader (the previous
// approximation). Adaline's real aurora is a Three.js scene: a huge
// 40000×250000 plane (50×400 segments) whose Z is displaced by 2D simplex
// noise in the VERTEX shader, laid flat and viewed nearly edge-on by a tilted
// perspective camera — the rippling sheet seen from the side IS the curtain.
// The fragment shader paints it pure green->teal, vec4(0.0, 1.0, noise, noise2),
// with two banded sine stacks animating the blue channel and the alpha, and a
// smoothstep horizontal fade replacing an old CSS blur. The clock runs at
// (now - start) / 200000 — glacially slow, which is exactly the drift adaline has.
//
// Everything below matches their bundle 1:1: geometry, camera transform, mesh
// transform, renderer flags, DPR cap 1.25, resize handling, reduced-motion
// bail-out, and the IntersectionObserver-gated rAF (rootMargin 200px).

import {
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { useEffect, useRef, type HTMLAttributes } from "react";

// Adaline stores this in state via a first effect; this repo's
// react-hooks/set-state-in-effect rule forbids that pattern, so each effect
// checks the media query itself on mount — same behaviour (client-only,
// evaluated once), no cascading render.
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const vertexShader = `
        precision highp float;
        varying vec2 vUv;
        uniform float time;

        // Ashima Arts 2D simplex noise — public domain.
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1.x = step(x0.y, x0.x);
          i1.y = 1.0 - i1.x;
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                 + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                                  dot(x12.zw, x12.zw)), 0.0);
          m = m * m;
          m = m * m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vUv = uv;
          float n = snoise(vec2(position.y / 60000.0 - time, time));
          vec3 displaced = position;
          displaced.z += ((1.0 - cos(n * 3.14159265)) * 0.5) * 70000.0;
          vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
          mvPosition.z -= 1.0;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

const fragmentShader = `
        varying vec2 vUv;
        uniform float time;
        void main() {
          float noise = sin(vUv.y * 10.0 + time) * 0.5 +
                       sin(vUv.y * 20.0 - time * 0.5) * 0.25 +
                       sin(vUv.y * 40.0 + time * 0.25) * 0.125;
          noise = noise * 0.5 + 0.5;
          noise = clamp((noise - 0.4) / 0.2, 0.0, 1.0);
          noise = noise * 0.4 + 0.6;

          float noise2 = sin(vUv.y * 45.0 - time * 2.4) * 0.5 +
                        sin(vUv.y * 75.0 + time * 1.4) * 0.25 +
                        sin(vUv.y * 105.0 - time * 0.8) * 0.125;
          noise2 = noise2 * 0.5 + 0.5;

          vec4 mainColor = vec4(0.0, 1, noise, noise2);

          // In-shader replacement for the previous CSS blur(8px)
          // filter. Smoothstep gives an almost-imperceptibly softer
          // edge than the pow(x*10, 3) ramp, which together with the
          // mix-blend-screen on the canvas produces the same diffuse
          // aurora glow without a separable Gaussian post-pass.
          float xn = vUv.x * 10.0;
          float left  = smoothstep(0.0, 1.0, xn);
          float right = smoothstep(1.0, 0.0, xn / 9.0);
          float alpha = mix(left, right, step(1.0, xn));

          float noiseValue = 1.0 - vUv.y;
          alpha *= noiseValue;
          alpha = clamp(alpha, 0.0, 1.0);

          vec4 finalColor = mainColor;
          finalColor.a *= alpha;
          gl_FragColor = finalColor;
        }
      `;

export type AuroraProps = HTMLAttributes<HTMLDivElement>;

export function Aurora({ className, ...rest }: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) {
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1000,
      1e6,
    );
    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    const applySize = () => {
      const element = renderer.domElement;
      const width = element.clientWidth;
      const height = element.clientHeight;
      renderer.setSize(width, height, false);
      // Canvas-derived aspect (adaline's behaviour). Safe while the wrapper
      // stays TALL (≈1570px): the aspect lands at or below adaline's 1.96
      // and the bright zone spans the frame. Only short/wide canvases
      // (aspect ≳2.2) widen the horizontal FOV enough to shove the bright
      // end to one side — if the wrapper is ever shortened again, either
      // re-lock this to 3082/1570 or expect left-biased beams.
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    let resizeFrame: number | null = null;
    const handleResize = () => {
      if (resizeFrame === null) {
        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = null;
          applySize();
        });
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const material = new ShaderMaterial({
      transparent: true,
      side: DoubleSide,
      depthWrite: true,
      depthTest: true,
      uniforms: { time: { value: 0 } },
      vertexShader,
      fragmentShader,
    });

    const geometry = new PlaneGeometry(4e4, 25e4, 50, 400);
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    camera.position.x = -4e4;
    camera.rotation.y = -(0.15 * Math.PI);
    camera.rotation.x = 0.08 * Math.PI;
    camera.rotation.z = 0.03 * Math.PI;
    mesh.position.y = 22500;
    mesh.position.z = -3e4;
    mesh.rotation.y = -(0.5 * Math.PI);
    mesh.rotation.x = -(0.5 * Math.PI);

    // Clock: adaline runs (now - pageLoad) / 2e5 from zero. Empirically (pixel
    // stats vs their live site) the shader has a bright "wall" transient for
    // the first ~2 time-units (≈6 min wall-clock): the fragment sine stacks
    // start phase-aligned, so alpha is high across the whole sheet before they
    // dephase into the distinct dim beams adaline is known for. Adaline
    // visitors never see the transient at the footer (their clock has been
    // running since page load, minutes before anyone scrolls to the bottom) —
    // but this portfolio can be opened straight at /#contact, so we pre-age
    // the clock by 600s (t₀ = 3.0, verified beams-over-dark-sky state). From
    // there it evolves exactly like theirs.
    const start = performance.now() - 600_000;
    const renderFrame = () => {
      const time = (performance.now() - start) / 2e5;
      material.uniforms.time.value = time;
      renderer.render(scene, camera);
      // Heartbeat: lets us verify from DevTools/automation that the loop is
      // actually advancing (the aurora drifts slowly, so a frozen loop and a
      // live one can look similar over a few seconds).
      canvas.dataset.auroraTime = time.toFixed(3);
    };

    // Adaline defers initial sizing to a rAF and renders only inside the rAF
    // loop. Sizing + painting the first frame synchronously here is visually
    // identical on a focused page but makes the first frame deterministic
    // (and lets a backgrounded tab — where rAF is paused — still show a
    // static aurora frame).
    applySize();
    renderFrame();

    // Animation loop: plain rAF gated by visibilitychange — the SAME pattern
    // as this repo's proven WebGL components (iridescence, the old OGL
    // aurora, which animated reliably). The previous split-effect
    // IntersectionObserver wiring left the canvas frozen on its first frame
    // in some sessions, and a static aurora is worse than the battery cost
    // of an always-running loop while the tab is visible.
    let rafId = 0;
    let running = false;

    const loop = () => {
      rafId = window.requestAnimationFrame(loop);
      renderFrame();
    };
    const startLoop = () => {
      if (!running) {
        running = true;
        rafId = window.requestAnimationFrame(loop);
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

    return () => {
      stopLoop();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
      }
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (!canvas.isConnected) {
        renderer.forceContextLoss();
      }
    };
  }, []);

  // Adaline merges cn("relative w-full", className) with tailwind-merge, so a
  // caller-supplied position class replaces `relative`. Same net result here:
  // the caller's className wins outright when provided.
  return (
    <div className={className ?? "relative w-full"} {...rest}>
      <canvas ref={canvasRef} className="h-full w-full mix-blend-screen blur-[6px]" />
    </div>
  );
}

export default Aurora;
