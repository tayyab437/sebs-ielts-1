import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mic, 
  Volume2, 
  Play, 
  Square, 
  Timer, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  Sparkles, 
  ArrowRight, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Globe, 
  Clock, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  ExternalLink, 
  MessageCircle, 
  Layers,
  Send,
  Star,
  Users,
  BarChart3
} from "lucide-react";
import { prefetchRoute } from "@/src/App";

// Interfaces & Data Models
interface QuestionItem {
  id: string;
  part: "Part 1" | "Part 2" | "Part 3";
  category: "Home & Life" | "Work & Career" | "Studies" | "Technology" | "Environment" | "Culture & Leisure" | "Society & Education";
  question: string;
  difficulty: "Standard" | "High Frequency" | "Advanced";
  description: string;
}

const SAMPLE_HUB_QUESTIONS: QuestionItem[] = [
  {
    id: "p1-1",
    part: "Part 1",
    category: "Home & Life",
    question: "Where is your hometown located, and how would you describe it?",
    difficulty: "Standard",
    description: "Focus on geographic location, population density, and general atmosphere."
  },
  {
    id: "p1-2",
    part: "Part 1",
    category: "Home & Life",
    question: "What do you like most about living in your current neighborhood?",
    difficulty: "Standard",
    description: "Emphasize community amenities, noise levels, or green spaces."
  },
  {
    id: "p1-3",
    part: "Part 1",
    category: "Technology",
    question: "What mobile applications do you open most frequently every day?",
    difficulty: "Standard",
    description: "Discuss functional utility, daily routines, and digital organization."
  },
  {
    id: "p1-4",
    part: "Part 1",
    category: "Work & Career",
    question: "Why did you decide to pursue your current line of work or career path?",
    difficulty: "High Frequency",
    description: "Highlight motivation, skill alignment, and long-term career outlook."
  },
  {
    id: "p2-1",
    part: "Part 2",
    category: "Environment",
    question: "Describe an environmental law or initiative in your country that has produced positive changes.",
    difficulty: "Advanced",
    description: "Cue Card: Introduce the policy, community reaction, tangible impact, and your assessment."
  },
  {
    id: "p2-2",
    part: "Part 2",
    category: "Society & Education",
    question: "Describe a person who has significantly influenced your academic or professional choices.",
    difficulty: "High Frequency",
    description: "Cue Card: Identify the person, shared history, key traits, and personal outcome."
  },
  {
    id: "p2-3",
    part: "Part 2",
    category: "Technology",
    question: "Describe a piece of technology or software that you initially found challenging to master.",
    difficulty: "Standard",
    description: "Cue Card: Specify the tool, why it was complex, how you learned it, and current proficiency."
  },
  {
    id: "p3-1",
    part: "Part 3",
    category: "Society & Education",
    question: "To what extent does reliance on automated algorithms diminish critical thinking among university graduates?",
    difficulty: "Advanced",
    description: "Analyze cognitive bandwidth, analytical depth, and academic policy balances."
  },
  {
    id: "p3-2",
    part: "Part 3",
    category: "Environment",
    question: "Should municipal governments mandate green roofs on all commercial architecture in urban centers?",
    difficulty: "Advanced",
    description: "Discuss urban heat islands, economic trade-offs, and urban planning policies."
  },
  {
    id: "p3-3",
    part: "Part 3",
    category: "Culture & Leisure",
    question: "How have global streaming platforms influenced traditional national cinematic industries?",
    difficulty: "High Frequency",
    description: "Evaluate cultural globalization, local narrative preservation, and production quality."
  }
];

