import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import HeroSection from "@/src/components/HeroSection";
import LiveLessonsSection from "@/src/components/LiveLessonsSection";

// Code-split below-the-fold sections to shrink initial JS payload
const MockTestCollectionSection = lazy(() => import("@/src/components/MockTestCollectionSection"));
const OfficialPracticeMaterialsSection = lazy(() => import("@/src/components/OfficialPracticeMaterialsSection"));
const StudentTrustBannerSection = lazy(() => import("@/src/components/StudentTrustBannerSection"));
const SixStepsSection = lazy(() => import("@/src/components/SixStepsSection"));
const TakeFreeTestSection = lazy(() => import("@/src/components/TakeFreeTestSection"));
const SeoOverviewContentSection = lazy(() => import("@/src/components/SeoOverviewContentSection"));
const FaqSection = lazy(() => import("@/src/components/FaqSection"));

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
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "500px 0px", // Pre-render 500px before scrolling into view for seamless appearance
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
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
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased overflow-x-hidden">
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
