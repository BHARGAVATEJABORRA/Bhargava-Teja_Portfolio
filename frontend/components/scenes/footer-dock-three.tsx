"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------------------------------------------------------------------------
// Scroll-bound Three.js build of the footer dock ("night theme"). The dock and
// water-reflection textures are drawn on shader planes so the scene stays
// pixel-faithful at rest. Three bounded warm pools sit under the lamps while a
// restrained cool sky fill keeps the unlit boards readable without flattening
// the pier into a uniformly bright slab. Scroll progress (GSAP
// ScrollTrigger, scrubbed) ignites the lamps as night settles. The reflection
// plane mirrors the pools about the waterline and ripples them with a
// time-based wobble.
// ---------------------------------------------------------------------------

// Lamp bulbs on the T-pier cross-bar: left / middle / right. The source texture
// contains its added left fixture at x=.185, too close to the middle lamp and
// without the painterly plank light baked under the original fixtures. At
// render time we replace that patch with an exact sample of the middle fixture
// and its pool, positioned one matching interval to the left. This keeps all
// three fixtures evenly spaced and gives the left lamp the same construction,
// colour and light response as the two originals.
const SOURCE_LEFT_LAMP_X = 0.185;
const LAMP_3: readonly [number, number] = [0.135, 0.866];
const LAMP_1: readonly [number, number] = [0.355, 0.866];
const LAMP_2: readonly [number, number] = [0.575, 0.866];

// Warm pools on the walkway planks directly beneath each bulb. The walkway
// surface sits just below the lamp heads in the texture.
const POOL_3: readonly [number, number] = [0.135, 0.795];
const POOL_1: readonly [number, number] = [0.355, 0.795];
const POOL_2: readonly [number, number] = [0.575, 0.795];

// Reflection texture mirrors the dock about this waterline: y' = 2*WATER_Y - y.
const WATER_Y = 0.76;

// Texture aspect (3840x1280). Distances in UV space are corrected by this so
// the glow pools read as circles on screen instead of 3:1 ellipses.
const TEX_ASPECT = 3;

