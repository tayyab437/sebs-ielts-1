import React, { useState, useEffect, useRef } from "react";
import HeroSection from "../../components/HeroSection";
import LiveLessonsSection from "../../components/LiveLessonsSection";

interface LazySectionProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  minHeight?: string;
  sectionId?: string;
}

/**
 * LazyViewportSection: Only invokes dynamic import() when the section is near the viewport (150px margin).
 * Eliminates below-the-fold component chunks from the initial critical request chain.
 */
function LazyViewportSection({
  loader,
  minHeight = "450px",
  sectionId
}: LazySectionProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("IntersectionObserver" in window)) {
      loader().then(m => setComponent(() => m.default)).catch(console.error);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loader().then(m => setComponent(() => m.default)).catch(console.error);
          observer.disconnect();
        }
      },
      {
        rootMargin: "150px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loader]);

  return (
    <div
      ref={containerRef}
      id={sectionId}
      style={{ minHeight: Component ? undefined : minHeight }}
      className="content-visibility-auto"
    >
      {Component ? <Component /> : null}
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

      {/* 3. Mock Test Collection Showcase Section (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/MockTestCollectionSection")}
        minHeight="550px"
      />

      {/* 4. 2026 Official IELTS Practice Materials Section (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/OfficialPracticeMaterialsSection")}
        minHeight="480px"
      />

      {/* 5. 35,000,000+ Students Trust Us To Learn Mosaic Banner (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/StudentTrustBannerSection")}
        minHeight="420px"
      />

      {/* 6. 6 Steps to Achieve Your IELTS Goal Section (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/SixStepsSection")}
        minHeight="550px"
      />

      {/* 7. Take an IELTS Free Online Test Feature Slider Section (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/TakeFreeTestSection")}
        minHeight="600px"
      />

      {/* 8. SEO-Rich Educational Overview & Global Testing Standards Section (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/SeoOverviewContentSection")}
        minHeight="450px"
      />

      {/* 9. FAQ Section (Lazy-loaded upon scroll) */}
      <LazyViewportSection 
        loader={() => import("../../components/FaqSection")}
        minHeight="400px"
      />
    </div>
  );
}
