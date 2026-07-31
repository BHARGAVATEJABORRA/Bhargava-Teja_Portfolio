'use client';

import { useCallback, useEffect, useRef, useId, useSyncExternalStore } from 'react';
import { getGlassDisplacementImage } from '@/lib/glass-displacement-map';
import './glass-surface.css';

interface GlassSurfaceProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function GlassSurface({
  children,
  width = '100%',
  height = '100%',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  // Softened from -180 + chromatic separation disabled so high-contrast
  // edges behind the glass don't produce visible RGB cross-stripes.
  distortionScale = -90,
  redOffset = 0,
  greenOffset = 0,
  blueOffset = 0,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {}
}: GlassSurfaceProps) {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;

  const supportsSVGFilters = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    if (isWebkit || isFirefox) {
      return false;
    }

    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;

    return div.style.backdropFilter !== '';
  };

  // Feature-detect SVG backdrop filters. useSyncExternalStore keeps this
  // SSR-safe (server renders `false`, client resolves the real value) without a
  // setState-in-effect.
  const svgSupported = useSyncExternalStore(
    () => () => {},
    () => supportsSVGFilters(),
    () => false,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const generateDisplacementMap = useCallback((measuredWidth?: number, measuredHeight?: number) => {
    const rect =
      measuredWidth === undefined || measuredHeight === undefined
        ? containerRef.current?.getBoundingClientRect()
        : null;
    return getGlassDisplacementImage({
      width: measuredWidth ?? rect?.width ?? 400,
      height: measuredHeight ?? rect?.height ?? 200,
      radius: borderRadius,
      border: borderWidth,
      lightness: brightness,
      alpha: opacity,
      blur,
      blendMode: mixBlendMode,
      transparentGradientStart: true,
    });
  }, [blur, borderRadius, borderWidth, brightness, mixBlendMode, opacity]);

  const updateDisplacementMap = useCallback((measuredWidth?: number, measuredHeight?: number) => {
    if (feImageRef.current) {
      feImageRef.current.setAttribute('href', generateDisplacementMap(measuredWidth, measuredHeight));
    }
  }, [generateDisplacementMap]);

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    if (gaussianBlurRef.current) {
      gaussianBlurRef.current.setAttribute('stdDeviation', displace.toString());
    }
  }, [
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
    updateDisplacementMap
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    let frame = 0;
    let nextWidth = 0;
    let nextHeight = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      nextWidth = entry.contentRect.width;
      nextHeight = entry.contentRect.height;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateDisplacementMap(nextWidth, nextHeight);
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [updateDisplacementMap]);

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': `url(#${filterId})`
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${svgSupported ? 'glass-surface--svg' : 'glass-surface--fallback'} ${className}`}
      style={containerStyle}
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage 
              ref={feImageRef} 
              x="0" 
              y="0" 
              width="100%" 
              height="100%" 
              preserveAspectRatio="none" 
              result="map" 
            />

            <feDisplacementMap 
              ref={redChannelRef} 
              in="SourceGraphic" 
              in2="map" 
              id="redchannel" 
              result="dispRed" 
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap
              ref={greenChannelRef}
              in="SourceGraphic"
              in2="map"
              id="greenchannel"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap 
              ref={blueChannelRef} 
              in="SourceGraphic" 
              in2="map" 
              id="bluechannel" 
              result="dispBlue" 
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      <div className="glass-surface__content">{children}</div>
    </div>
  );
}
