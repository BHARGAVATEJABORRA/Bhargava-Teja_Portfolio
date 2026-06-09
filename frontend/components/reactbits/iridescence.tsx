"use client";

import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef, type CSSProperties } from "react";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps {
  /** Base color as RGB values, each 0..1. */
  color?: [number, number, number];
  /** Speed multiplier for the animation. */
  speed?: number;
  /** Amplitude of the mouse-driven offset. */
  amplitude?: number;
  /** Enable mouse interaction with the shader. */
  mouseReact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Iridescence({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  className,
  style,
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cap DPR: full WebGL at native pixel density is wasteful for a soft
    // gradient field, and punishing on mobile GPUs.
    const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.5 : 2);

    const renderer = new Renderer({ dpr, alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) {
        return;
      }
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      );
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    container.appendChild(gl.canvas);

    // Paint an immediate frame so the field is visible even before the first
    // requestAnimationFrame callback (and in reduced-motion / slow-rAF cases).
    renderer.render({ scene: mesh });

    let animateId = 0;
    let running = false;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }

    function start() {
      if (running || prefersReducedMotion) {
        // Still paint a single frame so reduced-motion users see the field.
        if (prefersReducedMotion) {
          renderer.render({ scene: mesh });
        }
        return;
      }
      running = true;
      animateId = requestAnimationFrame(update);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(animateId);
    }

    function handleVisibility() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    function handleMouseMove(event: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1.0 - (event.clientY - rect.top) / rect.height;
      mousePos.current = { x, y };
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    }

    document.addEventListener("visibilitychange", handleVisibility);
    if (mouseReact) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      resizeObserver.disconnect();
      if (mouseReact) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, speed, amplitude, mouseReact]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ ...style, overflow: "hidden" }}
    />
  );
}

export default Iridescence;
