"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------------------------------------------------------------------------
// Scroll-bound Three.js rebuild of the adaline.ai footer dock ("night theme").
// The dock + water-reflection textures are the original adaline assets, drawn
// on shader planes so the scene stays pixel-faithful at rest. On top of that,
// scroll progress (GSAP ScrollTrigger, scrubbed) drives a warm glow that
// travels the pier -> walkway path, ignites the two lamps as it passes them,
// and lifts the whole scene's exposure as night settles. The reflection plane
// mirrors the glow about the waterline and ripples it with a time-based wobble.
// ---------------------------------------------------------------------------

// Path the glow travels, in dock-texture UV space (y up). Measured from the
// texture itself: pier centerline from the near (bottom) end up to the
// walkway, then along the walkway through lamp 1 to lamp 2.
const GLOW_PATH: ReadonlyArray<readonly [number, number]> = [
  [0.205, 0.04], // pier, nearest the viewer
  [0.3, 0.45], // mid pier
  [0.348, 0.76], // pier meets walkway
  [0.595, 0.78], // walkway run, ends at lamp 2
];

// Lamp bulbs, measured as the two bright clusters in footer-dock.webp.
const LAMP_1: readonly [number, number] = [0.355, 0.866];
// Lamp 2's x sits slightly before the glow path's end (0.595) so its ignition
// window fits inside the head's travel range instead of capping at ~23%.
const LAMP_2: readonly [number, number] = [0.575, 0.866];

// Reflection texture mirrors the dock about this waterline: y' = 2*WATER_Y - y.
const WATER_Y = 0.76;

