import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, GraduationCap, Trophy, LayoutDashboard, User, LogIn, Menu, X, ArrowRight, ShieldCheck, Globe, Users, Star, BarChart3, Clock, Sparkles, Bell, Facebook, Youtube, Instagram, Linkedin, Send, Mail, Phone, MapPin, Megaphone, Search, ExternalLink, FileText, HelpCircle, ArrowUpRight, FolderOpen, Compass } from "lucide-react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { fetchCustomPages, CustomPage } from "./lib/customPages";

// Eagerly load HomePage for instant first contentful paint (FCP)
import { Toaster, toast } from "sonner";
import HomePage from "./pages/public/Home";
import { lazyWithRetry } from "./lib/lazyRetry";

// Code-split heavy routes to eliminate unused JavaScript from initial bundle
const LoginPage = lazyWithRetry(() => import("./pages/auth/Login"));
const SignupPage = lazyWithRetry(() => import("./pages/auth/Signup"));
const DashboardPage = lazyWithRetry(() => import("./pages/dashboard/StudentDashboard"));
const WritingModule = lazyWithRetry(() => import("./pages/dashboard/WritingModule"));
const MockTestPage = lazyWithRetry(() => import("./pages/dashboard/MockTest"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const TeacherDashboard = lazyWithRetry(() => import("./pages/dashboard/TeacherDashboard"));
const StudentCourses = lazyWithRetry(() => import("./pages/public/Courses"));
const PricingPage = lazyWithRetry(() => import("./pages/public/Pricing"));
const TermsPage = lazyWithRetry(() => import("./pages/public/Terms"));
const PrivacyPage = lazyWithRetry(() => import("./pages/public/Privacy"));
const CustomPageView = lazyWithRetry(() => import("./pages/public/CustomPageView"));
const ContactPage = lazyWithRetry(() => import("./pages/public/Contact"));
const AboutPage = lazyWithRetry(() => import("./pages/public/About"));
const BooksPage = lazyWithRetry(() => import("./pages/public/Books"));
const NotFoundPage = lazyWithRetry(() => import("./pages/public/NotFound"));

// Intelligent prefetcher on hover/touch/idle
export const prefetchRoute = (path: string) => {
  if (!path) return;
  if (path.startsWith("/courses")) import("./pages/public/Courses");
  else if (path.startsWith("/mock-test") || path.startsWith("/academic") || path.startsWith("/general") || path.startsWith("/gt")) import("./pages/dashboard/MockTest");
  else if (path.startsWith("/pricing")) import("./pages/public/Pricing");
  else if (path.startsWith("/dashboard/writing")) import("./pages/dashboard/WritingModule");
  else if (path.startsWith("/dashboard")) import("./pages/dashboard/StudentDashboard");
  else if (path.startsWith("/admin")) import("./pages/admin/AdminDashboard");
  else if (path.startsWith("/login")) import("./pages/auth/Login");
  else if (path.startsWith("/signup")) import("./pages/auth/Signup");
  else if (path.startsWith("/about")) import("./pages/public/About");
  else if (path.startsWith("/contact")) import("./pages/public/Contact");
  else if (path.startsWith("/books")) import("./pages/public/Books");
};

import { supabase } from "./lib/supabaseClient";
import { MeetingsProvider } from "./context/MeetingsContext";
import { fetchSiteSettings, sanitizeAssetUrl } from "./lib/settings";
import { PageSEOManager } from "./components/PageSEOManager";

function Footer() {
  const [logoUrl, setLogoUrl] = useState(() => sanitizeAssetUrl(localStorage.getItem("site_logo_url"), "/sebs_official_logo_315.webp"));
  const [logoAlt, setLogoAlt] = useState(() => localStorage.getItem("site_logo_alt") || "SEB's Institute Logo");
  const [emailValue, setEmailValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);

  useEffect(() => {
    fetchCustomPages().then(pages => {
      if (pages && Array.isArray(pages)) {
        setCustomPages(pages.filter(p => p.is_published && p.slug !== "about-us" && p.slug !== "faq" && p.id !== "about-us" && p.id !== "faq"));
      }
    }).catch(err => {
      console.warn("Failed loading custom pages for footer", err);
    });
  }, []);

  useEffect(() => {
    const handleFooterLogoSync = (bypass = false) => {
      fetchSiteSettings(typeof bypass === "boolean" ? bypass : false).then(settings => {
        if (settings?.site_logo_url) setLogoUrl(settings.site_logo_url);
        if (settings?.site_logo_alt) setLogoAlt(settings.site_logo_alt);
      });
    };
    handleFooterLogoSync(false);
    const onSettingsUpdate = () => handleFooterLogoSync(true);
    window.addEventListener("storage", onSettingsUpdate);
    window.addEventListener("site_settings_updated", onSettingsUpdate);
    return () => {
      window.removeEventListener("storage", onSettingsUpdate);
      window.removeEventListener("site_settings_updated", onSettingsUpdate);
    };
  }, []);

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Successfully Subscribed!", {
        description: "You have joined Syed Ejaz Bukhari's weekly IELTS & Spoken English newsletter list!"
      });
      setEmailValue("");
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <footer className="relative bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-16 border-t border-slate-200 dark:border-slate-900 overflow-hidden text-left transition-colors duration-300">
      {/* Decorative subtle background highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-700/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-700/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        {/* Main Footer 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
          {/* Column 1: Brand Presentation & Socials (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center space-x-2 group">
              <img 
                src={logoUrl || "/sebs_official_logo_315.webp"} 
                srcSet={(!logoUrl || logoUrl === "/sebs_official_logo_315.webp" || logoUrl === "/sebs_official_logo_160.webp") ? "/sebs_official_logo_160.webp 160w, /sebs_official_logo_315.webp 315w" : undefined}
                sizes={(!logoUrl || logoUrl === "/sebs_official_logo_315.webp" || logoUrl === "/sebs_official_logo_160.webp") ? "(max-width: 640px) 130px, 160px" : undefined}
                alt={logoAlt} 
                width={160}
                height={87}
                loading="lazy"
                decoding="async"
                className="h-14 w-auto object-contain dark:brightness-200 dark:invert transition-transform duration-300 group-hover:scale-105" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== "/sebs_official_logo_315.webp") {
                    target.src = "/sebs_official_logo_315.webp";
                  }
                }}
              />
              <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white font-sans">
                SEB's <span className="text-emerald-600 dark:text-emerald-400">Institute</span>
              </span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold max-w-sm">
              SEB's Institute (Global Language Institute) is the premier trusted coaching academy empowering global scholars with masterly spoken English, verified IELTS Band scores, and supreme speaking confidence.
            </p>
            
            {/* Social Channels List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 italic block">connect with the director</span>
              <div className="flex gap-2.5">
                {[
                  { name: "Facebook", icon: <Facebook className="w-4 h-4" aria-hidden="true" />, url: "https://www.facebook.com/SEBSInstitute" },
                  { name: "YouTube", icon: <Youtube className="w-4 h-4" aria-hidden="true" />, url: "https://www.youtube.com/@SEBSinstitute" },
                  { name: "Instagram", icon: <Instagram className="w-4 h-4" aria-hidden="true" />, url: "https://www.instagram.com/sebs_institute/" },
                  { name: "LinkedIn", icon: <Linkedin className="w-4 h-4" aria-hidden="true" />, url: "https://www.linkedin.com/company/sebsinstitute" }
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    aria-label={`Visit SEB's Institute on ${social.name}`}
                    title={`Visit SEB's Institute on ${social.name}`}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 sm:min-w-[48px] sm:min-h-[48px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    {social.icon}
                    <span className="sr-only">Visit SEB's Institute on {social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Column 2: Academic Tracks (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-5 relative pl-3 border-l-2 border-emerald-500">
              Academic Tracks
            </h3>
            <ul className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {[
                { title: "Spoken English", tag: "Fluency" },
                { title: "Writing Skills", tag: "Expert" },
                { title: "IELTS Preparation", tag: "Band 8.5" },
                { title: "PTE Masterclass", tag: "Live" }
              ].map((course, idx) => (
                <li key={idx}>
                  <Link 
                    to="/courses" 
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group min-h-[40px] py-2 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{course.title}</span>
                    <span className="text-[9px] uppercase tracking-widest font-black bg-slate-200 dark:bg-slate-900 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 text-slate-600 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors px-2 py-0.5 rounded">
                      {course.tag}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Institute Directory & Resources (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-5 relative pl-3 border-l-2 border-emerald-500">
              Resources & Info
            </h3>
            <ul className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link 
                  to="/contact" 
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group min-h-[38px] py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Contact Us</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 font-mono">Live</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/books" 
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group min-h-[38px] py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Books</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">PDFs</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group min-h-[38px] py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Terms & Policies</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Rules</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group min-h-[38px] py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Privacy Policy</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">GDPR</span>
                </Link>
              </li>
              {customPages.map((cp) => (
                <li key={cp.id}>
                  <Link 
                    to={`/pages/${cp.slug}`} 
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group min-h-[38px] py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  >
                    <span className="group-hover:translate-x-1 transition-transform truncate pr-1">{cp.title}</span>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 shrink-0">Custom</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 4: Admissions & Contact Helpline (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-5 relative pl-3 border-l-2 border-emerald-500">
              Admissions & Contact
            </h3>
            <ul className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-slate-900 dark:text-white font-bold">Helpline Desk</span>
                  <a href="tel:+923304541573" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-bold block mt-0.5">
                    +92 330 4541573
                  </a>
                  <p className="text-[10px] text-slate-500 italic">Mon – Sat: 9 AM – 9 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-slate-900 dark:text-white font-bold">Virtual Campus</span>
                  <p className="text-[10px] text-slate-500 italic font-mono mt-0.5">24/7 Digital Exam Portal</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-slate-900 dark:text-white font-bold">Admissions Desk</span>
                  <a href="mailto:sebs.info@gmail.com" className="text-[10px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-mono mt-0.5 block hover:underline">
                    sebs.info@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Column 5: Newsletter / Fluency Keys (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-5 relative pl-3 border-l-2 border-emerald-500">
              Fluency Keys
            </h3>
            <div className="space-y-4">
              <p className="text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                Receive Syed Ejaz Bukhari's weekly language heuristics directly in your inbox.
              </p>
              
              <form onSubmit={handleNewsletterSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@address.com"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 rounded-xl h-10 px-4 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 pr-10 shadow-xs"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 w-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    disabled={isSubmitting}
                    title="Subscribe"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </form>
              
              {/* Privacy protection highlight */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                <span>Zero spam. Secure privacy.</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* External Testing Authorities & Global Accreditation Links */}
        <div className="pt-6 pb-3 mb-10 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <span>Official Examination Portals:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <a 
              href="https://takeielts.britishcouncil.org" 
              target="_blank" 
              rel="nofollow noopener noreferrer" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>British Council IELTS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://www.ieltsidp.com" 
              target="_blank" 
              rel="nofollow noopener noreferrer" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>IDP Education</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://www.cambridgeenglish.org" 
              target="_blank" 
              rel="nofollow noopener noreferrer" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Cambridge English</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://www.ielts.org" 
              target="_blank" 
              rel="nofollow noopener noreferrer" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>IELTS.org Official</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer bottom bar with license & trade details */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-900/60 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p className="font-medium text-slate-600 dark:text-slate-500">
              Copyright © {new Date().getFullYear()}. All Rights Reserved — Syed Ejaz Bukhari & SEB's Institute.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Website created and SEO by{" "}
              <a
                href="https://wa.me/923176369458"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 font-semibold underline decoration-dotted transition-colors"
              >
                Tayyab Ashfaq
              </a>
            </p>
          </div>
          <div className="flex space-x-6 items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-emerald-700 dark:text-emerald-500/85 px-2.5 py-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg">
              “We Teach English, Not Pinglish”
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(() => sanitizeAssetUrl(localStorage.getItem("site_logo_url"), "/sebs_official_logo_315.webp"));
  const [logoAlt, setLogoAlt] = useState(() => localStorage.getItem("site_logo_alt") || "SEB's Institute Logo");

  // Header Style & Layout States
  const [headerStyle, setHeaderStyle] = useState<"classic" | "iot">(() => (localStorage.getItem("site_header_style") as "classic" | "iot") || "classic");
  const [iotBannerText, setIotBannerText] = useState(() => localStorage.getItem("iot_banner_text") || "Self-study to boost your IELTS Score to 6.5+");
  const [iotBannerSubtext, setIotBannerSubtext] = useState(() => localStorage.getItem("iot_banner_subtext") || "Designed for Learners at IELTS 5.0-5.5");
  const [iotBannerButtonText, setIotBannerButtonText] = useState(() => localStorage.getItem("iot_banner_button_text") || "Learn more");
  const [iotBannerLink, setIotBannerLink] = useState(() => localStorage.getItem("iot_banner_link") || "/courses");
  const [searchQuery, setSearchQuery] = useState("");

  // Offer Bar Ticker States
  const [offerBarActive, setOfferBarActive] = useState<boolean>(() => {
    const val = localStorage.getItem("top_offer_bar_active");
    return val === null ? true : val === "true";
  });
  const [offerBarText, setOfferBarText] = useState(() => localStorage.getItem("top_offer_bar_text") || "Special Live Batches with Syed Ejaz Bukhari now recruiting • Genuine IELTS Band 8.5+ Syllabus");
  const [offerBarLinkText, setOfferBarLinkText] = useState(() => localStorage.getItem("top_offer_bar_link_text") || "Claim Seats");
  const [offerBarLink, setOfferBarLink] = useState(() => localStorage.getItem("top_offer_bar_link") || "/courses");
  const [isOfferBarDismissed, setIsOfferBarDismissed] = useState(() => sessionStorage.getItem("top_offer_bar_dismissed") === "true");

  useEffect(() => {
    const handleStorageChange = (bypass = false) => {
      fetchSiteSettings(typeof bypass === "boolean" ? bypass : false).then(settings => {
        if (settings?.site_logo_url) setLogoUrl(settings.site_logo_url);
        if (settings?.site_logo_alt) setLogoAlt(settings.site_logo_alt);
        setHeaderStyle(settings.site_header_style || "classic");
        setIotBannerText(settings.iot_banner_text || "Self-study to boost your IELTS Score to 6.5+");
        setIotBannerSubtext(settings.iot_banner_subtext || "Designed for Learners at IELTS 5.0-5.5");
        setIotBannerButtonText(settings.iot_banner_button_text || "Learn more");
        setIotBannerLink(settings.iot_banner_link || "/courses");
        setOfferBarActive(settings.top_offer_bar_active !== undefined ? settings.top_offer_bar_active : true);
        setOfferBarText(settings.top_offer_bar_text || "Special Live Batches with Syed Ejaz Bukhari now recruiting • Genuine IELTS Band 8.5+ Syllabus");
        setOfferBarLinkText(settings.top_offer_bar_link_text || "Claim Seats");
        setOfferBarLink(settings.top_offer_bar_link || "/courses");
        
        const favUrl = settings.site_favicon_url;
        if (favUrl) {
          const selectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
          selectors.forEach((sel) => {
            const existing = document.querySelectorAll<HTMLLinkElement>(sel);
            existing.forEach((el) => {
              el.href = favUrl;
            });
          });
        }
      });
    };
    const onSettingsUpdate = () => handleStorageChange(true);
    window.addEventListener("storage", onSettingsUpdate);
    window.addEventListener("site_settings_updated", onSettingsUpdate);
    handleStorageChange(false);
    return () => {
      window.removeEventListener("storage", onSettingsUpdate);
      window.removeEventListener("site_settings_updated", onSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname === "www.sebsinstitute.com") {
      window.location.replace(`https://sebsinstitute.com${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setIsOfferBarDismissed(false);
    }
  }, [location.pathname]);

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem("user_role") || "student");
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("app_notifications");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleHideNavbar = (e: any) => {
      setIsHidden(e.detail);
    };
    window.addEventListener("hide_main_navbar", handleHideNavbar);
    return () => window.removeEventListener("hide_main_navbar", handleHideNavbar);
  }, []);

  useEffect(() => {
    localStorage.setItem("app_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      setNotifications((prev) => [e.detail, ...prev]);
    };
    window.addEventListener("new_notification", handleNewNotification);
    return () => window.removeEventListener("new_notification", handleNewNotification);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    const checkOfflineUser = () => {
      const loggedIn = localStorage.getItem("mock_user_logged_in") === "true";
      if (loggedIn) {
        setUser({ email: localStorage.getItem("mock_user_email") || "offline@example.com" });
        setUserRole(localStorage.getItem("user_role") || "student");
      } else {
        setUser(null);
        setUserRole("student");
      }
    };

    // Check initial session
    if (supabase) {
      let subscription: any = null;
      try {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.warn("App: getSession returned error:", error.message);
            if (error.message.includes("Refresh Token")) {
              supabase.auth.signOut().catch(() => {});
            }
          }
          setUser(session?.user ?? null);
          if (session?.user) {
            supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data }) => {
              if (data?.role) {
                setUserRole(data.role);
                localStorage.setItem("user_role", data.role);
              } else if (session.user.user_metadata?.role) {
                setUserRole(session.user.user_metadata.role);
                localStorage.setItem("user_role", session.user.user_metadata.role);
              }
            }).catch((err) => {
              console.warn("App: profiles query failed on mount", err);
              if (session.user.user_metadata?.role) {
                setUserRole(session.user.user_metadata.role);
                localStorage.setItem("user_role", session.user.user_metadata.role);
              }
            });
          } else {
            checkOfflineUser();
          }
        }).catch((err) => {
          console.warn("App: getSession failed. Reverting to Offline Sandbox mode.", err);
          checkOfflineUser();
        });

        // Listen for changes
        const authChangeResult = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data }) => {
              if (data?.role) {
                setUserRole(data.role);
                localStorage.setItem("user_role", data.role);
              } else if (session.user.user_metadata?.role) {
                setUserRole(session.user.user_metadata.role);
                localStorage.setItem("user_role", session.user.user_metadata.role);
              }
            }).catch((err) => {
              console.warn("App: profiles query failed during auth change", err);
              if (session.user.user_metadata?.role) {
                setUserRole(session.user.user_metadata.role);
                localStorage.setItem("user_role", session.user.user_metadata.role);
              }
            });
          } else {
            if (localStorage.getItem("mock_user_logged_in") === "true") {
              checkOfflineUser();
            } else {
              setUserRole("student");
              localStorage.removeItem("user_role");
            }
          }
        });
        
        subscription = authChangeResult?.data?.subscription;
      } catch (err) {
        console.warn("App: auth listener setup failed. Reverting to Offline Sandbox mode.", err);
        checkOfflineUser();
      }

      window.addEventListener("storage", checkOfflineUser);
      return () => {
        window.removeEventListener("storage", checkOfflineUser);
        if (subscription) subscription.unsubscribe();
      };
    } else {
      checkOfflineUser();
      window.addEventListener("storage", checkOfflineUser);
      return () => window.removeEventListener("storage", checkOfflineUser);
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("mock_user_logged_in");
    localStorage.removeItem("mock_user_email");
    localStorage.removeItem("user_role");
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setUserRole("student");
    toast.success("Signed Out Successfully!");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses", badge: "Live" },
    { name: "Mock Tests", path: "/mock-tests", badge: "IELTS" },
    { name: "Pricing", path: "/pricing" },
  ];

  if (isHidden) return null;

  if (headerStyle === "iot") {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        {/* IOT Style Header Banner Top Bar */}
        <div className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 text-white py-2 px-4 sm:px-8 border-b border-rose-600/30">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Left: Branding Logo Section */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="bg-white/95 dark:bg-slate-900/95 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 border border-white/40">
                <span className="bg-red-600 text-white text-xs font-black px-1.5 py-0.5 rounded italic tracking-tighter">iot.</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">IELTS Online Tests</span>
                  <span className="text-[8px] font-bold text-slate-500 tracking-wider">by InterGreat • SEB's Partner</span>
                </div>
              </div>
            </Link>

            {/* Center: Self-Study Booster Promotional Message */}
            <div className="flex-1 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-center md:text-left">
              <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                {iotBannerText}
              </span>
              <span className="bg-slate-900/90 text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full border border-white/20 shadow-inner">
                {iotBannerSubtext}
              </span>
            </div>

            {/* Right: Learn More CTA Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to={iotBannerLink}>
                <button className="bg-white hover:bg-slate-50 text-red-600 font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer border-none">
                  {iotBannerButtonText} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Nav Bar below Top Banner */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Primary Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 shrink-0 pr-2">
                <img 
                  src={logoUrl || "/sebs_official_logo_160.webp"} 
                  srcSet={(!logoUrl || logoUrl === "/sebs_official_logo_315.webp" || logoUrl === "/sebs_official_logo_160.webp") ? "/sebs_official_logo_160.webp 160w, /sebs_official_logo_315.webp 315w" : undefined}
                  sizes={(!logoUrl || logoUrl === "/sebs_official_logo_315.webp" || logoUrl === "/sebs_official_logo_160.webp") ? "(max-width: 640px) 110px, 160px" : undefined}
                  alt={logoAlt} 
                  width={110}
                  height={60}
                  loading="eager"
                  decoding="async"
                  className="h-9 w-auto object-contain dark:brightness-200 dark:invert" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== "/sebs_official_logo_315.webp") {
                      target.src = "/sebs_official_logo_315.webp";
                    }
                  }}
                />
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-wider hidden xl:inline">SEB's Institute</span>
              </Link>

              <div className="hidden md:flex items-center space-x-5">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onMouseEnter={() => prefetchRoute(link.path)}
                      onTouchStart={() => prefetchRoute(link.path)}
                      className={`text-xs font-bold uppercase tracking-wider transition-all duration-200 py-1 ${
                        isActive
                          ? 'text-red-600 dark:text-red-400 font-black border-b-2 border-red-600 dark:border-red-400'
                          : 'text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {link.name}
                        {link.badge && (
                          <span className="text-[8px] bg-red-100 text-red-600 font-black px-1.5 py-0.2 rounded-full uppercase">
                            {link.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Search */}
            <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search IELTS tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="hidden sm:flex items-center space-x-2">
                  {user.email === "ac.repair.in.dubai3@gmail.com" && (
                    <Link to="/admin">
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase rounded-lg px-3 py-1">
                        Admin Console
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard">
                    <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase rounded-lg px-3 py-1">
                      Dashboard
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={handleLogout} className="text-[10px] font-bold uppercase text-slate-500 rounded-lg px-2">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Link to="/login">
                    <Button size="sm" variant="ghost" className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase rounded-lg px-4 shadow-sm border-none">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden min-w-[48px] min-h-[48px] p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-red-600 py-3 px-3 rounded-lg min-h-[48px] flex items-center transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/5 transition-colors duration-300">
      {/* Top Academic Promotion Ticker Banner */}
      {offerBarActive && !isOfferBarDismissed && (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-slate-900 dark:to-black text-white text-[10.5px] font-black items-center justify-center py-2 px-8 text-center tracking-widest flex gap-2 overflow-hidden uppercase italic min-h-[38px] shadow-inner select-none relative">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span className="truncate pr-4">{offerBarText}</span>
          <Link to={offerBarLink} className="underline hover:text-emerald-300 transition-all ml-1.5 flex items-center gap-0.5 font-bold shrink-0">
            {offerBarLinkText} <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
          <button
            onClick={() => {
              setIsOfferBarDismissed(true);
              sessionStorage.setItem("top_offer_bar_dismissed", "true");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer border-none"
            aria-label="Close promotion banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Brand Section */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-violet-500 rounded-2xl blur opacity-15 group-hover:opacity-30 transition-all duration-300" />
              <img 
                src={logoUrl || "/sebs_official_logo_315.webp"} 
                alt={logoAlt} 
                width={160}
                height={87}
                loading="eager"
                decoding="async"
                className="relative h-14 w-auto object-contain dark:brightness-200 dark:invert transition-all duration-500 group-hover:scale-[1.04]" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== "/sebs_official_logo_315.webp") {
                    target.src = "/sebs_official_logo_315.webp";
                  }
                }}
              />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">SEB's Institute</span>
              <span className="text-[8.5px] font-bold text-emerald-600 tracking-widest uppercase mt-0.5 font-mono">Global Language Institute</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-7 bg-slate-100/50 dark:bg-white/5 border border-slate-200/30 dark:border-white/5 rounded-2xl px-5 py-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.name} 
                    to={link.path} 
                    onMouseEnter={() => prefetchRoute(link.path)}
                    onTouchStart={() => prefetchRoute(link.path)}
                    className={`text-xs font-black uppercase tracking-wider transition-all duration-300 relative group py-1 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {link.name}
                      {link.badge && (
                        <span className={`text-[7.5px] px-1 py-0.2 rounded-md font-black tracking-normal uppercase leading-tight ${link.badge === "Live" ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>
                          {link.badge}
                        </span>
                      )}
                    </span>
                    <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-emerald-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </Link>
                );
              })}
            </div>

            {/* Notifications Indicator Portal */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 relative w-10 h-10"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-550 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>

                {showNotifications && (
                  <div
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 transform origin-top-right animate-in fade-in zoom-in-95"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-500 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-550 dark:text-slate-405 text-slate-400">
                          <Bell className="w-8 h-8 opacity-25 mx-auto mb-2" />
                          <p className="text-xs font-bold uppercase tracking-wider">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {notifications.map((notif, idx) => (
                            <div
                              key={idx}
                              className={`p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                                !notif.read ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                              }`}
                              onClick={() => {
                                if (!notif.read) {
                                  setNotifications((prev) =>
                                    prev.map((n, i) => (i === idx ? { ...n, read: true } : n))
                                  );
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div className="mt-1 shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                    {new Date(notif.time).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile or Authentication Controllers */}
            <div className="flex items-center space-x-4 pl-4 border-l border-slate-200 dark:border-white/10">
              {user ? (
                <>
                  {user.email === "ac.repair.in.dubai3@gmail.com" && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="font-extrabold text-[10.5px] uppercase tracking-wider text-emerald-505 text-emerald-650 dark:text-emerald-400 italic border border-emerald-500/20 dark:border-emerald-500/10 rounded-xl px-4 hover:bg-emerald-500/5">
                        Admin Console
                      </Button>
                    </Link>
                  )}
                  {userRole === "teacher" && (
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#059669] dark:text-[#34d399] italic font-mono animate-pulse rounded-full border border-emerald-550/20 px-2 py-0.5 leading-none">
                      Teacher Mode
                    </span>
                  )}
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl">
                      {userRole === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="rounded-xl px-4 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-extrabold text-[10.5px] uppercase tracking-wider"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-605 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="rounded-xl px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-600/10 border-none font-extrabold text-[10.5px] uppercase tracking-wider hover:scale-[1.02] transition-transform">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation Command buttons */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-600 dark:text-slate-300 hover:text-primary w-10 h-10"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="min-w-[48px] min-h-[48px] p-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded-xl" 
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay Panel */}
      {isOpen && (
        <div 
          className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/10 absolute w-full left-0 right-0 shadow-xl overflow-hidden transition-all duration-300 animate-in slide-in-from-top-2 fade-in"
        >
          <div className="px-5 pt-2 pb-6 space-y-1 text-left">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className={`block px-4 py-3.5 text-sm font-black uppercase tracking-wider rounded-xl transition-all min-h-[48px] flex items-center ${isActive ? 'text-emerald-600 bg-emerald-500/5 pl-6' : 'text-slate-605 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/10 text-emerald-600">
                        {link.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}

            <div className="pt-4 flex flex-col space-y-2.5 border-t border-slate-100 dark:border-white/5 mt-3">
              {user ? (
                <>
                  {user.email === "ac.repair.in.dubai3@gmail.com" && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full font-black text-emerald-650 dark:text-emerald-400 bg-emerald-500/5 rounded-xl uppercase tracking-wider text-xs">Admin Console</Button>
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full font-black uppercase tracking-wider text-xs">
                      {userRole === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
                    </Button>
                  </Link>
                  <Button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200 uppercase font-black tracking-wider text-xs rounded-xl">Logout</Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full font-black uppercase tracking-wider text-xs rounded-xl">Login</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-none">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function AnnouncementPopup() {
  const location = useLocation();
  const [announcementActive, setAnnouncementActive] = useState(() => localStorage.getItem("site_announcement_active") === "true");
  const [announcementTitle, setAnnouncementTitle] = useState(() => localStorage.getItem("site_announcement_title") || "Important Academy Notice");
  const [announcementMessage, setAnnouncementMessage] = useState(() => localStorage.getItem("site_announcement_message") || "Special Live Batch admissions for IELTS Academic & General are closing tonight at Midnight! Enter code PRIORITY85 to secure a seat.");
  const [announcementTheme, setAnnouncementTheme] = useState(() => localStorage.getItem("site_announcement_theme") || "urgent-red");
  const [announcementExpiry, setAnnouncementExpiry] = useState(() => localStorage.getItem("site_announcement_expiry") || "Closes in 02 hours 15 minutes");
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setAnnouncementActive(localStorage.getItem("site_announcement_active") === "true");
      setAnnouncementTitle(localStorage.getItem("site_announcement_title") || "Important Academy Notice");
      setAnnouncementMessage(localStorage.getItem("site_announcement_message") || "Special Live Batch admissions for IELTS Academic & General are closing tonight at Midnight! Enter code PRIORITY85 to secure a seat.");
      setAnnouncementTheme(localStorage.getItem("site_announcement_theme") || "urgent-red");
      setAnnouncementExpiry(localStorage.getItem("site_announcement_expiry") || "Closes in 02 hours 15 minutes");
    };
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && announcementActive) {
      setShowAnnouncementPopup(true);
    }
  }, [location.pathname, announcementActive]);

  return (
    <>
      {showAnnouncementPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Dark Ambient Backdrop */}
          <div
            onClick={() => {
              setShowAnnouncementPopup(false);
              sessionStorage.setItem("site_announcement_shown", "true");
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          />

          {/* Styled Popup Container */}
          <div
            className={`relative max-w-lg w-full rounded-[2.5rem] overflow-hidden shadow-3xl text-white border transition-all duration-300 transform animate-in fade-in zoom-in-95 ${
              announcementTheme === "urgent-red"
                ? "bg-gradient-to-b from-slate-900 via-red-950/80 to-slate-950 border-red-500/30"
                : "bg-gradient-to-b from-slate-900 via-slate-950/80 to-black border-emerald-500/30"
            }`}
          >
            {/* Glow Effects */}
            <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none ${announcementTheme === "urgent-red" ? "bg-red-500" : "bg-emerald-500"}`} />
            <div className={`absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none ${announcementTheme === "urgent-red" ? "bg-amber-600" : "bg-emerald-600"}`} />

            {/* Close Button Trigger */}
            <div className="flex justify-end p-5 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setShowAnnouncementPopup(false);
                  sessionStorage.setItem("site_announcement_shown", "true");
                }}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 transform hover:rotate-90 text-slate-400 hover:text-white border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Core Content */}
            <div className="px-8 pb-10 text-center relative z-10">
              {/* Animated Logo Shield */}
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300 ${
                  announcementTheme === "urgent-red"
                    ? "bg-gradient-to-br from-red-500 to-amber-600 text-white"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                }`}>
                  <Megaphone className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              {/* Broadcast Expiry Badge */}
              {announcementExpiry && (
                <span className={`text-[9.5px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest leading-none inline-block mb-3.5 ${
                  announcementTheme === "urgent-red"
                    ? "bg-red-500/15 text-red-400 animate-pulse border border-red-500/20"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {announcementExpiry}
                </span>
              )}

              {/* Main Heading title */}
              <h2 className="text-2xl font-black uppercase tracking-tight italic text-white leading-tight">
                {announcementTitle}
              </h2>

              <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-300 max-w-sm mx-auto">
                {announcementMessage}
              </p>

              {/* Action Controls */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnouncementPopup(false);
                    sessionStorage.setItem("site_announcement_shown", "true");
                  }}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer"
                >
                  Dismiss Notice
                </button>
                <Link
                  to="/courses"
                  onClick={() => {
                    setShowAnnouncementPopup(false);
                    sessionStorage.setItem("site_announcement_shown", "true");
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-xl transition-all hover:scale-[1.02] ${
                    announcementTheme === "urgent-red"
                      ? "bg-gradient-to-r from-red-600 to-amber-600 shadow-red-950/20"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-950/20"
                  }`}
                >
                  Claim Seats Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UnifiedDashboard() {
  const [role, setRole] = useState<string>(() => localStorage.getItem("user_role") || "student");

  useEffect(() => {
    async function determineRole() {
      const savedRole = localStorage.getItem("user_role");
      if (savedRole) {
        setRole(savedRole);
      }

      if (!supabase) {
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (data?.role) {
            setRole(data.role);
            localStorage.setItem("user_role", data.role);
          } else if (user.user_metadata?.role) {
            const r = user.user_metadata.role;
            setRole(r);
            localStorage.setItem("user_role", r);
          }
        }
      } catch (e) {
        console.warn("Failed checking user profile role in UnifiedDashboard:", e);
      }
    }
    determineRole();

    const syncRoleChange = () => {
      setRole(localStorage.getItem("user_role") || "student");
    };
    window.addEventListener("storage", syncRoleChange);
    return () => window.removeEventListener("storage", syncRoleChange);
  }, []);

  return role === "teacher" ? <TeacherDashboard /> : <DashboardPage />;
}

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    // Silently prefetch primary public routes when the browser is completely idle
    if (typeof window !== "undefined") {
      const runIdlePrefetch = () => {
        prefetchRoute("/courses");
        prefetchRoute("/mock-tests");
        prefetchRoute("/pricing");
      };

      if ("requestIdleCallback" in window) {
        const id = (window as any).requestIdleCallback(runIdlePrefetch, { timeout: 3500 });
        return () => (window as any).cancelIdleCallback(id);
      } else {
        const timer = setTimeout(runIdlePrefetch, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-clip">
      <PageSEOManager />
      <Toaster position="top-right" richColors />
      <Navbar />
      <AnnouncementPopup />
      <main className="w-full min-w-0 max-w-full overflow-x-clip">
        <Suspense fallback={<div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-indigo-500 animate-pulse z-50 pointer-events-none" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/dashboard/books" element={<BooksPage isDashboardMode={true} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<UnifiedDashboard />} />
            <Route path="/dashboard/:tab" element={<UnifiedDashboard />} />
            <Route path="/dashboard/writing" element={<WritingModule />} />
            <Route path="/dashboard/courses" element={<StudentCourses isDashboardMode={true} />} />
            <Route path="/dashboard/courses/:examType/:testType/:testNumber" element={<StudentCourses isDashboardMode={true} />} />
            <Route path="/dashboard/courses/:courseId" element={<StudentCourses isDashboardMode={true} />} />
            <Route path="/dashboard/mock-tests" element={<MockTestPage />} />
            <Route path="/dashboard/mock-tests/:testId" element={<MockTestPage />} />
            <Route path="/dashboard/mock-test/academic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/dashboard/mock-test/general-training-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/dashboard/mock-tests/academic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/dashboard/mock-tests/general-training-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/dashboard/academic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/dashboard/acdamic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/dashboard/general-training-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/dashboard/gt-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/dashboard/ielts-mock-test-:year/:month" element={<MockTestPage />} />
            <Route path="/dashboard/ielts-mock-test-:year/:month/:testName" element={<MockTestPage />} />
            <Route path="/dashboard/ielts-mock-test-:year/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/mock-tests" element={<MockTestPage />} />
            <Route path="/mock-tests/:testId" element={<MockTestPage />} />
            <Route path="/mock-test/academic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/mock-test/general-training-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/mock-tests/academic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/mock-tests/general-training-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/academic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/acdamic-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/academic-mock-tests" element={<MockTestPage defaultCategory="Academic" />} />
            <Route path="/general-training-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/general-training" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/gt-tests" element={<MockTestPage defaultCategory="General Training" />} />
            <Route path="/ielts-mock-test-2024/:month" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2024/:month/:testName" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2024/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2025/:month" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2025/:month/:testName" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2025/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2026/:month" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2026/:month/:testName" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2026/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2027/:month" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2027/:month/:testName" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2027/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2028/:month" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2028/:month/:testName" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-2028/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-:year/:month" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-:year/:month/:testName" element={<MockTestPage />} />
            <Route path="/ielts-mock-test-:year/:month/:testName/:testType" element={<MockTestPage />} />
            <Route path="/test/:testId" element={<MockTestPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/courses" element={<StudentCourses />} />
            <Route path="/courses/:examType/:testType/:testNumber" element={<StudentCourses />} />
            <Route path="/courses/:courseId" element={<StudentCourses />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/pages/:slug" element={<CustomPageView />} />
            <Route path="/page/:slug" element={<CustomPageView />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  const rawBase = import.meta.env.BASE_URL;
  const basename = (rawBase && !rawBase.includes(".")) ? rawBase : undefined;

  return (
    <BrowserRouter basename={basename}>
      <MeetingsProvider>
        <AppContent />
      </MeetingsProvider>
    </BrowserRouter>
  );
}
