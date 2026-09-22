import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowUpRight, Phone, MessageCircle, X, ExternalLink, ShieldCheck } from "lucide-react";
import { fetchSiteSettings, defaultCarouselSlides, CarouselSlide } from "@/src/lib/settings";
import OptimizedImage from "@/src/components/ui/OptimizedImage";

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>(() => {
    try {
      const stored = localStorage.getItem("carousel_slides");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return defaultCarouselSlides;
  });
  const [slideTimer, setSlideTimer] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("carousel_timer");
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 6.5;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const syncHeroSettings = () => {
      fetchSiteSettings(true).then((settings) => {
        let slidesData = settings?.carousel_slides;
        if (typeof slidesData === "string") {
          try {
            slidesData = JSON.parse(slidesData);
          } catch (e) {}
        }
        if (slidesData && Array.isArray(slidesData) && slidesData.length > 0) {
          setSlides(slidesData);
        }
        if (settings?.carousel_timer) {
          setSlideTimer(Number(settings.carousel_timer) || 6.5);
        }
      }).catch(console.error);
    };
    syncHeroSettings();
    window.addEventListener("storage", syncHeroSettings);
    window.addEventListener("site_settings_updated", syncHeroSettings);
    return () => {
      window.removeEventListener("storage", syncHeroSettings);
      window.removeEventListener("site_settings_updated", syncHeroSettings);
    };
  }, []);

  const safeCurrentSlide = slides.length > 0 ? currentSlide % slides.length : 0;

  // Auto-advance slides based on backend timer
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const intervalTime = Math.max(2, slideTimer) * 1000;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slideTimer, slides.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const activeSlide = slides[safeCurrentSlide] || defaultCarouselSlides[0];

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = "";
    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split("?")[0] || "";
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&playsinline=1`;
    }
    return url;
  };

  const renderHeading = (text?: string) => {
    if (!text) return null;
    if (text.includes("|")) {
      const parts = text.split("|");
      return (
        <>
          {parts[0]}
          <span className="text-[#00a8cc] font-black border-r-2 border-[#00a8cc] pr-1 mr-1 inline-block animate-pulse">
            |
          </span>
          {parts.slice(1).join("|")}
        </>
      );
    }
    return text;
  };

  return (
    <section 
      className="relative w-full h-[520px] sm:h-[580px] md:h-[640px] lg:h-[700px] overflow-hidden text-white font-sans bg-slate-950 select-none group border-b border-slate-900"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      aria-label="Hero Carousel Banner"
    >
      {/* Dynamic Full-Bleed Slide Background & Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id || `slide-${safeCurrentSlide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Full-Cover Background Media Layer */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {activeSlide.type === "video" ? (
              activeSlide.mediaUrl.includes("youtube.com") || activeSlide.mediaUrl.includes("youtu.be") ? (
                <iframe
                  src={getYouTubeEmbedUrl(activeSlide.mediaUrl)}
                  title={activeSlide.mediaAlt || "Hero Background Video"}
                  className="absolute inset-0 w-full h-full object-cover scale-125 pointer-events-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeSlide.mediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )
            ) : (
              <img
                src={activeSlide.mediaUrl || "/ielts_prep_banner_960.webp"}
                alt={activeSlide.mediaAlt || "Hero section banner"}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-1000 ease-out group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== "/ielts_prep_banner_960.webp") {
                    target.src = "/ielts_prep_banner_960.webp";
                  }
                }}
              />
            )}
          </div>

          {/* Foreground Hero Content Layer */}
          <div className="relative z-20 h-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center py-10 sm:py-16">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              
              {/* Slide Heading */}
              {activeSlide.heading && (
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase leading-[1.12] drop-shadow-xl max-w-4xl mx-auto">
                  {renderHeading(activeSlide.heading)}
                </h1>
              )}

              {/* Subheading */}
              {activeSlide.subheading && (
                <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl mx-auto drop-shadow-md leading-relaxed">
                  {activeSlide.subheading}
                </p>
              )}

            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Carousel Navigation Arrows (Left & Right) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Floating Bottom Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentSlide(idx);
              }}
              className="p-1 flex items-center justify-center cursor-pointer"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 block ${
                  idx === safeCurrentSlide
                    ? "w-8 bg-[#00a8cc] shadow-md shadow-cyan-400/60"
                    : "w-2 bg-white/40 hover:bg-white/80"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Contact Options Dialog (WhatsApp & Direct Call) */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative"
            >
              <div className="p-6 bg-gradient-to-r from-sky-500 to-[#00a8cc] text-white relative">
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold">Connect With Us</h3>
                <p className="text-sky-100 text-sm mt-1">Get fast answers for your IELTS goals</p>
              </div>

              <div className="p-6 space-y-4">
                <a
                  href="https://wa.me/971500000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/70 transition-all text-emerald-950 font-bold group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Chat on WhatsApp</div>
                      <div className="text-xs text-emerald-700 font-normal">Instant counselor chat</div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="tel:+971500000000"
                  className="flex items-center justify-between p-4 rounded-2xl bg-sky-50 border border-sky-200/80 hover:bg-sky-100/70 transition-all text-sky-950 font-bold group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Direct Phone Call</div>
                      <div className="text-xs text-sky-700 font-normal">Speak directly with advisor</div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-sky-600 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