export default function IeltsSpeakingPage() {
  const navigate = useNavigate();
  
  // State Management
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  
  // Part 1 Switcher
  const [activePart1Cat, setActivePart1Cat] = useState<"hometown" | "work" | "studies" | "routine" | "technology" | "travel">("hometown");

  // Cue Card Explorer Tabs
  const [activeCueCategory, setActiveCueCategory] = useState<string>("People");
  const [cueCardsVisibleCount, setCueCardsVisibleCount] = useState<number>(4);

  // Question Hub State
  const [hubPartFilter, setHubPartFilter] = useState<string>("all");
  const [hubCategoryFilter, setHubCategoryFilter] = useState<string>("all");
  const [hubSearchQuery, setHubSearchQuery] = useState<string>("");

  // Accordion State
  const [openMistakeIndex, setOpenMistakeIndex] = useState<number | null>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive Live Audio Timer Simulator Mock State
  const [isRecording, setIsRecording] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [talkSeconds, setTalkSeconds] = useState(0);

  // Active TOC Scroll Observer
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute("id") || "overview");
          }
        });
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  // Filtered Question Hub Items
  const filteredQuestions = SAMPLE_HUB_QUESTIONS.filter((q) => {
    if (hubPartFilter !== "all" && q.part.toLowerCase().replace(" ", "-") !== hubPartFilter) return false;
    if (hubCategoryFilter !== "all" && !q.category.toLowerCase().includes(hubCategoryFilter.toLowerCase())) return false;
    if (hubSearchQuery.trim() !== "") {
      const query = hubSearchQuery.toLowerCase();
      return q.question.toLowerCase().includes(query) || q.category.toLowerCase().includes(query) || q.description.toLowerCase().includes(query);
    }
    return true;
  });

  const part1CategoryData = {
    hometown: {
      title: "Hometown & Local Life",
      questions: [
        "Where is your hometown located, and how would you describe it?",
        "What do you like most about living in or visiting your hometown?",
        "Has your hometown changed significantly over the last several years?",
        "Would you prefer to settle down there permanently in the future? Why or why not?"
      ]
    },
    work: {
      title: "Work & Professional Path",
      questions: [
        "What do you currently do for a living?",
        "Why did you choose this particular field or profession?",
        "What is the most challenging aspect of your daily responsibilities?",
        "Do you see yourself staying in this industry over the long term?"
      ]
    },
    studies: {
      title: "Studies & Academic Field",
      questions: [
        "What subject or major are you currently studying?",
        "Why did you decide to pursue this specific academic degree?",
        "How do your professors usually structure your lectures or coursework?",
        "Do you feel your curriculum adequately prepares you for workplace needs?"
      ]
    },
    routine: {
      title: "Daily Routine & Organization",
      questions: [
        "What is the first thing you typically do when you wake up in the morning?",
        "Do you prefer to get demanding tasks done early in the day or later at night?",
        "Has your typical weekly schedule changed noticeably compared to a few years ago?",
        "What is your favorite way to unwind after a busy day?"
      ]
    },
    technology: {
      title: "Technology & Digital Tools",
      questions: [
        "What mobile applications do you open most frequently every day?",
        "Do you prefer reading documents digitally or on printed paper?",
        "Have modern communication tools made work life more or less convenient for you?",
        "Is there an emerging piece of technology you are looking forward to trying soon?"
      ]
    },
    travel: {
      title: "Travel & Leisure",
      questions: [
        "Do you prefer visiting bustling urban cities or quieter natural landscapes?",
        "What was the most memorable place you have traveled to recently?",
        "How do you usually pass the time during long transit journeys?",
        "Is there a country you hope to visit in the near future? Why that particular one?"
      ]
    }
  };

  const tocLinks = [
    { id: "overview", label: "1. Overview & Glance" },
    { id: "test-format", label: "2. Test Format & Architecture" },
    { id: "part-1", label: "3. Part 1 Strategy & Questions" },
    { id: "part-2", label: "4. Part 2 Cue Cards & Prep" },
    { id: "part-3", label: "5. Part 3 Deep Discussion" },
    { id: "scoring", label: "6. Scoring & 4 Criteria" },
    { id: "band-scores", label: "7. Band Scores 5–9 Matrix" },
    { id: "band-analysis", label: "8. Band 7 vs Band 8 Focus" },
    { id: "tips", label: "9. How to Improve Fluency" },
    { id: "practice-plan", label: "10. 30-Min Daily Routine" },
    { id: "practice", label: "11. Questions & Topics Hub" },
    { id: "samples", label: "12. Model Sample Answers" },
    { id: "mistakes", label: "13. 10 Common Mistakes" },
    { id: "mock-test", label: "14. Mock Test Simulator" },
    { id: "ai-speaking", label: "15. AI Practice Engine" },
    { id: "expert", label: "16. Learn with SEBS & Mentor" },
    { id: "official-sources", label: "17. Official IELTS Sources" },
    { id: "faq", label: "18. Candidate FAQs" }
  ];

  return (
    <div className="w-full bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased min-h-screen">
      
      {/* 1. BREADCRUMB & INSTITUTIONAL RIBBON */}
      <div className="w-full bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Home</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link to="/courses" className="hover:text-primary transition-colors">IELTS</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span aria-current="page" className="text-slate-900 dark:text-white font-bold">IELTS Speaking</span>
          </nav>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OFFICIAL CAMBRIDGE &amp; IDP CURRICULUM COMPLIANT
            </span>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="w-full bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Hero Details */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#00a8cc]/10 text-[#00a8cc] border border-[#00a8cc]/30 text-xs font-black uppercase tracking-widest">
                  ACADEMIC &amp; GENERAL TRAINING MODULE
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  CEFR Levels B2 • C1 • C2
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                IELTS Speaking: Complete Guide to the Test, Questions &amp; Practice
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                Understand the IELTS Speaking test from Part 1 to Part 3, explore authentic exam questions and topical themes, dissect certified Cambridge marking criteria, and master tactical fluency heuristics calibrated by Syed Ejaz Bukhari over 34 years of instructional leadership.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a 
                  href="#practice" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00a8cc] to-sky-500 hover:from-sky-400 hover:to-[#00a8cc] text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Speaking Practice</span>
                </a>
                
                <a 
                  href="#test-format" 
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
                >
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Explore Test Format</span>
                </a>

                <a 
                  href="#mock-test" 
                  className="inline-flex items-center justify-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-extrabold uppercase tracking-wider px-3 py-3"
                >
                  <span>Take Free Timed Diagnostic &rarr;</span>
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Assessment Window</span>
                  <span className="text-lg font-black text-white">11–14 Mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Examination Segments</span>
                  <span className="text-lg font-black text-white">3 Distinct Parts</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Global Acceptance</span>
                  <span className="text-lg font-black text-emerald-400">12,500+ Institutions</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Interactive Simulator */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-950/90 rounded-2xl shadow-2xl border border-slate-800 p-6 relative backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">Live Oral Assessment Room</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">Simulated Examiner UI</span>
                </div>

                {/* Candidate Task Card Display */}
                <div className="my-5 bg-slate-900 rounded-xl p-5 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded bg-[#00a8cc]/10 text-[#00a8cc] border border-[#00a8cc]/30 text-[10px] font-black uppercase">Candidate Task Card • Part 2</span>
                    <span className="text-[11px] font-mono text-slate-400">Topic ID: #CUE-804</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 leading-snug">Describe a person who has influenced you in your personal or academic life.</h4>
                  <p className="text-xs text-slate-400 mb-2">You should say:</p>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li>Who this person is and how you know them</li>
                    <li>What qualities, decisions, or traits define them</li>
                    <li>What specific influence they exerted over your path</li>
                    <li>And explain why their impact remains profoundly memorable</li>
                  </ul>
                </div>

                {/* Audio Recording & Timer State */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                    <div className="flex items-center gap-2 text-rose-400">
                      <Timer className="w-4 h-4" />
                      <span>Prep: <strong className="text-white">01:00</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Mic className="w-4 h-4" />
                      <span>Speaking: <strong className="text-white">02:00</strong></span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsRecording(!isRecording)}
                        className="w-8 h-8 rounded-full bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 flex items-center justify-center transition-colors"
                      >
                        {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono">Voice Track Capture</span>
                        <span className="text-xs font-bold text-white font-mono">01:42 / 02:00</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 h-6">
                      {[12, 20, 14, 24, 18, 10, 22, 16, 28, 12, 20, 15, 25, 12, 18].map((height, idx) => (
                        <div key={idx} className={`w-1 bg-[#00a8cc] rounded-full ${isRecording ? 'animate-pulse' : ''}`} style={{ height: `${height}px` }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cambridge Assessment Model
                  </span>
                  <a href="#part-2" className="text-[#00a8cc] hover:underline font-semibold text-[11px]">View Note-Taking Protocol &rarr;</a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. DUAL COLUMN DESKTOP GRID BODY WITH STICKY IN-PAGE TOC */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Mobile Accordion Toggle for On This Page */}
        <div className="lg:hidden mb-8">
          <button
            type="button"
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between text-left font-extrabold text-sm text-slate-900 dark:text-white"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00a8cc]" />
              <span>On This Page Guide Navigator ({tocLinks.length} Sections)</span>
            </div>
            {mobileTocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {mobileTocOpen && (
            <div className="mt-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-semibold">
              {tocLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => setMobileTocOpen(false)}
                  className={`block py-1.5 px-3 rounded-lg transition-colors ${
                    activeSection === link.id
                      ? "bg-[#00a8cc]/10 text-[#00a8cc] font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Desktop Left Sticky Navigation Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">On This Page</span>
                <span className="text-[10px] font-mono text-slate-400">18 Sections</span>
              </div>

              <nav className="flex flex-col space-y-1 text-xs text-slate-600 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-800">
                {tocLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`pl-3 py-1.5 hover:text-[#00a8cc] transition-all border-l-2 -ml-[2px] font-medium leading-tight ${
                      activeSection === link.id
                        ? "border-[#00a8cc] text-[#00a8cc] font-bold bg-sky-50/50 dark:bg-sky-950/20"
                        : "border-transparent text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-sky-50 dark:bg-sky-950/50 p-3.5 rounded-xl border border-sky-200/60 dark:border-sky-800/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00a8cc] block mb-1">Candidate Diagnostic</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-snug">Assess your speaking fluency &amp; cue card prep against official Cambridge band criteria.</p>
                  <a 
                    href="#mock-test"
                    className="block text-center py-2 px-3 bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                  >
                    Launch Diagnostic
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content Rail */}
          <main className="lg:col-span-9 flex flex-col gap-16 max-w-4xl">
            
            {/* SECTION 1: OVERVIEW */}
            <section id="overview" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 01 // OVERVIEW</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking at a Glance
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                The IELTS Speaking test is a standardized face-to-face or video-call oral assessment designed to evaluate how effectively candidates communicate in spoken English across informal, descriptive, and discursive contexts. The test is recorded digitally to ensure rigorous cross-examination, quality assurance, and verification.
              </p>

              {/* Direct Answer Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold">
                      <th className="py-3 px-4">Parameter</th>
                      <th className="py-3 px-4">Official Specification</th>
                      <th className="py-3 px-4">Academic Purpose &amp; Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Duration</td>
                      <td className="py-3 px-4 font-semibold text-[#00a8cc]">11 to 14 minutes</td>
                      <td className="py-3 px-4 text-slate-500">Strictly regulated by examiner timer; no penalty for shorter tests if criteria are satisfied.</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Format</td>
                      <td className="py-3 px-4">3 sequential interactive parts</td>
                      <td className="py-3 px-4 text-slate-500">Progression moves intentionally from personal familiarity to abstract sociological discourse.</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Part 1</td>
                      <td className="py-3 px-4">Introduction &amp; Interview (4–5 mins)</td>
                      <td className="py-3 px-4 text-slate-500">Questions regarding identity, home, occupation, and common daily routines.</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Part 2</td>
                      <td className="py-3 px-4">Individual Long Turn (3–4 mins)</td>
                      <td className="py-3 px-4 text-slate-500">1-minute preparation note-making; up to 2-minute uninterrupted speech based on a task card.</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Part 3</td>
                      <td className="py-3 px-4">Two-Way Discussion (4–5 mins)</td>
                      <td className="py-3 px-4 text-slate-500">Thematically tied to Part 2; candidate analyzes broader societal, moral, and conceptual questions.</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Assessment Rubric</td>
                      <td className="py-3 px-4">4 equally-weighted criteria (25% each)</td>
                      <td className="py-3 px-4 text-slate-500">Fluency &amp; Coherence, Lexical Resource, Grammatical Range &amp; Accuracy, Pronunciation.</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Academic vs GT</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">100% Identical</td>
                      <td className="py-3 px-4 text-slate-500">The exact same question pools and scoring standards apply to both exam registrations.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/40 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#00a8cc] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Institutional Notice:</strong> All data reflected in this syllabus is synthesized strictly from official Cambridge English, IDP Education, and British Council documentation. For formal validation, refer to <a href="#official-sources" className="text-[#00a8cc] underline font-bold">Official IELTS Reference Portals</a>.
                </p>
              </div>
            </section>

            {/* SECTION 2: TEST FORMAT */}
            <section id="test-format" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 02 // ARCHITECTURE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Test Format
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Understanding the progression of cognitive demand through the three parts allows candidates to calibrate pacing, tone, and lexical depth appropriately. The interview is not an interrogation; it is a progressive linguistic diagnostic.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-[#00a8cc] font-extrabold text-sm flex items-center justify-center">01</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">4–5 MINUTES</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Part 1: Introduction</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      The examiner confirms credentials, then poses direct queries around 2–3 familiar thematic clusters (e.g., accommodation, work, music, transport).
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    Objective: Immediate natural fluency without excessive elaboration.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-[#00a8cc] font-extrabold text-sm flex items-center justify-center">02</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">3–4 MINUTES</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Part 2: Long Turn</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Candidate receives a task card, paper, and pencil. 1 minute to outline notes; exactly 1 to 2 minutes of continuous individual speech without interruption.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    Objective: Coherent discourse maintenance and narrative structure.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-[#00a8cc] font-extrabold text-sm flex items-center justify-center">03</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">4–5 MINUTES</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Part 3: Deep Discussion</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Examiner initiates analytical discourse exploring broader concepts, hypothetical scenarios, historical shifts, and sociological patterns.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    Objective: Abstract speculation, logical justification &amp; nuance.
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: PART 1 */}
            <section id="part-1" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 03 // PART 1</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Part 1: Questions &amp; Topics
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Part 1 tests your ability to provide straightforward, authentic, grammatically sound answers on familiar aspects of personal life. It establishes the baseline conversational ease for the entire session.
              </p>

              {/* Interactive Category Selector */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">SELECT FREQUENT TEST CATEGORY:</span>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(Object.keys(part1CategoryData) as Array<keyof typeof part1CategoryData>).map((catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setActivePart1Cat(catKey)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                        activePart1Cat === catKey
                          ? "bg-[#00a8cc] text-slate-950 shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {catKey}
                    </button>
                  ))}
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00a8cc]">
                      Topic: {part1CategoryData[activePart1Cat].title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">Official Practice Pool</span>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                    {part1CategoryData[activePart1Cat].questions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono font-bold text-[#00a8cc] mt-0.5">Q{idx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3-Step Strategy */}
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">The 3-Step Part 1 Answer Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">STEP 1 • DIRECT CORE</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Directly Answer</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">State your stance or direct response cleanly in the opening clause without circular stalling.</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">STEP 2 • CAUSAL REASON</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Provide Rationale</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Add an explanatory clause with a causal marker (because, primarily due to, given that).</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">STEP 3 • CONCRETE DETAIL</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Add Detail or Example</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Conclude with a brief personal habit, routine, or illustrative instance in 1 concise sentence.</p>
                </div>
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-rose-500">Sub-Optimal Response (Band 5.0)</span>
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 italic mb-3">
                    "Do you enjoy reading books?"<br />
                    “Yes, I do. I like reading very much. It is good.”
                  </p>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    <strong>Deficiency Analysis:</strong> Displays bare minimum grammatical syntax, monosyllabic repetition, zero range of descriptive vocabulary, and provides no natural rhythm.
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-emerald-500">High-Yield Institutional Response (Band 7.5+)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 italic mb-3">
                    "Do you enjoy reading books?"<br />
                    “Yes, definitely. I particularly lean towards non-fiction and biographies because I find historical contexts fascinating. I usually try to wind down with a chapter or two right before going to sleep.”
                  </p>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    <strong>Linguistic Strengths:</strong> Employs natural discourse collocation (‘lean towards’, ‘wind down’), contextual precision (‘biographies’), and balanced compound syntax.
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: PART 2 CUE CARDS */}
            <section id="part-2" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 04 // INDIVIDUAL LONG TURN</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Part 2: Cue Cards, Topics &amp; Questions
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Part 2 requires the candidate to sustain discourse for up to 2 full minutes. The examiner remains silent until the conclusion. The differentiator between Band 6 and Band 8 here is narrative cohesion, chronological coherence, and spontaneous lexical flexibility.
              </p>

              {/* Task Card Box */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#00a8cc]/30 shadow-md mb-8">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#00a8cc]" />
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">CANDIDATE TASK CARD</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                    Prep: 1:00 min | Speech: 2:00 mins
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Describe an environmental law or initiative in your country that has produced positive changes.
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">You should say:</p>
                  <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                    <li>What the law or initiative is and when it was introduced</li>
                    <li>How people reacted when it was initially launched</li>
                    <li>What practical differences or tangible impacts it has made</li>
                    <li>And explain your personal perspective on whether it goes far enough.</li>
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="italic">You will have 1 minute to take notes. A notepad and pencil are provided.</span>
                  <span className="text-[#00a8cc] font-bold">Cambridge Certified Rubric</span>
                </div>
              </div>

              {/* 4 Quadrants */}
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">The 1-Minute Preparation Protocol: 4 Quadrants</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
                Do not write full sentences during the 60-second preparation phase; this exhausts your cognitive window. Divide your note paper mentally into 4 rapid keyword quadrants:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">QUADRANT 1: CONTEXT / SUBJECT</span>
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white block mb-1">WHO / WHAT</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400">3–4 core nouns &amp; precise descriptors. Avoid spelling concerns; write trigger symbols.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">QUADRANT 2: TEMPORAL ANCHOR</span>
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white block mb-1">WHEN / WHERE / BACKGROUND</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Temporal markers (e.g., ‘undergrad era’, ‘post-lockdown’). Enables accurate past-tense verbs.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">QUADRANT 3: TURNING POINT</span>
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white block mb-1">KEY ACTIONS / DEVELOPMENT</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Active verbs and adverbs to narrate the sequence. Keeps the speech flowing past 60 seconds.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">QUADRANT 4: REFLECTION</span>
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white block mb-1">WHY SIGNIFICANT / IMPACT</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Evaluative adjectives and speculative conjunctions to provide a solid, natural ending.</p>
                </div>
              </div>

              {/* Cue Card Category Explorer */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Curated IELTS Part 2 Cue Card Archive</h4>
                    <p className="text-xs text-slate-500">Explore recurring authentic prompts tested across recent exam cycles.</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#00a8cc]/10 text-[#00a8cc] px-2 py-0.5 rounded uppercase">Updated Weekly</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { topic: "People", title: "Describe an elderly person whose life story inspired you.", desc: "Focus on historical resilience, personal wisdom, and specific life choices." },
                    { topic: "Places", title: "Describe a quiet place you often visit to relax or concentrate.", desc: "Focus on sensory details, auditory descriptions, and psychological impact." },
                    { topic: "Experiences", topicTag: "Experiences", title: "Describe a time you received constructive feedback on your work.", desc: "Emphasize professional communication, personal reactions, and concrete outcomes." },
                    { topic: "Technology", title: "Describe a piece of technology that you found challenging to learn.", desc: "Discuss the steep learning curve, technical vocabulary, and eventual proficiency." },
                    { topic: "Objects", title: "Describe an item of sentimental value that you have kept for a long time.", desc: "Describe physical craftsmanship, historical origin, and personal emotional attachment." },
                    { topic: "Work & Study", title: "Describe a project or assignment you completed as part of a team.", desc: "Highlight division of labor, conflict resolution, and final presentation outcome." }
                  ].slice(0, cueCardsVisibleCount).map((card, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-[#00a8cc]/40 transition-all">
                      <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase block mb-1">Topic • {card.topic}</span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1 leading-snug">{card.title}</h5>
                      <p className="text-[11px] text-slate-500 mb-2">{card.desc}</p>
                      <a href="#samples" className="text-xs font-bold text-[#00a8cc] hover:underline">View Band 8 Sample Outline &rarr;</a>
                    </div>
                  ))}
                </div>

                {cueCardsVisibleCount < 6 && (
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={() => setCueCardsVisibleCount(6)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-[#00a8cc] hover:text-slate-950 transition-colors"
                    >
                      Load More Topics
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 5: PART 3 DISCUSSION */}
            <section id="part-3" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 05 // DEEP DISCOURSE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Part 3: Discussion Questions &amp; Topics
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Part 3 bridges the gap between individual recounting and high-level academic debate. Here, the examiner examines your ability to express opinions, analyze arguments, evaluate trends, and weigh hypothetical outcomes on abstract themes.
              </p>

              {/* Contrast Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 mb-8">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    <tr>
                      <th className="p-3.5 border-b border-slate-200 dark:border-slate-800">Criterion</th>
                      <th className="p-3.5 border-b border-slate-200 dark:border-slate-800">Part 1 (Interview)</th>
                      <th className="p-3.5 border-b border-slate-200 dark:border-slate-800">Part 2 (Long Turn)</th>
                      <th className="p-3.5 border-b border-slate-200 dark:border-slate-800">Part 3 (Discussion)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Focus</td>
                      <td className="p-3.5 text-slate-500">Personal reality &amp; habits</td>
                      <td className="p-3.5 text-slate-500">Extended descriptive narrative</td>
                      <td className="p-3.5 text-[#00a8cc] font-bold">Broad societal &amp; conceptual themes</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Perspective</td>
                      <td className="p-3.5 text-slate-500">“I usually... In my home...”</td>
                      <td className="p-3.5 text-slate-500">“This occurred during my...”</td>
                      <td className="p-3.5 text-[#00a8cc] font-bold">“From a macro perspective, societies tend to...”</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Vocabulary</td>
                      <td className="p-3.5 text-slate-500">Everyday conversational</td>
                      <td className="p-3.5 text-slate-500">Descriptive &amp; emotional</td>
                      <td className="p-3.5 text-[#00a8cc] font-bold">Analytical, formal, academic</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Target Response Length</td>
                      <td className="p-3.5 text-slate-500">2 to 4 sentences</td>
                      <td className="p-3.5 text-slate-500">90 to 120 seconds</td>
                      <td className="p-3.5 text-[#00a8cc] font-bold">4 to 6 developed sentences</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* OREC Framework */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">The OREC Answer Framework for Part 3</h3>
                <p className="text-xs text-slate-500 mb-4">When confronted with dense abstract inquiries, avoid rambling. Anchor your thoughts through OREC:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-6">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">O • OPINION</span>
                    <span className="text-slate-900 dark:text-white font-bold block">Articulate Point</span>
                    <span className="text-slate-500 text-[11px] block mt-1">“It seems evident to me that...”</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">R • REASON</span>
                    <span className="text-slate-900 dark:text-white font-bold block">Explain Root Cause</span>
                    <span className="text-slate-500 text-[11px] block mt-1">“The primary catalyst stems from...”</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">E • EXAMPLE</span>
                    <span className="text-slate-900 dark:text-white font-bold block">Societal Evidence</span>
                    <span className="text-slate-500 text-[11px] block mt-1">“Take, for instance, contemporary shifts in...”</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">C • CONTRAST</span>
                    <span className="text-slate-900 dark:text-white font-bold block">Nuance / Alternative</span>
                    <span className="text-slate-500 text-[11px] block mt-1">“Conversely, had institutions not intervened...”</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/40">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase block mb-1">Example Abstract Prompt</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Examiner: “To what extent does reliance on automated algorithms diminish critical thinking among university graduates?”
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-[#00a8cc]">Band 8.5 Strategy:</strong> Do not simply say ‘Yes, it is bad.’ Acknowledge benefits for cognitive bandwidth, identify systemic risks regarding unverified data adoption, and conclude with the responsibility of curricula to enforce epistemological validation.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 6: SCORING & 4 CRITERIA */}
            <section id="scoring" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 06 // EVALUATION RUBRIC</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  How Is IELTS Speaking Scored?
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Examiners award equal 25% weights to each of the four discrete assessment pillars. Your final Speaking score is the arithmetic mean of these four band descriptors, rounded up or down in accordance with standard IELTS half-band rounding conventions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">1. Fluency &amp; Coherence (FC)</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc]">25% OF TOTAL</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Evaluates your speech tempo, consistency of rhythm, natural pause placement, and seamless deployment of discourse markers without obvious hesitation to search for basic grammar.
                  </p>
                  <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    Focus: Avoid self-correction pauses mid-clause; connect clauses smoothly.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">2. Lexical Resource (LR)</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc]">25% OF TOTAL</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Measures vocabulary range, appropriateness of register, collocation accuracy, and the ability to paraphrase thoughts cleanly when a specific lexical item is temporarily unavailable.
                  </p>
                  <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    Focus: Precision over ornamentation. No unverified memorized idioms.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">3. Grammatical Range &amp; Accuracy (GRA)</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc]">25% OF TOTAL</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Examines your ability to blend compound, complex, and conditional clauses naturally, alongside overall grammatical precision and systematic error-free sentence frequency.
                  </p>
                  <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    Focus: Balanced syntax (relative clauses, inversions, participle clauses).
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">4. Pronunciation (P)</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc]">25% OF TOTAL</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Gauges phonetic intelligibility, accurate syllable and sentence stress, connected speech features (linking, elision), and intonation contours.
                  </p>
                  <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    Crucial Rule: A native British or American accent is NOT mandated.
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 7: BAND MATRIX */}
            <section id="band-scores" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 07 // BAND MATRIX</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Band Scores Explained
                </h2>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Band</th>
                      <th className="p-3.5">Fluency &amp; Coherence</th>
                      <th className="p-3.5">Lexical Resource</th>
                      <th className="p-3.5">Grammatical Accuracy</th>
                      <th className="p-3.5">Pronunciation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white align-top">Band 9<span className="block text-[10px] font-mono text-emerald-500">Expert</span></td>
                      <td className="p-3.5 text-slate-500">Speaks completely fluently with rare repetition or self-correction; coherent development is effortless.</td>
                      <td className="p-3.5 text-slate-500">Applies broad vocabulary with full flexibility, nuance, and precise idiomatic use.</td>
                      <td className="p-3.5 text-slate-500">Naturally integrates full grammatical range consistently error-free.</td>
                      <td className="p-3.5 text-slate-500">Effortless to understand; applies phonological features across all discourse subtleties.</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white align-top">Band 8<span className="block text-[10px] font-mono text-[#00a8cc]">Very Good</span></td>
                      <td className="p-3.5 text-slate-500">Maintains fluent speech with occasional hesitation for content. Complex topics are structured logically.</td>
                      <td className="p-3.5 text-slate-500">Uses a wide vocabulary flexibly; occasionally makes minor collocation slips.</td>
                      <td className="p-3.5 text-slate-500">High proportion of error-free sentences; varied complex structures dominant.</td>
                      <td className="p-3.5 text-slate-500">Clear and easy to understand throughout; sustains stress and intonation patterns well.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white align-top">Band 7<span className="block text-[10px] font-mono text-sky-500">Good</span></td>
                      <td className="p-3.5 text-slate-500">Can speak at length without noticeable effort. May exhibit language-search hesitation or self-correction.</td>
                      <td className="p-3.5 text-slate-500">Resourceful lexical range; uses less common and idiomatic words with some inappropriacies.</td>
                      <td className="p-3.5 text-slate-500">Frequently uses complex sentences; occasional minor grammatical errors persist.</td>
                      <td className="p-3.5 text-slate-500">Intelligible throughout; minor L1 accent influences cause occasional lack of clarity.</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white align-top">Band 6<span className="block text-[10px] font-mono text-slate-400">Competent</span></td>
                      <td className="p-3.5 text-slate-500">Willing to speak at length, but coherence lapses due to repetition, re-phrasing, or self-repair.</td>
                      <td className="p-3.5 text-slate-500">Sufficient vocabulary to discuss familiar topics; struggles with abstract paraphrasing.</td>
                      <td className="p-3.5 text-slate-500">Mix of simple and complex structures; errors occur regularly without impeding clarity.</td>
                      <td className="p-3.5 text-slate-500">Generally intelligible; occasional mispronunciations cause listener effort.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white align-top">Band 5<span className="block text-[10px] font-mono text-amber-500">Modest</span></td>
                      <td className="p-3.5 text-slate-500">Pauses frequently to search for basic grammar; over-relies on simple connectors.</td>
                      <td className="p-3.5 text-slate-500">Limited vocabulary range; communicates personal meaning simply; high repetition.</td>
                      <td className="p-3.5 text-slate-500">Accurate only in simple sentences; complex sentences frequently break down.</td>
                      <td className="p-3.5 text-slate-500">Frequent mispronunciations; listener concentration frequently required.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 8: BAND 7 VS BAND 8 */}
            <section id="band-analysis" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 08 // THE CRITICAL LEAP</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Band 7 &amp; Band 8 In Focus
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-mono font-bold uppercase block w-fit mb-3">Band 7 Profile</span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">The Competent Scholar Profile</h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                    <li><strong className="text-slate-900 dark:text-white">Fluency:</strong> Able to maintain long runs of speech, but hesitation often arises from searching for words or structures.</li>
                    <li><strong className="text-slate-900 dark:text-white">Lexicon:</strong> Deploys advanced vocabulary and idiomatic phrases, but some choices feel shoehorned or collocated unnaturally.</li>
                    <li><strong className="text-slate-900 dark:text-white">Grammar:</strong> Demonstrates consistent complex structures, but minor slips occur across 30% of utterances.</li>
                  </ul>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#00a8cc]/30 shadow-sm">
                  <span className="px-2.5 py-0.5 rounded bg-[#00a8cc]/10 text-[#00a8cc] text-[10px] font-mono font-bold uppercase block w-fit mb-3">Band 8 Profile</span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">The Effortless Communicator</h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                    <li><strong className="text-slate-900 dark:text-white">Fluency:</strong> Hesitations are content-driven (pondering an answer) rather than language-driven (groping for words).</li>
                    <li><strong className="text-slate-900 dark:text-white">Lexicon:</strong> Uses varied, contextual vocabulary with precise collocations without sounding rehearsed.</li>
                    <li><strong className="text-slate-900 dark:text-white">Grammar:</strong> Produces a majority of error-free sentences; complex sentence mechanics feel natural and purposeful.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-800/40">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Key Examiner Insight: The "Natural Phrasing" Rule</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  “Band 8 candidates do not memorize lists of rare vocabulary. Instead, they use precise words and collocations naturally in context. Forcing words like ‘plethora’ or ‘myriad’ awkwardly often lowers your score to Band 6.” — <em>Syed Ejaz Bukhari, Senior Academic Director</em>
                </p>
              </div>
            </section>

            {/* SECTION 9: TACTICAL UPGRADES */}
            <section id="tips" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 09 // TACTICAL UPGRADES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  How to Improve Your IELTS Speaking
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { title: "1. Master Discourse Flow (Fluency Drills)", desc: "Avoid fillers like 'umm' and 'aahh'. Use natural fillers to buy thinking time: 'That is an intriguing angle to consider...', 'Well, if we examine this from a historical standpoint...'", drill: "Drill: Practice 90-second audio recordings daily on unscripted prompts." },
                  { title: "2. Map Words in Collocation Pairs (Lexicon)", desc: "Stop memorizing isolated words. Learn vocabulary in natural word pairs. Instead of just learning 'problem', practice 'an intractable dilemma', 'pose a formidable obstacle', or 'alleviate strain'.", drill: "Drill: Build topical 4-column collocation maps for Environment, Education, and Tech." },
                  { title: "3. Shadow Native Prosody & Sentence Stress (Pronunciation)", desc: "Pronunciation is about rhythm and word stress, not accents. Use the speech shadowing method: listen to BBC Radio 4 or academic podcasts, pausing to match their stress and intonation patterns.", drill: "Drill: Shadow a 60-second excerpt 3 times until rhythm matches naturally." },
                  { title: "4. Build Grammatical Variety (Grammar Range)", desc: "Mix simple and complex sentence structures naturally: mix real conditionals ('If policies shift...'), counterfactuals ('Had the government acted sooner...'), and relative clauses.", drill: "Drill: Rephrase 3 simple sentences into compound-complex sentences daily." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-[#00a8cc] flex items-center justify-center shrink-0 font-extrabold text-sm">
                      0{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{item.desc}</p>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.drill}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 10: 30-MINUTE ROUTINE */}
            <section id="practice-plan" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 10 // DAILY REGIMEN</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  A 30-Minute IELTS Speaking Practice Routine
                </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { time: "00:00 – 05:00", title: "Vocal Warm-up & Part 1 Drill", desc: "Answer 4 Part 1 questions out loud without pause to build momentum.", tag: "Warm-Up" },
                  { time: "05:00 – 15:00", title: "Part 2 Cue Card Simulation", desc: "1 min notes, 2 min recorded speech. Listen back and note hesitations.", tag: "Core Task" },
                  { time: "15:00 – 20:00", title: "Part 3 Abstract Deep Reasoning", desc: "Answer 2 complex societal questions using the OREC framework.", tag: "Discourse" },
                  { time: "20:00 – 25:00", title: "Prosody & Shadowing Practice", desc: "Shadow a short native recording to improve rhythm, pausing, and intonation.", tag: "Phonetics" },
                  { time: "25:00 – 30:00", title: "Self-Review & Mistake Logging", desc: "Note repeated grammar errors and add 2 useful collocations to your notebook.", tag: "Retention" }
                ].map((step, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-[#00a8cc] bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-lg shrink-0">{step.time}</span>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{step.title}</h4>
                        <p className="text-[11px] text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold hidden sm:inline">{step.tag}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 11: QUESTION HUB FILTERABLE UI */}
            <section id="practice" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 11 // QUESTION DATABASE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Questions &amp; Topics Hub
                </h2>
              </div>

              {/* Dynamic Filters */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">Filter by Section</label>
                    <select
                      value={hubPartFilter}
                      onChange={(e) => setHubPartFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#00a8cc]"
                    >
                      <option value="all">All Speaking Parts (1, 2, 3)</option>
                      <option value="part-1">Part 1 • Familiar Interview</option>
                      <option value="part-2">Part 2 • Individual Long Turn</option>
                      <option value="part-3">Part 3 • Thematic Discussion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">Thematic Category</label>
                    <select
                      value={hubCategoryFilter}
                      onChange={(e) => setHubCategoryFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#00a8cc]"
                    >
                      <option value="all">All Academic Topics</option>
                      <option value="home">Home &amp; Life</option>
                      <option value="work">Work &amp; Career</option>
                      <option value="technology">Technology</option>
                      <option value="environment">Environment</option>
                      <option value="society">Society &amp; Education</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">Search Keywords</label>
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                      <input
                        type="text"
                        value={hubSearchQuery}
                        onChange={(e) => setHubSearchQuery(e.target.value)}
                        placeholder="Search prompt archives..."
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#00a8cc]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Displaying {filteredQuestions.length} curated prompts from the SEBS archive</span>
                  <span className="text-[#00a8cc] font-bold">Official Exam Pool Format</span>
                </div>
              </div>

              {/* Cards Output */}
              <div className="space-y-3">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#00a8cc]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] text-[10px] font-mono font-bold uppercase">{q.part}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Topic: {q.category}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">{q.difficulty}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{q.question}</h4>
                      <p className="text-xs text-slate-500">{q.description}</p>
                    </div>

                    <Link
                      to="/mock-tests"
                      onClick={() => prefetchRoute("/mock-tests")}
                      className="px-4 py-2 bg-[#00a8cc] text-slate-950 hover:bg-[#0096b7] rounded-xl text-xs font-extrabold uppercase tracking-wider shrink-0 transition-colors text-center"
                    >
                      Practice Prompt
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 12: MODEL SAMPLE ANSWERS */}
            <section id="samples" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 12 // MODEL RESPONSES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Speaking Sample Answers
                </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                      Band 8.5 Exemplar • Part 2
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      Prompt: Describe a challenging decision that yielded a positive outcome.
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Duration: 1m 58s</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed mb-4">
                  “I would like to speak about my decision three years ago to transition from an established corporate position into an independent data consultancy. At the time, it felt like an immense risk because I was walking away from financial predictability. However, I realized that remaining in my comfortable role was causing my technical skills to plateau. The initial six months were particularly demanding; I had to manage business development while refining my technical offerings. Ultimately, this pivot gave me professional autonomy and expanded my analytical expertise far beyond what my previous role could offer. Looking back, embracing that uncertainty was one of the most rewarding decisions of my career.”
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">WHY THIS EARNS BAND 8.5:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Uses natural collocations (<em>‘financial predictability’</em>, <em>‘skills to plateau’</em>, <em>‘professional autonomy’</em>) without forced idioms. Employs varied tenses cleanly throughout.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-mono font-bold text-emerald-500 block mb-1">WHAT TO REFINE FOR BAND 9.0:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Incorporate an inverted conditional (<em>‘Had I remained comfortable...’</em>) to demonstrate top-tier grammatical range naturally.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 13: 10 COMMON MISTAKES */}
            <section id="mistakes" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 13 // ERROR CATALOGUE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  10 Critical IELTS Speaking Mistakes
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { title: "1. Memorizing scripted templates or canned speeches", desc: "Examiners are trained to spot memorized answers within seconds through shifts in intonation, unnatural speed, and glazed eye contact. When recognized, examiners interrupt with off-topic queries." },
                  { title: "2. Giving brief, monosyllabic responses in Part 1", desc: "Replying with a simple 'Yes, I like reading' gives the examiner zero evidence to award higher bands. Always expand with a reason, detail, or short example." },
                  { title: "3. Speaking unnaturally fast to create an illusion of fluency", desc: "Rushing leads to mispronounced words, lost word stress, and grammatical slips. True fluency is steady, rhythmic pacing with purposeful pauses at clause boundaries." },
                  { title: "4. Overusing mechanical writing linkers ('Furthermore, Moreover')", desc: "Words like 'furthermore' and 'moreover' belong in academic writing, not natural spoken discourse. Use conversational connectors like 'On top of that...', 'Having said that...'." },
                  { title: "5. Forcing unnatural or outdated idioms", desc: "Forcing idioms like 'raining cats and dogs' or 'over the moon' sounds artificial. Natural idiomatic language means conversational collocations like 'take for granted', 'boils down to'." },
                  { title: "6. Ignoring syllable stress and sentence prosody", desc: "Focus on clear pronunciation, accurate word stress, and natural sentence intonation rather than trying to fake a British or American accent." },
                  { title: "7. Repeating the exact words from the examiner's question", desc: "Paraphrase the prompt using synonyms and structural shifts rather than repeating identical prompt phrasing." },
                  { title: "8. Leaving opinions undeveloped in Part 3", desc: "Part 3 demands abstract reasoning. Expand your points with reasons, societal instances, and alternative scenarios using the OREC structure." },
                  { title: "9. Straying off-topic during the Part 2 Cue Card", desc: "Stay grounded in the task card prompts. Use the 4 keyword quadrants during your 1-minute prep to maintain narrative focus." },
                  { title: "10. Panic-stalling when facing unfamiliar questions", desc: "Buy thinking time with natural fillers: 'That is an intriguing angle to consider...', then systematically address the core premise." }
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenMistakeIndex(openMistakeIndex === idx ? null : idx)}
                      className="w-full p-4 text-left font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 font-mono text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                        <span>{item.title}</span>
                      </span>
                      {openMistakeIndex === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {openMistakeIndex === idx && (
                      <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 pt-3">
                        {item.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 14: MOCK TEST SIMULATOR */}
            <section id="mock-test" className="scroll-mt-24">
              <div className="bg-slate-900 text-white rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="relative z-10 max-w-2xl">
                  <span className="px-2.5 py-1 rounded bg-[#00a8cc]/10 text-[#00a8cc] border border-[#00a8cc]/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    EXAM ENGINE PREVIEW
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-3">
                    Official IELTS Speaking Mock Test Simulator
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Take an authentic full-length speaking diagnostic. Our simulation replicates the 11–14 minute exam environment with live audio timing, prompt transitions, and automated evaluation.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-8 text-slate-300 border-y border-slate-800 py-4 font-mono text-xs">
                    <div>
                      <span className="block text-slate-500 text-[10px]">PART 1</span>
                      <span className="font-bold text-white">4.5 Mins</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[10px]">PART 2</span>
                      <span className="font-bold text-white">1m Prep / 2m Talk</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[10px]">PART 3</span>
                      <span className="font-bold text-white">5 Mins</span>
                    </div>
                  </div>

                  <Link
                    to="/mock-tests"
                    onClick={() => prefetchRoute("/mock-tests")}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#00a8cc] to-sky-500 hover:from-sky-400 hover:to-[#00a8cc] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Enter Interactive Mock Examination</span>
                  </Link>
                </div>
              </div>
            </section>

            {/* SECTION 15: AI SPEAKING ENGINE */}
            <section id="ai-speaking" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 15 // AI TECHNOLOGY</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  AI Speaking &amp; Pronunciation Practice
                </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-[#00a8cc] flex items-center justify-center mb-3">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Fluency Rhythm Analysis</h4>
                    <p className="text-[11px] text-slate-500">Detects filler sounds, tracks pauses per minute, and graphs your natural speech pace.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-[#00a8cc] flex items-center justify-center mb-3">
                      <Mic className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Phoneme-Level Accuracy</h4>
                    <p className="text-[11px] text-slate-500">Evaluates word stress, syllable clarity, and connected speech features.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-[#00a8cc] flex items-center justify-center mb-3">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Grammar &amp; Vocabulary Checks</h4>
                    <p className="text-[11px] text-slate-500">Transcribes your responses to highlight grammatical errors and suggest stronger collocations.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/40">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Included with all SEBS student dashboard accounts.</span>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => prefetchRoute("/dashboard")}
                    className="px-5 py-2.5 bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0"
                  >
                    Access Student Portal
                  </Link>
                </div>
              </div>
            </section>

            {/* SECTION 16: LEARN WITH SEBS & MENTOR */}
            <section id="expert" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 16 // INSTITUTIONAL HERITAGE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Learn IELTS Speaking With SEBS
                </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-5 flex flex-col items-center text-center">
                    <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-sky-100 dark:border-sky-900 shadow-md mb-4 bg-slate-200">
                      <img
                        src="/syed_ejaz_bukhari_hero.webp"
                        alt="Sir Syed Ejaz Bukhari - Founder &amp; Master English Coach"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Syed Ejaz Bukhari</h3>
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Founder &amp; Principal Linguistics Fellow</span>
                    <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                      ESTABLISHED 1992
                    </span>
                  </div>

                  <div className="md:col-span-7 flex flex-col gap-4">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Over 34 Years of Academic Excellence</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Founded in 1992, SEB’s Global Language Institute has prepared test-takers across 45+ countries for academic and professional certification. Under the direction of Syed Ejaz Bukhari, our method focuses on natural fluency, accurate collocations, and structured arguments rather than memorized scripts.
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-lg font-black text-[#00a8cc] block">45,000+</span>
                        <span className="text-slate-500 text-[11px]">Students Mentored Globally</span>
                      </div>
                      <div>
                        <span className="text-lg font-black text-emerald-500 block">8.0+</span>
                        <span className="text-slate-500 text-[11px]">Median Honors Track Band</span>
                      </div>
                    </div>

                    <div>
                      <Link
                        to="/courses"
                        onClick={() => prefetchRoute("/courses")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#202e43] hover:bg-[#152030] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                      >
                        <span>Explore SEBS Speaking Courses &rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 17: OFFICIAL SOURCES */}
            <section id="official-sources" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 17 // OFFICIAL SOURCES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Official IELTS Resources
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">BRITISH COUNCIL</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Official Speaking Test Guidelines</h4>
                  <p className="text-[11px] text-slate-500 mb-3">Official guidelines, test-day rules, and candidate requirements.</p>
                  <a
                    href="https://takeielts.britishcouncil.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1"
                  >
                    Visit British Council <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] block mb-1">IDP IELTS</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Candidate Preparation Portal</h4>
                  <p className="text-[11px] text-slate-500 mb-3">Computer-delivered and paper-based speaking exam specifications.</p>
                  <a
                    href="https://ielts.idp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1"
                  >
                    Visit IDP Global <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-emerald-500 block mb-1">CAMBRIDGE ENGLISH</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Public Band Descriptors</h4>
                  <p className="text-[11px] text-slate-500 mb-3">The complete official assessment rubric for Bands 1 through 9.</p>
                  <a
                    href="https://www.cambridgeenglish.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1"
                  >
                    Cambridge Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>

            {/* SECTION 18: FAQ ACCORDION */}
            <section id="faq" className="scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00a8cc]">SECTION 18 // CANDIDATE INQUIRIES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { q: "How long does the IELTS Speaking test take?", a: "The test lasts between 11 and 14 minutes across all test centers globally. The timing is strictly monitored by the examiner. If your test finishes closer to 11 minutes, it simply means you answered questions clearly and gave the examiner sufficient language to score your performance." },
                  { q: "Is the Speaking test different for IELTS Academic and General Training?", a: "No. The Speaking test is completely identical for both IELTS Academic and IELTS General Training candidates. It uses the exact same format, scoring criteria, and question pools." },
                  { q: "Can I ask the examiner to repeat or clarify a question?", a: "Yes. In Part 1, you can ask the examiner to repeat a question (e.g., 'Could you repeat that please?'). In Part 3, you can also ask them to rephrase or explain a word (e.g., 'Could you explain what you mean by that term?'). Asking for repetition will not lower your score." },
                  { q: "Do I need a British or American accent to get Band 8 or 9?", a: "No. Official band descriptors assess phonological clarity, word stress, sentence stress, and rhythm. Having a regional accent is completely fine as long as your speech remains clear and easily understood." },
                  { q: "What happens if the examiner interrupts me during Part 2?", a: "Being interrupted is normal and simply means you have reached the 2-minute time limit. Examiners must keep strictly to the schedule. An interruption is not a penalty." },
                  { q: "Can I make up examples or tell a white lie if I don't have real experience?", a: "Yes. IELTS is a language assessment, not a background check. If a Cue Card asks about a time you went camping and you never have, invent a realistic scenario. What matters is your fluency, vocabulary, and grammatical control." }
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <span>{item.q}</span>
                      {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* FINAL CALL TO ACTION */}
            <section className="w-full bg-[#202e43] text-white p-8 lg:p-10 rounded-3xl border border-slate-700 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">Ready to Improve Your IELTS Speaking?</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                    Build stronger fluency, vocabulary, grammar and pronunciation with structured IELTS Speaking preparation and realistic practice.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href="#practice"
                    className="px-6 py-3.5 bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg"
                  >
                    Start Speaking Practice
                  </a>
                  
                  <Link
                    to="/courses"
                    onClick={() => prefetchRoute("/courses")}
                    className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-600 transition-colors"
                  >
                    Explore IELTS Courses
                  </Link>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

    </div>
  );
}
