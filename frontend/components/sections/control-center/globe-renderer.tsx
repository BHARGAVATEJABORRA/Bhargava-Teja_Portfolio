"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg";
const AUTO_SPIN_SPEED = 0.0022;
const GLOBE_TILT = 0.32;

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
    gl_FragColor = vec4(0.25, 0.65, 0.95, 1.0) * intensity;
  }
`;

type GlobeRendererProps = {
  markerLat: number;
  markerLng: number;
  ready: boolean;
  setReady: Dispatch<SetStateAction<boolean>>;
  setRenderError: Dispatch<SetStateAction<boolean>>;
};

/**
 * The heavy renderer lives in its own conditional chunk. Three.js is imported
 * only after the location card is actually visible, and every GPU/resource
 * handle is disposed when the card leaves the viewport.
 */
export function GlobeRenderer({ markerLat, markerLng, ready, setReady, setRenderError }: GlobeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = event.clientX - dragDeltaRef.current;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (pointerStartRef.current !== null) {
        dragDeltaRef.current = event.clientX - pointerStartRef.current;
      }
    };
    const onPointerUp = () => {
      pointerStartRef.current = null;
      if (containerRef.current) containerRef.current.style.cursor = "grab";
    };

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
    let disposeRenderer = () => {};
    setReady(false);

    void import("three")
      .then((THREE) => {
        if (disposed) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.z = 2.85;

        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (error) {
          console.error("Failed to initialize globe renderer.", error);
          setRenderError(true);
          return;
        }

        renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 2.1));
        const sun = new THREE.DirectionalLight(0xffffff, 1.6);
        sun.position.set(4, 2.5, 5);
        scene.add(sun);

        const globeGroup = new THREE.Group();
        globeGroup.rotation.x = GLOBE_TILT;
        scene.add(globeGroup);

        const sphereGeometry = new THREE.SphereGeometry(1, 40, 40);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: new THREE.Color(0x223344),
          shininess: 9,
        });
        const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
        globeGroup.add(globe);

        const atmosphereGeometry = new THREE.SphereGeometry(1, 40, 40);
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

        const phi = ((90 - markerLat) * Math.PI) / 180;
        const theta = ((markerLng + 180) * Math.PI) / 180;
        const markerPosition = new THREE.Vector3(
          -1.005 * Math.sin(phi) * Math.cos(theta),
          1.005 * Math.cos(phi),
          1.005 * Math.sin(phi) * Math.sin(theta),
        );
        const markerGroup = new THREE.Group();
        markerGroup.position.copy(markerPosition);
        markerGroup.lookAt(markerPosition.clone().multiplyScalar(2));
        globe.add(markerGroup);

        const markerDotGeometry = new THREE.SphereGeometry(0.02, 16, 16);
        const markerDotMaterial = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
        markerGroup.add(new THREE.Mesh(markerDotGeometry, markerDotMaterial));

        const markerRingMaterial = new THREE.MeshBasicMaterial({
          color: 0x4ade80,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const markerRingGeometry = new THREE.RingGeometry(0.032, 0.044, 32);
        const markerRing = new THREE.Mesh(markerRingGeometry, markerRingMaterial);
        markerGroup.add(markerRing);

        const baseRotation = -Math.atan2(markerPosition.x, markerPosition.z);
        let spin = 0;
        let texture: { dispose: () => void } | null = null;
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin("anonymous");
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
        let frame = 0;
        let lastRender = 0;
        const animate = (timestamp: number) => {
          frame = window.requestAnimationFrame(animate);
          if (timestamp - lastRender < 1000 / 30) return;
          lastRender = timestamp;
          timer.update(timestamp);
          if (pointerStartRef.current === null) spin += AUTO_SPIN_SPEED;
          globe.rotation.y = baseRotation + spin + dragDeltaRef.current / 200;

          const pulsePhase = Math.sin(timer.getElapsed() * 2.6);
          markerRing.scale.setScalar(1 + 0.35 * pulsePhase);
          markerRingMaterial.opacity = 0.75 - 0.35 * pulsePhase;
          renderer.render(scene, camera);
        };
        frame = window.requestAnimationFrame(animate);

        disposeRenderer = () => {
          window.cancelAnimationFrame(frame);
          timer.dispose();
          resizeObserver.disconnect();
          texture?.dispose();
          sphereGeometry.dispose();
          sphereMaterial.dispose();
          atmosphereGeometry.dispose();
          atmosphereMaterial.dispose();
          markerDotGeometry.dispose();
          markerDotMaterial.dispose();
          markerRingGeometry.dispose();
          markerRingMaterial.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch((error) => {
        if (disposed) return;
        console.error("Failed to load globe renderer.", error);
        setRenderError(true);
      });

    return () => {
      disposed = true;
      disposeRenderer();
      setReady(false);
    };
  }, [markerLat, markerLng, setReady, setRenderError]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      data-ready={ready}
      className="absolute inset-0 z-10 cursor-grab touch-none overflow-hidden rounded-full opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
    />
  );
}