// Render the dock slightly taller than its native 3:1. On-screen display aspect
// = TEX_ASPECT / stretch. Keep the wrapper aspect-[2.5] in the return + the
// fallback imgs in sync with this. NOTE: overall pier SIZE is driven by the
// group width (w-[..vw] in adaline-scenes.tsx), NOT this — keep the pier smaller
// than the hills/lake so it reads as receding into the distance (perspective).
const DOCK_V_STRETCH = 1.2;
const DOCK_DISPLAY_ASPECT = TEX_ASPECT / DOCK_V_STRETCH; // 2.5

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
  uniform vec2 uLamp1;
  uniform vec2 uLamp2;
  uniform vec2 uLamp3;
  uniform vec2 uPool1;
  uniform vec2 uPool2;
  uniform vec2 uPool3;
  uniform float uLamp1On;
  uniform float uLamp2On;
  uniform float uLamp3On;
  uniform float uReflection;
  uniform float uOpacity;
  varying vec2 vUv;

  // Aspect-corrected distance so falloffs read as circles on screen instead
  // of 3:1 ellipses.
  float radialDist(vec2 p, vec2 c) {
    vec2 d = (p - c) * vec2(${TEX_ASPECT.toFixed(1)}, 1.0);
    return length(d);
  }

  // Exponential attenuation gives the lamps a bright center and a natural,
  // unnoticeable tail. A hard outer radius reads as a painted rectangle when
  // it is clipped by the dock alpha; this falloff never creates that edge.
  float lampFalloff(vec2 p, vec2 c, float decay) {
    return exp(-radialDist(p, c) * decay);
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);

    // The source left arm starts with a perspective-slanted wedge. Rebuild only
    // that short outer cap from a clean neighboring run of the same planks so
    // the arm has level top/front edges and a crisp vertical end. The feather
    // is confined to the inner join; the outer cut stays visually square.
    float directTexture = 1.0 - uReflection;
    float leftCapMask = smoothstep(0.050, 0.053, vUv.x) * (1.0 - smoothstep(0.102, 0.108, vUv.x));
    float straightCapSourceX = 0.120 + (vUv.x - 0.050) * 0.91;
    vec4 straightLeftCap = texture2D(uMap, vec2(straightCapSourceX, vUv.y));
    tex = mix(tex, straightLeftCap, leftCapMask * directTexture);

    // Move the added left fixture into the same spacing rhythm as the middle
    // and right lamps. First restore the small source patch from neighboring
    // left-arm planks, then copy the complete middle lamp/pool patch into its
    // new position. On the deck itself we retain the repaired arm's alpha so
    // neither radial patch can bend its silhouette; only the lamp pixels above
    // the deck are allowed to supply their source alpha.
    float oldFixture = 1.0 - smoothstep(
      0.092,
      0.125,
      radialDist(vUv, vec2(${SOURCE_LEFT_LAMP_X.toFixed(3)}, 0.820))
    );
    vec4 repairedLeftArm = texture2D(uMap, vec2(vUv.x + 0.047, vUv.y));
    repairedLeftArm.a = mix(repairedLeftArm.a, tex.a, 1.0 - smoothstep(0.825, 0.842, vUv.y));
    tex = mix(tex, repairedLeftArm, oldFixture * directTexture);

    float matchedLeftPatch = 1.0 - smoothstep(0.105, 0.145, radialDist(vUv, vec2(0.135, 0.820)));
    vec4 middleLampPatch = texture2D(uMap, vec2(vUv.x + 0.220, vUv.y));
    middleLampPatch.a = mix(middleLampPatch.a, tex.a, 1.0 - smoothstep(0.825, 0.842, vUv.y));
    tex = mix(tex, middleLampPatch, matchedLeftPatch * directTexture);

    // Lamp halos: gentle flicker once each lamp has ignited.
    float flicker1 = 0.975 + 0.025 * sin(uTime * 6.3 + 1.7);
    float flicker2 = 0.975 + 0.025 * sin(uTime * 5.1);
    float flicker3 = 0.975 + 0.025 * sin(uTime * 5.7 + 3.1);
    float bulb1 = lampFalloff(vUv, uLamp1, 22.0) * uLamp1On * flicker1;
    float bulb2 = lampFalloff(vUv, uLamp2, 22.0) * uLamp2On * flicker2;
    float bulb3 = lampFalloff(vUv, uLamp3, 22.0) * uLamp3On * flicker3;

    // All three fixtures now share the same painterly source pool, so their
    // shader reinforcement uses the same falloff and energy.
    float pool1 = lampFalloff(vUv, uPool1, 15.0) * uLamp1On * flicker1;
    float pool2 = lampFalloff(vUv, uPool2, 15.0) * uLamp2On * flicker2;
    float pool3 = lampFalloff(vUv, uPool3, 15.0) * uLamp3On * flicker3;

    // Very low-energy spill connects each fixture to the surrounding wood.
    // It is deliberately broad but too dim to turn the pier into a lit slab.
    float wash1 = lampFalloff(vUv, uPool1, 6.5) * uLamp1On;
    float wash2 = lampFalloff(vUv, uPool2, 6.5) * uLamp2On;
    float wash3 = lampFalloff(vUv, uPool3, 6.5) * uLamp3On;

    vec3 lampWarm = vec3(1.0, 0.78, 0.52);
    vec3 moonCool = vec3(0.42, 0.56, 0.66);

    // Pools hug the dock planks (soft alpha edge); the bulb halos may bleed
    // slightly past the dock so warm light pools onto the water below.
    // NOTE: uMap is an sRGB texture, so texture2D() already returns LINEAR
    // values and every term below is mixed in linear light. The
    // <colorspace_fragment> include at the end encodes back to sRGB — without
    // it the planks render ~4x too dark (only the additive light shows).
    float onDock = smoothstep(0.0, 0.15, tex.a);
    float bulbSum = bulb1 + bulb2 + bulb3;
    float strongestPool = max(pool1, max(pool2, pool3));
    float washSum = wash1 + wash2 + wash3;
    float directReach = clamp(strongestPool + washSum * 0.34, 0.0, 1.0);
    float reflectionScale = mix(1.0, 0.42, uReflection);

    // Moon/aurora fill exists only outside direct lamplight. It raises texture
    // contrast rather than painting a constant colour over every plank, and a
    // subtle horizontal drift prevents a flat grey exposure wash.
    float auroraVariation = 0.5 + 0.5 * sin(vUv.x * 5.2 + vUv.y * 1.7);
    float skyMask = (1.0 - directReach) * onDock * mix(1.0, 0.24, uReflection);
    float skyExposure = 0.020 + auroraVariation * 0.018;

    vec3 col = tex.rgb;
    col *= 1.0 + skyExposure * skyMask;
    col += moonCool * (0.00045 + auroraVariation * 0.00025) * skyMask;

    // Preserve and reinforce the three matched painterly pools equally.
    col *= 1.0 + (pool1 + pool2 + pool3) * 0.025 * onDock * reflectionScale;
    col += lampWarm * (pool1 + pool2 + pool3) * 0.035 * onDock * reflectionScale;
    col += lampWarm * washSum * 0.004 * onDock * reflectionScale;
    col += bulbSum * lampWarm * 0.15 * max(onDock, bulbSum * 0.36) * reflectionScale;

    gl_FragColor = vec4(col, tex.a * uOpacity);

    // three defines linearToOutputTexel() for ShaderMaterial from
    // renderer.outputColorSpace and resolves this include in custom shaders.
    #include <colorspace_fragment>
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
  // The reflection plane samples the mirrored texture, so its lamp/pool
  // centers are mirrored about the waterline too.
  return {
    uMap: { value: texture },
    uTime: { value: 0 },
    uLamp1: { value: new THREE.Vector2(...(mirrored ? mirrorY(LAMP_1) : LAMP_1)) },
    uLamp2: { value: new THREE.Vector2(...(mirrored ? mirrorY(LAMP_2) : LAMP_2)) },
    uLamp3: { value: new THREE.Vector2(...(mirrored ? mirrorY(LAMP_3) : LAMP_3)) },
    uPool1: { value: new THREE.Vector2(...(mirrored ? mirrorY(POOL_1) : POOL_1)) },
    uPool2: { value: new THREE.Vector2(...(mirrored ? mirrorY(POOL_2) : POOL_2)) },
    uPool3: { value: new THREE.Vector2(...(mirrored ? mirrorY(POOL_3) : POOL_3)) },
    uLamp1On: { value: 0 },
    uLamp2On: { value: 0 },
    uLamp3On: { value: 0 },
    uReflection: { value: mirrored ? 1 : 0 },
    uOpacity: { value: mirrored ? 0.55 : 1 },
  };
}

