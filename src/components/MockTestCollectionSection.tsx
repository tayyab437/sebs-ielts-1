import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { ArrowUpRight, VolumeX, Volume2, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSiteSettings } from "@/src/lib/settings";

const SecureVideoPlayer = lazy(() => import("@/src/components/common/SecureVideoPlayer"));

const FALLBACK_YOUTUBE_EMBED = "https://www.youtube-nocookie.com/embed/yY-7o-q9M7U?autoplay=1&mute=1&loop=1&playlist=yY-7o-q9M7U&controls=1&modestbranding=1&rel=0";

function parseVideoSource(url: string) {
  if (!url) return { type: "fallback", embedUrl: FALLBACK_YOUTUBE_EMBED };
  const trimmed = url.trim();

  // YouTube match
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "iframe",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=1&modestbranding=1&rel=0`
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "iframe",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`
    };
  }

  return {
    type: "direct",
    src: trimmed
  };
}

export default function MockTestCollectionSection() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [rawVideoUrl, setRawVideoUrl] = useState("https://www.youtube.com/watch?v=yY-7o-q9M7U");
  const [videoError, setVideoError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchSiteSettings().then(settings => {
      if (settings.mock_test_promo_video_url) {
        setRawVideoUrl(settings.mock_test_promo_video_url);
        setVideoError(false);
      }
    });
  }, []);

  // IntersectionObserver to detect when section is scrolled into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => {
      observer.unobserve(container);
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Sync play/pause with scroll visibility
  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView]);

  const parsed = parseVideoSource(rawVideoUrl);

  return (
    <section className="w-full bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-10 text-center">
        
        {/* Section Title */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#1e293b] leading-tight">
            Explore Our Collection of <br className="hidden sm:inline" />
            <span className="text-[#00a8cc]">International Standard</span> IELTS Mock Tests
          </h2>

          {/* Subtitle with Teal Accent Flanks */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-r from-transparent to-[#00a8cc]" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
              Designed to closely reflect the format, timing and question types of the IELTS exam.
            </p>
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-l from-transparent to-[#00a8cc]" />
          </div>
        </div>

        {/* Center Main Feature Banner Container */}
        <div 
          ref={containerRef}
          className="relative max-w-5xl mx-auto rounded-[28px] overflow-hidden shadow-2xl bg-black aspect-video flex items-center justify-center group"
        >
          {!isInView ? (
            /* Stopped state when out of viewport */
            <div 
              className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white cursor-pointer group"
              onClick={() => setIsInView(true)}
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format,compress&fm=webp&w=600&q=75"
                alt="IELTS Prep Video Showcase Poster"
                loading="lazy"
                decoding="async"
                width={600}
                height={338}
                style={{ aspectRatio: "16 / 9" }}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity aspect-video"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00a8cc] group-hover:scale-110 flex items-center justify-center text-white shadow-2xl transition-transform">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">IELTS Official Test Showcase</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">Scroll here or click play to start video preview</p>
              </div>
            </div>
          ) : parsed.type === "iframe" || videoError ? (
            <Suspense fallback={<div className="w-full h-full bg-slate-900 animate-pulse rounded-[28px]" />}>
              <SecureVideoPlayer
                url={rawVideoUrl}
                title="SEBS Official Masterclass Showcase"
                className="w-full h-full rounded-[28px] border-none shadow-none"
              />
            </Suspense>
          ) : (
            <>
              <video 
                ref={videoRef}
                src={parsed.src} 
                preload="none"
                loop 
                muted={isMuted}
                playsInline
                autoPlay
                onError={() => {
                  console.warn("Native video file failed to load. Falling back to default showcase embed:", parsed.src);
                  setVideoError(true);
                }}
                className="w-full h-full object-cover"
              />
              
              {/* Custom Sound Toggle Button Overlay */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/20 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </>
          )}
        </div>

        {/* CTA Button Below Main Showcase */}
        <div className="flex justify-center pt-2">
          <Link
            to="/about"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs sm:text-sm tracking-wider uppercase pl-6 sm:pl-7 pr-2 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 cursor-pointer group"
          >
            <span>SERVING SINCE 1992</span>
            <div className="w-8 h-8 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4.5 h-4.5" />
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
