import React, { useState } from "react";

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean; // Eager + high priority for above-the-fold/hero images
  sizes?: string;
  aspectRatio?: string; // e.g. "16/9", "4/3", "1/1"
  className?: string;
  fallbackSrc?: string;
}

/**
 * Optimizes Unsplash image URLs with modern WebP formatting, quality & responsive width parameters.
 */
export function getOptimizedImageUrl(url: string, targetWidth: number = 400, format: "webp" | "avif" | "auto" = "webp"): string {
  if (!url) return "";
  
  if (url.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("w", String(targetWidth));
      parsed.searchParams.set("auto", "format,compress");
      if (format !== "auto") {
        parsed.searchParams.set("fm", format);
      }
      parsed.searchParams.set("q", "70");
      return parsed.toString();
    } catch {
      return url;
    }
  }
  
  return url;
}

/**
 * Generates dynamic responsive srcSet candidates for Unsplash images.
 */
export function generateUnsplashSrcSet(url: string): string | undefined {
  if (!url || !url.includes("images.unsplash.com")) return undefined;
  
  const widths = [300, 400, 600, 800];
  return widths
    .map(w => `${getOptimizedImageUrl(url, w, "webp")} ${w}w`)
    .join(", ");
}

/**
 * Production-grade OptimizedImage component:
 * - Prevents CLS with explicit dimensions or aspect-ratio
 * - Applies lazy loading & async decoding for below-the-fold images
 * - Applies priority="eager" & fetchPriority="high" for hero images
 * - Generates WebP srcset for Unsplash images
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  aspectRatio,
  className = "",
  fallbackSrc,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || "");
  const [hasError, setHasError] = useState(false);

  const isUnsplash = typeof imgSrc === "string" && imgSrc.includes("images.unsplash.com");
  
  const targetW = typeof width === "number" ? width : 500;
  const optimizedSrc = isUnsplash ? getOptimizedImageUrl(imgSrc, targetW, "webp") : imgSrc;
  const srcSet = isUnsplash ? generateUnsplashSrcSet(imgSrc) : undefined;

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      // @ts-ignore fetchPriority is natively supported in modern browsers
      fetchPriority={priority ? "high" : "low"}
      referrerPolicy="no-referrer"
      style={aspectRatio ? { aspectRatio, ...props.style } : props.style}
      className={`object-cover transition-opacity duration-300 ${className}`}
      onError={(e) => {
        if (!hasError && fallbackSrc) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
        if (props.onError) {
          props.onError(e);
        }
      }}
      {...props}
    />
  );
}

export default OptimizedImage;