// Texture aspect (3840x1280). Distances in UV space are corrected by this so
// the glow pools read as circles on screen instead of 3:1 ellipses.
const TEX_ASPECT = 3;

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uExposure;
  uniform float uGlowStrength;
  uniform vec2 uPath[4];
  uniform float uLit[3];
  uniform vec2 uHead;
  uniform float uHeadGlow;
  uniform vec2 uLamp1;
  uniform vec2 uLamp2;
  uniform float uLamp1On;
  uniform float uLamp2On;
  uniform float uOpacity;
  uniform float uCanvasAspect; // canvas width / canvas height
  varying vec2 vUv;

  // Aspect-corrected distance from p to segment a->b, both in UV space.
  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 scale = vec2(${TEX_ASPECT.toFixed(1)}, 1.0);
    vec2 pa = (p - a) * scale;
    vec2 ba = (b - a) * scale;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);

    // Traveling path glow: each segment is lit only up to uLit[i] of its run.
    float glow = 0.0;
    for (int i = 0; i < 3; i++) {
      if (uLit[i] <= 0.0) continue;
      vec2 a = uPath[i];
      vec2 b = mix(uPath[i], uPath[i + 1], uLit[i]);
      float d = segDist(vUv, a, b);
      glow += exp(-d * 30.0) * 0.28;
    }

    // Bright head riding the front of the glow: isotropic in screen space so
    // it reads as a round hotspot rather than a horizontal smear.
    vec2 headDelta = (vUv - uHead) * vec2(uCanvasAspect, 1.0);
    float dHead = length(headDelta);
    float head = exp(-dHead * 18.0) * uHeadGlow;

    // Lamp halos: gentle flicker once the glow head has passed each lamp.
    float flicker1 = 0.9 + 0.1 * sin(uTime * 6.3 + 1.7);
    float flicker2 = 0.9 + 0.1 * sin(uTime * 5.1);
    float lamp1 = exp(-segDist(vUv, uLamp1, uLamp1) * 14.0) * uLamp1On * flicker1;
    float lamp2 = exp(-segDist(vUv, uLamp2, uLamp2) * 14.0) * uLamp2On * flicker2;

    vec3 warm = vec3(1.0, 0.64, 0.34);
    vec3 lampWarm = vec3(1.0, 0.78, 0.52);

    // Path glow hugs the dock planks (soft alpha edge); the lamp halos are
    // allowed to bleed past the dock so warm light pools onto the water.
    float onDock = smoothstep(0.0, 0.15, tex.a);
    float glowBleed = max(lamp1, lamp2) * 0.6;
    vec3 col = tex.rgb * uExposure;
    col += (glow + head) * warm * uGlowStrength * onDock;
    col += (lamp1 + lamp2) * lampWarm * 0.42 * max(onDock, glowBleed);

    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`;

// Reflection variant: ripple the UV lookup and stretch/dim the glow.
const REFLECTION_FRAGMENT_SHADER = FRAGMENT_SHADER.replace(
  "vec4 tex = texture2D(uMap, vUv);",
  /* glsl */ `
    float depth = clamp((${WATER_Y.toFixed(2)} - vUv.y) * 2.2, 0.0, 1.0);
    vec2 rippleUv = vUv;
    rippleUv.x += sin(vUv.y * 90.0 + uTime * 1.35) * 0.0028 * depth;
    rippleUv.y += sin(vUv.x * 70.0 - uTime * 0.9) * 0.0016 * depth;
    vec4 tex = texture2D(uMap, rippleUv);
  `,
);

interface PathRuntime {
  cumulative: number[];
  total: number;
}

function buildPathRuntime(): PathRuntime {
  const cumulative = [0];
  let total = 0;
  for (let i = 1; i < GLOW_PATH.length; i += 1) {
    const dx = (GLOW_PATH[i][0] - GLOW_PATH[i - 1][0]) * TEX_ASPECT;
    const dy = GLOW_PATH[i][1] - GLOW_PATH[i - 1][1];
    total += Math.hypot(dx, dy);
    cumulative.push(total);
  }
  return { cumulative, total };
}

// Polyline params (0..1 of total length) at which the head passes each lamp,
// so ignition can key off the same progress value the glow uses.
function lampParam(runtime: PathRuntime, lampX: number) {
  // Both lamps sit on the final walkway segment; param from x along it.
  const a = GLOW_PATH[2];
  const b = GLOW_PATH[3];
  const t = Math.min(1, Math.max(0, (lampX - a[0]) / (b[0] - a[0])));
  const len = runtime.cumulative[2] + t * (runtime.total - runtime.cumulative[2]);
  return len / runtime.total;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mirrorY(point: readonly [number, number]): [number, number] {
  return [point[0], 2 * WATER_Y - point[1]];
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  dockMaterial: THREE.ShaderMaterial;
  reflectionMaterial: THREE.ShaderMaterial;
  dockMesh: THREE.Mesh;
  reflectionMesh: THREE.Mesh;
}

function makeUniforms(texture: THREE.Texture, mirrored: boolean) {
  const path = (mirrored ? GLOW_PATH.map(mirrorY) : GLOW_PATH.map((p) => [...p])) as Array<[number, number]>;
  return {
    uMap: { value: texture },
    uTime: { value: 0 },
    uCanvasAspect: { value: 1.0 },
    uExposure: { value: mirrored ? 0.88 : 0.82 },
    // The mirrored glow path lands at UV y > 1 (outside the texture), so the
    // reflection keeps only lamp halos + ripple — no traveling path glow.
    uGlowStrength: { value: mirrored ? 0 : 1 },
    uPath: { value: path.map(([x, y]) => new THREE.Vector2(x, y)) },
    uLit: { value: [0, 0, 0] },
    uHead: { value: new THREE.Vector2(path[0][0], path[0][1]) },
    uHeadGlow: { value: 0 },
    uLamp1: { value: new THREE.Vector2(...(mirrored ? mirrorY(LAMP_1) : LAMP_1)) },
    uLamp2: { value: new THREE.Vector2(...(mirrored ? mirrorY(LAMP_2) : LAMP_2)) },
    uLamp1On: { value: 0 },
    uLamp2On: { value: 0 },
    uOpacity: { value: mirrored ? 0.55 : 1 },
  };
}

export function FooterDockThree() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      // Deferred so the fallback swap doesn't trigger a cascading render.
      queueMicrotask(() => setWebglFailed(true));
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;

    const loader = new THREE.TextureLoader();
    const loadTexture = (url: string) => {
      const texture = loader.load(url, () => {
        // First paint once the texture arrives so the dock never pops in late.
        renderOnce();
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    };

    const dockTexture = loadTexture("/adaline-scenes/footer/footer-dock.webp");
    const reflectionTexture = loadTexture("/adaline-scenes/footer/footer-dock-reflection.webp");

    const geometry = new THREE.PlaneGeometry(1, 1);

    const dockMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: makeUniforms(dockTexture, false),
      transparent: true,
      depthWrite: false,
    });
    const reflectionMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: REFLECTION_FRAGMENT_SHADER,
      uniforms: makeUniforms(reflectionTexture, true),
      transparent: true,
      depthWrite: false,
    });

    const reflectionMesh = new THREE.Mesh(geometry, reflectionMaterial);
    reflectionMesh.renderOrder = 0;
    const dockMesh = new THREE.Mesh(geometry, dockMaterial);
    dockMesh.renderOrder = 1;
    scene.add(reflectionMesh, dockMesh);

    const refs: SceneRefs = { renderer, camera, scene, dockMaterial, reflectionMaterial, dockMesh, reflectionMesh };
    const runtime = buildPathRuntime();
    const lamp1At = lampParam(runtime, LAMP_1[0]);
    const lamp2At = lampParam(runtime, LAMP_2[0]);

    let progress = 0;
    let renderQueued = true;
    let triggerActive = false;

    const applyProgress = () => {
      // Night settles in: the dock starts at natural brightness and exposure
      // lifts gently while the glow makes its run.
      const exposure = 0.82 + 0.2 * smoothstep(0, 0.6, progress);
      // Glow head travels the polyline over the first ~95% of the band scroll,
      // leaving room for lamp 2's ignition window to complete.
      const headParam = smoothstep(0.04, 0.95, progress);
      const headLen = headParam * runtime.total;

      const lit: number[] = [0, 0, 0];
      for (let i = 0; i < 3; i += 1) {
        const c0 = runtime.cumulative[i];
        const c1 = runtime.cumulative[i + 1];
        lit[i] = Math.min(1, Math.max(0, (headLen - c0) / (c1 - c0)));
      }

      let head: [number, number] = [...GLOW_PATH[0]] as [number, number];
      for (let i = 0; i < 3; i += 1) {
        if (lit[i] > 0) {
          head = [
            GLOW_PATH[i][0] + (GLOW_PATH[i + 1][0] - GLOW_PATH[i][0]) * lit[i],
            GLOW_PATH[i][1] + (GLOW_PATH[i + 1][1] - GLOW_PATH[i][1]) * lit[i],
          ];
        }
      }

      // Head fades in at launch and hands off to the lamps at the end of the run.
      const headGlow = smoothstep(0, 0.08, headParam) * (1 - smoothstep(0.94, 1, headParam)) * 0.55;
      const lamp1On = smoothstep(lamp1At - 0.015, lamp1At + 0.06, headParam);
      const lamp2On = smoothstep(lamp2At - 0.015, lamp2At + 0.05, headParam);

      for (const material of [refs.dockMaterial, refs.reflectionMaterial]) {
        const mirrored = material === refs.reflectionMaterial;
        material.uniforms.uExposure.value = mirrored ? exposure * 0.92 : exposure;
        if (!mirrored) {
          // The mirrored path glow falls outside UV [0,1]; the reflection only
          // tracks lamp state and exposure.
          material.uniforms.uLit.value = lit;
          material.uniforms.uHead.value.set(head[0], head[1]);
          material.uniforms.uHeadGlow.value = headGlow;
        }
        material.uniforms.uLamp1On.value = lamp1On;
        material.uniforms.uLamp2On.value = lamp2On;
      }

      wrapper.dataset.dockProgress = progress.toFixed(3);
      renderQueued = true;
    };

    const renderOnce = () => {
      renderQueued = true;
    };

    const resize = () => {
      const viewportWidth = window.innerWidth;
      // Mirrors the DOM layout this replaces: a 200vw image, aspect 3, centered.
      const planeWidth = viewportWidth * 2;
      const planeHeight = planeWidth / TEX_ASPECT;
      const width = wrapper.clientWidth || viewportWidth;
      const height = wrapper.clientHeight || planeHeight;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height, false);

      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();

      const aspect = width / height;
      refs.dockMaterial.uniforms.uCanvasAspect.value = aspect;
      refs.reflectionMaterial.uniforms.uCanvasAspect.value = aspect;

      for (const mesh of [refs.dockMesh, refs.reflectionMesh]) {
        mesh.scale.set(planeWidth, planeHeight, 1);
        // Plane top edge flush with the canvas top, horizontally centered.
        mesh.position.set(0, height / 2 - planeHeight / 2, mesh === refs.dockMesh ? 0.01 : 0);
      }

      renderQueued = true;
    };

    const tick = (time: number) => {
      // Time-based ripple/flicker only needs to run while the band is on screen.
      if (!triggerActive && !renderQueued) {
        return;
      }
      // gsap.ticker reports `time` in seconds (gsap v3), which is what the
      // shader's flicker/ripple coefficients are tuned for. Do NOT divide.
      refs.dockMaterial.uniforms.uTime.value = time;
      refs.reflectionMaterial.uniforms.uTime.value = time;
      renderer.render(scene, camera);
      renderQueued = false;
    };

    const scrollTrigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "max",
      scrub: true,
      onUpdate: (self) => {
        progress = self.progress;
        applyProgress();
      },
      onToggle: (self) => {
        triggerActive = self.isActive;
        renderQueued = true;
      },
    });

    // Debounced: ScrollTrigger.refresh() can reflow the page, which would
    // re-fire this observer and loop.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }
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
    applyProgress();
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      scrollTrigger.kill();
      resizeObserver.disconnect();
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      dockMaterial.dispose();
      reflectionMaterial.dispose();
      dockTexture.dispose();
      reflectionTexture.dispose();
      renderer.dispose();
    };
  }, []);

  if (webglFailed) {
    // Static fallback: the original image stack this scene replaces.
    return (
      <>
        <img
          src="/adaline-scenes/footer/footer-dock-reflection.webp"
          alt=""
          aria-hidden
          className="absolute left-0 top-0 aspect-[3] w-[200vw] object-cover opacity-60"
        />
        <img src="/adaline-scenes/footer/footer-dock.webp" alt="" aria-hidden className="relative aspect-[3] w-[200vw] object-cover" />
      </>
    );
  }

  return (
    <div ref={wrapperRef} data-scroll-scene="dock-three" className="relative aspect-[3] w-[200vw]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
