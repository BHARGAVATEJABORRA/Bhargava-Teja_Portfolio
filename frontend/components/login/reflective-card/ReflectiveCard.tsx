"use client";

import { useEffect, useRef } from "react";
import { LuActivity, LuFingerprint, LuLock } from "react-icons/lu";

import "./ReflectiveCard.css";

export type ReflectiveAuthStatus = "idle" | "authenticating" | "success" | "error";

type ReflectiveCardProps = {
  blurStrength?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  overlayColor?: string;
  displacementStrength?: number;
  noiseScale?: number;
  specularConstant?: number;
  grayscale?: number;
  glassDistortion?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Header/body/footer copy so the card can be reused for the login gate. */
  badgeLabel?: string;
  userName?: string;
  userRole?: string;
  idLabel?: string;
  idValue?: string;
  /** Auth wiring. When provided, the fingerprint area becomes an action button. */
  onFingerprint?: () => void;
  status?: ReflectiveAuthStatus;
  statusMessage?: string;
  actionLabel?: string;
};

const ReflectiveCard = ({
  blurStrength = 12,
  color = "white",
  metalness = 1,
  roughness = 0.4,
  overlayColor = "rgba(255, 255, 255, 0.1)",
  displacementStrength = 20,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 1,
  glassDistortion = 0,
  className = "",
  style = {},
  badgeLabel = "SECURE ACCESS",
  userName = "ADMIN ACCESS",
  userRole = "TOUCH ID REQUIRED",
  idLabel = "PASSKEY",
  idValue = "•••• •••• ••••",
  onFingerprint,
  status = "idle",
  statusMessage,
  actionLabel = "Touch ID to continue",
}: ReflectiveCardProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
  const saturation = 1 - Math.max(0, Math.min(1, grayscale));

  const cssVariables = {
    "--blur-strength": `${blurStrength}px`,
    "--metalness": metalness,
    "--roughness": roughness,
    "--overlay-color": overlayColor,
    "--text-color": color,
    "--saturation": saturation,
  } as React.CSSProperties;

  const isBusy = status === "authenticating";
  const interactive = typeof onFingerprint === "function";

  return (
    <div className={`reflective-card-container ${className}`} style={{ ...style, ...cssVariables }} data-status={status}>
      <svg className="reflective-svg-filters" aria-hidden="true">
        <defs>
          <filter id="metallic-displacement" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency={baseFrequency} numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rippled"
            />
            <feSpecularLighting
              in="noiseAlpha"
              surfaceScale={displacementStrength}
              specularConstant={specularConstant}
              specularExponent="20"
              lightingColor="#ffffff"
              result="light"
            >
              <fePointLight x="0" y="0" z="300" />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="solidAlpha"
            />
            <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope="0.5" intercept="0" />
            </feComponentTransfer>
            <feDisplacementMap
              in="metallic-result"
              in2="glassMap"
              scale={glassDistortion}
              xChannelSelector="A"
              yChannelSelector="A"
              result="final"
            />
          </filter>
        </defs>
      </svg>

      <video ref={videoRef} autoPlay playsInline muted className="reflective-video" />
      <div className="reflective-noise" />
      <div className="reflective-sheen" />
      <div className="reflective-border" />

      <div className="reflective-content">
        <div className="card-header">
          <div className="security-badge">
            <LuLock size={14} className="security-icon" />
            <span>{badgeLabel}</span>
          </div>
          <LuActivity className="status-icon" size={20} />
        </div>

        <div className="card-body">
          <div className="user-info">
            <h2 className="user-name">{userName}</h2>
            <p className="user-role">{userRole}</p>
          </div>
          {statusMessage ? <p className={`auth-status auth-status-${status}`}>{statusMessage}</p> : null}
        </div>

        <div className="card-footer">
          <div className="id-section">
            <span className="label">{idLabel}</span>
            <span className="value">{idValue}</span>
          </div>

          {interactive ? (
            <button
              type="button"
              className="fingerprint-button"
              onClick={onFingerprint}
              disabled={isBusy}
              aria-label={actionLabel}
              aria-busy={isBusy}
              title={actionLabel}
            >
              <LuFingerprint size={32} className="fingerprint-icon" />
            </button>
          ) : (
            <div className="fingerprint-section">
              <LuFingerprint size={32} className="fingerprint-icon" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReflectiveCard;
