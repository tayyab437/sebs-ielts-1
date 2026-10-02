import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  BookOpen, 
  Star, 
  CheckCircle2, 
  Award, 
  GraduationCap, 
  Sparkles, 
  ShieldCheck,
  Phone,
  MessageCircle,
  X
} from "lucide-react";
import { fetchSiteSettings } from "@/src/lib/settings";

export default function HeroSection() {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [heroImage, setHeroImage] = useState(
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCiEeL_rvkeTN1WD6jaHqpjjT6Ax0o76N4V0pu0-U9-8L1-NmC3hc-k0EqLXXfB8w7S_JHA6uxlcJjT8HwJ71j-cNAM7_gbTUJWGN8laDVri0819emFvtVeJw9ECQhOkzQ3RMjUHwfzUzbRiBQjBA9pd6Akxy_LHqda19ke-kK_FnKsrOsty0qCAuANw2-QNsmrthXPUV2iOWueWW_foCUWkH5CGELRy807DzjiALnHmhKPMt_TPi8Fc37lfjxiLk5GbFg"
  );

  useEffect(() => {
    fetchSiteSettings().then((settings) => {
      if (settings?.site_hero_image_url && !settings.site_hero_image_url.includes("01-logo-curve63-3")) {
        setHeroImage(settings.site_hero_image_url);
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-[#f9f9ff] dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Ambient Heritage Glow Background Elements */}
      <div className="absolute -top-32 -left-20 w-[480px] h-[480px] rounded-full bg-red-100/60 dark:bg-red-950/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[420px] h-[420px] rounded-full bg-rose-100/50 dark:bg-rose-950/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-slate-200/50 dark:bg-slate-900/40 blur-2xl pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-12 items-center">
          
          {/* Left Editorial Column */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            
            {/* Trust Badge / Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffdad6] dark:bg-red-950/60 text-[#91000a] dark:text-red-300 w-fit shadow-sm border border-red-200/60 dark:border-red-800/40">
              <span className="w-2 h-2 rounded-full bg-[#91000a] dark:bg-red-400 animate-pulse" />
              <span className="text-[12px] font-extrabold uppercase tracking-wider">Trusted Since 1992</span>
              <span className="text-red-400 text-xs">•</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">British Council Standards</span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              A <span className="text-[#91000a] dark:text-red-500 underline decoration-red-200 dark:decoration-red-950 decoration-4 underline-offset-4">Great Mentor</span> Can Change the Way You See Yourself.
            </h1>

            {/* Supporting Editorial Copy */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
              English is more than a language. It is the confidence to express your ideas, the courage to pursue opportunities, and the ability to connect with the world. Learn with Sir Ejaz Bukhari at SEBS Institute.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <a
                href="https://wa.me/923304541573?text=Hello%20Sir%20Ejaz%2C%20I%20would%20like%20to%20learn%20with%20you%20at%20SEBS%20Institute.%20Please%20guide%20me%20on%20admissions%20and%20batch%20timings."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Learn With Sir Ejaz</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#91000a] dark:text-red-400" />
                <span>View Our Courses</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Talk to Advisory</span>
              </button>
            </div>

            {/* Trust & Social Proof Indicator */}
            <div className="mt-10 pt-4 flex items-center gap-4 border-t border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex-wrap sm:flex-nowrap">
              {/* Overlapping Student Badges */}
              <div className="flex -space-x-2.5 overflow-hidden">
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#91000a] dark:text-red-400 font-bold text-xs shadow-sm">
                  <span>SK</span>
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xs shadow-sm">
                  <span>AM</span>
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs shadow-sm">
                  <span>FA</span>
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 bg-[#91000a] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Quantitative Validation */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-1">4.9/5</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  <strong className="font-bold text-slate-900 dark:text-slate-200">30,000+ Students</strong> Guided to Fluency
                </span>
              </div>
            </div>
          </div>

          {/* Right Visual Center: Authentic Portrait of Sir Syed Ejaz Bukhari */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            <div className="relative w-full max-w-[430px]">
              
              {/* Atmospheric Arch Frame Silhouette */}
              <div className="absolute -inset-2 bg-gradient-to-b from-red-200/80 via-slate-200/50 to-rose-200/60 dark:from-red-950/60 dark:via-slate-900/40 dark:to-rose-950/40 rounded-t-[130px] rounded-b-3xl blur-md opacity-70" />
              
              {/* Portrait Container */}
              <div className="relative rounded-t-[120px] rounded-b-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Heritage Crest Accents */}
                <div className="absolute top-4 right-5 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-slate-200/60 dark:border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#91000a] dark:text-red-400" />
                  <span className="text-[11px] text-slate-900 dark:text-white uppercase tracking-wider font-extrabold">Official SEBS</span>
                </div>

                {/* Main Authentic Headshot of Sir Syed Ejaz Bukhari */}
                <img 
                  alt="Sir Syed Ejaz Bukhari - Founder & Master English Coach" 
                  src={heroImage}
                  width={430}
                  height={500}
                  loading="eager"
                  decoding="async"
                  className="w-full h-[470px] lg:h-[500px] object-cover object-top filter contrast-[1.03] transition-transform duration-700 hover:scale-[1.02]"
                />

                {/* Subtle Base Vignette */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none" />
              </div>

              {/* Floating Credibility Badge */}
              <div className="absolute -bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xs z-30 p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex items-center gap-3 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                <div className="w-11 h-11 rounded-xl bg-[#ffdad6] dark:bg-red-950 flex items-center justify-center text-[#91000a] dark:text-red-400 shrink-0 shadow-inner">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-slate-900 dark:text-white font-bold leading-tight truncate">Direct 1-on-1 Mentorship</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Syed Ejaz Bukhari — Founder & Master Coach</span>
                </div>
              </div>

              {/* Background Secondary Badge / Year Marker */}
              <div className="absolute -top-3 -left-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200/80 dark:border-slate-800">
                <GraduationCap className="w-4 h-4 text-[#91000a] dark:text-red-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">32+ Years Pedagogy</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Advisory Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-left relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] dark:bg-red-950 flex items-center justify-center text-[#91000a] dark:text-red-400 mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">Speak With Academic Advisory</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Connect directly with our admissions counselor for IELTS slot booking, batch timings, and fee concession queries.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href="https://wa.me/923000000000"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href="tel:+923000000000"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call Admissions Office</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