// Shared helpers for the client-only mounted check (stable identities so the
// store never resubscribes).
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function FooterDockThree() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  // Client-only guard: Three.js/GSAP must never run during SSR/hydration.
  // useSyncExternalStore: false on the server snapshot, true on the client —
  // the lint-clean version of the setMounted(true)-in-effect pattern.
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!mounted) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) {
      return;
    }

    const setup = (): (() => void) | undefined => {
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
      // Crisp plank seams when the plane is viewed at less than full size.
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    const dockTexture = loadTexture("/adaline-scenes/footer/footer-dock.webp?v=3");
    const reflectionTexture = loadTexture("/adaline-scenes/footer/footer-dock-reflection.webp?v=2");

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

    let progress = 0;
    let renderQueued = true;
    let triggerActive = false;

    const applyProgress = () => {
      // Night settles in: the lamps ignite in sequence as the band scrolls.
      // The texture keeps its natural exposure throughout — no global
      // brightness lift, only the three discrete pools.
      const lamp1On = smoothstep(0.18, 0.4, progress);
      const lamp2On = smoothstep(0.3, 0.52, progress);
      const lamp3On = smoothstep(0.18, 0.4, progress);

      for (const material of [refs.dockMaterial, refs.reflectionMaterial]) {
        material.uniforms.uLamp1On.value = lamp1On;
        material.uniforms.uLamp2On.value = lamp2On;
        material.uniforms.uLamp3On.value = lamp3On;
      }

      wrapper.dataset.dockProgress = progress.toFixed(3);
      renderQueued = true;
    };

    const renderOnce = () => {
      renderQueued = true;
    };

    const resize = () => {
      const viewportWidth = window.innerWidth;
      // The plane always fills the wrapper: the parent scene owns the width in
      // vw, so resizing there never desyncs this.
      const planeWidth = wrapper.clientWidth || viewportWidth * 1.5;
      // Taller than native 3:1 so the dock reads bigger vertically (width unchanged).
      const planeHeight = planeWidth / DOCK_DISPLAY_ASPECT;
      const width = planeWidth;
      const height = wrapper.clientHeight || planeHeight;

      // Full device pixel ratio (capped at 2) so the plank seams stay crisp.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);

      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();

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
    };

    // Any throw during scene construction (shader compile, texture setup,
    // ScrollTrigger) downgrades to the static image fallback instead of
    // crashing the footer.
    try {
      return setup();
    } catch {
      queueMicrotask(() => setWebglFailed(true));
      return;
    }
  }, [mounted]);

  if (!mounted) return null;

  if (webglFailed) {
    // Static fallback: the original image stack this scene replaces.
    return (
      <>
        <img
          src="/adaline-scenes/footer/footer-dock-reflection.webp"
          alt=""
          aria-hidden
          className="absolute left-0 top-0 aspect-[2.5] w-full object-fill opacity-60"
        />
        <img src="/adaline-scenes/footer/footer-dock.webp" alt="" aria-hidden className="relative aspect-[2.5] w-full object-fill" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse 5.5% 12% at 13.5% 79.5%, rgba(255, 199, 133, 0.24) 0%, rgba(255, 199, 133, 0.1) 38%, transparent 75%)",
          }}
        />
      </>
    );
  }

  return (
    <div ref={wrapperRef} data-scroll-scene="dock-three" className="relative aspect-[2.5] w-full">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
