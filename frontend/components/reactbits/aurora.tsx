"use client";

// Footer aurora. A large Three.js plane is displaced along Z by 2D simplex
// noise in the vertex shader, then laid flat and viewed nearly edge-on so the
// rippling sheet reads as a curtain. The fragment shader tints it green->teal
// and fades the edges. The clock drifts very slowly (time = elapsed / 2e5).

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

// Client-only reduced-motion check, read fresh on each mount so we never store
// it in state (keeps the hooks lint happy).
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

          // Soft edge fade done in-shader. Together with the canvas
          // mix-blend-screen this gives the diffuse glow without a blur pass.
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
      // Use the canvas aspect directly. Fine while the wrapper stays tall; a
      // short, wide canvas widens the FOV and pushes the bright band to one side.
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

    // Pre-age the clock by 10 minutes so the aurora opens in its settled
    // beams-over-dark-sky state. From a cold start the sine stacks are
    // phase-aligned and the whole sheet glows bright for the first few minutes;
    // that never shows on a slow scroll, but the site can deep-link to #contact.
    const start = performance.now() - 600_000;
    const renderFrame = () => {
      const time = (performance.now() - start) / 2e5;
      material.uniforms.time.value = time;
      renderer.render(scene, camera);
      // Expose the current time on the canvas so a frozen loop is easy to spot
      // in automation; the drift is too slow to catch by eye over a few seconds.
      canvas.dataset.auroraTime = time.toFixed(3);
    };

    // Size and paint one frame up front so a backgrounded tab (where rAF is
    // paused) still shows a static aurora instead of a blank canvas.
    applySize();
    renderFrame();

    // Plain rAF gated by tab visibility. Simpler and steadier here than an
    // IntersectionObserver, which sometimes left the canvas stuck on frame one.
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

  // A caller-supplied className replaces the default positioning outright.
  return (
    <div className={className ?? "relative w-full"} {...rest}>
      <canvas ref={canvasRef} className="h-full w-full mix-blend-screen blur-[6px]" />
    </div>
  );
}

export default Aurora;
