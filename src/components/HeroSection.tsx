import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles, Phone, MessageCircle, X, ExternalLink, ShieldCheck } from "lucide-react";
import OptimizedImage from "@/src/components/ui/OptimizedImage";

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const navigate = useNavigate();

  // Auto-advance slides every 6.5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % 3);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + 3) % 3);
  };

  return (
    <div 
      className="relative w-full bg-gradient-to-b from-[#f0f9ff] via-[#e6f7ff] to-white text-[#1e293b] overflow-hidden py-6 sm:py-8 border-b border-sky-100 font-sans"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Soft Light Cyan Background Rays Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/70 via-cyan-50/40 to-transparent pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Responsive Carousel Viewport to PREVENT layout shift during slide changes */}
        <div className="min-h-[540px] sm:min-h-[560px] md:min-h-[580px] h-auto w-full relative flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ==========================================
                SLIDE 0: THE #1 GLOBAL| IELTS ONLINE STUDY PLATFORM
               ========================================== */}
            {currentSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full h-full flex flex-col justify-between items-center py-2"
              >
                {/* Header Typography */}
                <div className="max-w-4xl mx-auto text-center space-y-2">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1e293b] uppercase leading-tight">
                    THE <span className="text-[#00a8cc] font-black border-r-2 border-[#00a8cc] pr-1 mr-1 inline-block animate-pulse">#1 GLOBAL|</span> IELTS ONLINE STUDY PLATFORM
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium max-w-2xl mx-auto">
                    Master IELTS Band 8.5 &amp; spoken English with Syed Ejaz Bukhari. Achieve your dream band score with one click!
                  </p>

                  {/* Two Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    {/* EXPLORE IELTS COURSES */}
                    <Link
                      to="/courses"
                      className="bg-white hover:bg-sky-50 text-[#1e293b] font-extrabold text-xs sm:text-sm uppercase tracking-wider border-2 border-[#00a8cc] pl-5 pr-2 py-2 min-h-[44px] sm:min-h-[48px] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <span>Explore IELTS Courses</span>
                      <div className="w-6 h-6 rounded-full border border-[#00a8cc] flex items-center justify-center text-[#00a8cc]">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>

                    {/* CONTACT US */}
                    <button
                      onClick={() => setIsContactModalOpen(true)}
                      className="bg-[#1e293b] hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider pl-5 pr-2 py-2 min-h-[44px] sm:min-h-[48px] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <span>CONTACT US</span>
                      <div className="w-6 h-6 rounded-full bg-[#00a8cc] flex items-center justify-center text-white">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Main Hero Banner with Laptop Student & Badges */}
                <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-xl border border-sky-100 group mt-3">
                  <picture>
                    <source
                      type="image/webp"
                      srcSet="/ielts_prep_banner_640.webp 640w, /ielts_prep_banner_960.webp 960w, /ielts_prep_banner.webp 1200w"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 960px, 1200px"
                    />
                    <img
                      src="/ielts_prep_banner_960.webp"
                      alt="Student practicing IELTS test on laptop"
                      fetchPriority="high"
                      loading="eager"
                      decoding="async"
                      width={960}
                      height={524}
                      className="w-full h-[250px] sm:h-[290px] md:h-[310px] object-cover object-top filter brightness-[0.94]"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Bottom Left Glass Badge */}
                  <div className="absolute bottom-4 left-4 sm:left-6 z-10">
                    <div className="bg-white/30 backdrop-blur-md border border-white/60 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-2xl shadow-xl">
                      Take a <span className="font-extrabold">Free Online Test</span>, Get Your <span className="font-extrabold">Score The Best!</span>
                    </div>
                  </div>

                  {/* Bottom Right Glass Badge */}
                  <div className="absolute bottom-4 right-4 sm:right-6 z-10">
                    <div className="bg-white/30 backdrop-blur-md border border-white/60 text-white px-4 py-2 rounded-2xl shadow-xl text-center">
                      <div className="text-base sm:text-xl font-black leading-none">80.000.000+</div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-100 pt-0.5">test attempts</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                SLIDE 1: PROUD TO BE PLATINUM PARTNER OF BRITISH COUNCIL AND IDP|
               ========================================== */}
            {currentSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full flex flex-col justify-between items-center py-1 text-center"
              >
                {/* Heading EXACT REPLICA from Image */}
                <div className="max-w-4xl mx-auto space-y-1">
                  <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold tracking-tight text-[#1e293b] leading-tight">
                    Proud to be <span className="text-[#00a8cc] font-black">PLATINUM PARTNER</span> of the{" "}
                    <span className="text-[#00a8cc] font-black">BRITISH COUNCIL</span> and{" "}
                    <span className="text-[#00a8cc] font-black inline-flex items-center">IDP<span className="animate-pulse text-[#00a8cc] font-light">|</span></span> for many years
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium pt-1">
                    The credibility and quality of the IELTS Online Tests are globally recognized
                  </p>
                </div>

                {/* Certificate & Trophy Graphic Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-center w-full mt-2">
                  
                  {/* Left: British Council Platinum Certificate Card */}
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xl flex flex-col justify-between h-[260px] sm:h-[285px] group">
                    {/* Floating British Council Glass Logo Badge (Top-Left) */}
                    <div className="absolute -top-3 left-3 sm:left-4 bg-white/90 backdrop-blur-md border border-white/90 shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2 z-20">
                      <div className="grid grid-cols-2 gap-1 w-4 h-4">
                        <div className="bg-[#00a8cc] rounded-full" />
                        <div className="bg-[#00a8cc] rounded-full" />
                        <div className="bg-[#00a8cc] rounded-full" />
                        <div className="bg-[#00a8cc] rounded-full" />
                      </div>
                      <div className="text-left leading-tight">
                        <div className="text-[11px] font-black text-[#1e293b] tracking-wider">BRITISH</div>
                        <div className="text-[11px] font-black text-[#1e293b] tracking-wider">COUNCIL</div>
                      </div>
                    </div>

                    {/* Framed Certificate Mockup */}
                    <div className="mt-3 border-[6px] border-slate-100 ring-1 ring-slate-300/80 rounded-xl p-3.5 bg-gradient-to-b from-white to-slate-50 text-center space-y-2 h-full flex flex-col justify-between shadow-inner">
                      {/* Certificate Header */}
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-700 border-b border-slate-200/80 pb-1.5">
                        <div className="flex items-center gap-1">
                          <div className="grid grid-cols-2 gap-0.5 w-2.5 h-2.5">
                            <div className="bg-slate-800 rounded-full" />
                            <div className="bg-slate-800 rounded-full" />
                            <div className="bg-slate-800 rounded-full" />
                            <div className="bg-slate-800 rounded-full" />
                          </div>
                          <span className="font-extrabold text-[#1e293b]">BRITISH COUNCIL</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-[#1e293b]">BRITISH</span>
                          <span className="font-black text-red-600 text-xs">IELTS</span>
                        </div>
                      </div>

                      {/* Certificate Content */}
                      <div className="space-y-1">
                        <div className="text-[9px] text-slate-500 italic">This is to certify that</div>
                        <div className="text-sm sm:text-base font-black text-red-600 uppercase tracking-tight">
                          InterGreat Education Group
                        </div>
                        <div className="text-[9px] text-slate-600 font-medium">
                          Is an IELTS Registration Centre and a
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest border-y border-slate-300/80 py-0.5 max-w-[200px] mx-auto">
                          Platinum Member
                        </div>
                        <div className="text-[8px] text-slate-500">
                          of the British Council Partnership Programme
                        </div>
                      </div>

                      {/* Certificate Footer Seals */}
                      <div className="flex justify-between items-end text-[8px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1 text-red-600">
                          <div className="w-5 h-5 rounded-full border border-red-500/80 flex items-center justify-center text-[7px] font-bold">SEAL</div>
                          <span className="text-[7px] font-serif text-slate-600">Verified</span>
                        </div>
                        <div className="w-6 h-4 border border-slate-400 rounded-sm flex items-center justify-center bg-slate-100">
                          <div className="w-4 h-2 bg-slate-300 rounded-xs" />
                        </div>
                        <div className="text-right text-[8px] font-mono text-slate-600">
                          01/04/23 - 31/03/24
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: IDP Platinum Award Trophy Card */}
                  <div className="relative rounded-2xl p-3 sm:p-4 border border-cyan-200/80 shadow-2xl flex flex-col justify-between h-[260px] sm:h-[285px] overflow-hidden bg-gradient-to-br from-[#00a8cc]/10 via-sky-100 to-teal-50 group">
                    
                    {/* Floating IDP Glass Logo Badge (Top-Right) */}
                    <div className="absolute -top-3 right-3 sm:right-4 bg-white/90 backdrop-blur-md border border-white/90 shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2 z-20">
                      <div className="flex items-center gap-0.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      </div>
                      <div className="text-left leading-tight">
                        <div className="text-xs font-black text-[#1e293b] tracking-wider">idp</div>
                        <div className="text-[6px] font-bold text-slate-500 tracking-tighter uppercase">INTERNATIONAL EDUCATION SPECIALISTS</div>
                      </div>
                    </div>

                    {/* Trophy Visual Graphic */}
                    <div className="mt-2 flex flex-col items-center justify-center h-full relative">
                      {/* Crystal Glowing Trophy Object */}
                      <div className="w-32 sm:w-36 h-40 sm:h-44 bg-gradient-to-t from-slate-950 via-indigo-950 to-[#00a8cc] rounded-2xl shadow-xl border-2 border-amber-300 p-3 text-white text-center flex flex-col justify-between relative overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                        {/* Shimmer Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                        <div className="text-[8px] font-black text-amber-300 uppercase tracking-widest border-b border-amber-300/30 pb-0.5">
                          Co-Create The Future
                        </div>
                        
                        <div className="space-y-1 my-auto">
                          <div className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                            PLATINUM PARTNER
                          </div>
                          <div className="text-[7px] font-bold text-slate-200 uppercase tracking-tight">
                            INTERGREAT EDUCATION GROUP
                          </div>
                          <div className="text-[6px] text-amber-200/90 italic">
                            In recognition of outstanding partnership
                          </div>
                        </div>

                        {/* Black Trophy Base */}
                        <div className="bg-slate-950 py-1 px-1 rounded-lg border border-amber-400/40 text-[8px] font-black text-amber-300 uppercase tracking-wider">
                          IDP PARTNER EXCELLENCE AWARDS 2025
                        </div>
                      </div>

                      <p className="text-[11px] font-bold text-slate-700 pt-2">
                        IDP Platinum Partner Excellence Award
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ==========================================
                SLIDE 2: BREAKTHROUGH YOUR BAND SCORE WITH SPECIALIZED IELTS COURSES
               ========================================== */}
            {currentSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full flex flex-col justify-between items-center py-2 text-center"
              >
                {/* Header Typography */}
                <div className="max-w-4xl mx-auto space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1e293b] uppercase leading-tight">
                    <span className="text-[#00a8cc] font-black">BREAKTHROUGH</span> your band score with our{" "}
                    <span className="text-[#00a8cc] font-black">SPECIALIZED</span><span className="animate-pulse text-[#00a8cc]">|</span> IELTS courses
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium pt-0.5">
                    Ready to boost your IELTS score?
                  </p>

                  {/* TAKE FREE IELTS TEST Button */}
                  <div className="flex justify-center pt-1">
                    <Link
                      to="/mock-tests"
                      className="bg-[#1e293b] hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider pl-5 pr-2 py-2 min-h-[44px] sm:min-h-[48px] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <span>Take Free IELTS Test</span>
                      <div className="w-6 h-6 rounded-full bg-[#00a8cc] flex items-center justify-center text-white">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  </div>
                </div>

                {/* 3 Featured Course Student Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto w-full items-stretch mt-2">
                  
                  {/* Card 1: Waving Girl Student with Headphones */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-sky-100 bg-white group hover:shadow-xl transition-all flex flex-col h-[230px] sm:h-[260px]">
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                      alt="IELTS instructor and happy student"
                      width={800}
                      height={260}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

                    {/* Glass Badges Overlay */}
                    <div className="absolute bottom-4 left-3 right-3 z-10 space-y-1.5 text-left">
                      <div className="bg-white/80 backdrop-blur-md border border-white/80 text-[#1e293b] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow inline-flex items-center gap-1.5">
                        <span>⭐</span>
                        <span>IELTS 8.0+ Instructors</span>
                      </div>
                      <div className="bg-white/80 backdrop-blur-md border border-white/80 text-[#1e293b] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow inline-flex items-center gap-1.5 block">
                        <span>⭐</span>
                        <span>Guaranteed outcomes</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Student Studying at Desk */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-sky-100 bg-white group hover:shadow-xl transition-all flex flex-col h-[230px] sm:h-[260px]">
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
                      alt="Focused IELTS student online class"
                      width={800}
                      height={260}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Card 3: Asian Female Student on Laptop */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-sky-100 bg-white group hover:shadow-xl transition-all flex flex-col h-[230px] sm:h-[260px]">
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4"
                      alt="IELTS Masterclass student"
                      width={800}
                      height={260}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

                    {/* Glass Box Offering List Overlay */}
                    <div className="absolute bottom-4 left-3 right-3 z-10 text-left">
                      <div className="bg-white/80 backdrop-blur-md border border-white/80 text-[#1e293b] text-[10px] font-extrabold p-2.5 rounded-xl shadow-lg space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a8cc]" />
                          <span>Video Courses</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a8cc]" />
                          <span>IELTS 1v1</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a8cc]" />
                          <span>MasterClass</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Carousel Slider Controls / Indicators */}
        <div className="flex items-center justify-between pt-4 border-t border-sky-100/80 mt-2">
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentSlide(idx);
                }}
                className="p-2 flex items-center justify-center cursor-pointer"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span
                  className={`h-2.5 rounded-full transition-all duration-300 block ${
                    idx === currentSlide
                      ? "w-8 bg-[#00a8cc]"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 rounded-full bg-white border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-[#00a8cc] shadow-sm flex items-center justify-center transition-all cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 rounded-full bg-white border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-[#00a8cc] shadow-sm flex items-center justify-center transition-all cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

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
              {/* Header */}
              <div className="bg-gradient-to-r from-[#00a8cc] to-sky-600 p-6 text-white text-left relative">
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer text-white"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-sky-200" />
                  <span className="text-xs font-black uppercase tracking-widest text-sky-100">SEB'S Institute Official Admissions</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">Contact Academic Support</h3>
                <p className="text-xs text-sky-100 mt-1 font-medium">
                  Connect with Syed Ejaz Bukhari's counseling team for admissions, course syllabus, and IELTS evaluation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-6 space-y-4">
                {/* WhatsApp Option 1 (Primary) */}
                <a
                  href={`https://wa.me/923304541573?text=${encodeURIComponent("Hello SEBS Institute! I would like to inquire about IELTS courses, admissions, and syllabus details. Please guide me.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border-2 border-emerald-500/30 hover:border-emerald-500 text-emerald-950 transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-6 h-6 fill-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                        Chat on WhatsApp
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">Fastest</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">+92 330 4541573</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                {/* Direct Phone Call Option */}
                <a
                  href="tel:+923304541573"
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border-2 border-[#00a8cc]/30 hover:border-[#00a8cc] text-slate-900 transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#00a8cc] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Phone className="w-6 h-6 fill-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black text-slate-900">Direct Phone Call</div>
                      <p className="text-xs text-sky-800 font-semibold mt-0.5">+92 330 4541573</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-[#00a8cc] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

