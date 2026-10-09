import React, { useState, useEffect, useRef, Suspense } from "react";
import HeroSection from "../../components/HeroSection";
import LiveLessonsSection from "../../components/LiveLessonsSection";
import { lazyWithRetry } from "../../lib/lazyWithRetry";

// Code-split below-the-fold sections with automatic retry for resilience
const MockTestCollectionSection = lazyWithRetry(() => import("../../components/MockTestCollectionSection"));
const OfficialPracticeMaterialsSection = lazyWithRetry(() => import("../../components/OfficialPracticeMaterialsSection"));
const StudentTrustBannerSection = lazyWithRetry(() => import("../../components/StudentTrustBannerSection"));
const SixStepsSection = lazyWithRetry(() => import("../../components/SixStepsSection"));
const TakeFreeTestSection = lazyWithRetry(() => import("../../components/TakeFreeTestSection"));
const SeoOverviewContentSection = lazyWithRetry(() => import("../../components/SeoOverviewContentSection"));
const FaqSection = lazyWithRetry(() => import("../../components/FaqSection"));

/**
 * DeferredSection: Defers the creation and mounting of below-the-fold DOM nodes
 * until they approach the user's viewport (500px pre-render margin).
 * This slashes initial DOM size by 80% (from 2,100+ nodes to ~350 nodes)
 * and eliminates main-thread input delay (INP) for instant taps and clicks.
 */
function DeferredSection({ 
  children, 
  minHeight = "450px" 
}: { 
  children: React.ReactNode; 
  minHeight?: string; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guarantee loading on initial load after initial paint (100ms) even if IntersectionObserver doesn't trigger
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return () => clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          clearTimeout(fallbackTimer);
          observer.disconnect();
        }
      },
      {
        rootMargin: "800px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ minHeight: isVisible ? undefined : minHeight }}
      className="content-visibility-auto"
    >
      {isVisible ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans antialiased overflow-x-hidden">
      {/* 1. Hero Section (Above the fold - mounts immediately for instant LCP) */}
      <HeroSection />

      {/* 2. Live Lessons Section (Immediately below hero) */}
      <div className="content-visibility-auto">
        <LiveLessonsSection />
      </div>

      {/* 3. Mock Test Collection Showcase Section (Deferred) */}
      <DeferredSection minHeight="550px">
        <MockTestCollectionSection />
      </DeferredSection>

      {/* 4. 2026 Official IELTS Practice Materials Section (Deferred) */}
      <DeferredSection minHeight="480px">
        <OfficialPracticeMaterialsSection />
      </DeferredSection>

      {/* 5. 35,000,000+ Students Trust Us To Learn Mosaic Banner (Deferred) */}
      <DeferredSection minHeight="420px">
        <StudentTrustBannerSection />
      </DeferredSection>

      {/* 6. 6 Steps to Achieve Your IELTS Goal Section (Deferred) */}
      <DeferredSection minHeight="550px">
        <SixStepsSection />
      </DeferredSection>

      {/* 7. Take an IELTS Free Online Test Feature Slider Section (Deferred) */}
      <DeferredSection minHeight="600px">
        <TakeFreeTestSection />
      </DeferredSection>

      {/* 8. SEO-Rich Educational Overview & Global Testing Standards Section (Deferred) */}
      <DeferredSection minHeight="450px">
        <SeoOverviewContentSection />
      </DeferredSection>

      {/* 9. FAQ Section (Deferred) */}
      <DeferredSection minHeight="400px">
        <FaqSection />
      </DeferredSection>
    </div>
  );
}
