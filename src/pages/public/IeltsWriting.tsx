import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  ShieldCheck, 
  HelpCircle, 
  ExternalLink, 
  BarChart3, 
  Laptop, 
  PenTool, 
  Award,
  Zap,
  Timer,
  BookOpen
} from "lucide-react";
import { prefetchRoute } from "@/src/App";

interface Task2Prompt {
  id: string;
  category: "Education" | "Technology & AI" | "Environment" | "Society" | "Health & Lifestyle";
  type: "Agree / Disagree" | "Discuss Both Views" | "Advantages / Disadvantages" | "Causes & Solutions" | "Two-Part";
  prompt: string;
}

const SAMPLE_TASK2_PROMPTS: Task2Prompt[] = [
  {
    id: "WRT-2026-081",
    category: "Education",
    type: "Discuss Both Views",
    prompt: "Some people believe that university education should focus purely on teaching job-specific skills for future employment, while others argue its primary purpose is to provide broad intellectual development. Discuss both views and give your opinion."
  },
  {
    id: "WRT-2026-042",
    category: "Technology & AI",
    type: "Agree / Disagree",
    prompt: "As artificial intelligence systems automate increasingly complex professional tasks, human workers face unprecedented career disruption. Do the potential benefits of this automation outweigh its drawbacks for society?"
  },
  {
    id: "WRT-2026-119",
    category: "Environment",
    type: "Causes & Solutions",
    prompt: "In many modern metropolises, green urban spaces are rapidly disappearing to make way for high-density housing and commercial developments. What problems does this cause, and what urban planning initiatives can address them?"
  },
  {
    id: "WRT-2026-065",
    category: "Society",
    type: "Advantages / Disadvantages",
    prompt: "In numerous countries, an increasing proportion of adults choose to live alone rather than with extended family members. Do the advantages of this trend outweigh the disadvantages?"
  },
  {
    id: "WRT-2026-094",
    category: "Health & Lifestyle",
    type: "Two-Part",
    prompt: "Despite widespread public awareness campaigns regarding balanced nutrition and exercise, preventable lifestyle illnesses continue to rise globally. Why is this occurring, and what measures can governments implement to reverse this trajectory?"
  }
];

