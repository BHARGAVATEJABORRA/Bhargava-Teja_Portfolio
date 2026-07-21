"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Timer,
  Vector3,
  WebGLRenderer,
} from "three";
import { LuMapPin } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";

import { ControlCenterPanel } from "./control-center-panel";

const THREE = {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  Vector3,
  WebGLRenderer,
};

/**
 * Realistic earth: NASA Blue Marble texture (blue oceans, green land) loaded
 * at runtime from a CDN, wrapped in a soft blue atmosphere glow. three.js is
 * already in the bundle (footer dock scene), so this shares that chunk.
 */
const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg";

const AUTO_SPIN_SPEED = 0.0022;
const GLOBE_TILT = 0.32;

/** lat/lng (degrees) → position on a unit sphere that matches an equirectangular texture. */
function latLngToVector3(lat: number, lng: number, radius = 1): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    // Blue-teal halo — "glowing blue" per the design direction.
    gl_FragColor = vec4(0.25, 0.65, 0.95, 1.0) * intensity;
  }
`;

interface GlobeWidgetProps {
  markerLocation?: [number, number];
  label?: string;
}

export function GlobeWidget({
  markerLocation = [
    portfolioContent.identity.controlCenter.weatherLat,
    portfolioContent.identity.controlCenter.weatherLng,
  ],
  label = portfolioContent.identity.controlCenter.location,
}: GlobeWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasRenderError, setHasRenderError] = useState(false);
  const [ready, setReady] = useState(false);
  const [markerLat, markerLng] = markerLocation;

  // Auto-spin baseline plus drag offset accumulated from pointer interaction.
  const pointerInteractingRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerInteractingRef.current = event.clientX - dragDeltaRef.current;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, []);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (pointerInteractingRef.current !== null) {
        dragDeltaRef.current = event.clientX - pointerInteractingRef.current;
      }
    }
    function onPointerUp() {
      pointerInteractingRef.current = null;
      if (containerRef.current) containerRef.current.style.cursor = "grab";
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let frame = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 2.85;

    let renderer: WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (error) {
      console.error("Failed to initialize globe renderer.", error);
      window.requestAnimationFrame(() => setHasRenderError(true));
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // Soft, even light so the day side reads naturally over the dark panel.
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 2.5, 5);
    scene.add(sun);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = GLOBE_TILT;
    scene.add(globeGroup);

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: new THREE.Color(0x223344),
      shininess: 9,
    });
    const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(globe);

    // Atmosphere halo (rendered on a slightly larger back-facing shell).
    const atmosphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.16);
    scene.add(atmosphere);

    // Location marker: glowing green dot + pulsing ring, pinned to the surface.
    const markerPosition = latLngToVector3(markerLat, markerLng, 1.005);
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(markerPosition);
    markerGroup.lookAt(markerPosition.clone().multiplyScalar(2));
    globe.add(markerGroup);

    const markerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 }),
    );
    markerGroup.add(markerDot);

    const markerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const markerRing = new THREE.Mesh(new THREE.RingGeometry(0.032, 0.044, 32), markerRingMaterial);
    markerGroup.add(markerRing);

    // Start with the marker's longitude facing the camera.
    const baseRotation = -Math.atan2(markerPosition.x, markerPosition.z);
    let spin = 0;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    let texture: Texture | null = null;
    textureLoader.load(
      EARTH_TEXTURE_URL,
      (loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        texture = loaded;
        sphereMaterial.map = loaded;
        sphereMaterial.needsUpdate = true;
        setReady(true);
      },
      undefined,
      () => {
        // Texture unreachable (offline / CDN blocked): stylized fallback —
        // deep ocean-blue sphere so the widget still reads as an earth.
        if (disposed) return;
        sphereMaterial.color = new THREE.Color(0x1b4f82);
        sphereMaterial.needsUpdate = true;
        setReady(true);
      },
    );

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const timer = new THREE.Timer();
    timer.connect(document);
    const animate = (timestamp: number) => {
      frame = window.requestAnimationFrame(animate);
      timer.update(timestamp);
      if (pointerInteractingRef.current === null) {
        spin += AUTO_SPIN_SPEED;
      }
      globe.rotation.y = baseRotation + spin + dragDeltaRef.current / 200;

      const pulsePhase = Math.sin(timer.getElapsed() * 2.6);
      const pulse = 1 + 0.35 * pulsePhase;
      markerRing.scale.setScalar(pulse);
      markerRingMaterial.opacity = 0.75 - 0.35 * pulsePhase;

      renderer.render(scene, camera);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      timer.dispose();
      resizeObserver.disconnect();
      texture?.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      markerRingMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [markerLat, markerLng]);

  return (
    <ControlCenterPanel radius={32} className="flex h-full min-h-[16rem] flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
        <LuMapPin size={15} aria-hidden />
        <span>Location</span>
      </div>

      {/* min-h-0 keeps this flex item inside the panel even though the sphere
          is taller than the row — otherwise the pill anchored to its bottom
          edge lands below the panel and is clipped away. */}
      <div className="relative mx-auto mt-2 flex min-h-0 flex-1 items-end justify-center">
        <div className="pointer-events-none absolute inset-x-[16%] bottom-4 top-[24%] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,132,196,0.2),transparent_62%)] blur-3xl" />
        <div className="relative aspect-square w-full max-w-[15rem] translate-y-8 select-none sm:max-w-[17rem] sm:translate-y-9">
          {hasRenderError ? (
            <div className="flex h-full w-full items-center justify-center rounded-full border border-white/18 bg-[radial-gradient(circle_at_38%_34%,rgba(120,178,236,0.32)_0%,rgba(84,140,201,0.16)_26%,rgba(18,50,86,0.1)_58%,rgba(8,18,31,0.05)_100%)]">
              <span className="text-center text-sm font-medium text-[var(--color-muted-ink)]">{label}</span>
            </div>
          ) : (
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              data-ready={ready}
              className="h-full w-full cursor-grab touch-none overflow-hidden rounded-full opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
            />
          )}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[rgba(8,16,26,0.66)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <LuMapPin size={12} className="text-[var(--color-accent)]" aria-hidden />
            {label}
          </span>
        </div>
      </div>
    </ControlCenterPanel>
  );
}
