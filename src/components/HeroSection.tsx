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
import { prefetchRoute } from "../App";

export default function HeroSection() {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [heroImage, setHeroImage] = useState(
    "/syed_ejaz_bukhari_hero.webp"
  );

  useEffect(() => {
    const syncHero = () => {
      fetchSiteSettings().then((settings) => {
        if (settings?.site_hero_image_url && !settings.site_hero_image_url.includes("01-logo-curve63-3")) {
          setHeroImage(settings.site_hero_image_url);
        }
      }).catch(() => {});
    };

    syncHero();

    const handleUpdate = (e?: any) => {
      if (e?.detail?.site_hero_image_url && !e.detail.site_hero_image_url.includes("01-logo-curve63-3")) {
        setHeroImage(e.detail.site_hero_image_url);
      } else {
        const stored = localStorage.getItem("site_hero_image_url");
        if (stored && !stored.includes("01-logo-curve63-3")) {
          setHeroImage(stored);
        }
      }
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("site_settings_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("site_settings_updated", handleUpdate);
    };
  }, []);

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-[#f9f9ff] dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Ambient Heritage Glow Background Elements */}
      <div className="absolute -top-32 -left-20 w-[480px] h-[480px] rounded-full bg-cyan-100/60 dark:bg-cyan-950/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[420px] h-[420px] rounded-full bg-sky-100/50 dark:bg-blue-950/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-slate-200/50 dark:bg-slate-900/40 blur-2xl pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-12 items-center">
          
          {/* Left Editorial Column */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            
            {/* Trust Badge / Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#00a8cc] dark:text-cyan-300 w-fit shadow-sm border border-cyan-200/60 dark:border-cyan-800/40">
              <span className="w-2 h-2 rounded-full bg-[#00a8cc] dark:bg-cyan-400 animate-pulse" />
              <span className="text-[12px] font-extrabold uppercase tracking-wider">Trusted Since 1992</span>
              <span className="text-cyan-400 text-xs">•</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">British Council Standards</span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              A <span className="text-[#00a8cc] dark:text-[#00a8cc] underline decoration-[#00a8cc]/30 decoration-4 underline-offset-4">Great Mentor</span> Can Change the Way You See Yourself.
            </h1>

            {/* Supporting Editorial Copy */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
              English is more than a language. It is the confidence to express your ideas, the courage to pursue opportunities, and the ability to connect with the world. Learn with Sir Ejaz Bukhari at SEBS Institute.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <a
                href="https://wa.me/923304541573?text=Hello%20Sir%20Ejaz%2C%20I%20would%20like%20to%20speak%20with%20you%20regarding%20English%20%2F%20IELTS%20courses%20at%20SEBS%20Institute.%20Please%20guide%20me."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#202e43] hover:bg-[#152030] text-white font-bold text-sm shadow-lg shadow-slate-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Talk with Sir Ejaz</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              
              <Link
                to="/courses"
                onMouseEnter={() => prefetchRoute("/courses")}
                onTouchStart={() => prefetchRoute("/courses")}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#202e43] hover:bg-[#152030] text-white font-bold text-sm shadow-lg shadow-slate-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
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
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 overflow-hidden bg-slate-200 shadow-sm shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Student Sara Khan"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 overflow-hidden bg-slate-200 shadow-sm shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Student Ali Malik"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 overflow-hidden bg-slate-200 shadow-sm shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Student Fatima Ahmed"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-950 overflow-hidden bg-slate-200 shadow-sm shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Student Hamza Tariq"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
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
              <div className="absolute -inset-2 bg-gradient-to-b from-cyan-200/80 via-slate-200/50 to-blue-200/60 dark:from-cyan-950/60 dark:via-slate-900/40 dark:to-blue-950/40 rounded-t-[130px] rounded-b-3xl blur-md opacity-70" />
              
              {/* Portrait Container */}
              <div className="relative rounded-t-[120px] rounded-b-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Heritage Crest Accents */}
                <div className="absolute top-4 right-5 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-slate-200/60 dark:border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00a8cc] dark:text-cyan-400" />
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
                <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-[#00a8cc] dark:text-cyan-400 shrink-0 shadow-inner border border-cyan-100 dark:border-cyan-900/40">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-slate-900 dark:text-white font-bold leading-tight truncate">Direct 1-on-1 Mentorship</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Syed Ejaz Bukhari — Founder & Master Coach</span>
                </div>
              </div>

              {/* Background Secondary Badge / Year Marker */}
              <div className="absolute -top-3 -left-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200/80 dark:border-slate-800">
                <GraduationCap className="w-4 h-4 text-[#00a8cc] dark:text-cyan-400" />
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

            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-[#00a8cc] dark:text-cyan-400 mb-4 border border-cyan-100 dark:border-cyan-900/40">
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