export default function IeltsWritingPage() {
  const [activeSection, setActiveSection] = useState("at-a-glance");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [promptCategoryFilter, setPromptCategoryFilter] = useState<string>("all");
  const [promptSearch, setPromptSearch] = useState<string>("");

  // Live text counter widget state
  const [testerText, setTesterText] = useState("");
  const [openMistakeIndex, setOpenMistakeIndex] = useState<number | null>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Active section observer on scroll
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute("id") || "at-a-glance");
          }
        });
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  const wordCount = testerText.trim() ? testerText.trim().split(/\s+/).length : 0;
  const sentenceCount = testerText.trim() ? (testerText.match(/[.!?]+(?:\s|$)/g) || []).length : 0;

  const filteredPrompts = SAMPLE_TASK2_PROMPTS.filter((p) => {
    if (promptCategoryFilter !== "all" && p.category !== promptCategoryFilter) return false;
    if (promptSearch.trim() !== "") {
      const q = promptSearch.toLowerCase();
      return p.prompt.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  const tocItems = [
    { id: "at-a-glance", label: "1. At a Glance" },
    { id: "format-timing", label: "2. Timing & Weighting" },
    { id: "academic-vs-general", label: "3. Academic vs GT" },
    { id: "task-1-guide", label: "4. Task 1 Deep-Dive" },
    { id: "task-1-practice", label: "5. Task 1 Prompts" },
    { id: "task-2-guide", label: "6. Task 2 & PEEL Method" },
    { id: "computer-based", label: "7. Computer-Delivered" },
    { id: "scoring-criteria", label: "8. 4 Scoring Criteria" },
    { id: "band-descriptors", label: "9. Band Descriptors 5–9" },
    { id: "practice-routine", label: "10. 30-Min Micro Drill" },
    { id: "question-bank", label: "11. Task 2 Question Bank" },
    { id: "sample-answers", label: "12. Band 8.5 Model Answers" },
    { id: "common-mistakes", label: "13. Top Writing Traps" },
    { id: "ai-evaluation", label: "14. AI Writing Evaluator" },
    { id: "mentorship", label: "15. Led by Syed Ejaz Bukhari" },
    { id: "faq", label: "16. Frequently Asked Questions" }
  ];

  return (
    <div className="w-full bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased min-h-screen">
      
      {/* BREADCRUMB BAR */}
      <div className="w-full bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Home</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link to="/courses" className="hover:text-primary transition-colors">IELTS Preparation</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span aria-current="page" className="text-slate-900 dark:text-white font-bold">IELTS Writing Master Guide</span>
          </nav>
          
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2026 CRITERIA VERIFIED
            </span>
            <span className="text-[10px] font-mono text-slate-400">SEBS-ACAD-IELTS-WRT-09</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative bg-slate-900 text-white pt-12 pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-cyan-500/5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Hero Details */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#00a8cc]/10 text-[#00a8cc] border border-[#00a8cc]/30 text-xs font-black uppercase tracking-widest">
                  IELTS WRITING • ACADEMIC &amp; GENERAL TRAINING
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Official 4-Pillar Scoring
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                IELTS Writing: Complete Guide to Task 1, Task 2 &amp; Computer-Based Tests
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                Master Academic visual reports and General Training correspondence. Structure authoritative 250-word Task 2 discursive essays, master typing velocities in computer-delivered simulations, and decode the exact 4-criterion grading matrix used across global testing centers.
              </p>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-slate-300">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono">Total Duration</span>
                  <span className="block text-lg font-black text-white mt-0.5">60 Minutes</span>
                  <span className="block text-[11px] text-slate-400">Strict time ceiling</span>
                </div>
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono">Task Composition</span>
                  <span className="block text-lg font-black text-[#00a8cc] mt-0.5">2 Modules</span>
                  <span className="block text-[11px] text-slate-400">Task 1 (1/3) + Task 2 (2/3)</span>
                </div>
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono">Assessment Pillars</span>
                  <span className="block text-lg font-black text-emerald-400 mt-0.5">4 Criteria</span>
                  <span className="block text-[11px] text-slate-400">25% equal allocation</span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/dashboard/writing"
                  onClick={() => prefetchRoute("/dashboard/writing")}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00a8cc] to-sky-500 hover:from-sky-400 hover:to-[#00a8cc] text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Start Timed Writing Simulator</span>
                </Link>

                <a
                  href="#question-bank"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Explore Writing Questions</span>
                </a>

                <a
                  href="https://wa.me/923304541573"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-extrabold uppercase tracking-wider px-3 py-3"
                >
                  <span>Speak with IELTS Advisor &rarr;</span>
                </a>
              </div>
            </div>

            {/* Right Hero: Computer-Delivered Split Interface Mockup */}
            <div className="lg:col-span-5">
              <div className="bg-slate-950/95 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
                {/* Header Simulator Bar */}
                <div className="bg-slate-900 text-slate-100 px-4 py-3 flex items-center justify-between text-xs border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-mono font-bold tracking-wider text-[11px]">SEBS EXAM ENGINE v4.2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400">
                      <Timer className="w-3.5 h-3.5" />
                      <span>38:45 REMAINING</span>
                    </span>
                  </div>
                </div>

                {/* Task Header */}
                <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#00a8cc]/10 text-[#00a8cc] font-mono text-[10px] font-bold">TASK 2</span>
                    <span className="text-slate-300 font-bold">Academic Discursive Essay</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-xs font-bold">Word Count: 274 / 250</span>
                </div>

                {/* Prompt Box */}
                <div className="p-4 bg-slate-900/40 border-b border-slate-800 text-xs text-slate-300">
                  <p className="font-bold text-slate-400 text-[10px] uppercase mb-1">Essay Prompt:</p>
                  <p className="italic leading-relaxed text-slate-200">
                    "Some experts argue that remote digital learning will soon replace traditional physical universities entirely. To what extent do you agree or disagree?"
                  </p>
                </div>

                {/* Simulated Typing Box */}
                <div className="p-4 relative bg-slate-950 text-xs text-slate-300 leading-relaxed font-sans min-h-[140px]">
                  <p>
                    While online tertiary education affords unprecedented geographical accessibility and temporal autonomy, asserting that it will entirely supplant conventional campus-based institutions overlooks the fundamental experiential and collaborative nature of higher academia...
                  </p>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-md text-[10px] font-mono text-slate-400 border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-saved 4s ago
                  </div>
                </div>

                {/* Instant Band Diagnostic Tags */}
                <div className="p-3 bg-slate-900 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="block text-slate-400">TR</span>
                    <span className="font-bold text-[#00a8cc]">Band 7.5</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="block text-slate-400">CC</span>
                    <span className="font-bold text-[#00a8cc]">Band 8.0</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="block text-slate-400">LR</span>
                    <span className="font-bold text-[#00a8cc]">Band 7.5</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="block text-slate-400">GRA</span>
                    <span className="font-bold text-[#00a8cc]">Band 7.0</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DUAL-COLUMN LAYOUT: Sticky TOC & Content Pillar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
        
        {/* Mobile Accordion Toggle for On This Page */}
        <div className="lg:hidden mb-8">
          <button
            type="button"
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between text-left font-extrabold text-sm text-slate-900 dark:text-white"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00a8cc]" />
              <span>On This Page Guide Navigator ({tocItems.length} Sections)</span>
            </div>
            {mobileTocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {mobileTocOpen && (
            <div className="mt-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-semibold">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMobileTocOpen(false)}
                  className={`block py-1.5 px-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-[#00a8cc]/10 text-[#00a8cc] font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">On This Page</span>
                <span className="text-[10px] font-mono text-slate-400">16 SECTIONS</span>
              </div>

              <nav aria-label="Table of Contents" className="flex flex-col space-y-1 text-xs text-slate-600 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-800">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`pl-3 py-1.5 hover:text-[#00a8cc] transition-all border-l-2 -ml-[2px] font-medium leading-tight ${
                      activeSection === item.id
                        ? "border-[#00a8cc] text-[#00a8cc] font-bold bg-sky-50/50 dark:bg-sky-950/20"
                        : "border-transparent text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Instant Diagnostic</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  Submit your Task 1 report or Task 2 essay for criterion band evaluation.
                </p>
                <Link
                  to="/dashboard/writing"
                  onClick={() => prefetchRoute("/dashboard/writing")}
                  className="w-full py-2 px-3 rounded-xl bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 text-center text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Launch Writing Engine
                </Link>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Comprehensive Content Stream */}
          <main className="lg:col-span-9 flex flex-col gap-16 min-w-0">
            
            {/* SECTION 1: AT A GLANCE */}
            <section id="at-a-glance" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Module Fundamentals</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Writing at a Glance
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                The IELTS Writing component is administered directly after the Listening and Reading tests in a single continuous session with no scheduled recess. It evaluates whether you can produce clear, coherent, and academically appropriate English across distinct communicative formats under tight temporal constraints.
              </p>

              {/* Structured Comparison Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3.5">Parameter</th>
                      <th className="p-3.5">Academic Module</th>
                      <th className="p-3.5">General Training Module</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Test Duration</td>
                      <td className="p-3.5 font-semibold text-[#00a8cc]">60 Minutes total (Both tasks combined)</td>
                      <td className="p-3.5 font-semibold text-[#00a8cc]">60 Minutes total (Both tasks combined)</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Task 1 Focus</td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white">Visual Data Summary:</strong> Line graph, bar chart, pie chart, table, map, or process flowchart. (Min. 150 words)
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white">Functional Letter:</strong> Formal, semi-formal, or personal correspondence addressing 3 specific prompts. (Min. 150 words)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Task 2 Focus</td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white">Discursive Essay:</strong> Academic register, response to an argument, debate, or problem. (Min. 250 words)
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white">Discursive Essay:</strong> General interest topic; slightly more personal examples tolerated. (Min. 250 words)
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Score Weighting</td>
                      <td className="p-3.5 font-mono text-[#00a8cc] font-bold">Task 1 = 33.3% | Task 2 = 66.7%</td>
                      <td className="p-3.5 font-mono text-[#00a8cc] font-bold">Task 1 = 33.3% | Task 2 = 66.7%</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Delivery Modalities</td>
                      <td className="p-3.5">Computer-Delivered (Typed) &amp; Paper-Delivered (Pencil)</td>
                      <td className="p-3.5">Computer-Delivered (Typed) &amp; Paper-Delivered (Pencil)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl p-4 border border-sky-200/80 dark:border-sky-800/40 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#00a8cc] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Accreditation Source:</strong> Confirmed in alignment with Cambridge Assessment English, British Council, and IDP Education criteria. Band calculations utilize standard rounding conventions where fractional scores of .25 round to .5, and .75 round to the next whole band.
                </div>
              </div>
            </section>

            {/* SECTION 2: TEST FORMAT & MASTER TIME PROTOCOL */}
            <section id="format-timing" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Time Strategy</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Writing Format &amp; Master Time Protocol
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                The exam does not automatically transition candidates from Task 1 to Task 2. You possess complete operational autonomy over how the 60 minutes are allocated. Because Task 2 carries exactly double the mathematical weighting toward your cumulative writing band score, poor time management is the single leading reason candidates miss a Band 7.0 threshold.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phase 1 Task 1 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] text-[10px] font-mono font-bold uppercase">Phase 1 • 20 Minutes</span>
                      <span className="text-[10px] font-mono text-slate-400">33% Weight</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Task 1: Tactical 20-Minute Protocol</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                      Target: 160–180 words. Never exceed 20 minutes regardless of how interesting the graph or letter appears.
                    </p>
                    <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">MIN 0–3</span>
                        <div>
                          <strong className="block text-slate-900 dark:text-white">Deconstruct &amp; Identify Overview</strong>
                          <span className="text-slate-500">Highlight key trends, extremes, anomalies, or functional letter bullet points.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">MIN 4–17</span>
                        <div>
                          <strong className="block text-slate-900 dark:text-white">Systematic Drafting (14 Mins)</strong>
                          <span className="text-slate-500">Draft Intro, Overview paragraph, and two logically grouped data bodies.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">MIN 18–20</span>
                        <div>
                          <strong className="block text-slate-900 dark:text-white">Scan for Errata (3 Mins)</strong>
                          <span className="text-slate-500">Fix subject-verb agreements, unit omissions (%, millions), and plural endings.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 2 Task 2 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-[#00a8cc]/30 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded bg-[#00a8cc] text-slate-950 text-[10px] font-mono font-bold uppercase">Phase 2 • 40 Minutes</span>
                      <span className="text-[10px] font-mono text-[#00a8cc] font-bold">67% Weight (Double)</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Task 2: Strategic 40-Minute Protocol</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                      Target: 265–290 words. An incomplete Task 2 incurs severe penalties across Task Response and Cohesion.
                    </p>
                    <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">MIN 0–5</span>
                        <div>
                          <strong className="block text-slate-900 dark:text-white">Prompt Analysis &amp; Outline Grid</strong>
                          <span className="text-slate-500">Establish crystal-clear stance, brainstorm two central topic sentences with examples.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">MIN 6–35</span>
                        <div>
                          <strong className="block text-slate-900 dark:text-white">Execution of 4-Paragraph Core (30 Mins)</strong>
                          <span className="text-slate-500">Write Introduction (40w), Body 1 (90w), Body 2 (90w), and conclusive synthesis (45w).</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">MIN 36–40</span>
                        <div>
                          <strong className="block text-slate-900 dark:text-white">Rigorous Proofreading (5 Mins)</strong>
                          <span className="text-slate-500">Correct articles (a/an/the), prepositions, comma splices, and spelling slips.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: ACADEMIC VS GENERAL TRAINING */}
            <section id="academic-vs-general" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Module Distinction</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Academic vs General Training: Choosing Correctly
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                While both modules require the same cognitive English proficiency, their practical output in Task 1 differs fundamentally. Ensure you are registered for the module specified by your accrediting body, university admissions office, or migration authority.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-[#00a8cc]" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">IELTS Academic (AC)</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    Mandated for undergraduate/postgraduate university admission, medical registration (GMC, NMC, AHPRA), and professional engineering licensing.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Task 1:</strong> Objective descriptive analysis of visual data. Strictly no personal opinions allowed.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Task 2:</strong> Formal scholarly essay requiring elevated academic register, reasoned arguments, and abstract justification.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">IELTS General Training (GT)</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    Commonly requested for skilled permanent residency schemes (Canada Express Entry, Australia GSM, UK Skilled Worker) and secondary education.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Task 1:</strong> Contextual letter. Must maintain strict register consistency (Formal, Semi-formal, or Informal tone).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Task 2:</strong> Discursive essay on topics of broader public interest; candidate may leverage personal lived experience.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 4: TASK 1 COMPREHENSIVE GUIDE */}
            <section id="task-1-guide" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Academic Report Masterclass</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Writing Task 1: Complete Architectural Guide
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                In Academic Task 1, your directive is: <em>"Summarise the information by selecting and reporting the main features, and make comparisons where relevant."</em> You are not an interpreter; you are a precise technical reporter.
              </p>

              {/* 4-Paragraph Structural Framework */}
              <div className="space-y-4">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">The Non-Negotiable 4-Paragraph Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[#00a8cc] text-slate-950 flex items-center justify-center font-mono text-xs font-bold">§1</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">Introduction (Paraphrase)</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Rewrite the question prompt using synonymous phrasing and varied grammatical structure. Transform active to passive voice, change temporal phrases (e.g., "from 2000 to 2020" → "over a 20-year span starting in 2000").
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-[#00a8cc]/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[#00a8cc] text-slate-950 flex items-center justify-center font-mono text-xs font-bold">§2</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">Overview (The Band 7+ Pillar)</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Present 2–3 overarching macroscopic trends, highest/lowest peaks, or overall transformations without quoting isolated statistical figures. Without a clear overview, Task Achievement is mathematically capped at Band 5.0.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[#00a8cc] text-slate-950 flex items-center justify-center font-mono text-xs font-bold">§3</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">Body Paragraph 1 (Key Features)</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Group similar categories or historical trajectory paths together. Support claims with accurate numerical data, specifying correct units (%, million metric tons, currency).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[#00a8cc] text-slate-950 flex items-center justify-center font-mono text-xs font-bold">§4</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">Body Paragraph 2 (Contrasts &amp; Remainder)</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Analyze the opposing category, secondary trends, or counter-phenomena. Highlight comparative divergences (e.g., "In stark contrast to...", "A parallel trend occurred in...").
                    </p>
                  </div>
                </div>
              </div>

              {/* Lexical Arsenal */}
              <div className="mt-2 bg-slate-100 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Academic Task 1 Lexical Arsenal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] text-[#00a8cc] font-bold block mb-1 uppercase">Upward Trends</span>
                    <p className="text-slate-600 dark:text-slate-400">Witnessed a marked upsurge, climbed steadily, escalated, reached a historical zenith, rebounded markedly.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] text-[#00a8cc] font-bold block mb-1 uppercase">Downward Trends</span>
                    <p className="text-slate-600 dark:text-slate-400">Plummeted sharply, registered a moderate dip, contracted, descended to a trough of, suffered a steady reduction.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] text-[#00a8cc] font-bold block mb-1 uppercase">Process Linkers</span>
                    <p className="text-slate-600 dark:text-slate-400">In the preparatory phase, the subsequent operation involves, concurrently, before undergoing distillation, culminating in.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] text-[#00a8cc] font-bold block mb-1 uppercase">Map Transformations</span>
                    <p className="text-slate-600 dark:text-slate-400">Was cleared to make way for, demolished, erected, relocated northwards, pedestrianized, converted into.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: TASK 1 PRACTICE REPOSITORY */}
            <section id="task-1-practice" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Authentic Prompts</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                    Task 1 Practice Repository
                  </h2>
                </div>
                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 font-mono text-[10px] text-[#00a8cc] font-bold uppercase">
                  7 Visual Types Covered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#00a8cc] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] font-mono text-[10px] font-bold">LINE GRAPH</span>
                      <span className="text-[10px] text-slate-400 font-mono">Academic</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">UK Renewable vs Fossil Energy Mix</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      The graph shows the proportions of total electricity generated by four distinct sources (coal, natural gas, wind, nuclear) in the United Kingdom between 1990 and 2025.
                    </p>
                  </div>
                  <Link to="/dashboard/writing" className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1">
                    Simulate in Exam Engine &rarr;
                  </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#00a8cc] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] font-mono text-[10px] font-bold">PROCESS DIAGRAM</span>
                      <span className="text-[10px] text-slate-400 font-mono">Academic</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">Hydroelectric Power Generation</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      The diagram illustrates the continuous physical and industrial phases by which water from a mountainous reservoir is converted into electrical energy and returned.
                    </p>
                  </div>
                  <Link to="/dashboard/writing" className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1">
                    Simulate in Exam Engine &rarr;
                  </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#00a8cc] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] font-mono text-[10px] font-bold">FORMAL LETTER</span>
                      <span className="text-[10px] text-slate-400 font-mono">General Training</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">Local Council Public Park Proposal</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      You recently learned of a municipal proposal to convert a neighborhood green park into a commercial parking complex. Write a formal letter of objection to the city planner.
                    </p>
                  </div>
                  <Link to="/dashboard/writing" className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1">
                    Simulate in Exam Engine &rarr;
                  </Link>
                </div>
              </div>
            </section>

            {/* SECTION 6: TASK 2 & PEEL METHOD */}
            <section id="task-2-guide" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Essay Mastery</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  IELTS Writing Task 2: Architecture &amp; The PEEL Method
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Task 2 demands an academic argument built on clear logic. It is not an assessment of whether the examiner agrees with your personal opinion, but rather how systematically you establish a central thesis, advance supported claims, and maintain topical coherence across 250+ words.
              </p>

              {/* 5 Essay Formats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-[#00a8cc] font-bold">TYPE 1</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Agree or Disagree</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Take a definitive stance in §1 and defend it consistently across both body paragraphs.</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-[#00a8cc] font-bold">TYPE 2</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Discuss Both Views</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Examine both opposing sides objectively before clarifying your preferred philosophical stance.</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-[#00a8cc] font-bold">TYPE 3</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Advantages / Disadvantages</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Weigh positive outcomes against negative consequences; state explicitly which side predominates.</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-[#00a8cc] font-bold">TYPE 4</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Causes &amp; Solutions</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Isolate root systemic causes in Body 1; articulate feasible institutional remedies in Body 2.</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 sm:col-span-2 lg:col-span-1">
                  <span className="text-[10px] font-mono text-[#00a8cc] font-bold">TYPE 5</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Direct Two-Part Question</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Address Question 1 completely in Body 1, and Question 2 thoroughly in Body 2.</p>
                </div>
              </div>

              {/* PEEL Method Callout */}
              <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 mt-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00a8cc]" />
                  <span>The PEEL Paragraph Engineering Matrix</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  To secure Band 7.0 or above in Task Response and Coherence &amp; Cohesion, each body paragraph must follow an unbroken sequence of justification:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] block mb-0.5">P • POINT</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">Clear Topic Sentence</span>
                    <span className="text-slate-500 text-[11px]">One single central idea presented immediately in line 1.</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] block mb-0.5">E • EXPLANATION</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">Causal Deconstruction</span>
                    <span className="text-slate-500 text-[11px]">Unpack <em>why</em> and <em>how</em> this occurs using precise logical connectives.</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] block mb-0.5">E • EXAMPLE</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">Academic Evidence</span>
                    <span className="text-slate-500 text-[11px]">Offer a plausible factual scenario, institutional study, or civic observation.</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] block mb-0.5">L • LINK</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">Thesis Synthesizer</span>
                    <span className="text-slate-500 text-[11px]">Conclude the thought by tying the outcome back to the essay's core stance.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 7: COMPUTER-DELIVERED IELTS WRITING */}
            <section id="computer-based" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Exam Tech Dynamics</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Computer-Delivered IELTS Writing Mechanics
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Over 70% of global test candidates now select the Computer-Delivered format. While the scoring rubric is 100% identical to the paper version, the tactile ergonomics of digital testing require specialized operational adjustments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Laptop className="w-6 h-6 text-[#00a8cc] mb-2" />
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Real-Time Word Counter</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    The screen displays an automatic word count updated keystroke-by-keystroke below the text area. You never have to manually count lines or estimate word totals, saving 3–4 minutes per task.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Zap className="w-6 h-6 text-[#00a8cc] mb-2" />
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Editing Velocity: Cut &amp; Paste</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Standard keyboard shortcuts (<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono">Ctrl+C</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono">Ctrl+V</kbd>) work seamlessly. You can reorganize whole sentences without rubber-erasing or smudging your paper.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <AlertCircle className="w-6 h-6 text-rose-500 mb-2" />
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Zero Spellcheck or Autocorrect</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    There are no red squiggly underlines, grammar warnings, or autocorrect features. Typographical errors count against Grammatical Range and Lexical Resource. Typing accuracy is critical.
                  </p>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Testing Factor</th>
                      <th className="p-3.5">Computer-Delivered</th>
                      <th className="p-3.5">Paper-Based</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Ergonomic Drafting</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">Effortless repositioning of sentences and paragraphs</td>
                      <td className="p-3.5 text-slate-500">Laborious eraser usage; messy margins can impair readability</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Handwriting Legibility</td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">Universal readability; eliminates penmanship bias</td>
                      <td className="p-3.5 text-slate-500">Risk of illegibility penalizing lexical scoring</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">Result Release Speed</td>
                      <td className="p-3.5 text-[#00a8cc] font-bold">1 to 5 days globally</td>
                      <td className="p-3.5 text-slate-500">13 calendar days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 8: 4 SCORING CRITERIA DECODED */}
            <section id="scoring-criteria" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Examiner Framework</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  The 4 Equal Assessment Criteria Decoded
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Every IELTS Writing paper is assessed by certified examiners using four distinct criteria, each worth exactly 25% of your band score. A severe deficit in any single metric immediately drags down your final average.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">1. Task Achievement (T1) / Response (T2)</h3>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded">25%</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Did you fulfill every aspect of the instruction? In Task 1: is there an explicit overview and accurate data? In Task 2: did you address every part of the prompt with a sustained, well-supported stance?
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-500 font-mono">
                    Key to Band 7+: No omitted parts, clear stance throughout, no overgeneralized points.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">2. Coherence and Cohesion (CC)</h3>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded">25%</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Does your essay flow logically from sentence to sentence and paragraph to paragraph? Are transition signals natural rather than mechanical? Are pronouns and referents used accurately to prevent repetition?
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-500 font-mono">
                    Key to Band 7+: Distinct central topic per paragraph; logical sequencing without forced linkers.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">3. Lexical Resource (LR)</h3>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded">25%</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    The breadth and precision of your vocabulary. Examiners assess your ability to employ less common academic collocations naturally while tolerating only rare, minor slips in word formation or spelling.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-500 font-mono">
                    Key to Band 7+: Natural idiomatic collocations; avoidance of convoluted thesaurus synonyms.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">4. Grammatical Range &amp; Accuracy (GRA)</h3>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded">25%</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    The balance between structural complexity and mechanical control. A candidate must demonstrate mastery of compound, complex, conditional, and passive clauses with a high proportion of entirely error-free sentences.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-500 font-mono">
                    Key to Band 7+: Over 50% of sentences must be error-free; accurate punctuation control.
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 9: BAND DESCRIPTORS 5-9 & BAND 6 VS 7 CHASM */}
            <section id="band-descriptors" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Official Descriptors</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Public Band Descriptors &amp; The Band 6 vs 7 Chasm
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                The difference between Band 6.0 and Band 7.0 is where thousands of candidates get stuck. Understanding examiner expectations in the official public band descriptors is essential to bridging this gap.
              </p>

              {/* Band 6 vs 7 Dissection Box */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#00a8cc]/30 shadow-sm overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">The Critical Threshold: Band 6.0 vs Band 7.0 Dissection</span>
                  <span className="px-2.5 py-0.5 rounded bg-[#00a8cc] text-slate-950 text-[10px] font-mono font-bold uppercase">Benchmark Matrix</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold">BAND 6.0</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">Competent User (Common Plateau)</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-500">
                      <li className="flex items-start gap-1.5"><span className="text-rose-500 font-bold">✕</span> TR: Presents a relevant position, but some main ideas are underdeveloped, vague, or lack concrete examples.</li>
                      <li className="flex items-start gap-1.5"><span className="text-rose-500 font-bold">✕</span> CC: Cohesive devices are used mechanically; transitions like "Furthermore", "In addition", "Moreover" feel forced.</li>
                      <li className="flex items-start gap-1.5"><span className="text-rose-500 font-bold">✕</span> LR: Adequate vocabulary, but repeated awkward collocations occur when attempting complex phrasing.</li>
                      <li className="flex items-start gap-1.5"><span className="text-rose-500 font-bold">✕</span> GRA: Uses a mix of simple and complex sentences, but frequent minor errors persist in punctuation and verb tenses.</li>
                    </ul>
                  </div>
                  <div className="p-5 flex flex-col gap-3 bg-sky-50/30 dark:bg-sky-950/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">BAND 7.0</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">Good User (Academic Standard)</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">✓</span> TR: Presents a clear stance throughout; all ideas are extended and supported with relevant logic and examples.</li>
                      <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">✓</span> CC: Information flows logically with seamless referencing; paragraphs have a clear, unified focus.</li>
                      <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">✓</span> LR: Uses less common vocabulary and idiomatic collocations with awareness of style and register; errors are rare.</li>
                      <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">✓</span> GRA: Employs a variety of complex structures; the majority of sentences are completely free of errors.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 10: 30-MINUTE DAILY PRACTICE ROUTINE */}
            <section id="practice-routine" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Pedagogical Framework</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  The 30-Minute Daily Writing Micro-Drill
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Writing entire 60-minute essays every day causes mental burnout and reinforces bad habits. Instead, use Syed Ejaz Bukhari's focused 30-minute deliberate practice method to target specific criteria systematically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] uppercase">Step 1 • 5 Mins</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 mb-2">Prompt Dissection</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Take any real Task 2 prompt. Underline keywords, identify micro-constraints, and paraphrase the prompt twice using different grammatical structures.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold mt-3">Builds: Paraphrasing speed</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] uppercase">Step 2 • 5 Mins</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 mb-2">Dual Body Outlines</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Write out two PEEL blueprints with topic sentences and specific supporting examples. Do not write full paragraphs yet—focus entirely on the logical argument.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold mt-3">Builds: Task Response logic</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] uppercase">Step 3 • 15 Mins</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 mb-2">Targeted Single Body</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Draft one complete body paragraph (90–110 words) focusing on complex sentence structures and natural academic collocations.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold mt-3">Builds: Grammatical range</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#00a8cc] uppercase">Step 4 • 5 Mins</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 mb-2">Self-Correction Audit</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Review your paragraph strictly for subject-verb agreements, articles (a/an/the), prepositions, and singular/plural nouns.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold mt-3">Builds: Error elimination</span>
                </div>
              </div>
            </section>

            {/* SECTION 11: QUESTION BANK */}
            <section id="question-bank" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Curated Practice</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                    Filterable Task 2 Question Bank
                  </h2>
                </div>
                <Link to="/dashboard/writing" className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1">
                  Open Full Question Bank (240+) &rarr;
                </Link>
              </div>

              {/* Filter controls */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={promptSearch}
                    onChange={(e) => setPromptSearch(e.target.value)}
                    placeholder="Search by topic or keyword..."
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00a8cc]"
                  />
                </div>
                <select
                  value={promptCategoryFilter}
                  onChange={(e) => setPromptCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00a8cc]"
                >
                  <option value="all">All Thematic Categories</option>
                  <option value="Education">Education</option>
                  <option value="Technology & AI">Technology &amp; AI</option>
                  <option value="Environment">Environment</option>
                  <option value="Society">Society</option>
                  <option value="Health & Lifestyle">Health &amp; Lifestyle</option>
                </select>
              </div>

              {/* Question list */}
              <div className="space-y-3">
                {filteredPrompts.map((p) => (
                  <div key={p.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#00a8cc] transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] text-[10px] font-mono font-bold uppercase">{p.category}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">{p.type}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">QID: {p.id}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium mb-3 leading-relaxed">
                      "{p.prompt}"
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">Recommended: 40 Mins • 250 Words</span>
                      <Link
                        to="/dashboard/writing"
                        className="text-xs font-bold text-[#00a8cc] hover:underline inline-flex items-center gap-1"
                      >
                        Draft in Simulator <PenTool className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 12: MODEL ANSWERS */}
            <section id="sample-answers" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Exemplary Models</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Band 8.5 Model Answers &amp; Examiner Commentary
                </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#00a8cc] font-bold">TASK 2 MODEL ESSAY</span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">Topic: Technology &amp; Interpersonal Communication</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    EXAMINER EVALUATION: BAND 8.5
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <p>
                    <strong className="text-[#00a8cc]">§1 Introduction:</strong> It is frequently argued that contemporary telecommunications technologies, despite enabling instantaneous global connectivity, have paradoxically diminished the quality of face-to-face interpersonal relationships. I entirely agree with this proposition, as digital interactions both reduce the depth of everyday empathy and substitute superficial engagement for genuine human community.
                  </p>
                  <p>
                    <strong className="text-[#00a8cc]">§2 Body Paragraph 1:</strong> The primary reason digital convenience undermines interpersonal bonds is that asynchronous screen communication strips dialogue of non-verbal nuances. Human emotional comprehension relies heavily on facial micro-expressions, posture, and vocal inflection. When communication is mediated primarily through brief text messages and curated social profiles, conversations inevitably become transactional. For example, recent psychological inquiries indicate that adolescents who spend excessive hours on digital networks report higher rates of social alienation because digital exchanges lack the emotional resonance that physical presence provides.
                  </p>
                  <p>
                    <strong className="text-[#00a8cc]">§3 Body Paragraph 2:</strong> Furthermore, mobile devices continually disrupt physical social spaces through continuous digital interruptions. When individuals prioritize algorithmic push notifications over the companions sitting across from them, mutual trust and sustained intellectual engagement erode. This phenomenon—often termed "phubbing"—creates subtle interpersonal friction and signals that virtual acquaintances matter more than present relationships. As a consequence, family members and colleagues spend hours in close physical proximity yet remain emotionally distant.
                  </p>
                  <p>
                    <strong className="text-[#00a8cc]">§4 Conclusion:</strong> In conclusion, while digital networks offer undeniable logistical utility, they have undeniably thinned the fabric of authentic social cohesion. By replacing emotionally rich, uninterrupted presence with fragmented screen interactions, modern technology has left individuals more connected numerically yet significantly more isolated emotionally.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <strong className="text-slate-900 dark:text-white font-bold block mb-1">Task Response: 9.0</strong>
                    <p className="text-slate-500 text-[11px]">Unambiguous stance sustained from line 1 through the conclusion. Ideas are fully developed with no logical gaps.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <strong className="text-slate-900 dark:text-white font-bold block mb-1">Coherence: 8.5</strong>
                    <p className="text-slate-500 text-[11px]">Flawless paragraph progression; cohesive ties are subtle and organic ("This phenomenon", "When individuals prioritize...").</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <strong className="text-slate-900 dark:text-white font-bold block mb-1">Lexical Resource: 8.5</strong>
                    <p className="text-slate-500 text-[11px]">Sophisticated, natural collocations: "asynchronous screen communication", "emotional resonance", "transactional conversations".</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <strong className="text-slate-900 dark:text-white font-bold block mb-1">Grammar: 8.5</strong>
                    <p className="text-slate-500 text-[11px]">Complex conditional and participle clauses used smoothly with zero mechanical errors or comma splices.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 13: 15 COMMON MISTAKES */}
            <section id="common-mistakes" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">Pitfalls &amp; Traps</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Top IELTS Writing Traps &amp; How to Neutralize Them
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { title: "1. Omitting the Overview Paragraph in Task 1", desc: "Under the official public descriptors, failing to write a clear overview mathematically caps your Task Achievement score at Band 5.0, even if your grammar and vocabulary are otherwise exceptional. Always include a dedicated 2–3 sentence overview paragraph." },
                  { title: "2. Describing Every Single Number on a Chart", desc: "The task instructions explicitly state: 'select and report the main features.' Turning your essay into an exhaustive list of every single data point shows an inability to synthesize information, resulting in a Band 5 or 6 penalty. Group data into logical categories instead." },
                  { title: "3. Memorized Formulaic Clichés ('In today's fast-paced world...')", desc: "Examiners immediately recognize and discount canned introductory phrases like 'Since the dawn of time,' 'Every coin has two sides,' or 'In this modern world.' Open directly with an objective paraphrase of the specific prompt." },
                  { title: "4. Writing Under the Minimum Word Count (150 / 250 Words)", desc: "Writing 148 words in Task 1 or 245 words in Task 2 severely penalizes your Task Achievement / Task Response score. Always target 170 words for Task 1 and 270 words for Task 2 to maintain a safe buffer above the requirement." },
                  { title: "5. Inserting Artificial Synonyms ('The ubiquitous vehicle...')", desc: "Forcing obscure vocabulary or synonyms into simple sentences leads to incorrect collocations. Clear, natural academic phrasing will always score higher than forced thesaurus substitutions." }
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenMistakeIndex(openMistakeIndex === idx ? null : idx)}
                      className="w-full p-4 text-left font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
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

            {/* SECTION 14: AI WRITING EVALUATION */}
            <section id="ai-evaluation" className="scroll-mt-24 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 lg:p-10 text-white shadow-xl border border-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono tracking-wider uppercase text-cyan-300 w-fit">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      SEBS Diagnostic Engine
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      Instant Criterion-by-Criterion AI Writing Feedback
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Trained on tens of thousands of officially scored IELTS essays, our diagnostic tool analyzes your writing across all four criteria in real time. Receive sentence-level corrections, collocation improvements, and accurate band estimates.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Link
                        to="/dashboard/writing"
                        className="px-6 py-3 rounded-xl bg-[#00a8cc] text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-[#0096b7] transition-all shadow-md"
                      >
                        Evaluate My Essay Now
                      </Link>
                      <Link
                        to="/mock-tests"
                        className="px-5 py-3 rounded-xl border border-slate-700 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all"
                      >
                        Take Full Computer Mock Test
                      </Link>
                    </div>
                  </div>

                  {/* Interactive Live Word Counter Widget */}
                  <div className="lg:col-span-5 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-mono text-cyan-300 uppercase block mb-2 font-bold">Live Intro Text Analyzer</span>
                    <textarea
                      rows={4}
                      value={testerText}
                      onChange={(e) => setTesterText(e.target.value)}
                      placeholder="Paste your introductory paragraph here to check length and complexity..."
                      className="w-full bg-slate-950/80 text-white rounded-xl p-3 text-xs border border-slate-700 focus:outline-none focus:border-[#00a8cc] placeholder:text-slate-500"
                    />
                    <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-slate-300">
                      <span>Words: <strong className="text-cyan-300">{wordCount}</strong> / 250</span>
                      <span>Sentences: <strong className="text-cyan-300">{sentenceCount}</strong></span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${wordCount >= 40 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {wordCount === 0 ? "Awaiting input" : wordCount < 40 ? "Intro in progress" : "Solid intro length"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 15: LED BY SYED EJAZ BUKHARI */}
            <section id="mentorship" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Institutional Heritage</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Led by Syed Ejaz Bukhari &amp; SEBS Institute
                </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 border-2 border-[#00a8cc]/30 shadow-md bg-slate-200">
                  <img
                    src="/syed_ejaz_bukhari_hero.webp"
                    alt="Syed Ejaz Bukhari"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2.5 text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Syed Ejaz Bukhari</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                      Linguistics Coach • 30+ Years
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Founder of SEB's Global Language Institute (Established 1992). Syed Ejaz Bukhari has mentored candidates across 45+ countries. His teaching emphasizes rigorous linguistic structure over gimmicks or false guarantees, helping students develop natural, accurate English proficiency that holds up under examination conditions.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                    <span>• Global Virtual Campus</span>
                    <span>• Official Cambridge &amp; IDP Resource Partner</span>
                    <span>• "We Teach English, Not Pinglish"</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 16: FREQUENTLY ASKED QUESTIONS */}
            <section id="faq" className="scroll-mt-24 flex flex-col gap-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-[#00a8cc] uppercase tracking-wider">Common Questions</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Frequently Asked Questions About IELTS Writing
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { q: "Can I start with Task 2 instead of Task 1?", a: "Yes, absolutely. Because Task 2 carries double the weighting (66.7% of your final Writing band score) and requires greater cognitive stamina, many instructors recommend spending your first 40 minutes on Task 2 before completing Task 1." },
                  { q: "Is there a penalty for exceeding the 150/250 word counts?", a: "There is no official penalty for writing over the word limit. However, excessively long essays (over 320 words in Task 2) leave less time for proofreading and increase your risk of grammatical slips and loss of structural coherence." },
                  { q: "Can I use American spelling instead of British spelling?", a: "Both British English (e.g., 'colour', 'centre', 'analyse') and American English (e.g., 'color', 'center', 'analyze') are fully accepted. The important requirement is consistency: choose one spelling convention and stick with it throughout your entire test." },
                  { q: "Can I use the first-person pronoun 'I' in Task 2?", a: "Yes, but only where appropriate. When the prompt asks 'Do you agree or disagree?' or 'Give your opinion,' stating 'I argue that...' or 'In my view...' is expected and appropriate. Avoid overusing 'I think' as a casual filler throughout body paragraphs." },
                  { q: "What happens if I write under 250 words in Task 2?", a: "Under-length answers are penalized directly under Task Response. Essays between 200–240 words rarely score above Band 5.5 in that criterion because ideas cannot be adequately developed within that length." }
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

            {/* SECTION 17: FINAL CONVERSION CTA */}
            <section className="bg-slate-900 text-white rounded-3xl p-8 lg:p-12 border border-slate-800 text-center flex flex-col items-center gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#00a8cc] font-mono text-[10px] font-bold uppercase tracking-wider">
                Start Your Preparation Today
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white max-w-2xl">
                Ready to Take Your IELTS Writing to Band 7.0 and Beyond?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Practice in our timed Computer-Delivered exam environment, get instant feedback on your writing, or join Syed Ejaz Bukhari's live mentorship cohorts.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/dashboard/writing"
                  className="px-8 py-3.5 rounded-xl bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md font-bold"
                >
                  Start Timed Writing Practice
                </Link>
                <Link
                  to="/courses"
                  className="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 transition-all"
                >
                  Explore Live IELTS Courses
                </Link>
              </div>
            </section>

          </main>
        </div>
      </div>

    </div>
  );
}
